import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { ChangeRequestsModule } from './change-requests/change-requests.module';
import { getOracleTypeOrmOptions } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { EndurSvrtyModule } from './endur-svrty/endur-svrty.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PermissionsGuard } from './permissions/permissions.guard';
import { StdCodesModule } from './std-codes/std-codes.module';
import { TemplateModule } from './template/template.module';
import { TestClassificationModule } from './test-classification/test-classification.module';
import { TestMatchModule } from './test-match/test-match.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getOracleTypeOrmOptions,
    }),
    // 전역 기본 한도: IP 당 60초 100회. 로그인 등 민감 엔드포인트는 @Throttle 로 강화.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    PermissionsModule,
    AdminModule,
    AuditModule,
    ChangeRequestsModule,
    EndurSvrtyModule,
    HealthModule,
    NotificationsModule,
    StdCodesModule,
    TemplateModule,
    TestClassificationModule,
    TestMatchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 전역 가드 실행 순서: 요청량 제한 → JWT 인증 → 권한.
    // (ThrottlerGuard 를 가장 먼저 두어 인증 이전에 무차별 대입을 차단한다.
    //  PermissionsGuard 는 req.user 를 사용하므로 JwtAuthGuard 뒤여야 한다.)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
