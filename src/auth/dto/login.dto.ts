import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@innovempia.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@2024!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}