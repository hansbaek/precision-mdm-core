import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AdminModule } from './admin/admin.module';
import { getOracleTypeOrmOptions } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { EndurSvrtyModule } from './endur-svrty/endur-svrty.module';
import { HealthModule } from './health/health.module';
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
    AuthModule,
    PermissionsModule,
    AdminModule,
    EndurSvrtyModule,
    HealthModule,
    StdCodesModule,
    TemplateModule,
    TestClassificationModule,
    TestMatchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 전역 가드: 반드시 JWT 인증 → 권한 순으로 등록 (PermissionsGuard 가 req.user 사용).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
