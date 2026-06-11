import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import * as ExcelJS from 'exceljs';
import {
  AUDIT_COLS,
  MARKET_COLS,
  PK_COL,
  TABLE_NAME,
} from './template.constants';
import {
  UploadApplyResponse,
  UploadChange,
  UploadDeleteRow,
  UploadInsertRow,
  UploadPreviewResponse,
  UploadRowError,
  UploadUpdateRow,
  UploadWarning,
} from './dto/upload-preview.response';

type RawRow = Record<string, unknown>;

interface ParsedRow {
  /** Excel row number (1-based; header is row 1) */
  rowNumber: number;
  values: Record<string, string | null>;
  cellErrors: UploadRowError[];
}

interface ParsedWorkbook {
  sheetName: string;
  columns: string[];
  rows: ParsedRow[];
}

interface Diff {
  inserts: { row: ParsedRow }[];
  updates: { row: ParsedRow; id: number; changes: UploadChange[] }[];
  deletes: UploadDeleteRow[];
  unchanged: number;
  errors: UploadRowError[];
  warnings: UploadWarning[];
}

const MARKET_COL_SET = new Set<string>(MARKET_COLS);
const SKIP_DIFF_COLS = new Set<string>([PK_COL, ...AUDIT_COLS]);
const MASS_DELETE_RATIO = 0.5;
const MASS_DELETE_MIN_ROWS = 10;
const DELETE_CHUNK_SIZE = 500;
const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

/**
 * Excel upload synchronization for TEMPLATE_STD_TEST_ITEM.
 *
 * Diff-by-PK strategy: blank TMPLT_ID = INSERT, existing id with changed
 * cells = UPDATE, db ids absent from the file = DELETE, non-existent id in
 * the file = validation error. Preview never writes; apply re-diffs against
 * a FOR UPDATE snapshot inside one transaction (stateless between calls).
 */
