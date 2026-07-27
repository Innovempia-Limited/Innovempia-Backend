import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GradeDayDto {
  @ApiPropertyOptional({ example: '10.0' })
  @IsOptional()
  @IsString()
  quizScore?: string;

  @ApiPropertyOptional({ example: '8.5' })
  @IsOptional()
  @IsString()
  projectScore?: string;

  @ApiPropertyOptional({ example: '9.2' })
  @IsOptional()
  @IsString()
  overallScore?: string;

  @ApiPropertyOptional({ enum: ['SUCCESS', 'NEEDS_CORRECTION'], example: 'SUCCESS' })
  @IsEnum(['SUCCESS', 'NEEDS_CORRECTION'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Detailed feedback document (PDF/Doc)' })
  @IsOptional()
  @IsString()
  feedbackDocument?: string;
}