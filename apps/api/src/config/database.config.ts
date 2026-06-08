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
