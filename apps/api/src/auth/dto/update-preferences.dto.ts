import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsString, Length } from 'class-validator';

/** 프런트 환경설정과 동일한 표시 기본값. 모든 항목 필수(프런트가 전체 전송). */
export class UpdatePreferencesDto {
  @ApiProperty({ description: '페이지당 항목 수', enum: [10, 20, 50, 100] })
  @IsInt()
  @IsIn([10, 20, 50, 100])
  pageSize: number;

  @ApiProperty({ description: '기본 정렬 기준 컬럼' })
  @IsString()
  @IsIn(['id', 'productLine', 'testItemName', 'testMethod', 'certiType'])
  sortBy: string;

  @ApiProperty({ description: '기본 정렬 방향', enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc';

  @ApiProperty({ description: '기본 제품군 (ALL = 전체)' })
  @IsString()
  @Length(1, 50)
  defaultProductLine: string;

  @ApiProperty({ description: '테이블 밀도', enum: ['comfortable', 'compact'] })
  @IsIn(['comfortable', 'compact'])
  density: 'comfortable' | 'compact';

  @ApiProperty({ description: '시스템 상태 이상 알림 표시 여부' })
  @IsBoolean()
  notifySystemStatus: boolean;
}
