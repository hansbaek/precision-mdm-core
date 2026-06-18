import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 리프레시 토큰 저장소. 서버 측 무효화/로테이션/재사용 탐지를 가능하게 한다.
 * (RefreshTokenEntity 와 1:1)
 */
export class CreateRefreshTokenTable1781913800000 implements MigrationInterface {
  name = 'CreateRefreshTokenTable1781913800000';

  public async up(q: QueryRunner): Promise<void> {
    if (!(await this.tableExists(q, 'TMDM_REFRESH_TOKEN'))) {
      await q.query(`CREATE TABLE TMDM_REFRESH_TOKEN (
        TOKEN_ID    VARCHAR2(64)  NOT NULL ENABLE,
        USER_ID     VARCHAR2(50)  NOT NULL ENABLE,
        TOKEN_HASH  VARCHAR2(200) NOT NULL ENABLE,
        EXPIRES_AT  TIMESTAMP(6)  NOT NULL ENABLE,
        REVOKED_YN  VARCHAR2(1)   DEFAULT 'N' NOT NULL ENABLE,
        ROTATED_TO  VARCHAR2(64),
        USER_AGENT  VARCHAR2(300),
        CREATED_AT  TIMESTAMP(6)  DEFAULT SYSTIMESTAMP NOT NULL ENABLE,
        CONSTRAINT PK_TMDM_REFRESH_TOKEN PRIMARY KEY (TOKEN_ID)
      )`);
    }
    if (!(await this.indexExists(q, 'IX_TMDM_RT_USER'))) {
      await q.query(
        `CREATE INDEX IX_TMDM_RT_USER ON TMDM_REFRESH_TOKEN (USER_ID, REVOKED_YN)`,
      );
    }
  }

  public async down(q: QueryRunner): Promise<void> {
    if (await this.tableExists(q, 'TMDM_REFRESH_TOKEN')) {
      await q.query(`DROP TABLE TMDM_REFRESH_TOKEN CASCADE CONSTRAINTS PURGE`);
    }
  }

  private async tableExists(q: QueryRunner, name: string): Promise<boolean> {
    return this.count(
      q,
      `SELECT COUNT(*) AS CNT FROM USER_TABLES WHERE TABLE_NAME = :1`,
      name,
    );
  }

  private async indexExists(q: QueryRunner, name: string): Promise<boolean> {
    return this.count(
      q,
      `SELECT COUNT(*) AS CNT FROM USER_INDEXES WHERE INDEX_NAME = :1`,
      name,
    );
  }

  private async count(
    q: QueryRunner,
    sql: string,
    p: string,
  ): Promise<boolean> {
    const rows = (await q.query(sql, [p])) as Array<{ CNT: number }>;
    const cnt = rows?.[0]?.CNT ?? (rows?.[0] as unknown as number[])?.[0] ?? 0;
    return Number(cnt) > 0;
  }
}
