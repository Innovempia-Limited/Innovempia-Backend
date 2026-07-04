import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.prisma.user.findFirstOrThrow({ where: { id: userId } });
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  async getDashboard(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: { include: { subCategories: { orderBy: { order: 'asc' } } } },
        currentSubCategory: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((enr) => ({
      enrollmentId: enr.id,
      level: enr.level,
      currentDay: enr.currentDay,
      course: enr.course,
      currentSubCategory: enr.currentSubCategory,
      totalDaysInCurrentSub: enr.currentSubCategory?.durationDays || enr.course.totalDays,
    }));
  }

  async getPastCourses(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { course: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSubmissionHistory(userId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId },
    });
    if (!enrollment) throw new BadRequestException('Enrollment not found');

    return this.prisma.daySubmission.findMany({
      where: { enrollmentId },
      orderBy: { dayNumber: 'asc' },
    });
  }
    async getMyCertificate(enrollmentId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, userId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.certificate.findUnique({
      where: { enrollmentId },
    });
  }
}