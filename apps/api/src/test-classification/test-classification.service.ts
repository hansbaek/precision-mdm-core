import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const TABLE_NAME = 'DW_HNT_CLASSIFICATION';
const DEFAULT_MODE = 'Indoor';

interface CascadeFilters {
  mode?: string;
  group?: string;
  item?: string;
  method?: string;
}

export interface ClassificationRow {
  id: string;
  target: string;
  mode: string;
  group: string;
  item: string;
  method: string;
  condition: string;
  level: string;
}

export interface ClassificationListFilters {
  mode?: string;
  group?: string;
  item?: string;
  search?: string;
}

/**
 * Read-only lookups over the DW_HNT_CLASSIFICATION reference hierarchy:
 * TRGT > MODE > GROUP > ITEM > METHOD > COND. Backs the cascading combos
 * in the std-test-item edit screen (mode fixed to 'Indoor' by default).
 */
@Injectable()
export class TestClassificationService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findGroups(mode?: string): Promise<string[]> {
    return this.distinct('TEST_GROUP_NAME', { mode });
  }

  async findItems(mode?: string, group?: string): Promise<string[]> {
    return this.distinct('TEST_ITEM_NAME', { mode, group });
  }

  async findMethods(
    item: string,
    mode?: string,
    group?: string,
  ): Promise<string[]> {
    return this.distinct('TEST_METHOD_NAME', { mode, group, item });
  }

  async findConditions(
    item: string,
    method: string,
    mode?: string,
    group?: string,
  ): Promise<string[]> {
    return this.distinct('TEST_COND_NAME', { mode, group, item, method });
  }

  /** 분류 마스터 전체 목록 (관리/표시 화면용). mode/group/item + 명칭 검색 필터. */
  async findAll(filters: ClassificationListFilters = {}): Promise<ClassificationRow[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const eq: Record<string, string | undefined> = {
      TEST_MODE_NAME: filters.mode,
      TEST_GROUP_NAME: filters.group,
      TEST_ITEM_NAME: filters.item,
    };
    for (const [col, val] of Object.entries(eq)) {
      if (val !== undefined && val !== '' && val !== 'ALL') {
        where.push(`${col} = :${idx++}`);
        params.push(val);
      }
    }

    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      const cols = [
        'TEST_GROUP_NAME',
        'TEST_ITEM_NAME',
        'TEST_METHOD_NAME',
        'TEST_COND_NAME',
      ];
      where.push(
        `(${cols.map((c) => `LOWER(${c}) LIKE :${idx++}`).join(' OR ')})`,
      );
      for (let i = 0; i < cols.length; i++) params.push(term);
    }

    const sql =
      `SELECT CFS_UID, TEST_TRGT_NAME, TEST_MODE_NAME, TEST_GROUP_NAME,
              TEST_ITEM_NAME, TEST_METHOD_NAME, TEST_COND_NAME, CLASSIFICATION_LEVEL
       FROM ${TABLE_NAME}` +
      (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
      ` ORDER BY TEST_MODE_NAME, TEST_GROUP_NAME, TEST_ITEM_NAME, TEST_METHOD_NAME, TEST_COND_NAME`;

    const rows: Record<string, string | null>[] = await this.dataSource.query(
      sql,
      params,
    );
    const s = (v: string | null) => (v == null ? '' : String(v).trim());
    return rows.map((r) => ({
      id: s(r['CFS_UID']),
      target: s(r['TEST_TRGT_NAME']),
      mode: s(r['TEST_MODE_NAME']),
      group: s(r['TEST_GROUP_NAME']),
      item: s(r['TEST_ITEM_NAME']),
      method: s(r['TEST_METHOD_NAME']),
      condition: s(r['TEST_COND_NAME']),
      level: s(r['CLASSIFICATION_LEVEL']),
    }));
  }

  /** 모드 목록 (필터 드롭다운 소스). */
  async findModes(): Promise<string[]> {
    const rows: { NAME: string }[] = await this.dataSource.query(
      `SELECT DISTINCT TEST_MODE_NAME AS NAME FROM ${TABLE_NAME} WHERE TEST_MODE_NAME IS NOT NULL ORDER BY TEST_MODE_NAME`,
    );
    return rows.map((r) => r.NAME);
  }

  private async distinct(
    column: string,
    filters: CascadeFilters,
  ): Promise<string[]> {
    const where: string[] = [`${column} IS NOT NULL`];
    const params: unknown[] = [];
    let idx = 1;

    const filterMap: Record<string, string | undefined> = {
      TEST_MODE_NAME: filters.mode ?? DEFAULT_MODE,
      TEST_GROUP_NAME: filters.group,
      TEST_ITEM_NAME: filters.item,
      TEST_METHOD_NAME: filters.method,
    };
    for (const [col, val] of Object.entries(filterMap)) {
      if (val !== undefined && val !== '') {
        where.push(`${col} = :${idx++}`);
        params.push(val);
      }
    }

    const rows: { NAME: string }[] = await this.dataSource.query(
      `SELECT DISTINCT ${column} AS NAME FROM ${TABLE_NAME} WHERE ${where.join(' AND ')} ORDER BY ${column}`,
      params,
    );
    return rows.map((r) => r.NAME);
  }
}
