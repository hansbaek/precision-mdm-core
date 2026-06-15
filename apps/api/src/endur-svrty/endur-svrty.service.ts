import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const RANK_TABLE = 'DW_ENDUR_SVRTY_RANK';
const MAP_TABLE = 'DW_REGULATION_MARKET_MAP';

/** Speed symbols at or above 'S' — determines the LTR high-speed ranking set. */
const HIGH_SPEED_SYMBOLS = new Set(['S', 'T', 'U', 'H', 'V', 'W', 'Y']);

export interface SuggestCandidate {
  testCdnName: string;
  regulationCode: string;
  marketCode: string;
  rank: number;
  mandatory: boolean;
}

export interface SuggestResult {
  suggested: string | null;
  basis: SuggestCandidate | null;
  candidates: SuggestCandidate[];
  mandatory: { testCdnName: string; regulationCode: string }[];
  category: 'HS' | 'GE' | null;
  speedGrade: 'R_BELOW' | 'S_ABOVE' | null;
  speedGradeAssumed: boolean;
  unmappedMarkets: string[];
  reason?: 'UNSUPPORTED_METHOD' | 'NO_MARKETS' | 'NO_APPLICABLE_REGULATION';
}

export interface CertiTypeSuggestResult {
  /** Distinct regulation codes applicable to the selected markets. */
  suggested: string[];
  /** Per-market breakdown of applicable regulations (for explanation). */
  byMarket: { marketCode: string; regulationCodes: string[] }[];
  /** Selected markets with no regulation mapping. */
  unmappedMarkets: string[];
}

interface RankRow {
  TEST_CDN_NAME: string;
  REGULATION_CODE: string;
  MARKET_CODE: string;
  SVRTY_RANK: number;
  MANDATORY_YN: string;
}

/**
 * Severity suggestion engine v1 over the [별첨11] regulation ranking master.
 * Suggested severity = best (lowest) rank among regulations applicable to the
 * selected markets, for the row's (product line, test category, speed grade).
 */
