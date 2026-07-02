import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
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
  @ApiResponse({ status: 200, description: 'User profile data' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.studentsService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Edit my profile (name, phone)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.studentsService.updateProfile(userId, dto);
  }
}