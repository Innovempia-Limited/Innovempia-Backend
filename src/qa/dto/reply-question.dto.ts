import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyQuestionDto {
  @ApiProperty({ example: 'Try adding `justify-content: center; align-items: center;` to the parent container.' })
  @IsString()
  @IsNotEmpty()
  adminReply!: string;
}