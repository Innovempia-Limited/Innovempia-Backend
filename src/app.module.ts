import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { CmsModule } from './cms/cms.module';
import { CoursesModule } from './courses/courses.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { EmailModule } from './email/email.module';
import { MeetingsModule } from './meetings/meetings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CoursesModule,
    EmailModule,
    NotificationsModule,
    AdminModule,
    StudentsModule,
    CurriculumModule,
    SubmissionsModule,
    MeetingsModule,
    PaymentsModule,
    CmsModule
  ],
  providers: [
    {
      provide: 'SEED_ADMIN',
      useFactory: (authService: AuthService) => {
        authService.seedAdmin();
      },
      inject: [AuthService],
    },
  ],
})
export class AppModule {}