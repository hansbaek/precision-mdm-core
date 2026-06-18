import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** 반려(또는 승인) 시 선택 검토 의견. */
export class ReviewDto {
  @ApiPropertyOptional({ description: '검토 의견 / 반려 사유' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
