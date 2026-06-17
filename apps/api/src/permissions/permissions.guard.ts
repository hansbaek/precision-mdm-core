import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  RequiredPermission,
} from './decorators/require-permission.decorator';
import { PermissionsService } from './permissions.service';

interface RequestUser {
  userId: string;
  role: string;
}

/**
 * 전역 가드. @RequirePermission 이 선언된 라우트에서만 동작하며,
 * 현재 사용자(JWT)의 역할이 (메뉴, 액션) 권한을 갖는지 검증한다.
 * 데코레이터가 없는 라우트는 통과시킨다. (인증 자체는 JwtAuthGuard 담당)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user?.role) {
      throw new ForbiddenException('권한 정보가 없습니다.');
    }

    const allowed = await this.permissions.can(
      user.role,
      required.menuId,
      required.action,
    );
    if (!allowed) {
      throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
    }
    return true;
  }
}
