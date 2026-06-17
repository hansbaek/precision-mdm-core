import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
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
  ) {}

  // ---------- Roles ----------
  listRoles(): Promise<RoleEntity[]> {
    return this.roleRepo.find({ order: { sortOrder: 'ASC', roleId: 'ASC' } });
  }

  async createRole(dto: CreateRoleDto): Promise<RoleEntity> {
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
    return this.roleRepo.save(role);
  }

  async updateRole(roleId: string, dto: UpdateRoleDto): Promise<RoleEntity> {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new NotFoundException('역할을 찾을 수 없습니다.');
    Object.assign(role, {
      roleNm: dto.roleNm ?? role.roleNm,
      sortOrder: dto.sortOrder ?? role.sortOrder,
      useYn: dto.useYn ?? role.useYn,
    });
    return this.roleRepo.save(role);
  }

  async deleteRole(roleId: string): Promise<void> {
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
      };
    });
  }

  async updateRolePermissions(
    roleId: string,
    dto: UpdatePermissionsDto,
  ): Promise<MenuPermissionInput[]> {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new NotFoundException('역할을 찾을 수 없습니다.');
    const validMenuIds = new Set((await this.listMenus()).map((m) => m.menuId));

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
        },
        ['roleId', 'menuId'],
      );
    }
    return this.getRolePermissions(roleId);
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

  async createUser(dto: CreateUserDto): Promise<{ userId: string }> {
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
    return { userId: dto.userId };
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if (dto.roleId) await this.assertRoleExists(dto.roleId);
    Object.assign(user, {
      userNm: dto.userNm ?? user.userNm,
      userNmEng: dto.userNmEng ?? user.userNmEng,
      teamNm: dto.teamNm ?? user.teamNm,
      teamNmEng: dto.teamNmEng ?? user.teamNmEng,
      roleId: dto.roleId ?? user.roleId,
      useYn: dto.useYn ?? user.useYn,
    });
    await this.userRepo.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    if (userId === 'admin') {
      throw new BadRequestException('기본 관리자 계정은 삭제할 수 없습니다.');
    }
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    await this.userRepo.delete({ userId });
  }

  async resetPassword(userId: string, password: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.passwordHash = bcrypt.hashSync(password, 10);
    user.authSource = 'LOCAL';
    await this.userRepo.save(user);
  }

  private async assertRoleExists(roleId: string): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new BadRequestException('존재하지 않는 역할입니다.');
  }
}
