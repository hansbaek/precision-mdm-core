import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';
import type { AuthProvider } from './providers/auth-provider.interface';
import { RefreshTokensService } from './refresh-tokens.service';

/** 보안 이벤트(로그인/로그아웃/비밀번호 변경) 감사 계측 검증. (감사 3단계) */
describe('AuthService 감사 계측', () => {
  let service: AuthService;
  let authProvider: { authenticate: jest.Mock };
  let jwt: { signAsync: jest.Mock };
  let permissions: { getVisibleMenus: jest.Mock };
  let refreshTokens: { issue: jest.Mock; revoke: jest.Mock };
  let userRepo: { findOne: jest.Mock; save: jest.Mock };
  let audit: { record: jest.Mock };

  const USER = {
    userId: 'u1',
    userNm: '홍길동',
    roleId: 'EDITOR',
    useYn: 'Y',
    authSource: 'LOCAL',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuv', // 형식만; bcrypt.compare 는 모킹
  } as unknown as UserEntity;

  beforeEach(() => {
    authProvider = { authenticate: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('access-token') };
    permissions = { getVisibleMenus: jest.fn().mockResolvedValue([]) };
    refreshTokens = {
      issue: jest
        .fn()
        .mockResolvedValue({ token: 'rid.secret', expiresAt: new Date() }),
      revoke: jest.fn(),
    };
    userRepo = { findOne: jest.fn().mockResolvedValue(USER), save: jest.fn() };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    service = new AuthService(
      authProvider as unknown as AuthProvider,
      jwt as unknown as JwtService,
      permissions as unknown as PermissionsService,
      refreshTokens as unknown as RefreshTokensService,
      audit as unknown as AuditService,
      userRepo as unknown as Repository<UserEntity>,
    );
  });

  it('로그인 성공 → LOGIN 을 AUTH 출처로 기록', async () => {
    authProvider.authenticate.mockResolvedValue({ userId: 'u1' });

    const session = await service.signIn('u1', 'pw', 'jest-agent');

    expect(session).not.toBeNull();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'USER',
        entityId: 'u1',
        action: 'LOGIN',
        ctx: { actorId: 'u1', source: 'AUTH' },
      }),
    );
  });

  it('로그인 실패 → LOGIN_FAILED 기록(시도 ID 로), 세션 null', async () => {
    authProvider.authenticate.mockResolvedValue(null);

    const session = await service.signIn('attacker', 'bad');

    expect(session).toBeNull();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN_FAILED',
        entityId: 'attacker',
        ctx: { actorId: 'attacker', source: 'AUTH' },
      }),
    );
  });

  it('로그아웃 → 폐기된 토큰의 사용자로 LOGOUT 기록', async () => {
    refreshTokens.revoke.mockResolvedValue('u1');

    await service.logout('rid.secret');

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGOUT', entityId: 'u1' }),
    );
  });

  it('로그아웃 시 토큰이 없으면(null) 기록하지 않는다', async () => {
    refreshTokens.revoke.mockResolvedValue(null);

    await service.logout('missing');

    expect(audit.record).not.toHaveBeenCalled();
  });
});
