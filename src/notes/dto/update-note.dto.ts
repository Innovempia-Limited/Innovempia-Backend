import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  dayNumber?: number;

  @ApiProperty({ example: 'Updated Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'updated.pdf', required: false })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ example: 'https://example.com/updated.pdf', required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}