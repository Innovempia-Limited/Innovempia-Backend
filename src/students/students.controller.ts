import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { StudentsService } from './students.service';

import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get('profile')
  @ApiOperation({ summary: 'View my profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.studentsService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Edit my profile' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.studentsService.updateProfile(userId, dto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'View my active courses, current day, and progress' })
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.studentsService.getDashboard(userId);
  }

  @Get('past-courses')
  @ApiOperation({ summary: 'View courses I have completed' })
  async getPastCourses(@CurrentUser('id') userId: string) {
    return this.studentsService.getPastCourses(userId);
  }

  @Get('submissions/:enrollmentId')
  @ApiOperation({ summary: 'View my grades and download feedback documents for an enrollment' })
  async getSubmissions(@CurrentUser('id') userId: string, @Param('enrollmentId') enrollmentId: string) {
    return this.studentsService.getSubmissionHistory(userId, enrollmentId);
  }
}