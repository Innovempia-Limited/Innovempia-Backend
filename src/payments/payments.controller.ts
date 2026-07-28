import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PaymentsService } from './payments.service';
import { EnrollStandaloneDto } from './enroll-standalone.dto';
import { SubscribeMenteeDto } from './subscribe-mentee.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('init-course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for a standalone course' })
  async initCourse(@Param('courseId') courseId: string, @Body() dto: EnrollStandaloneDto) {
    return this.paymentsService.initializeStandaloneCourse(dto, courseId);
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

  @Get('subscription-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student: Check if I have an active subscription' })
  async getSubscriptionStatus(@CurrentUser('id') userId: string) {
    return this.paymentsService.getSubscriptionStatus(userId);
  }

  @Post('resubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Student: Resubscribe to a mentorship course after unsubscribing' })
  @ApiBody({ type: SubscribeMenteeDto })
  async resubscribe(@CurrentUser('id') userId: string, @Body() dto: SubscribeMenteeDto) {
    return this.paymentsService.resubscribe(userId, dto);
  }
}