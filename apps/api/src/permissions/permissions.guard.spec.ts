import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';

/** ExecutionContext 더블: 핸들러/클래스와 request.user 만 제공한다. */
function makeContext(user?: { userId: string; role: string }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let getAllAndOverride: jest.Mock;
  let can: jest.Mock;

  beforeEach(() => {
    getAllAndOverride = jest.fn();
    can = jest.fn();
    const reflector = { getAllAndOverride } as unknown as Reflector;
    const permissions = { can } as unknown as PermissionsService;
    guard = new PermissionsGuard(reflector, permissions);
  });

  it('@RequirePermission 이 없는 라우트는 권한 검사 없이 통과', async () => {
    getAllAndOverride.mockReturnValue(undefined);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
    expect(can).not.toHaveBeenCalled();
  });

  it('권한이 필요한데 user.role 이 없으면 Forbidden', async () => {
    getAllAndOverride.mockReturnValue({ menuId: 'm', action: 'view' });
    await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('역할이 권한을 가지면 통과', async () => {
    getAllAndOverride.mockReturnValue({ menuId: 'm', action: 'update' });
    can.mockResolvedValue(true);
    await expect(
      guard.canActivate(makeContext({ userId: 'u', role: 'R1' })),
    ).resolves.toBe(true);
    expect(can).toHaveBeenCalledWith('R1', 'm', 'update');
  });

  it('역할이 권한이 없으면 Forbidden', async () => {
    getAllAndOverride.mockReturnValue({ menuId: 'm', action: 'delete' });
    can.mockResolvedValue(false);
    await expect(
      guard.canActivate(makeContext({ userId: 'u', role: 'R1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
