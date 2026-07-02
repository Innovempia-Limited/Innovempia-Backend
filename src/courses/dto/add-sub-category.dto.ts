import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AddSubCategoryDto {
  @ApiProperty({ example: 'HTML Basics' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1, description: 'Order of the sub-category (1 comes first)' })
  @IsInt()
  order!: number;

  @ApiProperty({ example: 15, description: 'How many days this sub-category takes' })
  @IsInt()
  @IsNotEmpty()
  durationDays!: number;
}