import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateSubCategoryDto {
  @ApiPropertyOptional({ example: 'Advanced HTML' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  order?: number;
}