import { Controller, Post, Get, Param, Body, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { SubmissionsService } from './submissions.service';

import { GradeDayDto } from './dto/grade-day.dto';
import { SubmitDayDto } from './dto/submit-day.dto';

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Student: Submit day work (code/link/file)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enrollmentId: { type: 'string' },
        submissionContent: { type: 'string', description: 'GitHub link or pasted code' },
        submissionFile: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'submissionFile', maxCount: 1 }]))
  async submitDay(@CurrentUser('id') userId: string, @Body() dto: SubmitDayDto, @UploadedFiles() files: any) {
    return this.submissionsService.submitDay(userId, dto, files);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get all pending submissions' })
  async getPending() {
    return this.submissionsService.getPendingSubmissions();
  }

  @Post('grade/:submissionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Grade submission (scores + feedback doc)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quizScore: { type: 'number', example: 10.0 },
        projectScore: { type: 'number', example: 8.5 },
        overallScore: { type: 'number', example: 9.2 },
        status: { type: 'string', enum: ['SUCCESS', 'NEEDS_CORRECTION'] },
        feedbackDocument: { type: 'string', format: 'binary', description: 'Detailed feedback PDF/Doc' },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'feedbackDocument', maxCount: 1 }]))
  async gradeDay(@Param('submissionId') id: string, @Body() dto: GradeDayDto, @UploadedFiles() files: any) {
    return this.submissionsService.gradeDay(id, dto, files);
  }
}