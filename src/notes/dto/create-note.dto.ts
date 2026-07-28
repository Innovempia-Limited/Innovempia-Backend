import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'uuid-of-enrollment' })
  @IsString()
  @IsNotEmpty()
  enrollmentId!: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  dayNumber!: number;

  @ApiProperty({ example: 'Day 3 Notes' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Some note content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'notes.pdf', required: false })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ example: 'https://example.com/notes.pdf', required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}