import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPLOAD';

/** 변경 출처. 직접 편집/승인 반영/엑셀 업로드. */
export type AuditSource = 'API' | 'APPROVAL' | 'EXCEL_UPLOAD';

/**
 * 변경 이력(감사 로그). 마스터 데이터의 모든 쓰기 경로에서 누가/언제/무엇을
 * 바꿨는지 기록한다. CHANGES 는 필드 단위 before/after 의 JSON 배열.
 */
@Entity({ name: 'TMDM_AUDIT_LOG' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn({ name: 'AUDIT_ID', type: 'number' })
  auditId: number;

  @Index('IX_TMDM_AUDIT_ENTITY')
  @Column({ name: 'ENTITY_TYPE', type: 'varchar', length: 40 })
  entityType: string;

  /** 대상 레코드 식별자(문자열). BULK_UPLOAD 처럼 단일 대상이 아니면 null. */
  @Column({ name: 'ENTITY_ID', type: 'varchar', length: 100, nullable: true })
  entityId: string | null;

  @Column({ name: 'ACTION', type: 'varchar', length: 10 })
  action: AuditAction;

  @Index('IX_TMDM_AUDIT_ACTOR')
  @Column({ name: 'ACTOR_ID', type: 'varchar', length: 50 })
  actorId: string;

  @Column({ name: 'SOURCE', type: 'varchar', length: 20 })
  source: AuditSource;

  /** 필드 단위 변경 내역 JSON: [{ column, before, after }]. */
  @Column({ name: 'CHANGES', type: 'clob', nullable: true })
  changes: string | null;

  @Column({ name: 'SUMMARY', type: 'varchar', length: 1000, nullable: true })
  summary: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;
}
