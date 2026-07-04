import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { QaService } from './qa.service';

import { AskQuestionDto } from './dto/ask-question.dto';
import { ReplyQuestionDto } from './dto/reply-question.dto';

@ApiTags('Q&A')
@Controller('qa')
export class QaController {
  constructor(private qaService: QaService) {}

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student: Ask a question' })
  async askQuestion(@CurrentUser('id') userId: string, @Body() dto: AskQuestionDto) {
    return this.qaService.askQuestion(userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student: View my questions and admin replies' })
  async getMyQuestions(
    @CurrentUser('id') userId: string,
    @Query('enrollmentId') enrollmentId?: string,
  ) {
    return this.qaService.getMyQuestions(userId, enrollmentId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: View all questions from all students' })
  async getAllQuestions() {
    return this.qaService.getAllQuestions();
  }

  @Put('admin/reply/:questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Reply to a student question' })
  async replyQuestion(@Param('questionId') id: string, @Body() dto: ReplyQuestionDto) {
    return this.qaService.replyQuestion(id, dto);
  }
}