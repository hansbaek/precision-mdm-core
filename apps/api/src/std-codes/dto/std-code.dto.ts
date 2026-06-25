import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * 표준코드 생성. CODE_LVL 은 부모가 있으면 (부모LVL+1)로 서버가 산정하므로
 * 클라이언트는 PARENT_CD 만 넘기면 된다(루트는 PARENT_CD 생략 → LVL 1).
 */
export class CreateStdCodeDto {
  @ApiProperty({ example: 'PRODUCT_LINE' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  codeGrpId: string;

  @ApiPropertyOptional({
    example: '제품 라인',
    description: '그룹 신규 시 그룹명',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  codeGrpNm?: string;

  @ApiPropertyOptional({
    example: 'PCR',
    description: '부모 CODE_CD (루트면 생략)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  parentCd?: string;

  @ApiProperty({ example: 'SUMMER' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  codeCd: string;

  @ApiPropertyOptional({ example: '여름용' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  codeNm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  codeDesc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ enum: ['Y', 'N'], default: 'Y' })
  @IsOptional()
  @IsIn(['Y', 'N'])
  useYn?: string;

  // ATTR 슬롯(값/명/설명) — 코드별 부가 속성.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attr1Val?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attr1Nm?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attr1Desc?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attr2Val?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attr2Nm?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attr2Desc?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attr3Val?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attr3Nm?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attr3Desc?: string;
}

/**
 * 표준코드 이동(트리 드래그&드롭). 부모 변경(재부모화) + 형제 내 정렬을 한 번에 처리한다.
 * - newParentCd 생략 → 최상위(루트, CODE_LVL=1)로 이동.
 * - beforeCd 지정 → 그 형제 코드 바로 앞에 위치. 생략 → 형제 목록 맨 뒤.
 */
export class MoveStdCodeDto {
  @ApiPropertyOptional({ description: '새 부모 CODE_CD (루트면 생략)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  newParentCd?: string;

  @ApiPropertyOptional({ description: '이 형제 코드 앞에 삽입 (맨 뒤면 생략)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  beforeCd?: string;
}

/**
 * 표준코드 수정. PK(CODE_GRP_ID/CODE_LVL/CODE_CD)와 계층(PARENT_CD)은 수정 모달에서
 * 건드리지 않는다. 부모/정렬 변경은 move(드래그)로, 여기서는 속성만 갱신한다.
 */
export class UpdateStdCodeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  codeNm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  codeDesc?: string;

  @ApiPropertyOptional({ description: '그룹 전체에 적용되는 그룹명' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  codeGrpNm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ enum: ['Y', 'N'] })
  @IsOptional()
  @IsIn(['Y', 'N'])
  useYn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attr1Val?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attr1Nm?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attr1Desc?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attr2Val?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attr2Nm?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attr2Desc?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attr3Val?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attr3Nm?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attr3Desc?: string;
}
