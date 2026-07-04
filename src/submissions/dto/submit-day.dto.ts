import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitDayDto {
  @ApiProperty({ example: 'uuid-of-enrollment' })
  @IsString()
  @IsNotEmpty()
  enrollmentId!: string;

  @ApiPropertyOptional({ example: 'https://github.com/user/project', description: 'GitHub link or pasted code' })
  @IsString()
  @IsOptional()
  submissionContent?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Upload file if required' })
  @IsOptional()
  @IsString()
  submissionFile?: string;
}