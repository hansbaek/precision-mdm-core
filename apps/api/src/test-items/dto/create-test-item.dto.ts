import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTestItemDto {
  @ApiProperty({ example: 'T-10042' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Material Strength' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '인장강도 테스트' })
  @IsString()
  @IsNotEmpty()
  nameKr: string;

  @ApiProperty({ example: 'Tensile Strength Test' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiPropertyOptional({ example: 'ASTM D412' })
  @IsString()
  @IsOptional()
  specification?: string;

  @ApiPropertyOptional({ example: 'MPa' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ enum: ['REQUIRED', 'OPTIONAL'], example: 'REQUIRED' })
  @IsIn(['REQUIRED', 'OPTIONAL'])
  mandatory: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsString()
  @IsOptional()
  lastUpdated?: string;

  @ApiProperty({ enum: ['Active', 'Pending', 'Inactive'], example: 'Active' })
  @IsIn(['Active', 'Pending', 'Inactive'])
  status: string;

  @ApiPropertyOptional({ type: [String], example: ['PCR', 'EV'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productLines?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'hans.baek@gmail.com' })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
