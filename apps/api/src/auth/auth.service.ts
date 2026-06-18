import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { PermissionsService } from '../permissions/permissions.service';
import { MenuPermission } from '../permissions/permissions.types';
import { UserEntity } from './entities/user.entity';
import { JwtPayload } from './jwt.strategy';
import { AUTH_PROVIDER_TOKEN } from './providers/auth-provider.interface';
import type {
  AuthProvider,
  AuthenticatedUser,
} from './providers/auth-provider.interface';

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
  token: string;
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
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /** 인증 실패 시 null (컨트롤러가 200 + ok:false 로 응답 — 전역 401 리다이렉트 회피). */
  async signIn(userId: string, password: string): Promise<AuthSession | null> {
    const user = await this.authProvider.authenticate(userId, password);
    if (!user) return null;
    return this.buildSession(user);
  }

  /** 토큰 검증 후 최신 프로필/권한 재조회 (역할 변경 즉시 반영). */
  async me(userId: string): Promise<Omit<AuthSession, 'token'>> {
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
    return null;
  }

  private async buildSession(user: AuthenticatedUser): Promise<AuthSession> {
    const payload: JwtPayload = { sub: user.userId, role: user.roleId };
    const token = await this.jwt.signAsync(payload);
    const menus = await this.permissions.getVisibleMenus(user.roleId);
    const profile: UserProfile = {
      userId: user.userId,
      userName: user.userNm ?? '',
      userNameEng: user.userNmEng ?? '',
      teamName: user.teamNm ?? '',
      teamNameEng: user.teamNmEng ?? '',
      role: user.roleId ?? '',
    };
    // 로그인 응답에도 저장된 환경설정을 실어 첫 화면부터 반영.
    const stored = await this.userRepo.findOne({
      where: { userId: user.userId },
      select: { userId: true, preferences: true },
    });
    return {
      token,
      profile,
      menus,
      preferences: this.parsePreferences(stored?.preferences ?? null),
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
