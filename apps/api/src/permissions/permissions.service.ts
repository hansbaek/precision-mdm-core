import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuEntity } from './entities/menu.entity';
import { RoleMenuPermEntity } from './entities/role-menu-perm.entity';
import { MenuPermission, PermissionAction } from './permissions.types';

const isY = (v?: string) => v === 'Y';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(RoleMenuPermEntity)
    private readonly permRepo: Repository<RoleMenuPermEntity>,
  ) {}

  /** 역할이 **조회 가능한** 메뉴 목록 + 액션 권한 (프런트 게이팅용). */
  async getVisibleMenus(roleId: string): Promise<MenuPermission[]> {
    if (!roleId) return [];
    const rows = await this.permRepo
      .createQueryBuilder('p')
      .innerJoin(MenuEntity, 'm', 'm.MENU_ID = p.MENU_ID')
      .where('p.ROLE_ID = :roleId', { roleId })
      .andWhere("p.CAN_VIEW_YN = 'Y'")
      .andWhere("m.USE_YN = 'Y'")
      .select([
        'm.MENU_ID AS "menuId"',
        'm.MENU_TYPE AS "menuType"',
        'm.PARENT_ID AS "parentId"',
        'm.I18N_KEY AS "i18nKey"',
        'm.SORT_ORDER AS "sortOrder"',
        'p.CAN_VIEW_YN AS "canView"',
        'p.CAN_CREATE_YN AS "canCreate"',
        'p.CAN_UPDATE_YN AS "canUpdate"',
        'p.CAN_DELETE_YN AS "canDelete"',
        'p.CAN_APPROVE_YN AS "canApprove"',
      ])
      .orderBy('m.SORT_ORDER', 'ASC')
      .getRawMany<Record<string, string | number>>();

    return rows.map((r) => ({
      menuId: String(r.menuId),
      menuType: r.menuType as 'MODULE' | 'TAB',
      parentId: r.parentId ? String(r.parentId) : null,
      i18nKey: r.i18nKey ? String(r.i18nKey) : null,
      sortOrder: r.sortOrder != null ? Number(r.sortOrder) : null,
      canView: isY(r.canView as string),
      canCreate: isY(r.canCreate as string),
      canUpdate: isY(r.canUpdate as string),
      canDelete: isY(r.canDelete as string),
      canApprove: isY(r.canApprove as string),
    }));
  }

  /** 가드용 권한 체크. 역할이 해당 메뉴의 액션을 수행할 수 있는가. */
  async can(
    roleId: string,
    menuId: string,
    action: PermissionAction,
  ): Promise<boolean> {
    if (!roleId) return false;
    const perm = await this.permRepo.findOne({ where: { roleId, menuId } });
    if (!perm) return false;
    switch (action) {
      case 'view':
        return isY(perm.canViewYn);
      case 'create':
        return isY(perm.canCreateYn);
      case 'update':
        return isY(perm.canUpdateYn);
      case 'delete':
        return isY(perm.canDeleteYn);
      case 'approve':
        return isY(perm.canApproveYn);
    }
  }
}
