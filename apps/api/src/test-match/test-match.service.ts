import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MARKET_COLS, TABLE_NAME } from '../template/template.constants';
import {
  DEFERRED_FILTER_COLS,
  MARKET_38,
  REGION_MAP,
} from './test-match.constants';

type RawRow = Record<string, unknown>;

export interface ResolvedMarket {
  /** 매칭에 사용할 38 마켓코드 셋. */
  codes: string[];
  /** 결정 근거: region:<X> | oem:<XX>→md최빈 | md최빈 | none */
  source: string;
}

export interface TireAttrs {
  mcode: string;
  productLine: string;
  mainMarket: string | null;
  market: ResolvedMarket;
  rimInch: number | null;
  ss: string | null;
  li: number | null;
  ply: number | null;
  grvDepth: number | null;
  radialBias: string | null;
  segment: string[];
  frt: string | null;
  por: string | null;
  winter: string | null;
  tirePosition: string | null;
}

export interface MatchedTest {
  id: number;
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  cdnPattern: string;
  endurSvrty: string;
  certiTestYn: string;
  certiType: string;
  /** 매칭에 기여한 마켓 코드(교집합). */
  marketHits: string[];
  /** 값이 있으나 현재 평가 불가했던 조건 컬럼 (사용자 검토 필요). */
  unevaluated: string[];
}

export interface MatchResult {
  tire: TireAttrs;
  total: number;
  matchedCount: number;
  matched: MatchedTest[];
}

type Verdict = 'pass' | 'fail' | 'unknown';

/** 타이어 정규화 SQL — mcode당 md 다중행, 앱에서 집계. */
const ATTR_SQL = `
SELECT
  m.MAIN_MARKET main_market, m.PRODUCT_LINE product_line,
  md.MAIN_MKT mkt2, md.SEGMENT segment, md.FRT frt, md.POR por, md.M_PLUS_S mplus,
  md.TIRE_SIZE tiresize,
  m.INCH/100 rim_inch, m.LOAD_INDEX_SINGLE li, m.PLY_RATING ply, m.TIRE_POSITION tire_position,
  CASE WHEN substr(m.PRODUCT_SPEED_SYMBOL,1,1)='1' THEN '('||substr(m.PRODUCT_SPEED_SYMBOL,2,1)||')'
       ELSE substr(m.PRODUCT_SPEED_SYMBOL,2,1) END ss,
  CASE WHEN p.MAINGROOVEDEPTH=0 THEN NULL ELSE p.MAINGROOVEDEPTH END grv_depth,
  CASE WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]R[0-9]') THEN 'R'
       WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]B[0-9]') THEN 'B'
       WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]-[0-9]') THEN 'B' ELSE NULL END radial_bias,
  CASE WHEN md.THREE_PMSF='Y' OR INSTR(m.PATTERN,'W')>0 THEN 'Y' END winter
FROM V_MCODE_INFO_4_HINT m
LEFT JOIN V_PIC_MATTR_MDPT_INFO_4_HINT md ON m.MCODE=md.MCODE
LEFT JOIN DRW_PARAM_INFO p ON m.MCODE=p.PRODUCTCODE
WHERE m.ACTIVE_YN='Y' AND m.MCODE=:mc`;

