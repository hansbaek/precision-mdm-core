import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStdTestItemDto {
  @ApiPropertyOptional() @IsString() @IsOptional() productLine?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() testItemName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() testMethod?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() testCondition?: string;
  /** comma-separated market codes, e.g. "A0,A1,K1,NA" */
  @ApiPropertyOptional() @IsString() @IsOptional() markets?: string;
}
