import { ApiProperty } from '@nestjs/swagger';

import { UserBriefDto } from './user-brief.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT token' })
  access_token!: string;

  @ApiProperty({ type: UserBriefDto })
  user!: UserBriefDto;
}