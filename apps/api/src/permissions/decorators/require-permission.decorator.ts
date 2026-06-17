import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '../permissions.types';

export const PERMISSION_KEY = 'requiredPermission';

export interface RequiredPermission {
  menuId: string;
  action: PermissionAction;
}

/**
 * 엔드포인트에 필요한 (메뉴, 액션) 권한을 선언한다.
 * 예: @RequirePermission('test-master.dashboard', 'create')
 * PermissionsGuard(전역)가 현재 사용자의 역할로 이 권한을 검증한다.
 */
export const RequirePermission = (menuId: string, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { menuId, action } satisfies RequiredPermission);
