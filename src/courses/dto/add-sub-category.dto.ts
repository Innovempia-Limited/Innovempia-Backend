import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString, IsNumberString } from 'class-validator';

export class AddSubCategoryDto {
  @ApiProperty({ example: 'HTML Basics' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1, description: 'Order of the sub-category (1 comes first)' })
  @IsNumberString()
  @IsNotEmpty()
  order!: string;

  @ApiProperty({ example: 15, description: 'How many days this sub-category takes' })
  @IsNumberString()
  @IsNotEmpty()
  durationDays!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Sub-category curriculum document' })
  @IsOptional()
  @IsString()
  curriculumDocument?: string;
}