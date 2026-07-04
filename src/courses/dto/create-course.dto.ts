import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Frontend Development' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'TRACK', enum: ['TRACK', 'SPECIFIC_LANGUAGE'] })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ example: '90', description: 'Total duration in days' })
  @IsString()
  @IsOptional()
  totalDays?: string;

  @ApiPropertyOptional({ example: 'Learn HTML, CSS, and JavaScript from scratch' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'A laptop and internet connection' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  instructorName!: string;

  @ApiPropertyOptional({ example: 'Senior frontend engineer at TechCorp' })
  @IsString()
  @IsOptional()
  instructorBio?: string;

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

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Course curriculum document (PDF/Doc)' })
  @IsOptional()
  @IsString()
  curriculumDocument?: string;
}