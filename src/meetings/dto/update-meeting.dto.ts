import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMeetingDto {
  @ApiPropertyOptional({ enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Sure, let\'s meet at 2 PM. Come prepared with your code.' })
  @IsString()
  @IsOptional()
  adminMessage?: string;
}