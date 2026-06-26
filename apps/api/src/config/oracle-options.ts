/**
 * Oracle 접속 옵션 공통 빌더.
 *
 * 런타임(database.config.ts, @nestjs/config 기반)과 마이그레이션 CLI
 * (data-source.ts, process.env 기반)가 **동일한 접속 규칙**을 쓰도록 한 곳에 모은다.
 * 두 곳은 환경변수를 읽는 방식만 다르고, 접속 해석·공통 옵션은 여기서 일원화한다.
 * (과거엔 각자 구현해 SID를 service name 으로 취급하는 등 드리프트 위험이 있었다.)
 */

/** 마이그레이션 추적 테이블 — 앱 prefix(TMDM_) 통일. */
export const ORACLE_MIGRATIONS_TABLE = 'TMDM_MIGRATIONS';

export interface OracleConnectionParams {
  username?: string;
  password?: string;
  /** EZConnect/TNS 등 완전한 접속 문자열. 지정 시 host/port/service 를 무시한다. */
  connectString?: string;
  host?: string;
  port?: number;
  /** 서비스명 접속(우선). 미지정 시 sid 로 폴백. */
  serviceName?: string;
  sid?: string;
}

type OracleConnection =
  | { username?: string; password?: string; connectString: string }
  | {
      username?: string;
      password?: string;
      host: string;
      port: number;
      serviceName?: string;
      sid?: string;
    };

/**
 * 접속 정보(연결 문자열 vs host 기반)를 해석한다. serviceName 이 있으면
 * serviceName 으로, 없으면 sid 로 접속한다(두 방식은 Oracle 에서 의미가 다르다).
 */
export function resolveOracleConnection(
  p: OracleConnectionParams,
): OracleConnection {
  const credentials = { username: p.username, password: p.password };
  if (p.connectString) {
    return { ...credentials, connectString: p.connectString };
  }
  if (!p.host) {
    throw new Error(
      'Oracle connection requires DB_HOST when DB_CONNECT_STRING is not set.',
    );
  }
  return {
    ...credentials,
    host: p.host,
    port: p.port ?? 1521,
    ...(p.serviceName ? { serviceName: p.serviceName } : { sid: p.sid }),
  };
}

/**
 * 런타임·CLI 양쪽이 공유하는 Oracle 공통 옵션(접속 + 불변 정책).
 * 환경에 따라 달라지는 entities(런타임은 autoLoadEntities, CLI 는 glob)와
 * migrations 경로는 각 호출부가 스프레드 후 덧붙인다.
 */
export function baseOracleOptions(
  p: OracleConnectionParams & { logging?: boolean },
): {
  type: 'oracle';
  synchronize: false;
  migrationsTableName: string;
  logging: boolean;
} & OracleConnection {
  return {
    type: 'oracle',
    synchronize: false,
    migrationsTableName: ORACLE_MIGRATIONS_TABLE,
    logging: p.logging ?? false,
    ...resolveOracleConnection(p),
  };
}
