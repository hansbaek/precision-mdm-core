import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuEntity } from './entities/menu.entity';
import { RoleMenuPermEntity } from './entities/role-menu-perm.entity';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';

// PermissionsGuard 는 전역 가드로 AppModule 에서 JwtAuthGuard 다음 순서로 등록된다.
@Module({
  imports: [TypeOrmModule.forFeature([MenuEntity, RoleMenuPermEntity])],
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService, PermissionsGuard, TypeOrmModule],
})
export class PermissionsModule {}
