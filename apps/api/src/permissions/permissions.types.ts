export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve';

/** 한 메뉴에 대한 역할의 권한 묶음 (프런트 게이팅용). */
export interface MenuPermission {
  menuId: string;
  menuType: 'MODULE' | 'TAB';
  parentId: string | null;
  i18nKey: string | null;
  sortOrder: number | null;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** 변경 요청을 직접 반영·검토(승인/반려)할 수 있는가. */
  canApprove: boolean;
}
