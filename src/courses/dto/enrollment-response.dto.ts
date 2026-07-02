import { ApiProperty } from '@nestjs/swagger';

import { CourseResponseDto } from './course-response.dto';

export class EnrollmentResponseDto {
  @ApiProperty() access_token!: string;
  @ApiProperty() enrollmentId!: string;
  @ApiProperty() currentDay!: number;
  @ApiProperty() level!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: CourseResponseDto }) course!: any; 
}