import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Advanced Frontend Development' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'TRACK', enum: ['TRACK', 'SPECIFIC_LANGUAGE'] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructorName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructorBio?: string;

  @ApiPropertyOptional({ example: '90', description: 'Total duration in days (Optional for tracks, required for specific languages)' })
  @IsString()
  @IsOptional()
  totalDays?: string;
  
  // File fields
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  instructorImage?: string;
}