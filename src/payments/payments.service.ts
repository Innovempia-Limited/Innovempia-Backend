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

    const data = await res.json();
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

    // Create plan on the fly if you want, or use a fixed one. For simplicity, we use standard transaction first, 
    // then you migrate them to a subscription on Paystack dashboard later, OR we create a plan via API.
    // To keep it robust and manual as requested, we do a standard 25k payment.
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        metadata: { subscription_init: true, user_id: userId },
      }),
    });

    const data = await res.json();
    if (!data.status) throw new BadRequestException('Could not initialize subscription payment');

    await this.prisma.paymentRecord.create({
      data: {
        userId,
        type: 'SUBSCRIPTION',
        amount: 25000,
        status: 'PENDING',
        paystackReference: data.data.reference,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    return { authorization_url: data.data.authorization_url, reference: data.data.reference };
  }

  async verifyPayment(reference: string) {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!data.status || data.data.status !== 'success') {
      throw new BadRequestException('Payment not successful');
    }

    const payment = await this.prisma.paymentRecord.findUnique({ where: { paystackReference: reference } });
    if (!payment) throw new BadRequestException('Payment record not found');
    if (payment.status === 'SUCCESS') return payment; // Idempotency

    const updatedPayment = await this.prisma.paymentRecord.update({
      where: { paystackReference: reference },
      data: { status: 'SUCCESS' },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payment.userId } });

    // Handle Standalone Course Success
    if (payment.type === 'STANDALONE_COURSE') {
      const courseId = data.data.metadata.course_id;
      const course = await this.prisma.standaloneCourse.findUnique({ where: { id: courseId } });
      
      if (user && course) {
        try {
          await this.emailService.sendCoursePurchaseEmail(user.email, user.firstName, course.title, course.whatsappGroupLink);
        } catch (e) { console.error('Email failed', e.message); }
      }
    }

    // Handle Subscription Success
    if (payment.type === 'SUBSCRIPTION') {
      // You can send a welcome to intermediate email here
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