import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('students')
  @ApiOperation({ summary: 'Get all students with their enrolled courses' })
  @ApiResponse({ status: 200, description: 'List of students' })
  async getStudents() {
    return this.adminService.getAllStudents();
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get single student details and progress' })
  @ApiResponse({ status: 200, description: 'Student details' })
  async getStudent(@Param('id') id: string) {
    return this.adminService.getStudentById(id);
  }

  @Post('students/:id/suspend')
  @ApiOperation({ summary: 'Suspend a student (blocks login and actions)' })
  async suspendStudent(@Param('id') id: string) {
    return this.adminService.suspendStudent(id);
  }

  @Post('students/:id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a student' })
  async unsuspendStudent(@Param('id') id: string) {
    return this.adminService.unsuspendStudent(id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get admin profile' })
  async getProfile(@CurrentUser() user: any) {
    const { password, ...profile } = user;
    return profile;
  }
}