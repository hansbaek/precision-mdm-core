import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * 역할 × 메뉴 권한 매트릭스. 관리자 UI가 편집하는 핵심 테이블.
 * 각 (역할, 메뉴)마다 view/create/update/delete 4개 액션 플래그를 가진다.
 */
@Entity({ name: 'TMDM_ROLE_MENU_PERM' })
export class RoleMenuPermEntity {
  @PrimaryColumn({ name: 'ROLE_ID', type: 'varchar', length: 50 })
  roleId: string;

  @PrimaryColumn({ name: 'MENU_ID', type: 'varchar', length: 100 })
  menuId: string;

  @Column({ name: 'CAN_VIEW_YN', type: 'varchar', length: 1, default: 'N' })
  canViewYn: string;

  @Column({ name: 'CAN_CREATE_YN', type: 'varchar', length: 1, default: 'N' })
  canCreateYn: string;

  @Column({ name: 'CAN_UPDATE_YN', type: 'varchar', length: 1, default: 'N' })
  canUpdateYn: string;

  @Column({ name: 'CAN_DELETE_YN', type: 'varchar', length: 1, default: 'N' })
  canDeleteYn: string;
}
