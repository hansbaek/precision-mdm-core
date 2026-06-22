import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { RoleEntity } from '../auth/entities/role.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { MenuEntity } from '../permissions/entities/menu.entity';
import { RoleMenuPermEntity } from '../permissions/entities/role-menu-perm.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      UserEntity,
      MenuEntity,
      RoleMenuPermEntity,
    ]),
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
