import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
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

export interface AuthSession {
  token: string;
  profile: UserProfile;
  menus: MenuPermission[];
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
    return { profile, menus };
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
    return { token, profile, menus };
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
