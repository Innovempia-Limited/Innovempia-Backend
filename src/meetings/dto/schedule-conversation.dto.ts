import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScheduleConversationDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  recipientName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  recipientEmail!: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Struggling with React hooks' })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiProperty({ example: 'I want to discuss my career growth in frontend development' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: '2025-01-25' })
  @IsString()
  @IsNotEmpty()
  proposedDate!: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @IsNotEmpty()
  proposedTime!: string;
}
