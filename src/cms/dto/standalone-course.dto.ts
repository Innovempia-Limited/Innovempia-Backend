import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export enum Level {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export class StandaloneCourseDto {
  @ApiProperty({ example: 'Introduction to Web Development' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Learn web development from scratch' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 99.99 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: '<p>Course content here</p>' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://chat.whatsapp.com/...' })
  @IsOptional()
  @IsString()
  whatsappGroupLink?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({ enum: Level, example: Level.BEGINNER })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiPropertyOptional({ example: 'Week 1: HTML/CSS\nWeek 2: JavaScript' })
  @IsOptional()
  @IsString()
  blueprint?: string;

  @ApiPropertyOptional({ example: 'Mon, Wed, Fri' })
  @IsOptional()
  @IsString()
  classDays?: string;

  @ApiPropertyOptional({ example: '10:00 AM - 12:00 PM' })
  @IsOptional()
  @IsString()
  classTime?: string;

  @ApiPropertyOptional({ example: 'Online via Zoom' })
  @IsOptional()
  @IsString()
  venue?: string;
}
