import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TemplateModule } from '../template/template.module';
import { ChangeRequestsController } from './change-requests.controller';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestEntity } from './entities/change-request.entity';

/**
 * 승인 워크플로 모듈. STD 변경 제출/승인/반려를 담당한다.
 * TemplateModule 과 상호 의존하므로 forwardRef 로 순환을 해소한다.
 */
@Module({
  imports: [
    // UserEntity 는 승인권자 조회용. RoleMenuPermEntity 는 PermissionsModule 이 노출.
    TypeOrmModule.forFeature([ChangeRequestEntity, UserEntity]),
    PermissionsModule,
    NotificationsModule,
    forwardRef(() => TemplateModule),
  ],
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsService],
  exports: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
