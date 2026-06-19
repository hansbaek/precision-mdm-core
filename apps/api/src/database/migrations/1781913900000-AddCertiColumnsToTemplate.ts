import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TEMPLATE_STD_TEST_ITEM 에 인증 상세 컬럼 2개 추가.
 * - CERTI_REGULATION_TYPE: 인증/법규/내부 시험 구분
 * - CERTI_TYPE_ID: 인증 유형 고유번호(코드/키). CERTI_TYPE(표시명)과 별개.
 *
 * 멱등: 컬럼이 이미 있으면 추가하지 않는다.
 */
export class AddCertiColumnsToTemplate1781913900000 implements MigrationInterface {
  name = 'AddCertiColumnsToTemplate1781913900000';

  private readonly table = 'TEMPLATE_STD_TEST_ITEM';
  private readonly columns: { name: string; type: string }[] = [
    { name: 'CERTI_REGULATION_TYPE', type: 'VARCHAR2(60)' },
    { name: 'CERTI_TYPE_ID', type: 'VARCHAR2(60)' },
  ];

  public async up(q: QueryRunner): Promise<void> {
    for (const col of this.columns) {
      if (!(await this.columnExists(q, col.name))) {
        await q.query(
          `ALTER TABLE ${this.table} ADD (${col.name} ${col.type})`,
        );
      }
    }
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const col of [...this.columns].reverse()) {
      if (await this.columnExists(q, col.name)) {
        await q.query(`ALTER TABLE ${this.table} DROP COLUMN ${col.name}`);
      }
    }
  }

  private async columnExists(q: QueryRunner, name: string): Promise<boolean> {
    const rows = (await q.query(
      `SELECT COUNT(*) AS CNT FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :1 AND COLUMN_NAME = :2`,
      [this.table, name],
    )) as Array<{ CNT: number }>;
    const cnt = rows?.[0]?.CNT ?? (rows?.[0] as unknown as number[])?.[0] ?? 0;
    return Number(cnt) > 0;
  }
}
