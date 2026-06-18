import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: '리프레시 토큰 원문 (${tokenId}.${secret})' })
  @IsString()
  @MinLength(1)
  refreshToken: string;
}
