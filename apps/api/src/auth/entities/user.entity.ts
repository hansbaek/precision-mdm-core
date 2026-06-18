import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 사용자 마스터. 1차 구현은 LOCAL 인증(bcrypt). 추후 SSO 사용자는
 * AUTH_SOURCE='SSO' + PASSWORD_HASH=null 로 적재된다.
 */
@Entity({ name: 'TMDM_USER' })
export class UserEntity {
  @PrimaryColumn({ name: 'USER_ID', type: 'varchar', length: 50 })
  userId: string;

  @Column({ name: 'USER_NM', type: 'varchar', length: 100, nullable: true })
  userNm: string;

  @Column({ name: 'USER_NM_ENG', type: 'varchar', length: 100, nullable: true })
  userNmEng: string;

  @Column({ name: 'TEAM_NM', type: 'varchar', length: 100, nullable: true })
  teamNm: string;

  @Column({ name: 'TEAM_NM_ENG', type: 'varchar', length: 100, nullable: true })
  teamNmEng: string;

  /** bcrypt 해시. SSO 사용자는 null. */
  @Column({
    name: 'PASSWORD_HASH',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  passwordHash: string | null;

  /** 'LOCAL' | 'SSO' */
  @Column({
    name: 'AUTH_SOURCE',
    type: 'varchar',
    length: 10,
    default: 'LOCAL',
  })
  authSource: string;

  @Column({ name: 'ROLE_ID', type: 'varchar', length: 50, nullable: true })
  roleId: string;

  @Column({ name: 'USE_YN', type: 'varchar', length: 1, default: 'Y' })
  useYn: string;

  /** 사용자 표시 환경설정(JSON 문자열). 미설정 시 null → 프런트 기본값 사용. */
  @Column({
    name: 'PREFERENCES',
    type: 'varchar2',
    length: 2000,
    nullable: true,
  })
  preferences: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', type: 'timestamp' })
  updatedAt: Date;
}
