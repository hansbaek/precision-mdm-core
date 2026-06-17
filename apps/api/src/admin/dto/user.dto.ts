import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'hong' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  userId: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @MaxLength(100)
  userNm: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  userNmEng?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamNm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamNmEng?: string;

  @ApiProperty({ example: 'init123!' })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({ example: 'VIEWER' })
  @IsString()
  roleId: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  userNm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  userNmEng?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamNm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamNmEng?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ enum: ['Y', 'N'] })
  @IsOptional()
  @IsString()
  useYn?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'newpass123!' })
  @IsString()
  @MinLength(4)
  password: string;
}
