import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';
import { PaymentsModule } from '../payments/payments.module'; 
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';

import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';// ADD THIS

@Module({
  imports: [PrismaModule, SupabaseModule, EmailModule, PaymentsModule], // ADD THIS
  controllers: [CmsController],
  providers: [CmsService],
})
export class CmsModule {}