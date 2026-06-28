import { useQuery } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { AlertTriangle, Check, Wand2 } from 'lucide-react';

import FlagToggle from '@/components/FlagToggle';
import MultiCombobox from '@/components/MultiCombobox';
import SearchCombobox from '@/components/SearchCombobox';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { suggestCertiType, suggestEndurSvrty } from '@/api/endur-svrty';
import { ALL_MARKETS } from '@/types';

export default function MarketEditSection({
  selectedMarkets,
  onToggle,
  disabled,
  endurSvrty,
  onEndurSvrtyChange,
  endurSvrtyOptions,
  certiTestYn,
  onCertiTestYnChange,
  certiType,
  onCertiTypeChange,
  regulationOptions,
  productLine,
  testMethod,
  ss,
}: {
  selectedMarkets: Set<string>;
  onToggle: (code: string) => void;
  disabled: boolean;
  endurSvrty: string;
  onEndurSvrtyChange: (value: string) => void;
  endurSvrtyOptions: string[];
  certiTestYn: string;
  onCertiTestYnChange: (value: string) => void;
  certiType: string;
  onCertiTypeChange: (value: string) => void;
  regulationOptions: string[];
  productLine: string;
  testMethod: string;
  ss: string;
}) {
  const marketsStr = ALL_MARKETS.filter((m) => selectedMarkets.has(m)).join(',');
  // 시장 토글은 버스트로 들어오므로 디바운스해 제안 요청을 합친다.
  const [debouncedMarketsStr] = useDebounceValue(marketsStr, 300);

  // ENDUR_SVRTY 제안 — 시장·방법·SS 기반. 입력이 키에 포함돼 값이 비면
  // 새 키로 분리되고 비활성화되어 제안이 자동으로 null이 된다.
  const svrtyQuery = useQuery({
    queryKey: ['suggest-endur-svrty', productLine, debouncedMarketsStr, testMethod, ss],
    queryFn: () =>
      suggestEndurSvrty({
        productLine,
        markets: debouncedMarketsStr,
        testMethod: testMethod || undefined,
        ss: ss || undefined,
      }),
    enabled: !!productLine && !!debouncedMarketsStr,
  });
  const suggestion = svrtyQuery.data ?? null;
  const suggestLoading = svrtyQuery.isFetching;

  // CERTI_TYPE 제안 — 선택 시장에 매핑된 법규 코드
  const certiQuery = useQuery({
    queryKey: ['suggest-certi-type', debouncedMarketsStr],
    queryFn: () => suggestCertiType(debouncedMarketsStr),
    enabled: !!debouncedMarketsStr,
  });
  const certiSuggestion = certiQuery.data ?? null;
  const certiLoading = certiQuery.isFetching;

  const certiSet = new Set(
    certiType
      .split(/,\s*/)
      .map((c) => c.trim())
      .filter(Boolean),
  );
  const certiMissing = certiSuggestion?.suggested.filter((c) => !certiSet.has(c)) ?? [];
  const addCertiCode = (code: string) => {
    if (certiSet.has(code)) return;
    onCertiTypeChange([...certiSet, code].join(','));
  };
  const applyCertiSuggestion = () => {
    if (certiMissing.length === 0) return;
    onCertiTypeChange([...certiSet, ...certiMissing].join(','));
  };

  const reasonText: Record<string, string> = {
    UNSUPPORTED_METHOD: '지원되지 않는 시험 방법 — 고속내구(High Speed)/일반내구(Load Up)만 제안 가능',
    NO_APPLICABLE_REGULATION: '선택한 시장에 적용 가능한 법규 순위가 없습니다',
    NO_MARKETS: '시장을 선택하면 가혹도가 제안됩니다',
  };

  return (
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          3. 시장 적용 정보
        </h3>
        <p className="text-2xs text-secondary mt-1">
          38개 마켓 플래그 컬럼을 클릭하여 적용 여부를 토글합니다. 현재 {selectedMarkets.size}개
          선택
        </p>
      </div>

      {/* 법규/인증 (시장 도출) — 인증여부·인증유형·가혹도는 타겟 시장의 법규에서 도출 */}
      <div className="px-5 py-4 border-b border-border grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              CERTI_TEST_YN
            </label>
            <span className="text-2xs text-muted-foreground/70 truncate">인증 시험 여부 (Y/N)</span>
          </div>
          <FlagToggle
            id="edit-flag-certi-test-yn"
            value={certiTestYn}
            onChange={onCertiTestYnChange}
            disabled={disabled}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              CERTI_TYPE
            </label>
            <span className="text-2xs text-muted-foreground/70 truncate">인증 기관 / 유형</span>
          </div>
          <MultiCombobox
            id="edit-combo-certi-type"
            value={certiType}
            onChange={onCertiTypeChange}
            options={regulationOptions}
            separator=","
            placeholder="인증 유형 선택"
            disabled={disabled}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              ENDUR_SVRTY
            </label>
            <span className="text-2xs text-muted-foreground/70 truncate">내구 가혹도 (1~4)</span>
          </div>
          <SearchCombobox
            id="edit-combo-endur-svrty"
            value={endurSvrty}
            onChange={onEndurSvrtyChange}
            options={endurSvrtyOptions}
            placeholder="가혹도 선택"
            disabled={disabled}
            allowClear
            mono
          />
        </div>
      </div>

      {/* 인증유형 자동 제안 — 선택 시장에 매핑된 법규 코드, 적용은 수동 */}
      <div className="px-5 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2.5 flex-wrap min-h-11">
        {certiLoading ? (
          <span className="flex items-center gap-1.5 text-2xs font-bold text-muted-foreground">
            <Spinner className="h-3 w-3" />
            인증유형 제안 계산 중...
          </span>
        ) : certiSuggestion && certiSuggestion.suggested.length > 0 ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-2xs font-bold text-secondary">
              <Wand2 className="h-3 w-3" />
              CERTI_TYPE 제안:
            </span>
            {certiSuggestion.suggested.map((code) => {
              const has = certiSet.has(code);
              return (
                <button
                  key={code}
                  type="button"
                  disabled={disabled || has}
                  onClick={() => addCertiCode(code)}
                  title={has ? '이미 반영됨' : '클릭하여 추가'}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-2xs font-mono font-bold border transition-colors ${has
                    ? 'bg-success-container text-success border-success/20 cursor-default'
                    : 'bg-card text-info border-info/40 hover:bg-info hover:text-white cursor-pointer disabled:opacity-60'
                    }`}
                >
                  {has && <Check className="h-3 w-3" />}
                  {code}
                </button>
              );
            })}
            {certiMissing.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={disabled}
                onClick={applyCertiSuggestion}
                className="text-2xs font-bold h-6"
              >
                제안 적용 ({certiMissing.length})
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-success">
                <Check className="h-3.5 w-3.5" />
                제안 모두 반영됨
              </span>
            )}
          </>
        ) : (
          <span className="text-2xs font-medium text-muted-foreground/70">
            시장을 선택하면 법규 기반 인증유형이 제안됩니다
          </span>
        )}

        {certiSuggestion && certiSuggestion.unmappedMarkets.length > 0 && (
          <span className="text-2xs text-muted-foreground/70">
            법규 매핑 없는 시장: {certiSuggestion.unmappedMarkets.join(', ')}
          </span>
        )}
      </div>

      {/* 가혹도 자동 제안 — 시장·방법·SS 변경 시 갱신, 적용은 항상 수동 */}
      <div className="px-5 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2.5 flex-wrap min-h-11">
        {suggestLoading ? (
          <span className="flex items-center gap-1.5 text-2xs font-bold text-muted-foreground">
            <Spinner className="h-3 w-3" />
            가혹도 제안 계산 중...
          </span>
        ) : suggestion?.suggested ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-2xs font-bold bg-info-container text-info border border-info/20 rounded-md px-2 py-1">
              <Wand2 className="h-3 w-3" />
              ENDUR_SVRTY 제안: {suggestion.suggested} — {suggestion.basis?.testCdnName} (
              {suggestion.basis?.regulationCode} · {suggestion.basis?.marketCode})
              {suggestion.speedGradeAssumed && ' · 속도등급 R이하 가정'}
            </span>
            {endurSvrty === suggestion.suggested ? (
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-success">
                <Check className="h-3.5 w-3.5" />
                현재값 일치
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={disabled}
                onClick={() => onEndurSvrtyChange(suggestion.suggested!)}
                className="text-2xs font-bold h-6"
              >
                제안 적용
              </Button>
            )}
          </>
        ) : suggestion?.reason ? (
          <span className="text-2xs font-medium text-muted-foreground">
            {reasonText[suggestion.reason] ?? suggestion.reason}
          </span>
        ) : (
          <span className="text-2xs font-medium text-muted-foreground/70">
            시장을 선택하면 법규 기반 가혹도가 제안됩니다
          </span>
        )}

        {suggestion && suggestion.mandatory.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-2xs font-bold bg-warning-container text-warning border border-warning/30 rounded-md px-2 py-1">
            <AlertTriangle className="h-3 w-3" />
            US 포함 — {suggestion.mandatory.map((m) => m.testCdnName).join('/')} 필수 시험
          </span>
        )}
        {suggestion && suggestion.unmappedMarkets.length > 0 && (
          <span className="text-2xs text-muted-foreground/70">
            법규 매핑 없는 시장: {suggestion.unmappedMarkets.join(', ')} (제안에서 제외)
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5">
          {ALL_MARKETS.map((code) => {
            const on = selectedMarkets.has(code);
            return (
              <button
                key={code}
                type="button"
                disabled={disabled}
                aria-pressed={on}
                onClick={() => onToggle(code)}
                className={`px-2 py-1 rounded-md text-2xs font-mono font-bold border transition-colors cursor-pointer disabled:opacity-60 ${on
                  ? 'bg-info text-white border-info'
                  : 'bg-card text-muted-foreground/60 border-border hover:border-info/50 hover:text-info'
                  }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
