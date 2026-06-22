import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RefreshTokensService } from './refresh-tokens.service';
import { AUTH_PROVIDER_TOKEN } from './providers/auth-provider.interface';
import { LocalAuthProvider } from './providers/local-auth.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    PassportModule,
    PermissionsModule,
    AuditModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // 액세스 토큰은 단기. 리프레시 토큰으로 갱신한다.
          // (구 JWT_EXPIRES_IN 도 호환 지원)
          expiresIn:
            config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
            config.get<string>('JWT_EXPIRES_IN', '15m'),
        } as JwtModuleOptions['signOptions'],
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokensService,
    JwtStrategy,
    LocalAuthProvider,
    // AUTH_PROVIDER env 로 구현체 선택. 현재는 'local'만 구현 — 추후 SsoAuthProvider 추가.
    {
      provide: AUTH_PROVIDER_TOKEN,
      inject: [ConfigService, LocalAuthProvider],
      useFactory: (config: ConfigService, local: LocalAuthProvider) => {
        const kind = config.get<string>('AUTH_PROVIDER', 'local');
        // if (kind === 'sso') return ssoProvider;
        void kind;
        return local;
      },
    },
    // JwtAuthGuard 는 전역 가드로 AppModule 에서 PermissionsGuard 보다 먼저 등록된다.
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, TypeOrmModule],
})
export class AuthModule {}
