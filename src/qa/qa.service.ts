import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

import { AskQuestionDto } from './dto/ask-question.dto';
import { ReplyQuestionDto } from './dto/reply-question.dto';

@Injectable()
export class QaService {
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
  ) {}

  async askQuestion(userId: string, dto: AskQuestionDto) {
    // Verify enrollment belongs to user
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollmentId, userId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const question = await this.prisma.qandA.create({
      data: {
        userId,
        enrollmentId: dto.enrollmentId,
        question: dto.question,
      },
    });

    // Notify Admin
    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await this.notifService.create(
        admin.id,
        'New Question Asked',
        `A student asked: "${dto.question.substring(0, 50)}..."`,
      );
    }

    return question;
  }

  async replyQuestion(questionId: string, dto: ReplyQuestionDto) {
    const question = await this.prisma.qandA.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');

    const updated = await this.prisma.qandA.update({
      where: { id: questionId },
      data: { adminReply: dto.adminReply, isRead: true },
    });

    // Notify Student
    await this.notifService.create(
      question.userId,
      'Answer to your question',
      `The admin has replied to your question: "${question.question.substring(0, 50)}..."`,
    );

    return updated;
  }

  async getMyQuestions(userId: string, enrollmentId?: string) {
    return this.prisma.qandA.findMany({
      where: { 
        userId,
        ...(enrollmentId && { enrollmentId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllQuestions() {
    return this.prisma.qandA.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        enrollment: { include: { course: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}