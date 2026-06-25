import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * 표준코드(DW_STD_CODE). 계층은 `PARENT_CD`(부모 CODE_CD) + `CODE_LVL`(깊이)로
 * 표현되며, 같은 그룹 내에서 PK 는 (CODE_GRP_ID, CODE_LVL, CODE_CD) 다.
 * ATTR1~3 슬롯은 코드별 부가 속성(값/명/설명)이다.
 */
@Entity({ name: 'DW_STD_CODE' })
export class StdCodeEntity {
  @PrimaryColumn({ name: 'CODE_GRP_ID', type: 'varchar', length: 100 })
  codeGrpId: string;

  @PrimaryColumn({ name: 'CODE_LVL', type: 'number' })
  codeLvl: number;

  @PrimaryColumn({ name: 'CODE_CD', type: 'varchar', length: 100 })
  codeCd: string;

  @Column({ name: 'CODE_GRP_NM', type: 'varchar', length: 200, nullable: true })
  codeGrpNm: string | null;

  @Column({ name: 'PARENT_CD', type: 'varchar', length: 100, nullable: true })
  parentCd: string | null;

  @Column({ name: 'CODE_NM', type: 'varchar', length: 200, nullable: true })
  codeNm: string | null;

  @Column({ name: 'CODE_DESC', type: 'varchar', length: 1000, nullable: true })
  codeDesc: string | null;

  @Column({ name: 'ATTR1_VAL', type: 'varchar', length: 500, nullable: true })
  attr1Val: string | null;

  @Column({ name: 'ATTR1_NM', type: 'varchar', length: 200, nullable: true })
  attr1Nm: string | null;

  @Column({ name: 'ATTR1_DESC', type: 'varchar', length: 1000, nullable: true })
  attr1Desc: string | null;

  @Column({ name: 'ATTR2_VAL', type: 'varchar', length: 500, nullable: true })
  attr2Val: string | null;

  @Column({ name: 'ATTR2_NM', type: 'varchar', length: 200, nullable: true })
  attr2Nm: string | null;

  @Column({ name: 'ATTR2_DESC', type: 'varchar', length: 1000, nullable: true })
  attr2Desc: string | null;

  @Column({ name: 'ATTR3_VAL', type: 'varchar', length: 500, nullable: true })
  attr3Val: string | null;

  @Column({ name: 'ATTR3_NM', type: 'varchar', length: 200, nullable: true })
  attr3Nm: string | null;

  @Column({ name: 'ATTR3_DESC', type: 'varchar', length: 1000, nullable: true })
  attr3Desc: string | null;

  @Column({ name: 'USE_YN', type: 'varchar', length: 1, nullable: true })
  useYn: string | null;

  @Column({ name: 'SORT_ORDER', type: 'number', nullable: true })
  sortOrder: number | null;

  @Column({ name: 'REG_DTM', type: 'timestamp', nullable: true })
  regDtm: Date | null;

  @Column({ name: 'UPD_DTM', type: 'timestamp', nullable: true })
  updDtm: Date | null;
}
