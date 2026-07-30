import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import { EmailService } from '../email/email.service';
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
    private emailService: EmailService,
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
        quizScore: dto.quizScore !== undefined ? parseFloat(dto.quizScore) : undefined,
        projectScore: dto.projectScore !== undefined ? parseFloat(dto.projectScore) : undefined,
        overallScore: dto.overallScore !== undefined ? parseFloat(dto.overallScore) : undefined,
        status: dto.status,
        feedbackDocumentUrl,
        gradedAt: new Date(),
      },
    });

    if (dto.status === 'SUCCESS') {
      const enrollment = submission.enrollment;
      const nextDay = enrollment.currentDay + 1;

      // Determine the next day's content and detect level changes
      const LEVEL_ORDER: Record<string, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2, COMPLETED: 3 };
      const currentLevelRank = LEVEL_ORDER[enrollment.level] ?? 0;

      if (enrollment.currentSubCategoryId && enrollment.currentSubCategory) {
        if (nextDay > enrollment.currentSubCategory.durationDays) {
          const nextSub = await this.prisma.courseSubCategory.findFirst({
            where: { courseId: enrollment.courseId, order: { gt: enrollment.currentSubCategory.order } },
            orderBy: { order: 'asc' },
          });

          if (nextSub) {
            const nextDayContent = await this.prisma.dayContent.findFirst({
              where: { courseId: enrollment.courseId, subCategoryId: nextSub.id, dayNumber: 1, isActive: true },
            });

            if (nextDayContent && (LEVEL_ORDER[nextDayContent.level] ?? 0) > currentLevelRank) {
              await this.sendLevelUpgradeNotification(enrollment, nextDayContent.level);
            }

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
          const nextDayContent = await this.prisma.dayContent.findFirst({
            where: { courseId: enrollment.courseId, subCategoryId: enrollment.currentSubCategoryId, dayNumber: nextDay, isActive: true },
          });

          if (nextDayContent && (LEVEL_ORDER[nextDayContent.level] ?? 0) > currentLevelRank) {
            await this.sendLevelUpgradeNotification(enrollment, nextDayContent.level);
          }

          await this.prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { currentDay: nextDay },
          });
        }
      } else {
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

  async getMyGradeHistory(userId: string) {
    const submissions = await this.prisma.daySubmission.findMany({
      where: {
        enrollment: { userId },
        status: { in: ['SUCCESS', 'NEEDS_CORRECTION'] },
      },
      include: {
        enrollment: {
          include: {
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
    });

    return submissions.map((s) => ({
      dayNumber: s.dayNumber,
      courseId: s.enrollment.courseId,
      courseTitle: s.enrollment.course.title,
      status: s.status,
      quizScore: s.quizScore,
      projectScore: s.projectScore,
      overallScore: s.overallScore,
      feedbackDocumentUrl: s.feedbackDocumentUrl,
      gradedAt: s.gradedAt,
    }));
  }

  async getMyMaterials(userId: string) {
    const submissions = await this.prisma.daySubmission.findMany({
      where: {
        enrollment: { userId },
      },
      include: {
        enrollment: {
          include: {
            course: { select: { title: true, dayContents: true } },
          },
        },
      },
      orderBy: { dayNumber: 'asc' },
    });

    return submissions.map((s) => {
      const content = s.enrollment.course.dayContents.find(
        (dc) => dc.dayNumber === s.dayNumber && dc.level === s.enrollment.level,
      );

      return {
        dayNumber: s.dayNumber,
        courseId: s.enrollment.courseId,
        courseTitle: s.enrollment.course.title,
        materialText: content?.materialText ?? '',
        materialFileUrl: content?.materialFileUrl ?? null,
        videoUrl: content?.videoUrl ?? null,
      };
    });
  }

  private async sendLevelUpgradeNotification(enrollment: any, requiredLevel: string) {
    const user = await this.prisma.user.findUnique({ where: { id: enrollment.userId } });
    if (!user) return;

    await this.notifService.create(
      enrollment.userId,
      'Level Upgrade Required',
      `You've completed all ${enrollment.level} content. Subscribe to access ${requiredLevel} content.`,
    );

    try {
      await this.emailService.sendLevelUpgradeEmail(
        user.email,
        user.firstName,
        enrollment.level,
        requiredLevel,
      );
    } catch (err: any) {
      console.error('Level upgrade email failed', err.message);
    }
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