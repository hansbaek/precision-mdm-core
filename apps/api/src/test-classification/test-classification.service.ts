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
