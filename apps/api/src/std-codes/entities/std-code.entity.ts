import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'DW_STD_CODE' })
export class StdCodeEntity {
  @PrimaryColumn({ name: 'CODE_GRP_ID', type: 'varchar', length: 100 })
  codeGrpId: string;

  @PrimaryColumn({ name: 'CODE_CD', type: 'varchar', length: 100 })
  codeCd: string;

  @Column({ name: 'CODE_LVL', type: 'number', nullable: true })
  codeLvl: number;

  @Column({ name: 'CODE_NM', type: 'varchar', length: 200, nullable: true })
  codeNm: string;

  @Column({ name: 'CODE_DESC', type: 'varchar', length: 500, nullable: true })
  codeDesc: string;

  @Column({ name: 'SORT_ORDER', type: 'number', nullable: true })
  sortOrder: number;

  @Column({ name: 'USE_YN', type: 'varchar', length: 1, nullable: true })
  useYn: string;
}
