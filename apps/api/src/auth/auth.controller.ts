import { Body, Controller, Get, Headers, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AuthService,
  AuthSession,
  UserPreferences,
  UserProfile,
} from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { MenuPermission } from '../permissions/permissions.types';

interface CommonReturn<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  // 무차별 대입 방어: IP 당 60초 5회로 전역 한도보다 엄격하게 제한.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('signin')
  @ApiOperation({ summary: '로그인 — 액세스/리프레시 토큰 + 프로필 + 메뉴' })
  async signIn(
    @Body() dto: SignInDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<CommonReturn<AuthSession>> {
    const session = await this.authService.signIn(
      dto.userId,
      dto.password,
      userAgent,
    );
    if (!session) {
      return { ok: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }
    return { ok: true, result: session };
  }

  @Public()
  // 리프레시 토큰 회전. 토큰 자체로 인증하므로 액세스 토큰 만료와 무관.
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('refresh')
  @ApiOperation({
    summary: '리프레시 토큰 회전 — 새 액세스/리프레시 토큰 발급',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<CommonReturn<AuthSession>> {
    // 실패 시 RefreshTokensService 가 401 을 던진다(프런트가 로그아웃 처리).
    const session = await this.authService.refresh(dto.refreshToken, userAgent);
    return { ok: true, result: session };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: '로그아웃 — 제출된 리프레시 토큰 폐기' })
  async logout(@Body() dto: RefreshTokenDto): Promise<CommonReturn<null>> {
    await this.authService.logout(dto.refreshToken);
    return { ok: true };
  }

  @Get('me')
  @ApiOperation({ summary: '현재 사용자 프로필 + 허용 메뉴 + 환경설정' })
  async me(@CurrentUser() user: JwtUser): Promise<
    CommonReturn<{
      profile: UserProfile;
      menus: MenuPermission[];
      preferences: UserPreferences | null;
    }>
  > {
    const result = await this.authService.me(user.userId);
    return { ok: true, result };
  }

  @Put('preferences')
  @ApiOperation({ summary: '본인 표시 환경설정 저장' })
  async savePreferences(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<CommonReturn<UserPreferences>> {
    const result = await this.authService.savePreferences(user.userId, dto);
    return { ok: true, result };
  }

  @Post('password')
  @ApiOperation({ summary: '본인 비밀번호 변경' })
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<CommonReturn<null>> {
    const error = await this.authService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    if (error) {
      return { ok: false, error };
    }
    return { ok: true };
  }
}
