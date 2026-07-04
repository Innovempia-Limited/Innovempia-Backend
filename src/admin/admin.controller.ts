import { Body, Controller, Get, Post, Param, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { EmailService } from '../email/email.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SendBulkEmailDto } from '../qa/dto/send-bulk-email.dto';

import { AdminService } from './admin.service';

import { UpdateLevelDto } from './dto/update-level.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private emailService: EmailService,
  ) {}

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

  @Post('students/:id/update-level')
  @ApiOperation({ summary: 'Update student level (triggers payment logic if INTERMEDIATE/ADVANCED)' })
  async updateLevel(@Param('id') id: string, @Body() dto: UpdateLevelDto) {
    return this.adminService.updateStudentLevel(id, dto);
  }

  @Post('certificates/:enrollmentId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload certificate for a completed enrollment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        certificate: { type: 'string', format: 'binary', description: 'Certificate PDF/Image' },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'certificate', maxCount: 1 }]))
  async uploadCertificate(@Param('enrollmentId') enrollmentId: string, @UploadedFiles() files: any) {
    return this.adminService.uploadCertificate(enrollmentId, files);
  }

  @Post('bulk-email')
  @ApiOperation({ summary: 'Send an email to all active students' })
  async sendBulkEmail(@Body() dto: SendBulkEmailDto) {
    return this.emailService.sendBulkEmail(dto.subject, dto.message);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get admin profile' })
  async getProfile(@CurrentUser() user: any) {
    const { password, ...profile } = user;
    return profile;
  }
}