import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class SubscribeMenteeDto {
  @ApiPropertyOptional({ example: 'uuid-of-mentorship-course' })
  @IsOptional()
  @IsString()
  courseId?: string;
}
