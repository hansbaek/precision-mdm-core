import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuditFieldChange, AuditService } from '../audit/audit.service';
import { RoleEntity } from '../auth/entities/role.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { MenuEntity } from '../permissions/entities/menu.entity';
import { RoleMenuPermEntity } from '../permissions/entities/role-menu-perm.entity';
import {
  MenuPermissionInput,
  UpdatePermissionsDto,
} from './dto/permissions.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const yn = (b: boolean) => (b ? 'Y' : 'N');
const isY = (v?: string) => v === 'Y';

/** 객체 두 개에서 지정한 키들의 값이 달라진 항목만 필드 변경으로 추린다. */
const diffFields = <T extends Record<string, unknown>>(
  before: T,
  after: T,
  keys: Array<keyof T>,
): AuditFieldChange[] =>
  keys
    .filter((k) => before[k] !== after[k])
    .map((k) => ({
      column: String(k),
      before: before[k] == null ? null : String(before[k]),
      after: after[k] == null ? null : String(after[k]),
    }));

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(RoleMenuPermEntity)
    private readonly permRepo: Repository<RoleMenuPermEntity>,
    private readonly audit: AuditService,
  ) {}

  // ---------- Roles ----------
  listRoles(): Promise<RoleEntity[]> {
    return this.roleRepo.find({ order: { sortOrder: 'ASC', roleId: 'ASC' } });
  }

  async createRole(dto: CreateRoleDto, actorId: string): Promise<RoleEntity> {
    const exists = await this.roleRepo.findOne({
      where: { roleId: dto.roleId },
    });
    if (exists) throw new ConflictException('이미 존재하는 역할 ID 입니다.');
    const role = this.roleRepo.create({
      roleId: dto.roleId,
      roleNm: dto.roleNm,
      isSystemYn: 'N',
      sortOrder: dto.sortOrder ?? 50,
      useYn: 'Y',
    });
    const saved = await this.roleRepo.save(role);
    await this.audit.record({
      entityType: 'ROLE',
      entityId: saved.roleId,
      action: 'CREATE',
      ctx: { actorId, source: 'ADMIN' },
      summary: `역할 생성: ${saved.roleNm} (${saved.roleId})`,
    });
    return saved;
  }

  async updateRole(
    roleId: string,
    dto: UpdateRoleDto,
    actorId: string,
  ): Promise<RoleEntity> {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new NotFoundException('역할을 찾을 수 없습니다.');
    const before = {
      roleNm: role.roleNm,
      sortOrder: role.sortOrder,
      useYn: role.useYn,
    };
    Object.assign(role, {
      roleNm: dto.roleNm ?? role.roleNm,
      sortOrder: dto.sortOrder ?? role.sortOrder,
      useYn: dto.useYn ?? role.useYn,
    });
    const saved = await this.roleRepo.save(role);
    await this.audit.record({
      entityType: 'ROLE',
      entityId: roleId,
      action: 'UPDATE',
      ctx: { actorId, source: 'ADMIN' },
      changes: diffFields(before, saved, ['roleNm', 'sortOrder', 'useYn']),
      summary: `역할 수정: ${saved.roleNm} (${roleId})`,
    });
    return saved;
  }

  async deleteRole(roleId: string, actorId: string): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new NotFoundException('역할을 찾을 수 없습니다.');
    if (isY(role.isSystemYn)) {
      throw new BadRequestException('시스템 역할은 삭제할 수 없습니다.');
    }
    const inUse = await this.userRepo.count({ where: { roleId } });
    if (inUse > 0) {
      throw new BadRequestException(
        `이 역할을 사용 중인 사용자가 ${inUse}명 있어 삭제할 수 없습니다.`,
      );
    }
    await this.permRepo.delete({ roleId });
    await this.roleRepo.delete({ roleId });
    await this.audit.record({
      entityType: 'ROLE',
      entityId: roleId,
      action: 'DELETE',
      ctx: { actorId, source: 'ADMIN' },
      summary: `역할 삭제: ${role.roleNm} (${roleId})`,
    });
  }

  // ---------- Menus ----------
  listMenus(): Promise<MenuEntity[]> {
    return this.menuRepo.find({
      where: { useYn: 'Y' },
      order: { sortOrder: 'ASC', menuId: 'ASC' },
    });
  }

  // ---------- Role × Menu permissions ----------
  /** 전체 메뉴 + 해당 역할의 권한 플래그(없으면 false). 관리자 매트릭스용. */
  async getRolePermissions(roleId: string): Promise<MenuPermissionInput[]> {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new NotFoundException('역할을 찾을 수 없습니다.');
    const menus = await this.listMenus();
    const perms = await this.permRepo.find({ where: { roleId } });
    const byMenu = new Map(perms.map((p) => [p.menuId, p]));
    return menus.map((m) => {
      const p = byMenu.get(m.menuId);
      return {
        menuId: m.menuId,
        canView: isY(p?.canViewYn),
        canCreate: isY(p?.canCreateYn),
        canUpdate: isY(p?.canUpdateYn),
        canDelete: isY(p?.canDeleteYn),
        canApprove: isY(p?.canApproveYn),
      };
    });
  }

  async updateRolePermissions(
    roleId: string,
    dto: UpdatePermissionsDto,
    actorId: string,
  ): Promise<MenuPermissionInput[]> {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new NotFoundException('역할을 찾을 수 없습니다.');
    const validMenuIds = new Set((await this.listMenus()).map((m) => m.menuId));

    // 변경 전 스냅샷(메뉴별 권한 요약) — 감사 diff 용.
    const beforeByMenu = new Map(
      (await this.getRolePermissions(roleId)).map((p) => [
        p.menuId,
        this.permSummary(p),
      ]),
    );

    for (const p of dto.permissions) {
      if (!validMenuIds.has(p.menuId)) continue;
      await this.permRepo.upsert(
        {
          roleId,
          menuId: p.menuId,
          canViewYn: yn(p.canView),
          canCreateYn: yn(p.canCreate),
          canUpdateYn: yn(p.canUpdate),
          canDeleteYn: yn(p.canDelete),
          canApproveYn: yn(p.canApprove),
        },
        ['roleId', 'menuId'],
      );
    }

    const after = await this.getRolePermissions(roleId);
    const changes: AuditFieldChange[] = [];
    for (const p of after) {
      const before = beforeByMenu.get(p.menuId) ?? '';
      const now = this.permSummary(p);
      if (before !== now) {
        changes.push({
          column: p.menuId,
          before: before || null,
          after: now || null,
        });
      }
    }
    if (changes.length) {
      await this.audit.record({
        entityType: 'ROLE',
        entityId: roleId,
        action: 'PERM_CHANGE',
        ctx: { actorId, source: 'ADMIN' },
        changes,
        summary: `권한 변경: ${role.roleNm} (${roleId}) — ${changes.length}개 메뉴`,
      });
    }
    return after;
  }

  /** 메뉴 권한 플래그를 사람이 읽을 약어로 요약(없으면 '-'). */
  private permSummary(p: MenuPermissionInput): string {
    const flags = [
      p.canView && 'V',
      p.canCreate && 'C',
      p.canUpdate && 'U',
      p.canDelete && 'D',
      p.canApprove && 'A',
    ].filter(Boolean);
    return flags.length ? flags.join('') : '-';
  }

  // ---------- Users ----------
  async listUsers(): Promise<
    Array<Omit<UserEntity, 'passwordHash'> & { roleNm: string | null }>
  > {
    const users = await this.userRepo.find({
      order: { userId: 'ASC' },
    });
    const roles = await this.roleRepo.find();
    const roleNm = new Map(roles.map((r) => [r.roleId, r.roleNm]));
    return users.map(({ passwordHash, ...u }) => {
      void passwordHash;
      return { ...u, roleNm: roleNm.get(u.roleId) ?? null };
    });
  }

  async createUser(
    dto: CreateUserDto,
    actorId: string,
  ): Promise<{ userId: string }> {
    const exists = await this.userRepo.findOne({
      where: { userId: dto.userId },
    });
    if (exists) throw new ConflictException('이미 존재하는 사용자 ID 입니다.');
    await this.assertRoleExists(dto.roleId);
    const user = this.userRepo.create({
      userId: dto.userId,
      userNm: dto.userNm,
      userNmEng: dto.userNmEng ?? null,
      teamNm: dto.teamNm ?? null,
      teamNmEng: dto.teamNmEng ?? null,
      passwordHash: bcrypt.hashSync(dto.password, 10),
      authSource: 'LOCAL',
      roleId: dto.roleId,
      useYn: 'Y',
    } as Partial<UserEntity>);
    await this.userRepo.save(user);
    await this.audit.record({
      entityType: 'USER',
      entityId: dto.userId,
      action: 'CREATE',
      ctx: { actorId, source: 'ADMIN' },
      summary: `사용자 생성: ${dto.userNm} (${dto.userId}) · 역할 ${dto.roleId}`,
    });
    return { userId: dto.userId };
  }

  async updateUser(
    userId: string,
    dto: UpdateUserDto,
    actorId: string,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    // 기본 관리자 계정은 잠금 방지를 위해 비활성화/역할 강등을 차단한다.
    if (userId === 'admin') {
      if (dto.useYn === 'N') {
        throw new BadRequestException(
          '기본 관리자 계정은 비활성화할 수 없습니다.',
        );
      }
      if (dto.roleId && dto.roleId !== 'ADMIN') {
        throw new BadRequestException(
          '기본 관리자 계정의 역할은 변경할 수 없습니다.',
        );
      }
    }
    if (dto.roleId) await this.assertRoleExists(dto.roleId);
    const before = {
      userNm: user.userNm,
      userNmEng: user.userNmEng,
      teamNm: user.teamNm,
      teamNmEng: user.teamNmEng,
      roleId: user.roleId,
      useYn: user.useYn,
    };
    Object.assign(user, {
      userNm: dto.userNm ?? user.userNm,
      userNmEng: dto.userNmEng ?? user.userNmEng,
      teamNm: dto.teamNm ?? user.teamNm,
      teamNmEng: dto.teamNmEng ?? user.teamNmEng,
      roleId: dto.roleId ?? user.roleId,
      useYn: dto.useYn ?? user.useYn,
    });
    await this.userRepo.save(user);
    await this.audit.record({
      entityType: 'USER',
      entityId: userId,
      action: 'UPDATE',
      ctx: { actorId, source: 'ADMIN' },
      changes: diffFields(before, user, [
        'userNm',
        'userNmEng',
        'teamNm',
        'teamNmEng',
        'roleId',
        'useYn',
      ]),
      summary: `사용자 수정: ${user.userNm} (${userId})`,
    });
  }

  async deleteUser(userId: string, actorId: string): Promise<void> {
    if (userId === 'admin') {
      throw new BadRequestException('기본 관리자 계정은 삭제할 수 없습니다.');
    }
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    await this.userRepo.delete({ userId });
    await this.audit.record({
      entityType: 'USER',
      entityId: userId,
      action: 'DELETE',
      ctx: { actorId, source: 'ADMIN' },
      summary: `사용자 삭제: ${user.userNm} (${userId})`,
    });
  }

  async resetPassword(
    userId: string,
    password: string,
    actorId: string,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.passwordHash = bcrypt.hashSync(password, 10);
    user.authSource = 'LOCAL';
    await this.userRepo.save(user);
    await this.audit.record({
      entityType: 'USER',
      entityId: userId,
      action: 'PASSWORD_RESET',
      ctx: { actorId, source: 'ADMIN' },
      summary: `비밀번호 재설정: ${user.userNm} (${userId})`,
    });
  }

  private async assertRoleExists(roleId: string): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new BadRequestException('존재하지 않는 역할입니다.');
  }
}
