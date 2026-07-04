import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class GradeDayDto {
  @ApiProperty({ example: 10.0 })
  @IsNumber()
  @IsNotEmpty()
  quizScore!: number;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  @IsNotEmpty()
  projectScore!: number;

  @ApiProperty({ example: 9.2 })
  @IsNumber()
  @IsNotEmpty()
  overallScore!: number;

  @ApiProperty({ enum: ['SUCCESS', 'NEEDS_CORRECTION'], example: 'SUCCESS' })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Detailed feedback document (PDF/Doc)' })
  @IsOptional()
  @IsString()
  feedbackDocument?: string;
}