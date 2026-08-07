import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

import { EnrollStandaloneDto } from './enroll-standalone.dto';
import { SubscribeMenteeDto } from './subscribe-mentee.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private jwt: JwtService,
    private emailService: EmailService,
  ) {}

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeStandaloneCourse(data: EnrollStandaloneDto, courseId: string) {
    const course = await this.prisma.standaloneCourse.findFirst({ where: { id: courseId, isActive: true } });
    if (!course) throw new BadRequestException('Course not found');
    if (course.deadline && course.deadline < new Date()) {
      throw new BadRequestException('Registration deadline for this course has passed');
    }

    let user = await this.prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      const bcrypt = require('bcryptjs');
      const hashed = bcrypt.hashSync('Password123!', 10);
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: hashed,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'STUDENT',
        },
      });
    }

    const amountInKobo = Math.round(course.price * 100);

    const paystackBody: any = {
      email: user.email,
      amount: amountInKobo,
      metadata: { course_id: courseId, user_id: user.id },
      callback_url: this.config.get('PAYSTACK_CALLBACK_URL', 'https://www.innovempia.com/courses/payment/callback'),
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(paystackBody),
    });

    const paystackData = await res.json() as any;
    if (!paystackData.status) throw new BadRequestException('Could not initialize payment');

    await this.prisma.paymentRecord.create({
      data: {
        userId: user.id,
        type: 'STANDALONE_COURSE',
        amount: course.price,
        status: 'PENDING',
        paystackReference: paystackData.data.reference,
        standaloneCourseId: courseId,
      },
    });

    // Generate JWT for the new/existing user
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwt.sign(payload);

    return { 
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
      payment: {
        authorization_url: paystackData.data.authorization_url, 
        reference: paystackData.data.reference,
        amount: course.price 
      }
    };
  }
  
  async initializeSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const amountInKobo = 25000 * 100;

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        metadata: { subscription_init: true, user_id: userId },
      }),
    });

    const data = await res.json() as any;
    if (!data.status) throw new BadRequestException('Could not initialize subscription payment');

    await this.prisma.paymentRecord.create({
      data: {
        userId,
        type: 'SUBSCRIPTION',
        amount: 25000,
        status: 'PENDING',
        paystackReference: data.data.reference,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { authorization_url: data.data.authorization_url, reference: data.data.reference };
  }

  async verifyPayment(reference: string) {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await res.json() as any;
    if (!data.status || data.data.status !== 'success') {
      throw new BadRequestException('Payment not successful');
    }

    const payment = await this.prisma.paymentRecord.findUnique({ where: { paystackReference: reference } });
    if (!payment) throw new BadRequestException('Payment record not found');
    if (payment.status === 'SUCCESS') return payment;

    const updatedPayment = await this.prisma.paymentRecord.update({
      where: { paystackReference: reference },
      data: { status: 'SUCCESS' },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payment.userId } });

    if (payment.type === 'STANDALONE_COURSE') {
      const courseId = data.data.metadata.course_id;
      const course = await this.prisma.standaloneCourse.findUnique({ where: { id: courseId } });
      
      if (user && course) {
        try {
          await this.emailService.sendCoursePurchaseEmail(user.email, user.firstName, course.title, course.whatsappGroupLink, course.startDate?.toISOString(), course.classDays, course.classTime, course.venue);
        } catch (err: any) { console.error('Email failed', err.message); }
      }
    }

    return {
      payment: updatedPayment,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async cancelSubscription(userId: string) {
    const payment = await this.prisma.paymentRecord.findFirst({
      where: { userId, type: 'SUBSCRIPTION', status: 'SUCCESS', isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) throw new BadRequestException('No active subscription found');

    await this.prisma.paymentRecord.update({
      where: { id: payment.id },
      data: { isActive: false },
    });

    return { message: 'Subscription cancelled successfully' };
  }

  async getSubscriptionStatus(userId: string) {
    const activePayment = await this.prisma.paymentRecord.findFirst({
      where: { userId, type: 'SUBSCRIPTION', status: 'SUCCESS', isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      hasActiveSubscription: !!activePayment,
      subscription: activePayment
        ? {
            id: activePayment.id,
            type: activePayment.type,
            status: activePayment.status,
            amount: activePayment.amount,
            endDate: activePayment.endDate,
            createdAt: activePayment.createdAt,
          }
        : null,
    };
  }

  async resubscribe(userId: string, dto: SubscribeMenteeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let courseId = dto.courseId;

    if (courseId) {
      const course = await this.prisma.mentorshipCourse.findFirst({
        where: { id: courseId, isActive: true },
      });
      if (!course) throw new BadRequestException('Course not found');
    }

    let enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId: courseId || '' },
    });

    if (!enrollment && courseId) {
      enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId,
          currentDay: 1,
          level: 'BEGINNER',
          status: 'ACTIVE',
        },
      });
    } else if (enrollment && (enrollment.status === 'SUSPENDED' || enrollment.status === 'COMPLETED')) {
      enrollment = await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: 'ACTIVE', currentDay: 1, level: 'BEGINNER' },
      });
    }

    const amountInKobo = 25000 * 100;

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        metadata: { subscription_init: true, user_id: userId, ...(courseId ? { course_id: courseId } : {}) },
      }),
    });

    const data = await res.json() as any;
    if (!data.status) throw new BadRequestException('Could not initialize subscription payment');

    await this.prisma.paymentRecord.create({
      data: {
        userId,
        type: 'SUBSCRIPTION',
        amount: 25000,
        status: 'PENDING',
        paystackReference: data.data.reference,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { authorization_url: data.data.authorization_url, reference: data.data.reference };
  }
}