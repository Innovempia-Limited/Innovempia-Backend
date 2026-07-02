import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDayContentDto {
  @ApiProperty({ example: 'uuid-of-course' })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiPropertyOptional({ example: 'uuid-of-sub-category', description: 'Required if course is a TRACK' })
  @IsString()
  @IsOptional()
  subCategoryId?: string;

  @ApiProperty({ example: 'BEGINNER', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  @IsString()
  @IsNotEmpty()
  level!: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  dayNumber!: string;

  @ApiPropertyOptional({ example: 'Welcome to HTML! Today we learn tags.' })
  @IsString()
  @IsOptional()
  materialText?: string;

  @ApiPropertyOptional({ example: 'Build a simple profile page using h1, p, and img tags.' })
  @IsString()
  @IsOptional()
  projectDescription?: string;

  @ApiPropertyOptional({ example: 'Must include at least 1 heading, 1 paragraph, 1 image.' })
  @IsString()
  @IsOptional()
  projectRequirements?: string;

  @ApiProperty({ example: 'GITHUB_LINK', enum: ['GITHUB_LINK', 'PASTED_CODE', 'FILE_UPLOAD', 'MIXED'] })
  @IsString()
  @IsNotEmpty()
  submissionMethod!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Downloadable material file (PDF/Doc)' })
  @IsOptional()
  @IsString()
  materialFile?: string;
}