import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class RequestMeetingDto {
  @ApiProperty({ example: 'Struggling with CSS Grid layout logic' })
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ApiProperty({ example: '2025-01-25' })
  @IsString()
  @IsNotEmpty()
  proposedDate!: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @IsNotEmpty()
  proposedTime!: string;
}