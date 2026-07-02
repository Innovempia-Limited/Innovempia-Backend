import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SubCategoryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() order!: number;
}

export class CourseResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() type!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() imageUrl!: string | null;
  @ApiPropertyOptional() videoUrl!: string | null;
  @ApiProperty() requirements!: string;
  @ApiProperty() instructorName!: string;
  @ApiProperty() instructorBio!: string;
  @ApiPropertyOptional() instructorImage!: string | null;
  @ApiProperty({ type: [SubCategoryDto] }) subCategories!: SubCategoryDto[];
}