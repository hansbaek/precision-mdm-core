import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

/**
 * 리프레시 토큰(서버 측 저장). 클라이언트가 받는 값은 `${tokenId}.${secret}`
 * 형태이며, 서버는 tokenId(조회 키)와 secret 의 bcrypt 해시만 저장한다.
 * (원문 secret 은 저장하지 않음 → DB 유출 시에도 토큰 재사용 불가)
 *
 * 로테이션: 갱신마다 새 행을 만들고 기존 행을 revoke + rotatedTo 로 연결한다.
 * 재사용 탐지: 이미 revoke 된 토큰이 다시 제출되면 해당 사용자 토큰을 전부 폐기한다.
 */
@Entity({ name: 'TMDM_REFRESH_TOKEN' })
export class RefreshTokenEntity {
  @PrimaryColumn({ name: 'TOKEN_ID', type: 'varchar', length: 64 })
  tokenId: string;

  @Index('IX_TMDM_RT_USER')
  @Column({ name: 'USER_ID', type: 'varchar', length: 50 })
  userId: string;

  @Column({ name: 'TOKEN_HASH', type: 'varchar', length: 200 })
  tokenHash: string;

  @Column({ name: 'EXPIRES_AT', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'REVOKED_YN', type: 'varchar', length: 1, default: 'N' })
  revokedYn: string;

  /** 로테이션으로 이 토큰을 대체한 새 토큰 ID(재사용 탐지 추적용). */
  @Column({ name: 'ROTATED_TO', type: 'varchar', length: 64, nullable: true })
  rotatedTo: string | null;

  @Column({ name: 'USER_AGENT', type: 'varchar', length: 300, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;
}
