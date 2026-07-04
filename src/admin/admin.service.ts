import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

import { UpdateLevelDto } from './dto/update-level.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
    private supabase: SupabaseService,
  ) {}

  async getAllStudents() {
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          include: {
            course: { select: { title: true, type: true } },
            currentSubCategory: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentById(studentId: string) {
    return this.prisma.user.findFirstOrThrow({
      where: { id: studentId, role: 'STUDENT' },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, createdAt: true,
        enrollments: { include: { course: true, currentSubCategory: true } },
      },
    });
  }

  async suspendStudent(studentId: string) {
    await this.prisma.user.findFirstOrThrow({ where: { id: studentId, role: 'STUDENT' } });
    return this.prisma.user.update({ where: { id: studentId }, data: { isActive: false } });
  }

  async unsuspendStudent(studentId: string) {
    await this.prisma.user.findFirstOrThrow({ where: { id: studentId, role: 'STUDENT' } });
    return this.prisma.user.update({ where: { id: studentId }, data: { isActive: true } });
  }

    async updateStudentLevel(studentId: string, dto: UpdateLevelDto) {
    const user = await this.prisma.user.findFirstOrThrow({ where: { id: studentId, role: 'STUDENT' } });
    const enrollments = await this.prisma.enrollment.findMany({ where: { userId: studentId, status: 'ACTIVE' } });
    if (enrollments.length === 0) throw new BadRequestException('No active enrollments');

    const newStatus = dto.level === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE';

    await this.prisma.enrollment.updateMany({
      where: { userId: studentId, status: 'ACTIVE' },
      data: { 
        level: dto.level as any, 
        status: newStatus,
        ...(dto.level !== 'BEGINNER' && dto.level !== 'COMPLETED' && { currentDay: 1 })
      },
    });

    // Handle Subscription Cancellation if completed
    if (dto.level === 'COMPLETED') {
      const activeSub = await this.prisma.paymentRecord.findFirst({
        where: { userId: studentId, type: 'SUBSCRIPTION', status: 'SUCCESS', isActive: true }
      });
      if (activeSub) {
        await this.prisma.paymentRecord.update({ where: { id: activeSub.id }, data: { isActive: false } });
        // Note: In a full webhook setup, you'd call Paystack API here to disable the recurring token.
      }
    }

    let message = `Your level has been updated to ${dto.level}.`;
    if (dto.level === 'INTERMEDIATE' || dto.level === 'ADVANCED') {
      message += ` Please complete your 25,000 Naira monthly subscription payment to access the new curriculum.`;
    } else if (dto.level === 'COMPLETED') {
      message += ` Congratulations! Your subscription has been cancelled.`;
    }

    await this.notifService.create(user.id, 'Level Updated', message);
    return { message: `Student level updated to ${dto.level}` };
  }

  async uploadCertificate(enrollmentId: string, file: any) {
    const enrollment = await this.prisma.enrollment.findFirstOrThrow({
      where: { id: enrollmentId },
      include: { user: true, course: true },
    });

    if (!file.certificate?.[0]) throw new BadRequestException('Certificate file is required');

    const fileUrl = await this.supabase.uploadFile(file.certificate[0], 'certificates');

    // Upsert certificate
    const certificate = await this.prisma.certificate.upsert({
      where: { enrollmentId },
      update: { fileUrl, issuedAt: new Date() },
      create: { enrollmentId, fileUrl },
    });

    // Notify student
    await this.notifService.create(
      enrollment.user.id,
      'Certificate Issued! 🎓',
      `Congratulations! Your certificate for ${enrollment.course.title} is ready to download.`,
    );

    // TODO: Trigger email with certificate link here later if needed

    return certificate;
  }

  async getCertificate(enrollmentId: string) {
    return this.prisma.certificate.findUnique({
      where: { enrollmentId },
    });
  }
}