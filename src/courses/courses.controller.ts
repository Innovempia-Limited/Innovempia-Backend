import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CoursesService } from './courses.service';

import { AddSubCategoryDto } from './dto/add-sub-category.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { RegisterCourseDto } from './dto/register-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get('public')
  @ApiOperation({ summary: 'Browse all available courses (Public)' })
  @ApiResponse({ status: 200, description: 'List of active courses' })
  async getPublicCourses() {
    return this.coursesService.getPublicCourses();
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'Get single course details (Public)' })
  @ApiResponse({ status: 200, description: 'Single course with sub-categories' })
  @ApiResponse({ status: 400, description: 'Course not found' })
  async getPublicCourse(@Param('id') id: string) {
    return this.coursesService.getPublicCourse(id);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register as a student and enroll in a course' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  async registerCourse(@Body() dto: RegisterCourseDto) {
    return this.coursesService.registerAndEnroll(dto);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new mentorship course (with media)' })
   @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Frontend Development' },
        type: { type: 'string', enum: ['TRACK', 'SPECIFIC_LANGUAGE'], example: 'TRACK' },
        totalDays: { type: 'string', example: '90', description: 'Overall duration in days' }, 
        description: { type: 'string', example: 'Master HTML, CSS, and JS' },
        requirements: { type: 'string', example: 'A laptop' },
        instructorName: { type: 'string', example: 'Jane Doe' },
        instructorBio: { type: 'string', example: 'Senior Engineer' },
        image: { type: 'string', format: 'binary', description: 'Course cover image' },
        video: { type: 'string', format: 'binary', description: 'Course promo video' },
        instructorImage: { type: 'string', format: 'binary', description: 'Instructor photo' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'instructorImage', maxCount: 1 },
    ]),
  )
  async createCourse(
    @Body() dto: CreateCourseDto,
    @UploadedFiles() files: any,
  ) {
    return this.coursesService.createCourse(dto, files);
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Edit a course (media optional)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Advanced Frontend' },
        type: { type: 'string', enum: ['TRACK', 'SPECIFIC_LANGUAGE'] },
        description: { type: 'string' },
        requirements: { type: 'string' },
        instructorName: { type: 'string' },
        instructorBio: { type: 'string' },
        image: { type: 'string', format: 'binary' },
        video: { type: 'string', format: 'binary' },
        instructorImage: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'instructorImage', maxCount: 1 },
    ]),
  )
  async updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @UploadedFiles() files: any,
  ) {
    return this.coursesService.updateCourse(id, dto, files);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a course' })
  @ApiResponse({ status: 200, description: 'Course deleted' })
  async removeCourse(@Param('id') id: string) {
    return this.coursesService.removeCourse(id);
  }

  @Post('admin/:id/sub-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a sub-category to a TRACK' })
  @ApiResponse({ status: 201, description: 'Sub-category added' })
  async addSubCategory(@Param('id') id: string, @Body() dto: AddSubCategoryDto) {
    return this.coursesService.addSubCategory(id, dto);
  }

  @Put('admin/sub-categories/:subId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a sub-category' })
  @ApiResponse({ status: 200, description: 'Sub-category updated' })
  async updateSubCategory(@Param('subId') subId: string, @Body() dto: UpdateSubCategoryDto) {
    return this.coursesService.updateSubCategory(subId, dto);
  }

  @Delete('admin/sub-categories/:subId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a sub-category' })
  @ApiResponse({ status: 200, description: 'Sub-category deleted' })
  async removeSubCategory(@Param('subId') subId: string) {
    return this.coursesService.removeSubCategory(subId);
  }
}