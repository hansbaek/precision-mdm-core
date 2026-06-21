import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getOracleTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const connectString = configService.get<string>('DB_CONNECT_STRING');
  const serviceName = configService.get<string>('DB_SERVICE_NAME');
  const sid = configService.get<string>('DB_SID');
  const poolMin = configService.get<number>('DB_POOL_MIN', 2);
  const poolMax = configService.get<number>('DB_POOL_MAX', 10);

  const baseOptions: TypeOrmModuleOptions = {
    type: 'oracle',
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    autoLoadEntities: true,
    synchronize: false,
    // 마이그레이션은 부팅 시 자동 적용하지 않는다(migrationsRun 미설정). 다만
    // 런타임에서도 미적용 여부를 점검할 수 있도록 파일·추적 테이블은 인식시킨다.
    // (data-source.ts 의 CLI 설정과 동일하게 유지할 것)
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{js,ts}')],
    migrationsTableName: 'TMDM_MIGRATIONS',
    logging: configService.get<boolean>('DB_LOGGING', false),
    poolSize: poolMax,
    extra: {
      poolMin,
      poolMax,
    },
    retryAttempts: 3,
    retryDelay: 3000,
  };

  if (connectString) {
    return { ...baseOptions, connectString };
  }

  return {
    ...baseOptions,
    host: configService.getOrThrow<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT', 1521),
    ...(serviceName ? { serviceName } : { sid }),
  };
}
