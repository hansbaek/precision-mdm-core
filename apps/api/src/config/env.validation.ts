import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum AuthProviderKind {
  Local = 'local',
  Sso = 'sso',
}

enum MigrationGuardKind {
  Strict = 'strict',
  Warn = 'warn',
  Off = 'off',
}

class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  @IsOptional()
  NODE_ENV?: NodeEnvironment;

  @Transform(({ value }) => Number(value ?? 4000))
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  API_PORT?: number;

  @IsString()
  @IsOptional()
  DB_HOST?: string;

  @Transform(({ value }) => Number(value ?? 1521))
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT?: number;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  @IsOptional()
  DB_SERVICE_NAME?: string;

  @IsString()
  @IsOptional()
  DB_SID?: string;

  @IsString()
  @IsOptional()
  DB_CONNECT_STRING?: string;

  @Transform(({ value }) => Number(value ?? 2))
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  DB_POOL_MIN?: number;

  @Transform(({ value }) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  DB_POOL_MAX?: number;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  DB_LOGGING?: boolean;

  @IsString()
  JWT_SECRET!: string;

  /** @deprecated JWT_ACCESS_EXPIRES_IN 사용. 호환을 위해 유지. */
  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string;

  /** 액세스 토큰 수명(예: 15m). 미설정 시 15분. */
  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN?: string;

  /** 리프레시 토큰 수명(예: 14d). 미설정 시 14일. */
  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsEnum(AuthProviderKind)
  @IsOptional()
  AUTH_PROVIDER?: AuthProviderKind;

  /**
   * 부팅 시 미적용 마이그레이션 가드 동작. 미설정 시 운영=strict(중단),
   * 그 외=warn(경고 후 계속). off 는 점검 자체를 생략한다. (main.ts 참조)
   */
  @IsEnum(MigrationGuardKind)
  @IsOptional()
  MIGRATION_GUARD?: MigrationGuardKind;

  /**
   * 허용할 프런트엔드 Origin 목록(콤마 구분). 미설정 시 개발 환경에서는
   * 전체 허용(reflect), 운영 환경에서는 차단된다. (main.ts 참조)
   */
  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  const hasConnectString = Boolean(validatedConfig.DB_CONNECT_STRING);
  const hasServiceName = Boolean(validatedConfig.DB_SERVICE_NAME);
  const hasSid = Boolean(validatedConfig.DB_SID);

  if (!hasConnectString && !hasServiceName && !hasSid) {
    throw new Error(
      'Oracle connection requires DB_SERVICE_NAME, DB_SID, or DB_CONNECT_STRING.',
    );
  }

  if (!hasConnectString && !validatedConfig.DB_HOST) {
    throw new Error(
      'Oracle connection requires DB_HOST when DB_CONNECT_STRING is not set.',
    );
  }

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
