import {
  Controller,
  Get,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import {
  CurrentUser,
  type JwtUser,
} from '../src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { RequirePermission } from '../src/permissions/decorators/require-permission.decorator';
import { PermissionsGuard } from '../src/permissions/permissions.guard';
import { PermissionsService } from '../src/permissions/permissions.service';

const TEST_SECRET = 'test-secret-at-least-32-characters-long!';

/** 권한 가드 검증용 보호 라우트 (테스트 전용). */
@Controller('test')
class ProtectedController {
  @Get('protected')
  @RequirePermission('test-master.dashboard', 'view')
  get(@CurrentUser() user: JwtUser) {
    return { userId: user.userId, role: user.role };
  }
}

/**
 * 인증·권한·검증의 HTTP 글루를 실제 전역 가드/파이프로 검증한다(DB 없이 모킹).
 * - JwtAuthGuard + JwtStrategy(실제, 테스트 시크릿) → 401/인증
 * - PermissionsGuard(실제) + PermissionsService(모킹) → 403/허용
 * - ValidationPipe(실제) → 400
 */
describe('Auth & guards (e2e, mocked)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const authService = { signIn: jest.fn(), me: jest.fn() };
  const permissions = { can: jest.fn() };

  const tokenFor = (sub: string, role: string) => jwt.sign({ sub, role });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: TEST_SECRET })],
        }),
        PassportModule,
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '5m' },
        }),
      ],
      controllers: [AuthController, ProtectedController],
      providers: [
        JwtStrategy,
        { provide: AuthService, useValue: authService },
        { provide: PermissionsService, useValue: permissions },
        // 운영과 동일한 순서: 인증 → 권한.
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => jest.clearAllMocks());

  // ── signin (@Public) ──
  it('signin 성공 → ok:true + result', async () => {
    authService.signIn.mockResolvedValue({
      token: 't',
      refreshToken: 'r',
      profile: {},
      menus: [],
      preferences: null,
    });
    const res = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ userId: 'admin', password: 'pw' })
      .expect(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.token).toBe('t');
  });

  it('signin 자격증명 오류 → 201 ok:false (전역 401 회피 설계)', async () => {
    authService.signIn.mockResolvedValue(null);
    const res = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ userId: 'admin', password: 'bad' })
      .expect(201);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBeTruthy();
  });

  it('signin 검증: 필수 필드 누락 → 400', () =>
    request(app.getHttpServer())
      .post('/auth/signin')
      .send({ userId: 'admin' })
      .expect(400));

  it('signin 검증: 미허용 필드 → 400 (whitelist)', () =>
    request(app.getHttpServer())
      .post('/auth/signin')
      .send({ userId: 'a', password: 'b', evil: 1 })
      .expect(400));

  // ── 인증 게이트 ──
  it('토큰 없이 보호 라우트 → 401', () =>
    request(app.getHttpServer()).get('/test/protected').expect(401));

  it('유효 토큰 + 권한 있음 → 200, can(role,menu,action) 호출', async () => {
    permissions.can.mockResolvedValue(true);
    const res = await request(app.getHttpServer())
      .get('/test/protected')
      .set('Authorization', `Bearer ${tokenFor('u1', 'ADMIN')}`)
      .expect(200);
    expect(res.body).toEqual({ userId: 'u1', role: 'ADMIN' });
    expect(permissions.can).toHaveBeenCalledWith(
      'ADMIN',
      'test-master.dashboard',
      'view',
    );
  });

  it('유효 토큰 + 권한 없음 → 403', async () => {
    permissions.can.mockResolvedValue(false);
    await request(app.getHttpServer())
      .get('/test/protected')
      .set('Authorization', `Bearer ${tokenFor('u2', 'VIEWER')}`)
      .expect(403);
  });

  // ── 토큰 → 사용자 전파 ──
  it('me: 토큰의 sub 로 AuthService.me 호출', async () => {
    authService.me.mockResolvedValue({
      profile: {},
      menus: [],
      preferences: null,
    });
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${tokenFor('u9', 'EDITOR')}`)
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(authService.me).toHaveBeenCalledWith('u9');
  });
});
