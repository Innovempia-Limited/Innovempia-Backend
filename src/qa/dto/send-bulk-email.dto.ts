import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class SendBulkEmailDto {
  @ApiProperty({ example: 'Important Update: New Course Available!' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'We just launched a new Python course. Check it out on your dashboard!' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}