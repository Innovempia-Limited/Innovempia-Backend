import { ApiProperty } from '@nestjs/swagger';

export class UserBriefDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() role!: string;
  @ApiProperty({ nullable: true }) track!: string | null;
  @ApiProperty() isProfileComplete!: boolean;
}