import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { MARKET_COLS, TABLE_NAME } from './template.constants';
import { TemplateUploadService } from './template-upload.service';

/**
 * 업로드 diff 엔진(preview) 단위 테스트.
 * 실제 xlsx 버퍼를 메모리에서 생성하고, DataSource 의 두 쿼리
 * (USER_TAB_COLUMNS, SELECT *) 만 목으로 대체한다.
 *
 * 컬럼 집합은 실제 테이블처럼 38개 시장 플래그를 모두 포함한다
 * (toPreviewResponse 가 MARKET_COLS 전체를 순회하므로 충실도상 필요).
 */
const CONTENT_COLS = ['PRODUCT_LINE', 'TEST_ITEM_NAME', 'GRV_DEPTH'];
const COLUMNS = [
  'TMPLT_ID',
  ...CONTENT_COLS,
  ...MARKET_COLS,
  'CREATED_AT',
  'CREATED_BY',
];

type Cell = string | number | null;
type RowObj = Record<string, Cell>;

async function buildXlsx(rows: RowObj[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(TABLE_NAME);
  ws.addRow(COLUMNS);
  for (const r of rows) {
    ws.addRow(COLUMNS.map((c) => r[c] ?? ''));
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function makeService(dbRows: RowObj[]): TemplateUploadService {
  const query = jest.fn((sql: string) => {
    if (sql.includes('USER_TAB_COLUMNS')) {
      return Promise.resolve(COLUMNS.map((c) => ({ COLUMN_NAME: c })));
    }
    return Promise.resolve(dbRows); // SELECT * FROM TABLE_NAME
  });
  const dataSource = { query } as unknown as DataSource;
  return new TemplateUploadService(dataSource);
}

const audit = { CREATED_AT: '20240101', CREATED_BY: 'sys' };

describe('TemplateUploadService.preview (diff 엔진)', () => {
  it('INSERT/UPDATE/DELETE/UNCHANGED 를 정확히 분류한다', async () => {
    const dbRows: RowObj[] = [
      {
        TMPLT_ID: 1,
        PRODUCT_LINE: 'PCR',
        TEST_ITEM_NAME: 'A',
        F1: 1,
        ...audit,
      },
      { TMPLT_ID: 2, PRODUCT_LINE: 'PCR', TEST_ITEM_NAME: 'B', ...audit },
      { TMPLT_ID: 3, PRODUCT_LINE: 'TBR', TEST_ITEM_NAME: 'C', ...audit },
    ];
    const service = makeService(dbRows);

    const buffer = await buildXlsx([
      { TMPLT_ID: 1, PRODUCT_LINE: 'PCR', TEST_ITEM_NAME: 'A', F1: 1 }, // unchanged
      { TMPLT_ID: 2, PRODUCT_LINE: 'PCR', TEST_ITEM_NAME: 'B-edit' }, // update
      { PRODUCT_LINE: 'PCR', TEST_ITEM_NAME: 'NEW', F1: 1 }, // insert (PK 공백)
      // id=3 누락 → delete
    ]);

    const res = await service.preview(buffer);

    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.summary).toEqual({
      inserts: 1,
      updates: 1,
      deletes: 1,
      unchanged: 1,
    });
    expect(res.updates[0].id).toBe(2);
    expect(res.updates[0].changes.map((c) => c.column)).toEqual([
      'TEST_ITEM_NAME',
    ]);
    expect(res.deletes[0].id).toBe(3);
  });

  it('시장 플래그(Y==1)·숫자(17.50==17.5) 동치는 변경으로 보지 않는다', async () => {
    const dbRows: RowObj[] = [
      {
        TMPLT_ID: 1,
        PRODUCT_LINE: 'PCR',
        TEST_ITEM_NAME: 'A',
        GRV_DEPTH: 17.5,
        F1: 1,
        ...audit,
      },
    ];
    const service = makeService(dbRows);

    const buffer = await buildXlsx([
      {
        TMPLT_ID: 1,
        PRODUCT_LINE: 'PCR',
        TEST_ITEM_NAME: 'A',
        GRV_DEPTH: '17.50',
        F1: 'Y',
      },
    ]);

    const res = await service.preview(buffer);

    expect(res.summary.updates).toBe(0);
    expect(res.summary.unchanged).toBe(1);
  });

  it('DB 에 없는 TMPLT_ID 는 검증 오류(valid=false)', async () => {
    const dbRows: RowObj[] = [
      { TMPLT_ID: 1, PRODUCT_LINE: 'PCR', TEST_ITEM_NAME: 'A', ...audit },
    ];
    const service = makeService(dbRows);

    const buffer = await buildXlsx([
      { TMPLT_ID: 999, PRODUCT_LINE: 'PCR', TEST_ITEM_NAME: 'Z' },
    ]);

    const res = await service.preview(buffer);

    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'UNKNOWN_ID')).toBe(true);
  });

  it('절반 초과 대량 삭제 시 MASS_DELETE 경고를 낸다', async () => {
    const dbRows: RowObj[] = Array.from({ length: 10 }, (_, i) => ({
      TMPLT_ID: i + 1,
      PRODUCT_LINE: 'PCR',
      TEST_ITEM_NAME: `T${i + 1}`,
      ...audit,
    }));
    const service = makeService(dbRows);

    // 10건 중 4건만 유지 → 6건(60%) 삭제
    const buffer = await buildXlsx(
      [1, 2, 3, 4].map((id) => ({
        TMPLT_ID: id,
        PRODUCT_LINE: 'PCR',
        TEST_ITEM_NAME: `T${id}`,
      })),
    );

    const res = await service.preview(buffer);

    expect(res.summary.deletes).toBe(6);
    expect(res.warnings.some((w) => w.code === 'MASS_DELETE')).toBe(true);
  });
});
