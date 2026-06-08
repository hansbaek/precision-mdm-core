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
