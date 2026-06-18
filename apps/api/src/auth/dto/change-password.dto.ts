import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: '현재 비밀번호' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ description: '새 비밀번호 (8자 이상)' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
