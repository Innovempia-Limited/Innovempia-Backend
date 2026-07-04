import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateLevelDto {
  @ApiProperty({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'COMPLETED'], example: 'INTERMEDIATE' })
  @IsString()
  @IsNotEmpty()
  level!: string;
}