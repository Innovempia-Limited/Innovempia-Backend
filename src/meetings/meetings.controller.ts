import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { MeetingsService } from './meetings.service';

import { RequestMeetingDto } from './dto/request-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@ApiTags('Meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student: Request a meeting with admin' })
  async requestMeeting(@CurrentUser('id') userId: string, @Body() dto: RequestMeetingDto) {
    return this.meetingsService.requestMeeting(userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student: View my meeting requests' })
  async getMyMeetings(@CurrentUser('id') userId: string) {
    return this.meetingsService.getMyMeetings(userId);
  }

  @Get('admin/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: View all meeting requests' })
  async getAllRequests() {
    return this.meetingsService.getAllRequests();
  }

  @Put('admin/:meetingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Approve or reject a meeting' })
  async updateRequest(@Param('meetingId') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetingsService.updateRequest(id, dto);
  }
}