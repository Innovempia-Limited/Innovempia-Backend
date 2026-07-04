import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeStandaloneCourse(userId: string, courseId: string) {
    const course = await this.prisma.standaloneCourse.findFirst({ where: { id: courseId } });
    if (!course) throw new BadRequestException('Course not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const amountInKobo = Math.round(course.price * 100);

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        metadata: { course_id: courseId, user_id: userId },
      }),
    });

    const data = await res.json() as any;
    if (!data.status) throw new BadRequestException('Could not initialize payment');

    await this.prisma.paymentRecord.create({
      data: {
        userId,
        type: 'STANDALONE_COURSE',
        amount: course.price,
        status: 'PENDING',
        paystackReference: data.data.reference,
      },
    });

    return { authorization_url: data.data.authorization_url, reference: data.data.reference };
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
          await this.emailService.sendCoursePurchaseEmail(user.email, user.firstName, course.title, course.whatsappGroupLink);
        } catch (err: any) { console.error('Email failed', err.message); }
      }
    }

    return updatedPayment;
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
}