@Injectable()
export class EndurSvrtyService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async suggest(
    productLine: string,
    markets: string,
    testMethod?: string,
    ss?: string,
  ): Promise<SuggestResult> {
    const empty: SuggestResult = {
      suggested: null,
      basis: null,
      candidates: [],
      mandatory: [],
      category: null,
      speedGrade: null,
      speedGradeAssumed: false,
      unmappedMarkets: [],
    };

    const marketList = (markets ?? '')
      .split(/[,\s]+/)
      .map((m) => m.trim().toUpperCase())
      .filter(Boolean);
    if (marketList.length === 0) return { ...empty, reason: 'NO_MARKETS' };

    const category = this.deriveCategory(testMethod);
    if (!category) return { ...empty, reason: 'UNSUPPORTED_METHOD' };

    const { speedGrade, assumed } = this.deriveSpeedGrade(ss);

    const binds = marketList.map((_, i) => `:${i + 1}`).join(', ');
    const params: unknown[] = [...marketList];
    let idx = marketList.length + 1;
    const plBind = `:${idx++}`;
    const catBind = `:${idx++}`;
    const sgBind = `:${idx++}`;
    params.push(productLine, category, speedGrade);

    const rows: RankRow[] = await this.dataSource.query(
      `SELECT r.TEST_CDN_NAME, r.REGULATION_CODE, m.MARKET_CODE, r.SVRTY_RANK, r.MANDATORY_YN
       FROM ${RANK_TABLE} r
       JOIN ${MAP_TABLE} m ON m.REGULATION_CODE = r.REGULATION_CODE AND m.USE_YN = 'Y'
       WHERE m.MARKET_CODE IN (${binds})
         AND (r.PRODUCT_LINE = ${plBind} OR r.PRODUCT_LINE = 'ALL')
         AND r.TEST_CATEGORY = ${catBind}
         AND (r.SPEED_GRADE_COND = ${sgBind} OR r.SPEED_GRADE_COND = 'ALL')
         AND r.USE_YN = 'Y'
       ORDER BY r.SVRTY_RANK, r.TEST_CDN_NAME`,
      params,
    );

    const mappedMarkets = new Set(rows.map((r) => r.MARKET_CODE));
    const unmappedMarkets = marketList.filter((m) => !mappedMarkets.has(m));

    if (rows.length === 0) {
      return {
        ...empty,
        category,
        speedGrade: category === 'HS' ? speedGrade : null,
        speedGradeAssumed: category === 'HS' ? assumed : false,
        unmappedMarkets,
        reason: 'NO_APPLICABLE_REGULATION',
      };
    }

    const candidates: SuggestCandidate[] = rows.map((r) => ({
      testCdnName: r.TEST_CDN_NAME,
      regulationCode: r.REGULATION_CODE,
      marketCode: r.MARKET_CODE,
      rank: Number(r.SVRTY_RANK),
      mandatory: r.MANDATORY_YN === 'Y',
    }));

    const basis = candidates[0];
    const mandatorySet = new Map<
      string,
      { testCdnName: string; regulationCode: string }
    >();
    for (const c of candidates) {
      if (c.mandatory) {
        mandatorySet.set(`${c.testCdnName}/${c.regulationCode}`, {
          testCdnName: c.testCdnName,
          regulationCode: c.regulationCode,
        });
      }
    }

    return {
      suggested: String(basis.rank),
      basis,
      candidates,
      mandatory: [...mandatorySet.values()],
      category,
      speedGrade: category === 'HS' ? speedGrade : null,
      speedGradeAssumed: category === 'HS' ? assumed : false,
      unmappedMarkets,
    };
  }

  /**
   * Suggest CERTI_TYPE (regulation codes) from the selected markets.
   * CERTI_TYPE values are regulation codes, so the suggestion is simply the set
   * of regulations mapped to the chosen markets via DW_REGULATION_MARKET_MAP.
   */
  async suggestCertiType(markets: string): Promise<CertiTypeSuggestResult> {
    const marketList = (markets ?? '')
      .split(/[,\s]+/)
      .map((m) => m.trim().toUpperCase())
      .filter(Boolean);
    if (marketList.length === 0) {
      return { suggested: [], byMarket: [], unmappedMarkets: [] };
    }

    const binds = marketList.map((_, i) => `:${i + 1}`).join(', ');
    const rows: { MARKET_CODE: string; REGULATION_CODE: string }[] =
      await this.dataSource.query(
        `SELECT MARKET_CODE, REGULATION_CODE FROM ${MAP_TABLE}
         WHERE USE_YN = 'Y' AND MARKET_CODE IN (${binds})
         ORDER BY MARKET_CODE, REGULATION_CODE`,
        marketList,
      );

    const byMarketMap = new Map<string, string[]>();
    const suggestedSet = new Set<string>();
    for (const r of rows) {
      suggestedSet.add(r.REGULATION_CODE);
      const arr = byMarketMap.get(r.MARKET_CODE) ?? [];
      arr.push(r.REGULATION_CODE);
      byMarketMap.set(r.MARKET_CODE, arr);
    }

    const unmappedMarkets = marketList.filter((m) => !byMarketMap.has(m));

    return {
      suggested: [...suggestedSet].sort(),
      byMarket: [...byMarketMap.entries()].map(([marketCode, regulationCodes]) => ({
        marketCode,
        regulationCodes,
      })),
      unmappedMarkets,
    };
  }

  /** Distinct regulation codes — option source for the CERTI_TYPE combo. */
  async findRegulations(): Promise<string[]> {
    const rows: { REGULATION_CODE: string }[] = await this.dataSource.query(
      `SELECT DISTINCT REGULATION_CODE FROM ${MAP_TABLE} WHERE USE_YN = 'Y' ORDER BY REGULATION_CODE`,
    );
    return rows.map((r) => r.REGULATION_CODE);
  }

  async findRanks() {
    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT * FROM ${RANK_TABLE} WHERE USE_YN = 'Y'
       ORDER BY PRODUCT_LINE, TEST_CATEGORY, SPEED_GRADE_COND, SVRTY_RANK, TEST_CDN_NAME`,
    );
    return rows;
  }

  private deriveCategory(testMethod?: string): 'HS' | 'GE' | null {
    if (!testMethod) return null;
    if (testMethod.includes('High Speed')) return 'HS';
    if (testMethod.includes('Load Up')) return 'GE';
    return null;
  }

  private deriveSpeedGrade(ss?: string): {
    speedGrade: 'R_BELOW' | 'S_ABOVE';
    assumed: boolean;
  } {
    const tokens = (ss ?? '')
      .split(/[,\s]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (tokens.length === 0) return { speedGrade: 'R_BELOW', assumed: true };
    const hasHigh = tokens.some((t) => HIGH_SPEED_SYMBOLS.has(t));
    return { speedGrade: hasHigh ? 'S_ABOVE' : 'R_BELOW', assumed: false };
  }
}
