import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { AdminService } from './admin.service';
import { UpdatePermissionsDto } from './dto/permissions.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto } from './dto/user.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ---------- Roles ----------
  @Get('roles')
  @RequirePermission('admin', 'view')
  @ApiOperation({ summary: '역할 목록' })
  listRoles() {
    return this.admin.listRoles();
  }

  @Post('roles')
  @RequirePermission('admin', 'create')
  @ApiOperation({ summary: '역할 생성' })
  createRole(@CurrentUser() user: JwtUser, @Body() dto: CreateRoleDto) {
    return this.admin.createRole(dto, user.userId);
  }

  @Patch('roles/:roleId')
  @RequirePermission('admin', 'update')
  @ApiOperation({ summary: '역할 수정' })
  updateRole(
    @CurrentUser() user: JwtUser,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.admin.updateRole(roleId, dto, user.userId);
  }

  @Delete('roles/:roleId')
  @RequirePermission('admin', 'delete')
  @ApiOperation({ summary: '역할 삭제' })
  async deleteRole(
    @CurrentUser() user: JwtUser,
    @Param('roleId') roleId: string,
  ) {
    await this.admin.deleteRole(roleId, user.userId);
    return { ok: true };
  }

  // ---------- Menus ----------
  @Get('menus')
  @RequirePermission('admin', 'view')
  @ApiOperation({ summary: '메뉴 카탈로그' })
  listMenus() {
    return this.admin.listMenus();
  }

  // ---------- Role × Menu permissions ----------
  @Get('roles/:roleId/permissions')
  @RequirePermission('admin', 'view')
  @ApiOperation({ summary: '역할 권한 매트릭스 조회' })
  getRolePermissions(@Param('roleId') roleId: string) {
    return this.admin.getRolePermissions(roleId);
  }

  @Put('roles/:roleId/permissions')
  @RequirePermission('admin', 'update')
  @ApiOperation({ summary: '역할 권한 매트릭스 저장' })
  updateRolePermissions(
    @CurrentUser() user: JwtUser,
    @Param('roleId') roleId: string,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return this.admin.updateRolePermissions(roleId, dto, user.userId);
  }

  // ---------- Users ----------
  @Get('users')
  @RequirePermission('admin', 'view')
  @ApiOperation({ summary: '사용자 목록' })
  listUsers() {
    return this.admin.listUsers();
  }

  @Post('users')
  @RequirePermission('admin', 'create')
  @ApiOperation({ summary: '사용자 생성' })
  createUser(@CurrentUser() user: JwtUser, @Body() dto: CreateUserDto) {
    return this.admin.createUser(dto, user.userId);
  }

  @Patch('users/:userId')
  @RequirePermission('admin', 'update')
  @ApiOperation({ summary: '사용자 수정' })
  async updateUser(
    @CurrentUser() user: JwtUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    await this.admin.updateUser(userId, dto, user.userId);
    return { ok: true };
  }

  @Delete('users/:userId')
  @RequirePermission('admin', 'delete')
  @ApiOperation({ summary: '사용자 삭제' })
  async deleteUser(
    @CurrentUser() user: JwtUser,
    @Param('userId') userId: string,
  ) {
    await this.admin.deleteUser(userId, user.userId);
    return { ok: true };
  }

  @Post('users/:userId/reset-password')
  @RequirePermission('admin', 'update')
  @ApiOperation({ summary: '사용자 비밀번호 재설정' })
  async resetPassword(
    @CurrentUser() user: JwtUser,
    @Param('userId') userId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    await this.admin.resetPassword(userId, dto.password, user.userId);
    return { ok: true };
  }
}
