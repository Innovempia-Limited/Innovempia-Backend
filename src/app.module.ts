import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
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