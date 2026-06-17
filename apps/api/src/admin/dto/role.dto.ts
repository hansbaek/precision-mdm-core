import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'QA' })
  @IsString()
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'roleId 는 대문자/숫자/밑줄만 허용됩니다.',
  })
  @MaxLength(50)
  roleId: string;

  @ApiProperty({ example: '품질담당' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  roleNm: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleNm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: ['Y', 'N'] })
  @IsOptional()
  @IsString()
  useYn?: string;
}
