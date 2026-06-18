import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** 변경 대상 데이터 종류. 1차는 시험항목 기준정보만. */
export type ChangeTargetType = 'STD_TEST_ITEM';

/** 변경 작업 종류. */
export type ChangeOperation = 'CREATE' | 'UPDATE' | 'DELETE';

/** 변경요청 상태. */
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * 승인 워크플로 변경요청. 비승인권자의 생성/수정/삭제는 라이브 테이블에
 * 즉시 반영되지 않고 PENDING 으로 적재된다. 승인 시 PAYLOAD 를 적용한다.
 */
@Entity({ name: 'TMDM_CHANGE_REQUEST' })
export class ChangeRequestEntity {
  @PrimaryGeneratedColumn({ name: 'CR_ID', type: 'number' })
  crId: number;

  @Column({ name: 'TARGET_TYPE', type: 'varchar', length: 40 })
  targetType: ChangeTargetType;

  @Column({ name: 'OPERATION', type: 'varchar', length: 10 })
  operation: ChangeOperation;

  /** 대상 레코드 ID (CREATE 는 null). */
  @Column({ name: 'TARGET_ID', type: 'number', nullable: true })
  targetId: number | null;

  /** 제안 값(JSON). CREATE/UPDATE 의 본문. DELETE 는 null. */
  @Column({ name: 'PAYLOAD', type: 'varchar2', length: 4000, nullable: true })
  payload: string | null;

  /** 사람이 읽을 변경 요약(목록 표시용). */
  @Column({ name: 'SUMMARY', type: 'varchar', length: 500, nullable: true })
  summary: string | null;

  @Column({ name: 'REQUESTER_ID', type: 'varchar', length: 50 })
  requesterId: string;

  @Column({
    name: 'STATUS',
    type: 'varchar',
    length: 10,
    default: 'PENDING',
  })
  status: ChangeRequestStatus;

  /** 검토자(승인/반려) 사용자 ID. */
  @Column({ name: 'REVIEWER_ID', type: 'varchar', length: 50, nullable: true })
  reviewerId: string | null;

  /** 반려 사유 등 검토 의견. */
  @Column({
    name: 'REVIEW_COMMENT',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  reviewComment: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'REVIEWED_AT', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;
}
