import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { baseOracleOptions } from './oracle-options';

export function getOracleTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const poolMin = configService.get<number>('DB_POOL_MIN', 2);
  const poolMax = configService.get<number>('DB_POOL_MAX', 10);

  return {
    // 접속·불변 정책(type/synchronize/migrationsTableName)은 공통 빌더에서.
    ...baseOracleOptions({
      username: configService.getOrThrow<string>('DB_USERNAME'),
      password: configService.getOrThrow<string>('DB_PASSWORD'),
      connectString: configService.get<string>('DB_CONNECT_STRING'),
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT', 1521),
      serviceName: configService.get<string>('DB_SERVICE_NAME'),
      sid: configService.get<string>('DB_SID'),
      logging: configService.get<boolean>('DB_LOGGING', false),
    }),
    autoLoadEntities: true,
    // 마이그레이션은 부팅 시 자동 적용하지 않는다(migrationsRun 미설정). 다만
    // 런타임에서도 미적용 여부를 점검할 수 있도록 파일을 인식시킨다.
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{js,ts}')],
    poolSize: poolMax,
    extra: {
      poolMin,
      poolMax,
    },
    retryAttempts: 3,
    retryDelay: 3000,
  };
}
