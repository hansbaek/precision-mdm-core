import { Repository } from 'typeorm';
import { MenuEntity } from './entities/menu.entity';
import { RoleMenuPermEntity } from './entities/role-menu-perm.entity';
import { PermissionsService } from './permissions.service';

/**
 * can() 의 (메뉴, 액션) → Y/N 판정 로직 단위 테스트.
 * permRepo.findOne 만 목으로 대체한다.
 */
describe('PermissionsService.can', () => {
  let service: PermissionsService;
  let findOne: jest.Mock;

  beforeEach(() => {
    findOne = jest.fn();
    const permRepo = { findOne } as unknown as Repository<RoleMenuPermEntity>;
    const menuRepo = {} as unknown as Repository<MenuEntity>;
    service = new PermissionsService(menuRepo, permRepo);
  });

  it('roleId 가 비어 있으면 항상 false (권한 없음)', async () => {
    expect(await service.can('', 'menu', 'view')).toBe(false);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('권한 행이 없으면 false', async () => {
    findOne.mockResolvedValue(null);
    expect(await service.can('R1', 'menu', 'view')).toBe(false);
  });

  it('액션별 *_YN 컬럼을 정확히 매핑한다', async () => {
    findOne.mockResolvedValue({
      canViewYn: 'Y',
      canCreateYn: 'N',
      canUpdateYn: 'Y',
      canDeleteYn: 'N',
      canApproveYn: 'Y',
    });
    expect(await service.can('R1', 'm', 'view')).toBe(true);
    expect(await service.can('R1', 'm', 'create')).toBe(false);
    expect(await service.can('R1', 'm', 'update')).toBe(true);
    expect(await service.can('R1', 'm', 'delete')).toBe(false);
    expect(await service.can('R1', 'm', 'approve')).toBe(true);
  });

  it("'Y' 가 아닌 값은 모두 false 로 본다", async () => {
    findOne.mockResolvedValue({ canViewYn: 'y', canApproveYn: '' });
    expect(await service.can('R1', 'm', 'view')).toBe(false);
    expect(await service.can('R1', 'm', 'approve')).toBe(false);
  });
});
