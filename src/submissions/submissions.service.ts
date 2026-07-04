import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

import { GradeDayDto } from './dto/grade-day.dto';
import { SubmitDayDto } from './dto/submit-day.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    private notifService: NotificationsService,
  ) {}

  async submitDay(userId: string, dto: SubmitDayDto, files: any) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollmentId, userId, status: 'ACTIVE' },
    });
    if (!enrollment) throw new BadRequestException('Active enrollment not found');

    // Prevent submitting if already successful
    const existingSuccess = await this.prisma.daySubmission.findFirst({
      where: {
        enrollmentId: dto.enrollmentId,
        dayNumber: enrollment.currentDay,
        status: 'SUCCESS',
      },
    });
    if (existingSuccess) throw new BadRequestException('Day already passed.');

    let submissionFileUrl: string | undefined;
    if (files.submissionFile?.[0]) {
      submissionFileUrl = await this.supabase.uploadFile(files.submissionFile[0], 'submissions');
    }

    const submission = await this.prisma.daySubmission.create({
      data: {
        enrollmentId: dto.enrollmentId,
        dayNumber: enrollment.currentDay,
        submissionContent: dto.submissionContent || '',
        submissionFileUrl,
        status: 'PENDING',
      },
    });

    // Notify Admin
    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await this.notifService.create(
        admin.id,
        'New Submission',
        `${enrollment.userId} submitted Day ${enrollment.currentDay}.`,
      );
    }

    return submission;
  }

  async gradeDay(submissionId: string, dto: GradeDayDto, files: any) {
    const submission = await this.prisma.daySubmission.findUnique({
      where: { id: submissionId },
      include: { enrollment: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    let feedbackDocumentUrl: string | undefined;
    if (files.feedbackDocument?.[0]) {
      feedbackDocumentUrl = await this.supabase.uploadFile(files.feedbackDocument[0], 'feedback');
    }

    const graded = await this.prisma.daySubmission.update({
      where: { id: submissionId },
      data: {
        quizScore: dto.quizScore,
        projectScore: dto.projectScore,
        overallScore: dto.overallScore,
        status: dto.status,
        feedbackDocumentUrl,
        gradedAt: new Date(),
      },
    });

    // If SUCCESS, unlock next day
    if (dto.status === 'SUCCESS') {
      await this.prisma.enrollment.update({
        where: { id: submission.enrollmentId },
        data: { currentDay: { increment: 1 } },
      });
    }

    // Notify Student
    await this.notifService.create(
      submission.enrollment.userId,
      `Day ${submission.dayNumber} Graded`,
      `Your submission was graded. Status: ${dto.status}. Overall Score: ${dto.overallScore}/10`,
    );

    return graded;
  }

  async getPendingSubmissions() {
    return this.prisma.daySubmission.findMany({
      where: { status: 'PENDING' },
      include: {
        enrollment: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { title: true } },
            currentSubCategory: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}