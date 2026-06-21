import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 변경요청에 BASE_HASH 추가. UPDATE/DELETE 제출 시 대상 행의 콘텐츠 해시를
 * 저장해 두고, 승인 시점에 현재 행 해시와 비교한다. 제출 이후 원본이 바뀌었으면
 * 승인을 차단(409)해 무검증 덮어쓰기를 막는다.
 */
export class AddBaseHashToChangeRequest1781914100000 implements MigrationInterface {
  name = 'AddBaseHashToChangeRequest1781914100000';

  public async up(q: QueryRunner): Promise<void> {
    if (!(await this.columnExists(q, 'TMDM_CHANGE_REQUEST', 'BASE_HASH'))) {
      await q.query(
        `ALTER TABLE TMDM_CHANGE_REQUEST ADD (BASE_HASH VARCHAR2(64))`,
      );
    }
  }

  public async down(q: QueryRunner): Promise<void> {
    if (await this.columnExists(q, 'TMDM_CHANGE_REQUEST', 'BASE_HASH')) {
      await q.query(`ALTER TABLE TMDM_CHANGE_REQUEST DROP COLUMN BASE_HASH`);
    }
  }

  private async columnExists(
    q: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const rows = (await q.query(
      `SELECT COUNT(*) AS CNT FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :1 AND COLUMN_NAME = :2`,
      [table, column],
    )) as Array<{ CNT: number }>;
    const cnt = rows?.[0]?.CNT ?? (rows?.[0] as unknown as number[])?.[0] ?? 0;
    return Number(cnt) > 0;
  }
}
