import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { UpdateStdTestItemDto } from './dto/update-std-test-item.dto';

const TABLE_NAME = 'TEMPLATE_STD_TEST_ITEM';

/** 38 market flag columns, in fixed display order (matches ALL_MARKETS on the web side). */
const MARKET_COLS = [
  'F1',
  'F2',
  'F3',
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'A9',
  'N1',
  'N2',
  'N3',
  'E1',
  'E2',
  'E3',
  'E4',
  'E5',
  'E6',
  'K1',
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'NA',
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'L6',
  'L7',
  'L8',
] as const;

type RawRow = Record<string, unknown>;

export interface StdTestItemFilters {
  productLine?: string;
  search?: string;
  /** comma/space-separated market codes; matches rows applied to ANY of them */
  markets?: string;
}

@Injectable()
export class TemplateService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private cell(r: RawRow, key: string): string {
    const v = r[key] ?? r[key.toLowerCase()];
    if (
      typeof v !== 'string' &&
      typeof v !== 'number' &&
      typeof v !== 'boolean'
    )
      return '';
    return String(v).trim();
  }

  private isMarketOn(r: RawRow, col: string): boolean {
    const v = r[col] ?? r[col.toLowerCase()];
    if (
      typeof v !== 'string' &&
      typeof v !== 'number' &&
      typeof v !== 'boolean'
    )
      return false;
    const s = String(v).trim();
    return s !== '' && s !== '0' && s.toUpperCase() !== 'N';
  }

  private mapRow(r: RawRow) {
    return {
      id: Number(r['TMPLT_ID'] ?? r['tmplt_id'] ?? 0),
      productLine: this.cell(r, 'PRODUCT_LINE'),
      testItemName: this.cell(r, 'TEST_ITEM_NAME'),
      testMethod: this.cell(r, 'TEST_MTH_NAME'),
      testCondition: this.cell(r, 'TEST_CDN_NAME'),
      certiType: this.cell(r, 'CERTI_TYPE'),
      markets: MARKET_COLS.filter((c) => this.isMarketOn(r, c)),
      createdAt: this.cell(r, 'CREATED_AT'),
      createdBy: this.cell(r, 'CREATED_BY'),
    };
  }

  async findAllStdTestItems(filters: StdTestItemFilters = {}) {
    const where: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.productLine && filters.productLine !== 'ALL') {
      where.push(`PRODUCT_LINE = :${idx++}`);
      params.push(filters.productLine);
    }

    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      where.push(
        `(LOWER(TEST_ITEM_NAME) LIKE :${idx} OR LOWER(TEST_MTH_NAME) LIKE :${idx + 1} OR LOWER(TEST_CDN_NAME) LIKE :${idx + 2})`,
      );
      params.push(term, term, term);
      idx += 3;
    }

    // Market filter: rows applied to ANY of the given markets (OR).
    // Unknown codes match nothing — so if the user typed market tokens but none
    // are valid, the result is empty (1 = 0) rather than silently unfiltered.
    // Column names come from the MARKET_COLS whitelist, so they are safe to
    // inline (Oracle cannot bind identifiers as parameters).
    const marketTokens = (filters.markets ?? '')
      .split(/[,\s]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (marketTokens.length) {
      const valid = new Set(MARKET_COLS as readonly string[]);
      const cols = [...new Set(marketTokens.filter((t) => valid.has(t)))];
      where.push(
        cols.length ? `(${cols.map((c) => `${c} = 1`).join(' OR ')})` : '1 = 0',
      );
    }

    const sql =
      `SELECT * FROM ${TABLE_NAME}` +
      (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
      ` ORDER BY TMPLT_ID`;

    const rows: RawRow[] = await this.dataSource.query(sql, params);
    return rows.map((r) => this.mapRow(r));
  }

  async findOneStdTestItem(id: number) {
    const rows: RawRow[] = await this.dataSource.query(
      `SELECT * FROM ${TABLE_NAME} WHERE TMPLT_ID = :1`,
      [id],
    );
    if (!rows.length)
      throw new NotFoundException(`StdTestItem '${id}' not found`);
    return this.mapRow(rows[0]);
  }

  async updateStdTestItem(id: number, dto: UpdateStdTestItemDto) {
    await this.findOneStdTestItem(id); // 404 if missing

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const textMap: Record<string, string | undefined> = {
      PRODUCT_LINE: dto.productLine,
      TEST_ITEM_NAME: dto.testItemName,
      TEST_MTH_NAME: dto.testMethod,
      TEST_CDN_NAME: dto.testCondition,
    };

    for (const [col, val] of Object.entries(textMap)) {
      if (val !== undefined) {
        setClauses.push(`${col} = :${idx++}`);
        params.push(val);
      }
    }

    // Markets arrive as a comma-separated list; expand to the 38 flag columns.
    if (dto.markets !== undefined) {
      const active = new Set(
        dto.markets
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
      );
      for (const col of MARKET_COLS) {
        setClauses.push(`${col} = :${idx++}`);
        params.push(active.has(col) ? 1 : null);
      }
    }

    if (setClauses.length > 0) {
      params.push(id);
      await this.dataSource.query(
        `UPDATE ${TABLE_NAME} SET ${setClauses.join(', ')} WHERE TMPLT_ID = :${idx}`,
        params,
      );
    }

    return this.findOneStdTestItem(id);
  }

  async getStats() {
    const rows = await this.findAllStdTestItems();
    const total = rows.length;

    const tally = (key: 'productLine' | 'testMethod' | 'testItemName') => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const v = r[key] || '(blank)';
        m.set(v, (m.get(v) ?? 0) + 1);
      }
      return [...m.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const byProductLine = tally('productLine');
    const byTestMethod = tally('testMethod');
    const byTestItem = tally('testItemName');

    const marketCoverage = MARKET_COLS.map((code) => ({
      code,
      count: rows.filter((r) => r.markets.includes(code)).length,
    }));

    const totalMarkets = rows.reduce((s, r) => s + r.markets.length, 0);
    const noMarketCount = rows.filter((r) => r.markets.length === 0).length;

    const recent = [...rows]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
      .slice(0, 10);

    return {
      total,
      distinctProductLines: byProductLine.length,
      distinctTestMethods: byTestMethod.length,
      distinctTestItems: byTestItem.length,
      avgMarketsPerItem: total ? Number((totalMarkets / total).toFixed(1)) : 0,
      noMarketCount,
      byProductLine,
      byTestMethod,
      byTestItem,
      marketCoverage,
      recent,
    };
  }

  async generateTemplateXlsx(): Promise<Buffer> {
    const columns: { COLUMN_NAME: string }[] = await this.dataSource.query(
      `SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :1 ORDER BY COLUMN_ID`,
      [TABLE_NAME],
    );
    const columnNames = columns.map((c) => c.COLUMN_NAME);

    const rows: RawRow[] = await this.dataSource.query(
      `SELECT * FROM ${TABLE_NAME}`,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(TABLE_NAME);
    sheet.addRow(columnNames);
    for (const row of rows) {
      sheet.addRow(columnNames.map((col) => row[col] ?? null));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
