import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class UpdateDayContentDto {
  @ApiPropertyOptional({ example: 'Updated material text' })
  @IsString()
  @IsOptional()
  materialText?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectRequirements?: string;

  @ApiPropertyOptional({ example: 'FILE_UPLOAD', enum: ['GITHUB_LINK', 'PASTED_CODE', 'FILE_UPLOAD', 'MIXED'] })
  @IsString()
  @IsOptional()
  submissionMethod?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  materialFile?: string;
}