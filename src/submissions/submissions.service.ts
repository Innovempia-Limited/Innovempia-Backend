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

    const existingSuccess = await this.prisma.daySubmission.findFirst({
      where: { enrollmentId: dto.enrollmentId, dayNumber: enrollment.currentDay, status: 'SUCCESS' },
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

    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await this.notifService.create(admin.id, 'New Submission', `Student submitted Day ${enrollment.currentDay}.`);
    }

    return submission;
  }

  async gradeDay(submissionId: string, dto: GradeDayDto, files: any) {
    const submission = await this.prisma.daySubmission.findUnique({
      where: { id: submissionId },
      include: { enrollment: { include: { course: true, currentSubCategory: true } } },
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

    if (dto.status === 'SUCCESS') {
      const enrollment = submission.enrollment;
      const nextDay = enrollment.currentDay + 1;

      // AUTO-MOVE LOGIC: Check if they just finished the last day of a sub-category
      if (enrollment.currentSubCategoryId && enrollment.currentSubCategory) {
        if (nextDay > enrollment.currentSubCategory.durationDays) {
          // Find the next sub-category
          const nextSub = await this.prisma.courseSubCategory.findFirst({
            where: {
              courseId: enrollment.courseId,
              order: { gt: enrollment.currentSubCategory.order },
            },
            orderBy: { order: 'asc' },
          });

          if (nextSub) {
            // Move to Day 1 of the next sub-category
            await this.prisma.enrollment.update({
              where: { id: enrollment.id },
              data: { currentSubCategoryId: nextSub.id, currentDay: 1 },
            });
            await this.notifService.create(
              enrollment.userId,
              'Sub-Category Completed! 🎉',
              `You finished ${enrollment.currentSubCategory.name}! Moving to ${nextSub.name} - Day 1.`,
            );
          } else {
            // No more subs. Keep them on the last day (Final exam state handled later)
            await this.prisma.enrollment.update({
              where: { id: enrollment.id },
              data: { currentDay: nextDay },
            });
            await this.notifService.create(
              enrollment.userId,
              'Track Almost Complete!',
              `You've finished all sub-categories! Prepare for your final steps.`,
            );
          }
        } else {
          // Just increment the day normally
          await this.prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { currentDay: nextDay },
          });
        }
      } else {
        // Specific language track (no subs), just increment day
        await this.prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { currentDay: nextDay },
        });
      }
    }

    await this.notifService.create(
      submission.enrollment.userId,
      `Day ${submission.dayNumber} Graded`,
      `Status: ${dto.status}. Overall Score: ${dto.overallScore}/10`,
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