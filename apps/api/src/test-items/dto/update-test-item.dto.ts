import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateTestItemDto {
  @ApiPropertyOptional({ example: 'Material Strength' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameKr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specification?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ enum: ['REQUIRED', 'OPTIONAL'] })
  @IsIn(['REQUIRED', 'OPTIONAL'])
  @IsOptional()
  mandatory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastUpdated?: string;

  @ApiPropertyOptional({ enum: ['Active', 'Pending', 'Inactive'] })
  @IsIn(['Active', 'Pending', 'Inactive'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productLines?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
