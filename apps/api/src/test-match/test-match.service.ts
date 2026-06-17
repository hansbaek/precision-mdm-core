import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { MARKET_COLS, TABLE_NAME } from '../template/template.constants';
import {
  CODE_TO_GROUP,
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
  tireSize: string | null;
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
  tlIndicator: string | null;
}

/** 추출 이유 — 충족된 조건 1건 (PRODUCT_LINE/MARKET + 템플릿 값이 있는 조건들). */
export interface ConditionReason {
  col: string;
  templateValue: string;
  tireValue: string;
}

/** 미평가 조건 1건 (값은 있으나 평가 불가) + 사유. */
export interface UnevaluatedDetail {
  col: string;
  templateValue: string;
  reason: string;
}

export interface MatchedTest {
  id: number;
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  cdnPattern: string;
  /** CDN_PATTERN의 치환자({SS}/{RADIAL_BIAS}/{POR})를 타이어 실제 값으로 펼친 조건명. */
  expandedCondition: string;
  endurSvrty: string;
  certiTestYn: string;
  certiType: string;
  /** 매칭에 기여한 마켓 코드(교집합). */
  marketHits: string[];
  /** 값이 있으나 현재 평가 불가했던 조건 컬럼 (사용자 검토 필요). */
  unevaluated: string[];
  /** 추출 이유 — 충족된 조건 목록 (보고서용). */
  reasons: ConditionReason[];
  /** 미평가 조건 상세 + 사유 (보고서용). */
  unevaluatedDetail: UnevaluatedDetail[];
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
  CASE 
	  WHEN md.TIRE_SIZE  IS NULL  THEN m.SIZE_DESCRIPTION
	  ELSE md.TIRE_SIZE 
  END Tiresize,
  m.INCH/100 rim_inch, m.LOAD_INDEX_SINGLE li, m.PLY_RATING ply, m.TIRE_POSITION tire_position, m.TL tl,
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
  constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

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
    // 2자리(OEM) / '-' / null → md.MAIN_MKT 를 지역 그룹 단위로 집계.
    // 가장 많은 그룹을 대표마켓으로 삼고, 그 그룹의 (실제 존재하는) 코드 셋을 반환.
    // 예: "NA,E1~E6" → EU 6개 > NA 1개 → 대표 = E1~E6.
    const codes: string[] = [];
    for (const r of mktRows) for (const t of this.tokens38(r)) codes.push(t);
    if (!codes.length) {
      return { codes: [], source: mk.length === 2 ? `oem:${mk}→마켓없음` : 'none' };
    }
    const groupCount = new Map<string, number>();
    for (const c of codes) {
      const g = CODE_TO_GROUP[c];
      if (g) groupCount.set(g, (groupCount.get(g) ?? 0) + 1);
    }
    const topGroup = [...groupCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const groupCodes = [...new Set(codes.filter((c) => CODE_TO_GROUP[c] === topGroup))];
    const source = mk.length === 2 ? `oem:${mk}→md그룹:${topGroup}` : `md그룹:${topGroup}`;
    return { codes: groupCodes, source };
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
      tireSize: first('TIRESIZE'),
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
      tlIndicator: first('TL'),
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

  /**
   * CDN_PATTERN 치환자를 타이어 값으로 펼친다.
   *   {SS}→tire.ss, {RADIAL_BIAS}→tire.radialBias, {POR}→tire.por.
   * 값이 없는 치환자는 원본 토큰을 그대로 남겨(예: {RADIAL_BIAS}) 미전개임을 드러낸다.
   * 패턴이 비어 있으면 빈 문자열을 반환(표시는 TEST_CDN_NAME으로 폴백).
   */
  private expandPattern(
    pattern: string,
    vals: { ss: string | null; radialBias: string | null; por: string | null },
  ): string {
    if (!pattern) return '';
    return pattern
      .replace(/\{SS\}/g, vals.ss || '{SS}')
      .replace(/\{RADIAL_BIAS\}/g, vals.radialBias || '{RADIAL_BIAS}')
      .replace(/\{POR\}/g, vals.por || '{POR}');
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

  /**
   * resolveTire가 null일 때 원인을 구분해 안내 메시지를 만든다.
   *  - V_MCODE_INFO_4_HINT에 없음 → 미존재
   *  - 있으나 활성 행 없음(ACTIVE_YN<>'Y') → 비활성(단종)
   *  - 그 외 → 속성 도출 불가
   */
  private async explainMissing(mcode: string): Promise<string> {
    const rows: RawRow[] = await this.dataSource.query(
      `SELECT ACTIVE_YN FROM V_MCODE_INFO_4_HINT WHERE MCODE = :1`,
      [mcode],
    );
    if (!rows.length) return `존재하지 않는 mcode입니다: '${mcode}'`;
    const hasActive = rows.some(
      (r) => this.str(r['ACTIVE_YN']).toUpperCase() === 'Y',
    );
    if (!hasActive)
      return `비활성(단종) 제품입니다: '${mcode}' — 활성 제품(ACTIVE_YN=Y)만 조회됩니다.`;
    return `mcode '${mcode}'의 속성을 도출할 수 없습니다 (마켓 정보 확인).`;
  }

  async match(mcode: string): Promise<MatchResult> {
    const tire = await this.resolveTire(mcode);
    if (!tire) throw new NotFoundException(await this.explainMissing(mcode));

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

      // 2) 평가 가능한 조건 명세 (컬럼 / template값 / 타이어값 / 판정)
      const num = (n: number | null) => (n == null ? '' : String(n));
      const specs: {
        col: string;
        tmpl: string;
        tireVal: string;
        verdict: Verdict;
      }[] = [
        { col: 'SS', tmpl: this.str(r['SS']), tireVal: tireSsNorm ?? '', verdict: this.evalCsvMember(r['SS'], tireSsNorm) },
        { col: 'RIM_INCH', tmpl: this.str(r['RIM_INCH']), tireVal: num(tire.rimInch), verdict: this.evalRange(r['RIM_INCH'], tire.rimInch) },
        { col: 'LI', tmpl: this.str(r['LI']), tireVal: num(tire.li), verdict: this.evalRange(r['LI'], tire.li) },
        { col: 'PLY_RATING', tmpl: this.str(r['PLY_RATING']), tireVal: num(tire.ply), verdict: this.evalRange(r['PLY_RATING'], tire.ply) },
        { col: 'GRV_DEPTH', tmpl: this.str(r['GRV_DEPTH']), tireVal: num(tire.grvDepth), verdict: this.evalRange(r['GRV_DEPTH'], tire.grvDepth) },
        { col: 'POR', tmpl: this.str(r['POR']), tireVal: tire.por ?? '', verdict: this.evalFlag(r['POR'], porOn) },
        { col: 'FRT', tmpl: this.str(r['FRT']), tireVal: tire.frt ?? '', verdict: this.evalFlag(r['FRT'], frtOn) },
        { col: 'SNOW_MARK', tmpl: this.str(r['SNOW_MARK']), tireVal: tire.winter ?? '', verdict: this.evalFlag(r['SNOW_MARK'], snowOn) },
        { col: 'TBR_POSITION', tmpl: this.str(r['TBR_POSITION']), tireVal: tire.tirePosition ?? '', verdict: this.evalTbrPosition(r['TBR_POSITION'], tire.tirePosition) },
        { col: 'TBR_SEGMENT', tmpl: this.str(r['TBR_SEGMENT']), tireVal: tire.segment.join(','), verdict: this.evalCsvIntersect(r['TBR_SEGMENT'], tire.segment) },
        { col: 'TL_INDICATOR', tmpl: this.str(r['TL_INDICATOR']), tireVal: tire.tlIndicator ?? '', verdict: this.evalCsvMember(r['TL_INDICATOR'], tire.tlIndicator) },
        { col: 'RADIAL_BIAS', tmpl: this.str(r['RADIAL_BIAS']), tireVal: tire.radialBias ?? '', verdict: this.evalCsvMember(r['RADIAL_BIAS'], tire.radialBias) },
      ];
      if (specs.some((s) => s.verdict === 'fail')) continue;

      // 3) 추출 이유 + 미평가 상세 구성
      const reasons: ConditionReason[] = [
        { col: 'PRODUCT_LINE', templateValue: this.str(r['PRODUCT_LINE']), tireValue: tire.productLine },
        onMarkets.length > 0
          ? { col: 'MARKET', templateValue: onMarkets.join(','), tireValue: marketHits.join(',') }
          : { col: 'MARKET', templateValue: '(지정 없음)', tireValue: '전체 적용' },
      ];
      const unevaluated: string[] = [];
      const unevaluatedDetail: UnevaluatedDetail[] = [];
      for (const s of specs) {
        if (s.tmpl === '') continue; // 빈 조건=wildcard → 이유 아님
        if (s.verdict === 'pass') {
          reasons.push({ col: s.col, templateValue: s.tmpl, tireValue: s.tireVal });
        } else if (s.verdict === 'unknown') {
          unevaluated.push(s.col);
          unevaluatedDetail.push({
            col: s.col,
            templateValue: s.tmpl,
            reason: s.tireVal === '' ? '타이어 값 없음' : '평가 불가',
          });
        }
      }
      // 소스 자체가 없는 보류 컬럼
      for (const col of DEFERRED_FILTER_COLS) {
        const tmpl = this.str(r[col]);
        if (tmpl === '') continue;
        unevaluated.push(col);
        unevaluatedDetail.push({
          col,
          templateValue: tmpl,
          reason:
            col === 'SIZE_SMPL' ? '샘플 지정(필터 아님)' : '소스 미연결(보류)',
        });
      }

      matched.push({
        id: Number(r['TMPLT_ID'] ?? 0),
        productLine: this.str(r['PRODUCT_LINE']),
        testItemName: this.str(r['TEST_ITEM_NAME']),
        testMethod: this.str(r['TEST_MTH_NAME']),
        testCondition: this.str(r['TEST_CDN_NAME']),
        cdnPattern: this.str(r['CDN_PATTERN']),
        // 전개는 원본 ss(괄호 표기 '(Y)' 등)를 그대로 사용 — 매칭용 tireSsNorm(괄호 제거)와 구분.
        expandedCondition: this.expandPattern(this.str(r['CDN_PATTERN']), {
          ss: tire.ss,
          radialBias: tire.radialBias,
          por: tire.por,
        }),
        endurSvrty: this.str(r['ENDUR_SVRTY']),
        certiTestYn: this.str(r['CERTI_TEST_YN']),
        certiType: this.str(r['CERTI_TYPE']),
        marketHits,
        unevaluated,
        reasons,
        unevaluatedDetail,
      });
    }

    return {
      tire,
      total: rows.length,
      matchedCount: matched.length,
      matched,
    };
  }

  /** 추출 이유 1건을 사람이 읽는 한 줄로. */
  private reasonText(r: ConditionReason): string {
    if (r.col === 'PRODUCT_LINE' || r.col === 'MARKET') return `${r.col}:${r.tireValue}`;
    return `${r.col} ${r.tireValue}⟵${r.templateValue}`;
  }

  /** 필요시험 매칭 결과를 xlsx로 출력 (보고서 Excel 내보내기). */
  async buildReportXlsx(mcode: string): Promise<Buffer> {
    const result = await this.match(mcode); // 404는 그대로 전파
    const t = result.tire;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('필요시험');

    ws.addRow(['MCODE', t.mcode]);
    ws.addRow(['제품라인', t.productLine]);
    ws.addRow(['대표마켓', t.market.codes.join(', ')]);
    ws.addRow(['사이즈', t.tireSize ?? '']);
    ws.addRow(['SS / LI / PLY', `${t.ss ?? ''} / ${t.li ?? ''} / ${t.ply ?? ''}`]);
    ws.addRow(['매칭', `${result.matchedCount} / ${result.total}`]);
    ws.addRow([]);

    const header = [
      'ID', '시험항목', '시험방법', '조건', '가혹도', '인증', '적용마켓', '추출이유', '미평가',
    ];
    const headerRow = ws.addRow(header);
    headerRow.font = { bold: true };

    for (const m of result.matched) {
      ws.addRow([
        m.id,
        m.testItemName,
        m.testMethod,
        m.expandedCondition || m.testCondition,
        m.endurSvrty,
        m.certiType,
        m.marketHits.join(','),
        m.reasons.map((r) => this.reasonText(r)).join(' / '),
        m.unevaluatedDetail.map((u) => `${u.col}(${u.reason})`).join(', '),
      ]);
    }

    const widths = [8, 22, 28, 18, 8, 14, 18, 56, 30];
    ws.columns.forEach((c, i) => {
      c.width = widths[i] ?? 14;
    });

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
