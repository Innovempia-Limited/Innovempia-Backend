import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMeetingDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'AVAILABLE', 'UNAVAILABLE', 'RESCHEDULED', 'APPROVED', 'REJECTED'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Sure, let\'s meet at 2 PM. Come prepared with your code.' })
  @IsString()
  @IsOptional()
  adminMessage?: string;

  @ApiPropertyOptional({ example: '2025-01-26' })
  @IsString()
  @IsOptional()
  rescheduleDate?: string;

  @ApiPropertyOptional({ example: '15:00' })
  @IsString()
  @IsOptional()
  rescheduleTime?: string;
}