@Injectable()
export class TemplateUploadService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async preview(buffer: Buffer): Promise<UploadPreviewResponse> {
    const parsed = await this.parseWorkbook(buffer);
    const dbRows: RawRow[] = await this.dataSource.query(
      `SELECT * FROM ${TABLE_NAME}`,
    );
    const diff = this.computeDiff(parsed, dbRows);
    return this.toPreviewResponse(parsed, dbRows.length, diff);
  }

  async apply(buffer: Buffer, force: boolean): Promise<UploadApplyResponse> {
    // Parse outside the transaction so malformed files fail fast without locks.
    const parsed = await this.parseWorkbook(buffer);

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      // FOR UPDATE serializes concurrent applies and pins the snapshot we
      // diff against — preview results are advisory only.
      const dbRows = (await runner.query(
        `SELECT * FROM ${TABLE_NAME} FOR UPDATE`,
      )) as RawRow[];
      const diff = this.computeDiff(parsed, dbRows);

      if (diff.errors.length > 0) {
        throw new BadRequestException({
          message: '업로드 파일에 검증 오류가 있습니다.',
          errors: diff.errors,
        });
      }
      if (diff.warnings.some((w) => w.code === 'MASS_DELETE') && !force) {
        throw new ConflictException({
          code: 'MASS_DELETE_CONFIRM_REQUIRED',
          message: diff.warnings[0].message,
        });
      }

      await this.applyUpdates(runner, diff);
      await this.applyInserts(runner, parsed.columns, diff, dbRows);
      await this.applyDeletes(runner, diff);

      await runner.commitTransaction();
      return {
        applied: true,
        summary: {
          inserts: diff.inserts.length,
          updates: diff.updates.length,
          deletes: diff.deletes.length,
        },
      };
    } catch (err) {
      await runner.rollbackTransaction();
      if (
        err instanceof BadRequestException ||
        err instanceof ConflictException
      )
        throw err;
      throw new InternalServerErrorException(
        '동기화 적용 중 오류가 발생하여 전체 변경이 롤백되었습니다.',
      );
    } finally {
      await runner.release();
    }
  }

  // ── Parsing ────────────────────────────────────────────────────────────

  private async parseWorkbook(buffer: Buffer): Promise<ParsedWorkbook> {
    // xlsx is a zip container — first two bytes are always 'PK'.
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      throw new BadRequestException(
        'xlsx 형식이 아닙니다. 다운로드한 템플릿 파일을 사용하세요.',
      );
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    } catch {
      throw new BadRequestException('xlsx 파일을 읽을 수 없습니다.');
    }

    const sheet = workbook.getWorksheet(TABLE_NAME) ?? workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 1) {
      throw new BadRequestException('워크시트가 비어 있습니다.');
    }

    const columns = await this.getTableColumns();

    // Header: order-insensitive (users reorder columns in Excel), but the
    // column *set* must match the table exactly.
    const headerRow = sheet.getRow(1);
    const colIndexByName = new Map<string, number>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const name = this.cellToStringSafe(cell);
      if (name) colIndexByName.set(name.toUpperCase(), colNumber);
    });

    const missing = columns.filter((c) => !colIndexByName.has(c));
    const known = new Set(columns);
    const unknown = [...colIndexByName.keys()].filter((c) => !known.has(c));
    if (missing.length || unknown.length) {
      throw new BadRequestException(
        `헤더가 테이블 컬럼과 일치하지 않습니다.` +
          (missing.length ? ` 누락: ${missing.join(', ')}.` : '') +
          (unknown.length ? ` 알 수 없음: ${unknown.join(', ')}.` : ''),
      );
    }

    const rows: ParsedRow[] = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
      const excelRow = sheet.getRow(r);
      const values: Record<string, string | null> = {};
      const cellErrors: UploadRowError[] = [];
      let hasValue = false;

      for (const col of columns) {
        const cell = excelRow.getCell(colIndexByName.get(col)!);
        const result = this.cellToString(cell);
        if (result.error) {
          cellErrors.push({
            rowNumber: r,
            code: 'CELL_ERROR',
            message: `행 ${r}, 컬럼 ${col}: 오류 셀(${result.error})이 있습니다.`,
          });
          values[col] = null;
          continue;
        }
        values[col] = result.value;
        if (result.value !== null) hasValue = true;
      }

      // Skip phantom rows (formatting only, every cell empty).
      if (!hasValue) continue;
      rows.push({ rowNumber: r, values, cellErrors });
    }

    return { sheetName: sheet.name, columns, rows };
  }

  private async getTableColumns(): Promise<string[]> {
    const columns: { COLUMN_NAME: string }[] = await this.dataSource.query(
      `SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :1 ORDER BY COLUMN_ID`,
      [TABLE_NAME],
    );
    return columns.map((c) => c.COLUMN_NAME);
  }

  /** Normalize one Excel cell to string|null, or report an error cell. */
  private cellToString(cell: ExcelJS.Cell): {
    value: string | null;
    error?: string;
  } {
    return this.normalizeCellValue(cell.value);
  }

  private normalizeCellValue(v: ExcelJS.CellValue): {
    value: string | null;
    error?: string;
  } {
    if (v === null || v === undefined) return { value: null };
    if (v instanceof Date) {
      // Defensive only: date columns are audit-only and never written back.
      const y = v.getUTCFullYear();
      const m = String(v.getUTCMonth() + 1).padStart(2, '0');
      const d = String(v.getUTCDate()).padStart(2, '0');
      return { value: `${y}${m}${d}` };
    }
    if (typeof v === 'object') {
      if ('richText' in v)
        return this.trimToNull(v.richText.map((t) => t.text).join(''));
      if ('error' in v) return { value: null, error: String(v.error) };
      if ('result' in v && v.result !== undefined)
        return this.normalizeCellValue(v.result as ExcelJS.CellValue);
      if ('text' in v) return this.trimToNull(String(v.text));
      return { value: null };
    }
    return this.trimToNull(String(v));
  }

  private trimToNull(s: string): { value: string | null } {
    const t = s.trim();
    return { value: t === '' ? null : t };
  }

  /** Header cells: best-effort string, never an error. */
  private cellToStringSafe(cell: ExcelJS.Cell): string | null {
    return this.cellToString(cell).value;
  }

  // ── Diff ───────────────────────────────────────────────────────────────

  private computeDiff(parsed: ParsedWorkbook, dbRows: RawRow[]): Diff {
    const dbMap = new Map<number, RawRow>();
    for (const r of dbRows) {
      const id = Number(r[PK_COL] ?? r[PK_COL.toLowerCase()]);
      if (Number.isFinite(id)) dbMap.set(id, r);
    }

    const diff: Diff = {
      inserts: [],
      updates: [],
      deletes: [],
      unchanged: 0,
      errors: [],
      warnings: [],
    };
    const seenIds = new Set<number>();

    for (const row of parsed.rows) {
      diff.errors.push(...row.cellErrors);

      const rawId = row.values[PK_COL];
      if (rawId === null) {
        diff.inserts.push({ row });
        continue;
      }

      // Accept 123 / '123' / '123.0'; reject everything else.
      const idNum = NUMERIC_RE.test(rawId) ? Number(rawId) : NaN;
      if (!Number.isInteger(idNum) || idNum <= 0) {
        diff.errors.push({
          rowNumber: row.rowNumber,
          code: 'INVALID_ID',
          message: `행 ${row.rowNumber}: TMPLT_ID '${rawId}' 는 양의 정수가 아닙니다. 신규 행은 TMPLT_ID를 비워두세요.`,
        });
        continue;
      }

      if (seenIds.has(idNum)) {
        diff.errors.push({
          rowNumber: row.rowNumber,
          code: 'DUPLICATE_ID',
          message: `행 ${row.rowNumber}: TMPLT_ID ${idNum} 가 파일 내에 중복되었습니다.`,
        });
        continue;
      }
      seenIds.add(idNum);

      const dbRow = dbMap.get(idNum);
      if (!dbRow) {
        diff.errors.push({
          rowNumber: row.rowNumber,
          code: 'UNKNOWN_ID',
          message: `행 ${row.rowNumber}: TMPLT_ID ${idNum} 는 DB에 없습니다. 신규 행은 TMPLT_ID를 비워두세요.`,
        });
        continue;
      }

      const changes: UploadChange[] = [];
      for (const col of parsed.columns) {
        if (SKIP_DIFF_COLS.has(col)) continue;
        const fileVal = row.values[col];
        const dbVal = this.dbToString(dbRow[col] ?? dbRow[col.toLowerCase()]);
        if (!this.valuesEqual(fileVal, dbVal, col)) {
          changes.push({ column: col, before: dbVal, after: fileVal });
        }
      }

      if (changes.length > 0) {
        diff.updates.push({ row, id: idNum, changes });
      } else {
        diff.unchanged++;
      }
    }

    for (const [id, dbRow] of dbMap) {
      if (!seenIds.has(id)) {
        diff.deletes.push({
          id,
          productLine: this.dbToString(dbRow['PRODUCT_LINE']) ?? '',
          testItemName: this.dbToString(dbRow['TEST_ITEM_NAME']) ?? '',
        });
      }
    }
    diff.deletes.sort((a, b) => a.id - b.id);

    if (
      dbRows.length >= MASS_DELETE_MIN_ROWS &&
      diff.deletes.length > dbRows.length * MASS_DELETE_RATIO
    ) {
      const pct = Math.round((diff.deletes.length / dbRows.length) * 100);
      diff.warnings.push({
        code: 'MASS_DELETE',
        message: `전체 ${dbRows.length}건 중 ${diff.deletes.length}건(${pct}%)이 삭제됩니다. 파일이 잘리지 않았는지 확인하세요.`,
      });
    }

    return diff;
  }

  private dbToString(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    const s = String(v as string | number | boolean).trim();
    return s === '' ? null : s;
  }

  private valuesEqual(
    fileVal: string | null,
    dbVal: string | null,
    column: string,
  ): boolean {
    // Market flags compare as booleans: '1'/'Y'/non-empty = on, blank/'0'/'N' = off.
    if (MARKET_COL_SET.has(column)) {
      return this.isFlagOn(fileVal) === this.isFlagOn(dbVal);
    }
    if (fileVal === null && dbVal === null) return true;
    if (fileVal === null || dbVal === null) return false;
    if (fileVal === dbVal) return true;
    // Numeric fallback: Excel rewrites '17.50' as 17.5, '091' as 91, etc.
    if (NUMERIC_RE.test(fileVal) && NUMERIC_RE.test(dbVal)) {
      return Number(fileVal) === Number(dbVal);
    }
    return false;
  }

  /** Same semantics as TemplateService.isMarketOn, over normalized strings. */
  private isFlagOn(v: string | null): boolean {
    return v !== null && v !== '0' && v.toUpperCase() !== 'N';
  }

  // ── Apply steps (inside the caller's transaction) ──────────────────────

  private async applyUpdates(runner: QueryRunner, diff: Diff): Promise<void> {
    for (const { id, changes } of diff.updates) {
      const setClauses: string[] = [];
      const params: unknown[] = [];
      let idx = 1;
      for (const change of changes) {
        setClauses.push(`${change.column} = :${idx++}`);
        params.push(
          MARKET_COL_SET.has(change.column)
            ? this.isFlagOn(change.after)
              ? 1
              : null
            : change.after,
        );
      }
      params.push(id);
      await runner.query(
        `UPDATE ${TABLE_NAME} SET ${setClauses.join(', ')} WHERE ${PK_COL} = :${idx}`,
        params,
      );
    }
  }

  private async applyInserts(
    runner: QueryRunner,
    columns: string[],
    diff: Diff,
    lockedDbRows: RawRow[],
  ): Promise<void> {
    if (diff.inserts.length === 0) return;

    // Identity columns generate their own ids; otherwise MAX+1 over the
    // FOR-UPDATE-locked rows is race-free against concurrent applies.
    const identityCols = (await runner.query(
      `SELECT COLUMN_NAME FROM USER_TAB_IDENTITY_COLS WHERE TABLE_NAME = :1`,
      [TABLE_NAME],
    )) as { COLUMN_NAME: string }[];
    const pkIsIdentity = identityCols.some((c) => c.COLUMN_NAME === PK_COL);

    let nextId =
      lockedDbRows.reduce((max, r) => {
        const id = Number(r[PK_COL] ?? r[PK_COL.toLowerCase()]);
        return Number.isFinite(id) && id > max ? id : max;
      }, 0) + 1;

    const auditSet = new Set<string>(AUDIT_COLS);
    const insertCols = columns.filter(
      (c) => !auditSet.has(c) && (!pkIsIdentity || c !== PK_COL),
    );
    const allCols = [...insertCols, ...AUDIT_COLS];
    const placeholders = allCols.map((_, i) => `:${i + 1}`).join(', ');
    const sql = `INSERT INTO ${TABLE_NAME} (${allCols.join(', ')}) VALUES (${placeholders})`;

    const now = new Date();
    const createdAt = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    for (const { row } of diff.inserts) {
      const params: unknown[] = insertCols.map((col) => {
        if (col === PK_COL) return nextId++;
        const v = row.values[col];
        if (MARKET_COL_SET.has(col)) return this.isFlagOn(v) ? 1 : null;
        return v;
      });
      params.push(createdAt, 'EXCEL_UPLOAD');
      await runner.query(sql, params);
    }
  }

  private async applyDeletes(runner: QueryRunner, diff: Diff): Promise<void> {
    const ids = diff.deletes.map((d) => d.id);
    for (let i = 0; i < ids.length; i += DELETE_CHUNK_SIZE) {
      const chunk = ids.slice(i, i + DELETE_CHUNK_SIZE);
      const placeholders = chunk.map((_, j) => `:${j + 1}`).join(', ');
      await runner.query(
        `DELETE FROM ${TABLE_NAME} WHERE ${PK_COL} IN (${placeholders})`,
        chunk,
      );
    }
  }

  // ── Response assembly ──────────────────────────────────────────────────

  private toPreviewResponse(
    parsed: ParsedWorkbook,
    dbRowCount: number,
    diff: Diff,
  ): UploadPreviewResponse {
    const inserts: UploadInsertRow[] = diff.inserts.map(({ row }) => ({
      rowNumber: row.rowNumber,
      values: Object.fromEntries(
        Object.entries(row.values).filter(
          ([col, v]) =>
            !MARKET_COL_SET.has(col) && !SKIP_DIFF_COLS.has(col) && v !== null,
        ),
      ),
      markets: MARKET_COLS.filter((c) => this.isFlagOn(row.values[c])),
    }));

    const updates: UploadUpdateRow[] = diff.updates.map(
      ({ row, id, changes }) => ({
        rowNumber: row.rowNumber,
        id,
        testItemName: row.values['TEST_ITEM_NAME'] ?? '',
        changes,
      }),
    );

    return {
      sheetName: parsed.sheetName,
      fileRowCount: parsed.rows.length,
      dbRowCount,
      valid: diff.errors.length === 0,
      summary: {
        inserts: diff.inserts.length,
        updates: diff.updates.length,
        deletes: diff.deletes.length,
        unchanged: diff.unchanged,
      },
      inserts,
      updates,
      deletes: diff.deletes,
      errors: diff.errors,
      warnings: diff.warnings,
    };
  }
}
