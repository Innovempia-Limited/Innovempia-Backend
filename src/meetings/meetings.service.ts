import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

import { RequestMeetingDto } from './dto/request-meeting.dto';
import { ScheduleConversationDto } from './dto/schedule-conversation.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
    private config: ConfigService,
  ) {}

  async requestMeeting(userId: string | undefined, dto: RequestMeetingDto) {
    const data: any = { ...dto };
    if (userId) data.userId = userId;

    const meeting = await this.prisma.meetingRequest.create({
      data,
    });

    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await this.notifService.create(
        admin.id,
        'New Meeting Request',
        `A student requested a meeting about: ${dto.topic} (${dto.proposedDate} at ${dto.proposedTime})`,
      );
    }

    return meeting;
  }

  async scheduleConversation(dto: ScheduleConversationDto) {
    const meeting = await this.prisma.meetingRequest.create({
      data: {
        recipientName: dto.recipientName,
        recipientEmail: dto.recipientEmail,
        phone: dto.phone,
        topic: dto.topic || 'General Inquiry',
        reason: dto.reason,
        proposedDate: dto.proposedDate,
        proposedTime: dto.proposedTime,
      },
    });

    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });

    if (admin) {
      await this.notifService.create(
        admin.id,
        'New Public Meeting Request',
        `${dto.recipientName} (${dto.recipientEmail}) wants to schedule a conversation about: ${dto.reason} (${dto.proposedDate} at ${dto.proposedTime})`,
      );
    }

    const apiKey = this.config.get('RESEND_API_KEY');
    if (apiKey) {
      const adminEmail = this.config.get('ADMIN_EMAIL_NOTIFY', 'mail@innovempia.com');
      const html = `
        <h2>New Public Meeting Request</h2>
        <p><strong>Name:</strong> ${dto.recipientName}</p>
        <p><strong>Email:</strong> ${dto.recipientEmail}</p>
        <p><strong>Phone:</strong> ${dto.phone || 'N/A'}</p>
        <p><strong>Topic:</strong> ${dto.topic || 'N/A'}</p>
        <p><strong>Reason:</strong> ${dto.reason}</p>
        <p><strong>Proposed Date:</strong> ${dto.proposedDate}</p>
        <p><strong>Proposed Time:</strong> ${dto.proposedTime}</p>
      `;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.config.get('FROM_EMAIL', 'Innovempia <mail@innovempia.com>'),
            to: [adminEmail],
            subject: 'New Public Meeting Request',
            html,
          }),
        });
      } catch (e) {
        // ignore email failure
      }
    }

    return meeting;
  }

  async getMyMeetings(userId: string) {
    return this.prisma.meetingRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRequests() {
    return this.prisma.meetingRequest.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRequest(meetingId: string, dto: UpdateMeetingDto) {
    await this.prisma.meetingRequest.findFirstOrThrow({ where: { id: meetingId } });

    const data: any = {
      status: dto.status,
      adminMessage: dto.adminMessage,
    };

    if (dto.rescheduleDate) data.rescheduleDate = dto.rescheduleDate;
    if (dto.rescheduleTime) data.rescheduleTime = dto.rescheduleTime;

    const updated = await this.prisma.meetingRequest.update({
      where: { id: meetingId },
      data,
    });

    if (dto.status === 'APPROVED' || dto.status === 'REJECTED') {
      const recipientId = updated.userId;
      if (recipientId) {
        await this.notifService.create(
          recipientId,
          `Meeting ${dto.status}`,
          dto.adminMessage || `Your meeting request for "${updated.topic}" has been ${dto.status.toLowerCase()}.`,
        );
      }
    }

    if (dto.status === 'RESCHEDULED' && updated.recipientEmail) {
      const apiKey = this.config.get('RESEND_API_KEY');
      if (apiKey) {
        const html = `
          <h2>Meeting Rescheduled</h2>
          <p>Your meeting request has been rescheduled.</p>
          <p><strong>New Date:</strong> ${updated.rescheduleDate || 'TBD'}</p>
          <p><strong>New Time:</strong> ${updated.rescheduleTime || 'TBD'}</p>
          <p>${dto.adminMessage || 'Please check your dashboard for details.'}</p>
        `;

        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: this.config.get('FROM_EMAIL', 'Innovempia <mail@innovempia.com>'),
              to: [updated.recipientEmail],
              subject: 'Meeting Rescheduled',
              html,
            }),
          });
        } catch (e) {
          // ignore email failure
        }
      }
    }

    return updated;
  }
}
