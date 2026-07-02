import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';

import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

import { AddSubCategoryDto } from './dto/add-sub-category.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { RegisterCourseDto } from './dto/register-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private emailService: EmailService,
    private notifService: NotificationsService,
    private supabase: SupabaseService,
  ) {}

    async createCourse(dto: CreateCourseDto, files: any) {
    let imageUrl: string | undefined;
    let videoUrl: string | undefined;
    let instructorImage: string | undefined;

    if (files.image?.[0]) imageUrl = await this.supabase.uploadFile(files.image[0], 'courses');
    if (files.video?.[0]) videoUrl = await this.supabase.uploadFile(files.video[0], 'courses');
    if (files.instructorImage?.[0]) instructorImage = await this.supabase.uploadFile(files.instructorImage[0], 'instructors');

    return this.prisma.mentorshipCourse.create({
      data: {
        title: dto.title,
        type: dto.type as any,
        totalDays: dto.totalDays ? parseInt(dto.totalDays, 10) : null, // ADD THIS
        description: dto.description || '',
        requirements: dto.requirements || '',
        instructorName: dto.instructorName,
        instructorBio: dto.instructorBio || '',
        imageUrl,
        videoUrl,
        instructorImage,
      },
    });
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto, files: any) {
    const course = await this.prisma.mentorshipCourse.findFirstOrThrow({ where: { id: courseId } });

    let imageUrl = course.imageUrl;
    let videoUrl = course.videoUrl;
    let instructorImage = course.instructorImage;

    if (files.image?.[0]) imageUrl = await this.supabase.uploadFile(files.image[0], 'courses');
    if (files.video?.[0]) videoUrl = await this.supabase.uploadFile(files.video[0], 'courses');
    if (files.instructorImage?.[0]) instructorImage = await this.supabase.uploadFile(files.instructorImage[0], 'instructors');

    return this.prisma.mentorshipCourse.update({
      where: { id: courseId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.type && { type: dto.type as any }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.requirements !== undefined && { requirements: dto.requirements }),
        ...(dto.instructorName && { instructorName: dto.instructorName }),
        ...(dto.instructorBio !== undefined && { instructorBio: dto.instructorBio }),
        ...(dto.totalDays !== undefined && { totalDays: dto.totalDays ? parseInt(dto.totalDays, 10) : null }),
        imageUrl,
        videoUrl,
        instructorImage,
      },
    });
  }

  async removeCourse(courseId: string) {
    await this.prisma.mentorshipCourse.findFirstOrThrow({ where: { id: courseId } });
    return this.prisma.mentorshipCourse.update({ 
      where: { id: courseId }, 
      data: { isActive: false } 
    });
  }

  async addSubCategory(courseId: string, dto: AddSubCategoryDto) {
    const course = await this.prisma.mentorshipCourse.findUnique({ where: { id: courseId } });
    if (!course) throw new BadRequestException('Course not found');
    if (course.type !== 'TRACK') throw new BadRequestException('Only TRACK courses can have sub-categories');

    return this.prisma.courseSubCategory.create({ data: { ...dto, courseId } });
  }

  async updateSubCategory(subId: string, dto: UpdateSubCategoryDto) {
    await this.prisma.courseSubCategory.findFirstOrThrow({ where: { id: subId } });
    return this.prisma.courseSubCategory.update({ where: { id: subId }, data: dto });
  }

  async removeSubCategory(subId: string) {
    await this.prisma.courseSubCategory.findFirstOrThrow({ where: { id: subId } });
    return this.prisma.courseSubCategory.delete({ where: { id: subId } });
  }

  async getPublicCourses() {
    return this.prisma.mentorshipCourse.findMany({
      where: { isActive: true },
      include: { subCategories: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicCourse(courseId: string) {
    const course = await this.prisma.mentorshipCourse.findFirst({
      where: { id: courseId, isActive: true },
      include: { subCategories: { orderBy: { order: 'asc' } } },
    });
    if (!course) throw new BadRequestException('Course not found');
    return course;
  }

  async registerAndEnroll(dto: RegisterCourseDto) {
    const course = await this.prisma.mentorshipCourse.findUnique({
      where: { id: dto.courseId },
      include: { subCategories: { orderBy: { order: 'asc' } } },
    });

    if (!course || !course.isActive) throw new BadRequestException('Course not available');

    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (user) {
      const exists = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });
      if (exists) throw new ConflictException('Already enrolled in this course');
    } else {
      const hashed = await bcrypt.hash(dto.password, 10);
      user = await this.prisma.user.create({
        data: { email: dto.email, password: hashed, firstName: dto.firstName, lastName: dto.lastName, role: 'STUDENT' },
      });
    }

    let startingSubId: string | null = null;
    if (course.type === 'TRACK' && course.subCategories.length > 0) {
      startingSubId = course.subCategories[0].id;
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        currentSubCategoryId: startingSubId,
        currentDay: 1,
        level: 'BEGINNER',
        status: 'ACTIVE',
      },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwt.sign(payload);

    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const hasCurriculum = false;

    try {
      await this.emailService.sendStudentOnboarding(user.email, user.firstName, course.title);
      await this.emailService.sendAdminNewEnrollment(`${user.firstName} ${user.lastName}`, course.title, hasCurriculum);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Email failed, but enrollment succeeded:', error.message);
      } else {
        console.error('Email failed, but enrollment succeeded:', String(error));
      }
    }

    if (admin) {
      const warningText = !hasCurriculum ? ' (WARNING: No curriculum uploaded yet!)' : '';
      await this.notifService.create(
        admin.id,
        'New Student Enrollment',
        `${user.firstName} ${user.lastName} enrolled in ${course.title}.${warningText}`,
      );
    }

    return {
      access_token,
      enrollmentId: enrollment.id,
      currentDay: enrollment.currentDay,
      level: enrollment.level,
      status: enrollment.status,
      course,
    };
  }
}