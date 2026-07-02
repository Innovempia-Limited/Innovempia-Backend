import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CurriculumService } from './curriculum.service';

import { CreateDayContentDto } from './dto/create-day-content.dto';
import { UpdateDayContentDto } from './dto/update-day-content.dto';

@ApiTags('Curriculum')
@Controller('curriculum')
export class CurriculumController {
  constructor(private curriculumService: CurriculumService) {}

  // --- ADMIN ---

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Create day content for a course/sub-category' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        subCategoryId: { type: 'string', description: 'Required for Tracks' },
        level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
        dayNumber: { type: 'string' },
        materialText: { type: 'string' },
        projectDescription: { type: 'string' },
        projectRequirements: { type: 'string' },
        submissionMethod: { type: 'string', enum: ['GITHUB_LINK', 'PASTED_CODE', 'FILE_UPLOAD', 'MIXED'] },
        materialFile: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'materialFile', maxCount: 1 }]))
  async createDay(@Body() dto: CreateDayContentDto, @UploadedFiles() files: any) {
    return this.curriculumService.createDay(dto, files);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: View curriculum days for a course' })
  async getCurriculum(
    @Query('courseId') courseId: string,
    @Query('subCategoryId') subCategoryId?: string,
    @Query('level') level?: string,
  ) {
    return this.curriculumService.getCurriculum(courseId, subCategoryId, level);
  }

  @Put('admin/:dayId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Update a day content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        materialText: { type: 'string' },
        projectDescription: { type: 'string' },
        projectRequirements: { type: 'string' },
        submissionMethod: { type: 'string', enum: ['GITHUB_LINK', 'PASTED_CODE', 'FILE_UPLOAD', 'MIXED'] },
        materialFile: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'materialFile', maxCount: 1 }]))
  async updateDay(@Param('dayId') dayId: string, @Body() dto: UpdateDayContentDto, @UploadedFiles() files: any) {
    return this.curriculumService.updateDay(dayId, dto, files);
  }

  @Delete('admin/:dayId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Soft delete day content' })
  async deleteDay(@Param('dayId') dayId: string) {
    return this.curriculumService.deleteDay(dayId);
  }

  // --- STUDENT ---

  @Get('my-current-day/:enrollmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student: Get my current day content for an enrollment' })
  async getMyCurrentDay(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.curriculumService.getMyCurrentDay(enrollmentId, userId);
  }
}