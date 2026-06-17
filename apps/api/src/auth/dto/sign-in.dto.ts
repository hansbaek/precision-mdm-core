import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  userId: string;

  @ApiProperty({ example: 'admin123!' })
  @IsString()
  @MinLength(1)
  password: string;
}
