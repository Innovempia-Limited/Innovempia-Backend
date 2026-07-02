import { Injectable, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

import { CreateDayContentDto } from './dto/create-day-content.dto';
import { UpdateDayContentDto } from './dto/update-day-content.dto';

@Injectable()
export class CurriculumService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async createDay(dto: CreateDayContentDto, file: any) {
    const course = await this.prisma.mentorshipCourse.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new BadRequestException('Course not found');

    if (course.type === 'TRACK' && !dto.subCategoryId) {
      throw new BadRequestException('subCategoryId is required for TRACK courses');
    }

    let materialFileUrl: string | undefined;
    if (file?.materialFile?.[0]) {
      materialFileUrl = await this.supabase.uploadFile(file.materialFile[0], 'materials');
    }

    return this.prisma.dayContent.create({
      data: {
        courseId: dto.courseId,
        subCategoryId: dto.subCategoryId || null,
        level: dto.level as any,
        dayNumber: parseInt(dto.dayNumber, 10),
        materialText: dto.materialText || '',
        materialFileUrl,
        projectDescription: dto.projectDescription || '',
        projectRequirements: dto.projectRequirements || '',
        submissionMethod: dto.submissionMethod,
      },
    });
  }

  async getCurriculum(courseId: string, subCategoryId?: string, level?: string) {
    return this.prisma.dayContent.findMany({
      where: {
        courseId,
        ...(subCategoryId && { subCategoryId }),
        ...(level && { level: level as any }),
        isActive: true,
      },
      orderBy: { dayNumber: 'asc' },
    });
  }

  async updateDay(dayId: string, dto: UpdateDayContentDto, file: any) {
    const day = await this.prisma.dayContent.findFirstOrThrow({ where: { id: dayId } });

    let materialFileUrl = day.materialFileUrl;
    if (file?.materialFile?.[0]) {
      materialFileUrl = await this.supabase.uploadFile(file.materialFile[0], 'materials');
    }

    return this.prisma.dayContent.update({
      where: { id: dayId },
      data: {
        ...(dto.materialText !== undefined && { materialText: dto.materialText }),
        ...(dto.projectDescription !== undefined && { projectDescription: dto.projectDescription }),
        ...(dto.projectRequirements !== undefined && { projectRequirements: dto.projectRequirements }),
        ...(dto.submissionMethod && { submissionMethod: dto.submissionMethod }),
        materialFileUrl,
      },
    });
  }

  async deleteDay(dayId: string) {
    await this.prisma.dayContent.findFirstOrThrow({ where: { id: dayId } });
    return this.prisma.dayContent.update({
      where: { id: dayId },
      data: { isActive: false },
    });
  }

  // STUDENT: Get current day content based on enrollment
  async getMyCurrentDay(enrollmentId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId, status: 'ACTIVE' },
    });

    if (!enrollment) throw new BadRequestException('Active enrollment not found');

    const content = await this.prisma.dayContent.findFirst({
      where: {
        courseId: enrollment.courseId,
        subCategoryId: enrollment.currentSubCategoryId,
        level: enrollment.level,
        dayNumber: enrollment.currentDay,
        isActive: true,
      },
    });

    if (!content) {
      return { message: 'No content uploaded for this day yet.', data: null };
    }

    return { message: 'Current day content', data: content };
  }
}