import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class AskQuestionDto {
  @ApiProperty({ example: 'uuid-of-enrollment' })
  @IsString()
  @IsNotEmpty()
  enrollmentId!: string;

  @ApiProperty({ example: 'I am stuck on the CSS flexbox project. My items are not aligning center.' })
  @IsString()
  @IsNotEmpty()
  question!: string;
}