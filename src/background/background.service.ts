import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackgroundService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    setInterval(() => this.expireOldSubscriptions(), 60 * 60 * 1000);
  }

  async expireOldSubscriptions() {
    const now = new Date();
    const expired = await this.prisma.paymentRecord.findMany({
      where: {
        type: 'SUBSCRIPTION',
        status: 'SUCCESS',
        isActive: true,
        endDate: { lt: now },
      },
    });

    for (const payment of expired) {
      await this.prisma.paymentRecord.update({
        where: { id: payment.id },
        data: { isActive: false },
      });

      await this.prisma.enrollment.updateMany({
        where: { userId: payment.userId, status: 'ACTIVE' },
        data: { status: 'SUSPENDED' },
      });
    }
  }
}
