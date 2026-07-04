import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddSubCategoryDto {
  @ApiProperty({ example: 'HTML Basics' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  order!: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  @IsNotEmpty()
  durationDays!: number;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Sub-category curriculum document' })
  @IsOptional()
  @IsString()
  curriculumDocument?: string;
}