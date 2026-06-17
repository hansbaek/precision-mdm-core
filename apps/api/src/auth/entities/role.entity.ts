import { Column, Entity, PrimaryColumn } from 'typeorm';

/** 역할 마스터. 사용자당 단일 역할이 배정된다. */
@Entity({ name: 'TMDM_ROLE' })
export class RoleEntity {
  @PrimaryColumn({ name: 'ROLE_ID', type: 'varchar', length: 50 })
  roleId: string;

  @Column({ name: 'ROLE_NM', type: 'varchar', length: 100 })
  roleNm: string;

  /** 시스템 역할(ADMIN 등) — 삭제 불가 보호용. */
  @Column({ name: 'IS_SYSTEM_YN', type: 'varchar', length: 1, default: 'N' })
  isSystemYn: string;

  @Column({ name: 'SORT_ORDER', type: 'number', nullable: true })
  sortOrder: number;

  @Column({ name: 'USE_YN', type: 'varchar', length: 1, default: 'Y' })
  useYn: string;
}
