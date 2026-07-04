import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

import { RequestMeetingDto } from './dto/request-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
  ) {}

  async requestMeeting(userId: string, dto: RequestMeetingDto) {
    const meeting = await this.prisma.meetingRequest.create({
      data: { userId, ...dto },
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
    
    const updated = await this.prisma.meetingRequest.update({
      where: { id: meetingId },
      data: { status: dto.status, adminMessage: dto.adminMessage },
    });

    if (dto.status === 'APPROVED' || dto.status === 'REJECTED') {
      await this.notifService.create(
        updated.userId,
        `Meeting ${dto.status}`,
        dto.adminMessage || `Your meeting request for "${updated.topic}" has been ${dto.status.toLowerCase()}.`,
      );
    }

    return updated;
  }
}