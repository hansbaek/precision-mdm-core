import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { RoleEntity } from '../auth/entities/role.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { MenuEntity } from '../permissions/entities/menu.entity';
import { RoleMenuPermEntity } from '../permissions/entities/role-menu-perm.entity';
import { AdminService } from './admin.service';

/**
 * 관리자 콘솔의 보안·관리 이벤트가 감사 로그로 적재되는지(actorId/source=ADMIN,
 * action, 필드 diff) 검증한다. (감사 3단계)
 */
describe('AdminService 감사 계측', () => {
  let service: AdminService;
  let roleRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  let userRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  let menuRepo: { find: jest.Mock };
  let permRepo: { find: jest.Mock; upsert: jest.Mock; delete: jest.Mock };
  let audit: { record: jest.Mock };

  const ACTOR = 'admin-1';

  beforeEach(() => {
    roleRepo = {
      findOne: jest.fn(),
      save: jest.fn((x) => Promise.resolve(x)),
      create: jest.fn((x) => x),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn((x) => Promise.resolve(x)),
      create: jest.fn((x) => x),
      delete: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
    };
    menuRepo = { find: jest.fn().mockResolvedValue([]) };
    permRepo = {
      find: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    service = new AdminService(
      roleRepo as unknown as Repository<RoleEntity>,
      userRepo as unknown as Repository<UserEntity>,
      menuRepo as unknown as Repository<MenuEntity>,
      permRepo as unknown as Repository<RoleMenuPermEntity>,
      audit as unknown as AuditService,
    );
  });

  it('createUser → USER CREATE 를 ADMIN 출처로 기록한다', async () => {
    userRepo.findOne.mockResolvedValue(null); // 중복 없음
    roleRepo.findOne.mockResolvedValue({ roleId: 'VIEWER' }); // 역할 존재

    await service.createUser(
      { userId: 'u9', userNm: '홍길동', password: 'pw12', roleId: 'VIEWER' },
      ACTOR,
    );

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'USER',
        entityId: 'u9',
        action: 'CREATE',
        ctx: { actorId: ACTOR, source: 'ADMIN' },
      }),
    );
  });

  it('updateUser → 변경된 필드만 diff 로 기록한다(역할 변경)', async () => {
    userRepo.findOne.mockResolvedValue({
      userId: 'u9',
      userNm: '홍길동',
      userNmEng: null,
      teamNm: null,
      teamNmEng: null,
      roleId: 'VIEWER',
      useYn: 'Y',
    });
    roleRepo.findOne.mockResolvedValue({ roleId: 'EDITOR' });

    await service.updateUser('u9', { roleId: 'EDITOR' }, ACTOR);

    const arg = audit.record.mock.calls[0][0];
    expect(arg.action).toBe('UPDATE');
    expect(arg.changes).toEqual([
      { column: 'roleId', before: 'VIEWER', after: 'EDITOR' },
    ]);
  });

  it('deleteUser → USER DELETE 기록', async () => {
    userRepo.findOne.mockResolvedValue({ userId: 'u9', userNm: '홍길동' });

    await service.deleteUser('u9', ACTOR);

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DELETE', entityId: 'u9' }),
    );
  });

  it('resetPassword → PASSWORD_RESET 기록', async () => {
    userRepo.findOne.mockResolvedValue({ userId: 'u9', userNm: '홍길동' });

    await service.resetPassword('u9', 'newpw', ACTOR);

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PASSWORD_RESET',
        ctx: { actorId: ACTOR, source: 'ADMIN' },
      }),
    );
  });

  it('updateRolePermissions → 변경된 메뉴만 PERM_CHANGE diff 로 기록', async () => {
    roleRepo.findOne.mockResolvedValue({ roleId: 'EDITOR', roleNm: '편집자' });
    menuRepo.find.mockResolvedValue([{ menuId: 'std' }, { menuId: 'admin' }]);
    // 변경 전: std 권한 없음, admin 권한 없음
    permRepo.find
      .mockResolvedValueOnce([]) // before 스냅샷
      .mockResolvedValueOnce([
        {
          menuId: 'std',
          canViewYn: 'Y',
          canCreateYn: 'N',
          canUpdateYn: 'N',
          canDeleteYn: 'N',
          canApproveYn: 'N',
        },
      ]); // after

    await service.updateRolePermissions(
      'EDITOR',
      {
        permissions: [
          {
            menuId: 'std',
            canView: true,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canApprove: false,
          },
        ],
      },
      ACTOR,
    );

    const arg = audit.record.mock.calls[0][0];
    expect(arg.action).toBe('PERM_CHANGE');
    expect(arg.entityId).toBe('EDITOR');
    expect(arg.changes).toEqual([{ column: 'std', before: '-', after: 'V' }]);
  });

  it('권한 변경이 없으면 PERM_CHANGE 를 기록하지 않는다', async () => {
    roleRepo.findOne.mockResolvedValue({ roleId: 'EDITOR', roleNm: '편집자' });
    menuRepo.find.mockResolvedValue([{ menuId: 'std' }]);
    permRepo.find.mockResolvedValue([]); // before/after 모두 권한 없음

    await service.updateRolePermissions(
      'EDITOR',
      {
        permissions: [
          {
            menuId: 'std',
            canView: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canApprove: false,
          },
        ],
      },
      ACTOR,
    );

    expect(audit.record).not.toHaveBeenCalled();
  });
});
