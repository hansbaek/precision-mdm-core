import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import {
  AuditContext,
  AuditFieldChange,
  AuditService,
} from '../audit/audit.service';
import { UpdateStdTestItemDto } from './dto/update-std-test-item.dto';
import { CreateStdTestItemDto } from './dto/create-std-test-item.dto';
import { MARKET_COLS, TABLE_NAME } from './template.constants';

const PK_SEQUENCE = 'SEQ_TEMPLATE_STD_TEST_ITEM';

/** 감사 대상 엔티티 식별자. */
const AUDIT_ENTITY = 'STD_TEST_ITEM';

/** 감사 diff 에서 제외할 키(파생/식별/감사 컬럼). */
const AUDIT_SKIP_KEYS = new Set([
  'id',
  'marketFlags',
  'createdAt',
  'createdBy',
]);

type RawRow = Record<string, unknown>;

export interface StdTestItemFilters {
  productLine?: string;
  search?: string;
  /** comma/space-separated market codes; matches rows applied to ANY of them */
  markets?: string;
}

@Injectable()
export class TemplateService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

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

  private marketFlags(r: RawRow): Record<(typeof MARKET_COLS)[number], string> {
    return MARKET_COLS.reduce(
      (acc, col) => ({
        ...acc,
        [col]: this.cell(r, col),
      }),
      {} as Record<(typeof MARKET_COLS)[number], string>,
    );
  }

  private mapRow(r: RawRow) {
    return {
      id: Number(r['TMPLT_ID'] ?? r['tmplt_id'] ?? 0),
      productLine: this.cell(r, 'PRODUCT_LINE'),
      testItemName: this.cell(r, 'TEST_ITEM_NAME'),
      testMethod: this.cell(r, 'TEST_MTH_NAME'),
      testCondition: this.cell(r, 'TEST_CDN_NAME'),
      cdnPattern: this.cell(r, 'CDN_PATTERN'),
      endurSvrty: this.cell(r, 'ENDUR_SVRTY'),
      certiTestYn: this.cell(r, 'CERTI_TEST_YN'),
      certiType: this.cell(r, 'CERTI_TYPE'),
      certiRegulationType: this.cell(r, 'CERTI_REGULATION_TYPE'),
      certiTypeId: this.cell(r, 'CERTI_TYPE_ID'),
      tempTire: this.cell(r, 'TEMP_TIRE'),
      snowMark: this.cell(r, 'SNOW_MARK'),
      frt: this.cell(r, 'FRT'),
      utqg: this.cell(r, 'UTQG'),
      por: this.cell(r, 'POR'),
      radialBias: this.cell(r, 'RADIAL_BIAS'),
      rimInch: this.cell(r, 'RIM_INCH'),
      grvDepth: this.cell(r, 'GRV_DEPTH'),
      ss: this.cell(r, 'SS'),
      li: this.cell(r, 'LI'),
      plyRating: this.cell(r, 'PLY_RATING'),
      tlIndicator: this.cell(r, 'TL_INDICATOR'),
      tbrPosition: this.cell(r, 'TBR_POSITION'),
      tbrGrv3: this.cell(r, 'TBR_GRV_3'),
      tbrSegment: this.cell(r, 'TBR_SEGMENT'),
      tbrItemCntPerBarcode: this.cell(r, 'TBR_ITEM_CNT_PER_BARCODE'),
      newSizeYn: this.cell(r, 'NEW_SIZE_YN'),
      sizeSmpl: this.cell(r, 'SIZE_SMPL'),
      markets: MARKET_COLS.filter((c) => this.isMarketOn(r, c)),
      marketFlags: this.marketFlags(r),
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

  async updateStdTestItem(
    id: number,
    dto: UpdateStdTestItemDto,
    ctx?: AuditContext,
  ) {
    const existing = await this.findOneStdTestItem(id); // 404 if missing

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // TBR-only columns are valid only when PRODUCT_LINE is TBR. For any other
    // product line they are forced to NULL — blocking TBR values from being
    // saved and clearing them when a row is switched away from TBR.
    const effectivePL = (
      dto.productLine ??
      existing.productLine ??
      ''
    ).toUpperCase();
    const isTbr = effectivePL === 'TBR';

    const textMap: Record<string, string | null | undefined> = {
      PRODUCT_LINE: dto.productLine,
      TEST_ITEM_NAME: dto.testItemName,
      TEST_MTH_NAME: dto.testMethod,
      TEST_CDN_NAME: dto.testCondition,
      CDN_PATTERN: dto.cdnPattern,
      ENDUR_SVRTY: dto.endurSvrty,
      CERTI_TEST_YN: dto.certiTestYn,
      CERTI_TYPE: dto.certiType,
      CERTI_REGULATION_TYPE: dto.certiRegulationType,
      CERTI_TYPE_ID: dto.certiTypeId,
      TEMP_TIRE: dto.tempTire,
      SNOW_MARK: dto.snowMark,
      FRT: dto.frt,
      UTQG: dto.utqg,
      POR: dto.por,
      RADIAL_BIAS: dto.radialBias,
      RIM_INCH: dto.rimInch,
      GRV_DEPTH: dto.grvDepth,
      SS: dto.ss,
      LI: dto.li,
      PLY_RATING: dto.plyRating,
      TL_INDICATOR: dto.tlIndicator,
      TBR_POSITION: isTbr ? dto.tbrPosition : null,
      TBR_GRV_3: isTbr ? dto.tbrGrv3 : null,
      TBR_SEGMENT: isTbr ? dto.tbrSegment : null,
      TBR_ITEM_CNT_PER_BARCODE: isTbr ? dto.tbrItemCntPerBarcode : null,
      NEW_SIZE_YN: dto.newSizeYn,
      SIZE_SMPL: dto.sizeSmpl,
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

    const updated = await this.findOneStdTestItem(id);
    const changes = this.diffItem(existing, updated);
    if (changes.length) {
      await this.audit.record({
        entityType: AUDIT_ENTITY,
        entityId: id,
        action: 'UPDATE',
        ctx: this.resolveCtx(ctx),
        changes,
        summary: `수정: #${id} ${updated.productLine}/${updated.testItemName}`,
      });
    }
    return updated;
  }

  async createStdTestItem(dto: CreateStdTestItemDto, ctx?: AuditContext) {
    // New PK from the table sequence (next value is ahead of MAX(TMPLT_ID)).
    const seqRows: { ID: number }[] = await this.dataSource.query(
      `SELECT ${PK_SEQUENCE}.NEXTVAL AS ID FROM DUAL`,
    );
    const newId = Number(seqRows[0].ID);

    const now = new Date();
    const createdAt =
      `${now.getFullYear()}` +
      `${now.getMonth() + 1}`.padStart(2, '0') +
      `${now.getDate()}`.padStart(2, '0');
    const createdBy = dto.createdBy?.trim() || 'SYSTEM';

    const isTbr = (dto.productLine ?? '').toUpperCase() === 'TBR';

    // Same column set as update; TBR columns null unless PRODUCT_LINE is TBR.
    const textMap: Record<string, string | null | undefined> = {
      PRODUCT_LINE: dto.productLine,
      TEST_ITEM_NAME: dto.testItemName,
      TEST_MTH_NAME: dto.testMethod,
      TEST_CDN_NAME: dto.testCondition,
      CDN_PATTERN: dto.cdnPattern,
      ENDUR_SVRTY: dto.endurSvrty,
      CERTI_TEST_YN: dto.certiTestYn,
      CERTI_TYPE: dto.certiType,
      CERTI_REGULATION_TYPE: dto.certiRegulationType,
      CERTI_TYPE_ID: dto.certiTypeId,
      TEMP_TIRE: dto.tempTire,
      SNOW_MARK: dto.snowMark,
      FRT: dto.frt,
      UTQG: dto.utqg,
      POR: dto.por,
      RADIAL_BIAS: dto.radialBias,
      RIM_INCH: dto.rimInch,
      GRV_DEPTH: dto.grvDepth,
      SS: dto.ss,
      LI: dto.li,
      PLY_RATING: dto.plyRating,
      TL_INDICATOR: dto.tlIndicator,
      TBR_POSITION: isTbr ? dto.tbrPosition : null,
      TBR_GRV_3: isTbr ? dto.tbrGrv3 : null,
      TBR_SEGMENT: isTbr ? dto.tbrSegment : null,
      TBR_ITEM_CNT_PER_BARCODE: isTbr ? dto.tbrItemCntPerBarcode : null,
      NEW_SIZE_YN: dto.newSizeYn,
      SIZE_SMPL: dto.sizeSmpl,
    };

    const cols = ['TMPLT_ID', 'CREATED_AT', 'CREATED_BY'];
    const values: unknown[] = [newId, createdAt, createdBy];
    for (const [col, val] of Object.entries(textMap)) {
      cols.push(col);
      values.push(val === undefined ? null : val);
    }

    const active = new Set(
      (dto.markets ?? '')
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    );
    for (const col of MARKET_COLS) {
      cols.push(col);
      values.push(active.has(col) ? 1 : null);
    }

    const placeholders = cols.map((_, i) => `:${i + 1}`).join(', ');
    await this.dataSource.query(
      `INSERT INTO ${TABLE_NAME} (${cols.join(', ')}) VALUES (${placeholders})`,
      values,
    );

    const created = await this.findOneStdTestItem(newId);
    await this.audit.record({
      entityType: AUDIT_ENTITY,
      entityId: newId,
      action: 'CREATE',
      ctx: this.resolveCtx(ctx, createdBy),
      changes: this.diffItem(null, created),
      summary: `생성: ${created.productLine}/${created.testItemName}`,
    });
    return created;
  }

  async deleteStdTestItem(id: number, ctx?: AuditContext) {
    const existing = await this.findOneStdTestItem(id); // 404 if missing
    await this.dataSource.query(
      `DELETE FROM ${TABLE_NAME} WHERE TMPLT_ID = :1`,
      [id],
    );
    await this.audit.record({
      entityType: AUDIT_ENTITY,
      entityId: id,
      action: 'DELETE',
      ctx: this.resolveCtx(ctx),
      changes: this.diffItem(existing, null),
      summary: `삭제: #${id} ${existing.productLine}/${existing.testItemName}`,
    });
    return { deleted: true, id };
  }

  // ---------- 감사(변경 이력) 보조 ----------

  /** ctx 미지정 시(직접 호출/테스트) 합리적 기본값으로 보정. */
  private resolveCtx(
    ctx: AuditContext | undefined,
    fallbackActor = 'SYSTEM',
  ): AuditContext {
    return ctx ?? { actorId: fallbackActor || 'SYSTEM', source: 'API' };
  }

  /** 감사 비교용 정규화: null/undefined→'', 배열→정렬 콤마, 원시값→문자열. */
  private auditNorm(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) {
      return [...(v as unknown[])]
        .map((x) => this.auditNorm(x))
        .sort()
        .join(',');
    }
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return ''; // 객체/함수 등은 감사 대상 필드가 아니므로 무시.
  }

  /**
   * 매핑된 시험항목 두 스냅샷의 필드 단위 차이. before/after 한쪽이 null 이면
   * 생성(전체 신규)/삭제(전체 제거)를 의미한다. 파생/식별/감사 컬럼은 제외.
   */
  private diffItem(
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ): AuditFieldChange[] {
    const keys = new Set<string>([
      ...Object.keys(before ?? {}),
      ...Object.keys(after ?? {}),
    ]);
    const changes: AuditFieldChange[] = [];
    for (const k of keys) {
      if (AUDIT_SKIP_KEYS.has(k)) continue;
      const b = before ? this.auditNorm(before[k]) : '';
      const a = after ? this.auditNorm(after[k]) : '';
      if (b !== a) {
        changes.push({
          column: k,
          before: before ? b : null,
          after: after ? a : null,
        });
      }
    }
    return changes;
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
