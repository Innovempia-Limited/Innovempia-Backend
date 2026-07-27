import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GradeDayDto {
  @ApiPropertyOptional({ example: 10.0 })
  @IsOptional()
  quizScore?: number;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  projectScore?: number;

  @ApiPropertyOptional({ example: 9.2 })
  @IsOptional()
  overallScore?: number;

  @ApiPropertyOptional({ enum: ['SUCCESS', 'NEEDS_CORRECTION'], example: 'SUCCESS' })
  @IsEnum(['SUCCESS', 'NEEDS_CORRECTION'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Detailed feedback document (PDF/Doc)' })
  @IsOptional()
  @IsString()
  feedbackDocument?: string;
}