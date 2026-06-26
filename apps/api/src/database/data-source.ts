import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { baseOracleOptions } from '../config/oracle-options';

/**
 * TypeORM CLI(마이그레이션) 전용 DataSource.
 *
 * Nest 런타임 밖에서 실행되므로 @nestjs/config 가 없다. .env.local → .env
 * 순으로 직접 로드하고, 런타임(database.config.ts)과 동일한 Oracle 접속 정보를
 * 사용한다. 개발/운영 구분은 어느 .env 를 두느냐로 결정된다(코드 분기 없음).
 *
 * 사용:
 *   pnpm migration:run      # 미적용 마이그레이션 적용
 *   pnpm migration:revert   # 마지막 마이그레이션 되돌리기
 *   pnpm migration:generate src/database/migrations/<Name>  # 엔티티 diff 생성
 */
function loadEnv(): void {
  for (const file of ['.env.local', '.env']) {
    const path = join(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].trim();
      }
    }
  }
}

loadEnv();

const options: DataSourceOptions = {
  // 접속·불변 정책은 런타임(database.config.ts)과 동일한 공통 빌더에서.
  ...baseOracleOptions({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    serviceName: process.env.DB_SERVICE_NAME,
    sid: process.env.DB_SID,
    logging: process.env.DB_LOGGING === 'true',
  }),
  // CLI 는 Nest autoLoadEntities 가 없으므로 엔티티를 glob 으로 직접 수집한다.
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
};

// TypeORM CLI 는 파일에 DataSource 인스턴스 export 가 정확히 하나여야 한다.
export default new DataSource(options);