@Injectable()
export class TestMatchService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // ---- 값 헬퍼 ----
  private str(v: unknown): string {
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean')
      return '';
    return String(v).trim();
  }
  private num(v: unknown): number | null {
    const s = this.str(v);
    if (s === '') return null;
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
  }
  /** 38코드 토큰화 ('1'→K1, 38코드만 유지). */
  private tokens38(csv: unknown): string[] {
    return this.str(csv)
      .split(',')
      .map((t) => t.trim())
      .map((t) => (t === '1' ? 'K1' : t))
      .filter((t) => MARKET_38.has(t));
  }

  // ---- 대표 마켓 결정 ----
  private resolveMarket(mainMarket: string, mktRows: unknown[]): ResolvedMarket {
    const mk = (mainMarket ?? '').trim();
    if (mk.length === 1 && REGION_MAP[mk]) {
      return { codes: [...REGION_MAP[mk]], source: `region:${mk}` };
    }
    // 2자리(OEM) / '-' / null → md.MAIN_MKT 최빈 38코드 1개
    const freq = new Map<string, number>();
    for (const r of mktRows)
      for (const t of this.tokens38(r)) freq.set(t, (freq.get(t) ?? 0) + 1);
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
    const source =
      mk.length === 2 ? `oem:${mk}→md최빈` : top ? 'md최빈' : 'none';
    return { codes: top ? [top[0]] : [], source };
  }

  async resolveTire(mcode: string): Promise<TireAttrs | null> {
    const rows: RawRow[] = await this.dataSource.query(ATTR_SQL, [mcode]);
    if (!rows.length) return null;

    const first = (key: string): string | null => {
      for (const r of rows) {
        const s = this.str(r[key]);
        if (s !== '') return s;
      }
      return null;
    };
    const firstNum = (key: string): number | null => {
      for (const r of rows) {
        const n = this.num(r[key]);
        if (n != null) return n;
      }
      return null;
    };

    const mainMarket = first('MAIN_MARKET');
    const market = this.resolveMarket(
      mainMarket ?? '',
      rows.map((r) => r['MKT2']),
    );
    const segment = [
      ...new Set(
        rows.flatMap((r) =>
          this.str(r['SEGMENT'])
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ),
    ];

    return {
      mcode,
      productLine: first('PRODUCT_LINE') ?? '',
      mainMarket,
      market,
      rimInch: firstNum('RIM_INCH'),
      ss: first('SS'),
      li: firstNum('LI'),
      ply: firstNum('PLY'),
      grvDepth: firstNum('GRV_DEPTH'),
      radialBias: first('RADIAL_BIAS'),
      segment,
      frt: first('FRT'),
      por: first('POR'),
      winter: first('WINTER'),
      tirePosition: first('TIRE_POSITION'),
    };
  }

  // ---- 조건 평가기 ----
  /** 연산자 문자열("<=121", ">12", "<>17.5", "17.5") 평가. 빈 조건=pass, 값없음=unknown. */
  private evalRange(cond: unknown, value: number | null): Verdict {
    const c = this.str(cond);
    if (c === '') return 'pass';
    if (value == null) return 'unknown';
    const m = c.match(/^(<=|>=|<>|!=|<|>|=)?\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) return 'unknown'; // 해석 불가 → 배제하지 않음
    const op = m[1] || '=';
    const n = Number(m[2]);
    switch (op) {
      case '<':
        return value < n ? 'pass' : 'fail';
      case '>':
        return value > n ? 'pass' : 'fail';
      case '<=':
        return value <= n ? 'pass' : 'fail';
      case '>=':
        return value >= n ? 'pass' : 'fail';
      case '<>':
      case '!=':
        return value !== n ? 'pass' : 'fail';
      default:
        return value === n ? 'pass' : 'fail';
    }
  }

  private isOn(v: unknown): boolean {
    const s = this.str(v).toUpperCase();
    return s !== '' && s !== '0' && s !== 'N';
  }

  /** 플래그 조건: template 값이 양성(Y/S)이면 타이어 ON 요구, 'N'이면 OFF 요구. */
  private evalFlag(tmpl: unknown, tireOn: boolean): Verdict {
    const t = this.str(tmpl).toUpperCase();
    if (t === '') return 'pass';
    const wantOn = t !== 'N' && t !== '0';
    return tireOn === wantOn ? 'pass' : 'fail';
  }

  /** CSV 멤버십: 타이어 값이 template 목록에 포함되면 pass. */
  private evalCsvMember(tmplCsv: unknown, tireVal: string | null): Verdict {
    const c = this.str(tmplCsv);
    if (c === '') return 'pass';
    if (!tireVal) return 'unknown';
    const list = c
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return list.includes(tireVal) ? 'pass' : 'fail';
  }

  /**
   * TBR 포지션 매칭. 'A'(All)는 와일드카드:
   *  - template 에 'A' 포함 → 모든 포지션 대상 시험 → pass
   *  - 타이어 포지션이 'A'(전포지션 타이어) → 어떤 요구든 pass
   *  - 그 외엔 멤버십.
   */
  private evalTbrPosition(tmplCsv: unknown, tirePos: string | null): Verdict {
    const c = this.str(tmplCsv);
    if (c === '') return 'pass';
    if (!tirePos) return 'unknown';
    const list = c
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (list.includes('A') || tirePos.toUpperCase() === 'A') return 'pass';
    return list.includes(tirePos.toUpperCase()) ? 'pass' : 'fail';
  }

  /** CSV 교집합: template 목록과 타이어 목록이 겹치면 pass. */
  private evalCsvIntersect(tmplCsv: unknown, tireVals: string[]): Verdict {
    const c = this.str(tmplCsv);
    if (c === '') return 'pass';
    if (!tireVals.length) return 'unknown';
    const list = new Set(
      c
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
    return tireVals.some((v) => list.has(v)) ? 'pass' : 'fail';
  }

  async match(mcode: string): Promise<MatchResult> {
    const tire = await this.resolveTire(mcode);
    if (!tire)
      throw new NotFoundException(
        `mcode '${mcode}' 정보를 찾을 수 없습니다 (활성/마켓정보 확인).`,
      );

    const rows: RawRow[] = await this.dataSource.query(
      `SELECT * FROM ${TABLE_NAME} ORDER BY TMPLT_ID`,
    );

    // 타이어측 플래그 ON 여부
    const tireSsNorm = (tire.ss ?? '').replace(/[()]/g, '') || null;
    const porOn = this.isOn(tire.por);
    const frtOn = this.isOn(tire.frt);
    const snowOn = this.isOn(tire.winter);
    const tireMarketSet = new Set(tire.market.codes);

    const matched: MatchedTest[] = [];

    for (const r of rows) {
      // 0) PRODUCT_LINE (필수 일치)
      if (this.str(r['PRODUCT_LINE']) !== tire.productLine) continue;

      // 1) 마켓: ON 플래그 ∩ 대표마켓. ON 플래그 없으면 wildcard.
      const onMarkets = MARKET_COLS.filter((c) => this.isOn(r[c]));
      let marketHits: string[] = [];
      if (onMarkets.length > 0) {
        marketHits = onMarkets.filter((c) => tireMarketSet.has(c));
        if (marketHits.length === 0) continue;
      }

      // 2) 평가 가능한 나머지 조건 (하나라도 fail이면 제외)
      const checks: Verdict[] = [
        this.evalCsvMember(r['SS'], tireSsNorm),
        this.evalRange(r['RIM_INCH'], tire.rimInch),
        this.evalRange(r['LI'], tire.li),
        this.evalRange(r['PLY_RATING'], tire.ply),
        this.evalRange(r['GRV_DEPTH'], tire.grvDepth),
        this.evalFlag(r['POR'], porOn),
        this.evalFlag(r['FRT'], frtOn),
        this.evalFlag(r['SNOW_MARK'], snowOn),
        this.evalTbrPosition(r['TBR_POSITION'], tire.tirePosition),
        this.evalCsvIntersect(r['TBR_SEGMENT'], tire.segment),
      ];
      if (checks.includes('fail')) continue;

      // 3) 미평가 조건 수집 (값은 있으나 평가 불가) — 행은 포함하되 경고
      const unevaluated: string[] = [];
      // unknown 이 된 평가가능 조건 (예: GRV 값 없음)
      const rangeUnknownCols: [string, Verdict][] = [
        ['SS', checks[0]],
        ['RIM_INCH', checks[1]],
        ['LI', checks[2]],
        ['PLY_RATING', checks[3]],
        ['GRV_DEPTH', checks[4]],
        ['TBR_POSITION', checks[8]],
        ['TBR_SEGMENT', checks[9]],
      ];
      for (const [col, v] of rangeUnknownCols)
        if (v === 'unknown') unevaluated.push(col);
      // 소스 자체가 없는 보류 컬럼
      for (const col of DEFERRED_FILTER_COLS)
        if (this.str(r[col]) !== '') unevaluated.push(col);

      matched.push({
        id: Number(r['TMPLT_ID'] ?? 0),
        productLine: this.str(r['PRODUCT_LINE']),
        testItemName: this.str(r['TEST_ITEM_NAME']),
        testMethod: this.str(r['TEST_MTH_NAME']),
        testCondition: this.str(r['TEST_CDN_NAME']),
        cdnPattern: this.str(r['CDN_PATTERN']),
        endurSvrty: this.str(r['ENDUR_SVRTY']),
        certiTestYn: this.str(r['CERTI_TEST_YN']),
        certiType: this.str(r['CERTI_TYPE']),
        marketHits,
        unevaluated,
      });
    }

    return {
      tire,
      total: rows.length,
      matchedCount: matched.length,
      matched,
    };
  }
}
