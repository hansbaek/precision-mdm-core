import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @Post('signin')
  @ApiOperation({ summary: '로그인 — JWT + 프로필 + 허용 메뉴 반환' })
  async signIn(@Body() dto: SignInDto): Promise<CommonReturn<AuthSession>> {
    const session = await this.authService.signIn(dto.userId, dto.password);
    if (!session) {
      return { ok: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }
    return { ok: true, result: session };
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
