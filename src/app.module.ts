import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { CoursesModule } from './courses/courses.module';
import { EmailModule } from './email/email.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';

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