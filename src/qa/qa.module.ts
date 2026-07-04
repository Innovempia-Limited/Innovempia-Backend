import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [QaController],
  providers: [QaService],
})
export class QaModule {}