import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** 알림 유형. 확장 시 값을 추가한다. */
export type NotificationType =
  | 'CHANGE_REQUEST_SUBMITTED' // 승인권자에게: 새 변경요청 대기
  | 'CHANGE_REQUEST_APPROVED' // 요청자에게: 승인됨
  | 'CHANGE_REQUEST_REJECTED' // 요청자에게: 반려됨
  | 'SYSTEM';

/**
 * 사용자별 인앱 알림. 토스트(휘발성)와 달리 영속되며 읽음 상태를 갖는다.
 */
@Entity({ name: 'TMDM_NOTIFICATION' })
export class NotificationEntity {
  @PrimaryGeneratedColumn({ name: 'NOTI_ID', type: 'number' })
  notiId: number;

  /** 수신자 사용자 ID. */
  @Column({ name: 'RECIPIENT_ID', type: 'varchar', length: 50 })
  recipientId: string;

  @Column({ name: 'NOTI_TYPE', type: 'varchar', length: 40 })
  type: NotificationType;

  /** 표시 메시지(국문). 다국어는 추후 i18n 키 전환 가능. */
  @Column({ name: 'MESSAGE', type: 'varchar', length: 500 })
  message: string;

  /** 클릭 시 이동할 앱 내 위치 식별자(예: change-request:123). 선택. */
  @Column({ name: 'LINK', type: 'varchar', length: 200, nullable: true })
  link: string | null;

  @Column({ name: 'IS_READ_YN', type: 'varchar', length: 1, default: 'N' })
  isReadYn: string;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;
}
