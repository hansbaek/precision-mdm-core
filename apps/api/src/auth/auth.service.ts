import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { PermissionsService } from '../permissions/permissions.service';
import { MenuPermission } from '../permissions/permissions.types';
import { UserEntity } from './entities/user.entity';
import { JwtPayload } from './jwt.strategy';
import { RefreshTokensService } from './refresh-tokens.service';
import { AUTH_PROVIDER_TOKEN } from './providers/auth-provider.interface';
import type { AuthProvider } from './providers/auth-provider.interface';

/** 프런트 UserProfile 과 일치하는 프로필 형태. */
export interface UserProfile {
  userId: string;
  userName: string;
  userNameEng: string;
  teamName: string;
  teamNameEng: string;
  role: string;
}

/** 사용자 표시 환경설정. 미설정 사용자는 null. */
export interface UserPreferences {
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  defaultProductLine: string;
  density: 'comfortable' | 'compact';
  notifySystemStatus: boolean;
}

export interface AuthSession {
  /** 단기 액세스 토큰(JWT). */
  token: string;
  /** 장기 리프레시 토큰 원문(`${tokenId}.${secret}`). 갱신마다 회전된다. */
  refreshToken: string;
  profile: UserProfile;
  menus: MenuPermission[];
  preferences: UserPreferences | null;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER_TOKEN)
    private readonly authProvider: AuthProvider,
    private readonly jwt: JwtService,
    private readonly permissions: PermissionsService,
    private readonly refreshTokens: RefreshTokensService,
    private readonly audit: AuditService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /** 인증 실패 시 null (컨트롤러가 200 + ok:false 로 응답 — 전역 401 리다이렉트 회피). */
  async signIn(
    userId: string,
    password: string,
    userAgent?: string,
  ): Promise<AuthSession | null> {
    const authed = await this.authProvider.authenticate(userId, password);
    if (!authed) {
      await this.audit.record({
        entityType: 'USER',
        entityId: userId,
        action: 'LOGIN_FAILED',
        ctx: { actorId: userId, source: 'AUTH' },
        summary: this.uaSummary('로그인 실패', userAgent),
      });
      return null;
    }
    const session = await this.buildSession(authed.userId, userAgent);
    await this.audit.record({
      entityType: 'USER',
      entityId: authed.userId,
      action: 'LOGIN',
      ctx: { actorId: authed.userId, source: 'AUTH' },
      summary: this.uaSummary('로그인', userAgent),
    });
    return session;
  }

  /**
   * 리프레시 토큰으로 세션 갱신. 토큰을 회전(이전 토큰 폐기 + 새 토큰 발급)하고
   * 최신 프로필/권한으로 새 액세스 토큰을 발급한다. 실패는 401.
   */
  async refresh(
    presentedRefreshToken: string,
    userAgent?: string,
  ): Promise<AuthSession> {
    const { userId, refresh } = await this.refreshTokens.rotate(
      presentedRefreshToken,
      userAgent,
    );
    return this.buildSession(userId, userAgent, refresh.token);
  }

  /** 로그아웃: 제출된 리프레시 토큰을 폐기한다. */
  async logout(presentedRefreshToken: string): Promise<void> {
    const userId = await this.refreshTokens.revoke(presentedRefreshToken);
    if (userId) {
      await this.audit.record({
        entityType: 'USER',
        entityId: userId,
        action: 'LOGOUT',
        ctx: { actorId: userId, source: 'AUTH' },
      });
    }
  }

  /** 토큰 검증 후 최신 프로필/권한 재조회 (역할 변경 즉시 반영). */
  async me(
    userId: string,
  ): Promise<Omit<AuthSession, 'token' | 'refreshToken'>> {
    const user = await this.userRepo.findOne({
      where: { userId, useYn: 'Y' },
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    const profile = this.toProfile(user);
    const menus = await this.permissions.getVisibleMenus(user.roleId);
    return {
      profile,
      menus,
      preferences: this.parsePreferences(user.preferences),
    };
  }

  /** 본인 표시 환경설정 저장. 저장된 값을 반환. */
  async savePreferences(
    userId: string,
    preferences: UserPreferences,
  ): Promise<UserPreferences> {
    const user = await this.userRepo.findOne({
      where: { userId, useYn: 'Y' },
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    user.preferences = JSON.stringify(preferences);
    await this.userRepo.save(user);
    return preferences;
  }

  /** 저장된 JSON 문자열을 파싱. 없거나 손상 시 null(프런트 기본값 사용). */
  private parsePreferences(raw: string | null): UserPreferences | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserPreferences;
    } catch {
      return null;
    }
  }

  /**
   * 본인 비밀번호 변경. 성공 시 null, 실패 시 사용자에게 보여줄 오류 메시지.
   * (signIn 과 동일하게 200 + ok:false 로 응답해 전역 401 리다이렉트를 피한다.)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<string | null> {
    const user = await this.userRepo.findOne({
      where: { userId, useYn: 'Y' },
    });
    if (!user || user.authSource !== 'LOCAL' || !user.passwordHash) {
      return '비밀번호를 변경할 수 없는 계정입니다.';
    }
    const matched = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matched) {
      return '현재 비밀번호가 올바르지 않습니다.';
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return '새 비밀번호가 현재 비밀번호와 동일합니다.';
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    await this.audit.record({
      entityType: 'USER',
      entityId: userId,
      action: 'PASSWORD_CHANGE',
      ctx: { actorId: userId, source: 'AUTH' },
      summary: '본인 비밀번호 변경',
    });
    return null;
  }

  /** User-Agent 를 곁들인 짧은 감사 요약(길면 잘라낸다). */
  private uaSummary(label: string, userAgent?: string): string {
    const ua = userAgent?.trim();
    return ua ? `${label} · ${ua.slice(0, 200)}` : label;
  }

  /**
   * 사용자 ID 로 세션을 구성한다. 항상 최신 UserEntity 를 읽어 프로필/권한/
   * 환경설정을 반영한다(역할 변경 즉시 반영). existingRefresh 가 주어지면
   * (refresh 경로) 회전된 토큰을 그대로 싣고, 없으면(signin) 새로 발급한다.
   */
  private async buildSession(
    userId: string,
    userAgent?: string,
    existingRefresh?: string,
  ): Promise<AuthSession> {
    const user = await this.userRepo.findOne({ where: { userId, useYn: 'Y' } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    const payload: JwtPayload = { sub: user.userId, role: user.roleId ?? '' };
    const token = await this.jwt.signAsync(payload);
    const menus = await this.permissions.getVisibleMenus(user.roleId);
    const refreshToken =
      existingRefresh ??
      (await this.refreshTokens.issue(user.userId, userAgent)).token;
    return {
      token,
      refreshToken,
      profile: this.toProfile(user),
      menus,
      preferences: this.parsePreferences(user.preferences),
    };
  }

  private toProfile(user: UserEntity): UserProfile {
    return {
      userId: user.userId,
      userName: user.userNm ?? '',
      userNameEng: user.userNmEng ?? '',
      teamName: user.teamNm ?? '',
      teamNameEng: user.teamNmEng ?? '',
      role: user.roleId ?? '',
    };
  }
}
