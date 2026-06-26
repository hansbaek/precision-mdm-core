import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TABLE_NAME } from './template.constants';

type RawRow = Record<string, unknown>;

/**
 * TEMPLATE_STD_TEST_ITEM 전체 행 캐시.
 *
 * 필요시험 매칭(test-match)은 매 요청마다 템플릿 전체(약 188행, SELECT *)를
 * 다시 읽었다. 템플릿은 거의 변하지 않으므로 인메모리로 캐시하고, 쓰기(생성/
 * 수정/삭제·업로드 적용·변경요청 반영)가 일어나면 invalidate() 로 비운다.
 * 무효화 누락에 대비해 TTL 안전망(기본 5분)도 둔다.
 */
@Injectable()
export class TemplateCacheService {
  private cached: { rows: RawRow[]; at: number } | null = null;
  private readonly ttlMs = 5 * 60_000;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** 캐시된 템플릿 전체 행(TMPLT_ID 순). 만료/무효화 시 재조회. */
  async getRows(): Promise<RawRow[]> {
    const now = Date.now();
    if (this.cached && now - this.cached.at < this.ttlMs) {
      return this.cached.rows;
    }
    const rows: RawRow[] = await this.dataSource.query(
      `SELECT * FROM ${TABLE_NAME} ORDER BY TMPLT_ID`,
    );
    this.cached = { rows, at: now };
    return rows;
  }

  /** 템플릿 쓰기 후 호출 — 다음 조회 시 강제 재적재. */
  invalidate(): void {
    this.cached = null;
  }
}
