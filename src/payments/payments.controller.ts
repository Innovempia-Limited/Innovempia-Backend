import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('init-course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for a standalone course' })
  async initCourse(@CurrentUser('id') userId: string, @Param('courseId') courseId: string) {
    return this.paymentsService.initializeStandaloneCourse(userId, courseId);
  }

  @Post('init-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize 25k monthly subscription payment' })
  async initSubscription(@CurrentUser('id') userId: string) {
    return this.paymentsService.initializeSubscription(userId);
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify a paystack payment manually' })
  async verify(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }

  @Post('cancel-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student cancels their mentorship subscription' })
  async cancelSub(@CurrentUser('id') userId: string) {
    return this.paymentsService.cancelSubscription(userId);
  }
}