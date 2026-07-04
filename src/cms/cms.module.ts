import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';

import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';

@Module({
  imports: [PrismaModule, SupabaseModule, EmailModule],
  controllers: [CmsController],
  providers: [CmsService],
})
export class CmsModule {}