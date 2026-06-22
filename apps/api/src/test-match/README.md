# 시험 매칭(test-match) 판정 로직

mcode(타이어) 하나에 대해 `TEMPLATE_STD_TEST_ITEM`의 각 행(표준 시험 항목)이
**적용되는지**를 판정한다. 구현은 [`test-match.service.ts`](./test-match.service.ts)의
`match()`이며, 이 문서는 그 판정 규칙을 정리한다.

## 1. 판정 모델 (Verdict)

각 조건 컬럼은 `pass | fail | unknown` 3값으로 평가된다
([`test-match.service.ts:87`](./test-match.service.ts#L87)).

| Verdict | 의미 | 행 전체에 대한 영향 |
| --- | --- | --- |
| `pass` | 조건 충족 | 통과(추출 이유 `reasons`에 기록) |
| `fail` | 조건 위배 | **행 즉시 제외** — 하나라도 fail이면 탈락 |
| `unknown` | 평가 불가(타이어 값 없음/해석 불가) | 제외하지 않음. **미평가**로만 표시 |

핵심 원칙: **"빈 조건(template 값 없음)은 와일드카드"** 로 간주해 항상 `pass`다.
즉 조건이 비어 있으면 그 컬럼은 매칭을 좁히지 않는다. 또한 `unknown`은 보수적으로
**행을 떨어뜨리지 않는다**(정보 부족으로 배제하지 않음).

행 채택 여부: `specs.some(s => s.verdict === 'fail')` 이면 제외
([`:490`](./test-match.service.ts#L490)). 살아남은 행에서
- `pass` + 비어있지 않은 조건 → `reasons`(추출 이유)
- `unknown` → `unevaluated` + 사유(`타이어 값 없음` 또는 `평가 불가`)
- 빈 조건 → 이유 아님(생략)

## 2. 게이트 (불일치 시 즉시 제외)

조건 평가(3절) 이전에 두 게이트를 먼저 통과해야 한다.

### PRODUCT_LINE — 필수 정확 일치
`row.PRODUCT_LINE !== tire.productLine` 이면 즉시 제외
([`:392`](./test-match.service.ts#L392)). 와일드카드 없음.

### MARKET — 38개 시장 플래그(F1~L8) 교집합
([`:395`](./test-match.service.ts#L395))
- 템플릿 행에서 ON인 시장 플래그 집합 `onMarkets = MARKET_COLS.filter(isOn)`.
- `onMarkets`가 **하나라도 있으면**: 타이어 대표시장과 교집합(`marketHits`)이
  비어 있으면 제외. (적어도 한 시장이 겹쳐야 함)
- `onMarkets`가 **비어 있으면**: 와일드카드 → 전체 적용(시장으로 거르지 않음).

> `isOn(v)`: 문자열로 정규화 후 대문자화하여 `''`/`'0'`/`'N'`이 아니면 ON
> ([`:296`](./test-match.service.ts#L296)).

## 3. 조건 컬럼 × 평가기

게이트를 통과한 행에 대해 아래 13개 컬럼을 평가한다
([`:404`](./test-match.service.ts#L404)). 컬럼별 평가기와 타이어 비교값:

| 컬럼 | 평가기 | 타이어 비교값 |
| --- | --- | --- |
| `SS` | `evalCsvMember` | 사이즈 `tire.ss`에서 괄호 제거(`tireSsNorm`) |
| `RIM_INCH` | `evalRange` | `tire.rimInch` |
| `LI` | `evalRange` | `tire.li` |
| `PLY_RATING` | `evalRange` | `tire.ply` |
| `GRV_DEPTH` | `evalRange` | `tire.grvDepth` |
| `POR` | `evalFlag` | `tire.por`(ON 여부) |
| `FRT` | `evalFlag` | `tire.frt`(ON 여부) |
| `SNOW_MARK` | `evalFlag` | `tire.winter`(ON 여부) |
| `TBR_POSITION` | `evalTbrPosition` | `tire.tirePosition` |
| `TBR_SEGMENT` | `evalCsvIntersect` | `tire.segment[]` |
| `TL_INDICATOR` | `evalCsvMember` | `tire.tlIndicator` |
| `RADIAL_BIAS` | `evalCsvMember` | `tire.radialBias` |
| `SIZE_SMPL` | `evalCsvMember` | `tire.sizeSmpl`(DW_SPEC_PLM_TIRE) |

### evalRange — 숫자 연산자 비교
([`:254`](./test-match.service.ts#L254))
- 조건 문자열을 `^(<=|>=|<>|!=|<|>|=)?\s*(-?\d+(\.\d+)?)$` 로 해석.
- 연산자 생략 시 `=`(정확 일치)로 본다. `<>`/`!=`는 부등(같지 않음).
- 빈 조건 → `pass`. 타이어 값 `null` → `unknown`. 해석 불가(정규식 불일치)
  → `unknown`(배제하지 않음).
- 예: 조건 `"<=121"`, 타이어 `118` → `118 <= 121` → `pass`. 조건 `"17.5"`,
  타이어 `16` → `16 === 17.5` 아님 → `fail`.

### evalFlag — 양성/음성 플래그
([`:302`](./test-match.service.ts#L302))
- 조건 값 대문자화. 빈 값 → `pass`.
- `wantOn = (조건 !== 'N' && 조건 !== '0')` — 즉 `Y`/`S` 등 양성이면 타이어 ON을,
  `N`/`0`이면 타이어 OFF를 요구.
- 타이어 ON 여부와 요구가 같으면 `pass`, 다르면 `fail`.
- 타이어 ON 여부는 `isOn(tire.por)` 등으로 사전 계산.

### evalCsvMember — CSV 멤버십
([`:310`](./test-match.service.ts#L310))
- 조건을 `[,\s]+`로 분할한 목록에 **타이어 값이 그대로 포함**되면 `pass`.
- 빈 조건 → `pass`. 타이어 값 없음(falsy) → `unknown`.
- **대소문자 구분**(정규화 없이 `includes`) — `evalTbrPosition`과 다른 점.
- 예: 조건 `"R,RF"`, 타이어 `"RF"` → `pass`.

### evalTbrPosition — TBR 포지션('A'=전포지션 와일드카드)
([`:327`](./test-match.service.ts#L327))
- 조건/타이어 모두 대문자화.
- 조건 목록에 `'A'` 포함 → 모든 포지션 대상 → `pass`.
- 타이어 포지션이 `'A'`(전포지션 타이어) → 어떤 요구든 `pass`.
- 그 외엔 멤버십(대문자 비교). 빈 조건 → `pass`, 타이어 값 없음 → `unknown`.

### evalCsvIntersect — CSV 교집합
([`:340`](./test-match.service.ts#L340))
- 조건 목록과 타이어 값 목록(`segment[]`)이 **하나라도 겹치면** `pass`.
- 빈 조건 → `pass`. 타이어 목록이 비어 있으면 → `unknown`. 대소문자 구분.

## 4. 보류 컬럼 (DEFERRED_FILTER_COLS)

`TEMP_TIRE` · `UTQG` · `NEW_SIZE_YN` · `TBR_GRV_3`
([`test-match.constants.ts:110`](./test-match.constants.ts#L110))

타이어측 소스가 아직 연결되지 않아 **매칭 판정에서 제외**된다. 템플릿 행에 값이
있으면 `fail`/`pass`로 평가하지 않고 **미평가(`소스 미연결(보류)`)** 로만 노출한다
([`:531`](./test-match.service.ts#L531)). 즉 이 컬럼들은 현재 행을 떨어뜨리지도,
추출 이유가 되지도 않는다.

## 5. 조건 표시(CDN_PATTERN) 전개

매칭과 별개로, 화면 표시용 조건 문자열은 `CDN_PATTERN`의 치환자를 타이어 값으로
펼쳐 만든다([`expandPattern`, :285](./test-match.service.ts#L285)):
`{SS}`→`tire.ss`, `{RADIAL_BIAS}`→`tire.radialBias`, `{POR}`→`tire.por`.
값이 없는 치환자는 원본 토큰(`{RADIAL_BIAS}` 등)을 그대로 남겨 미전개임을 드러낸다.

> 주의: 표시 전개는 **원본 `tire.ss`**(괄호 표기 `(Y)` 등 포함)를 쓰고, 매칭의
> `SS` 비교는 괄호를 제거한 `tireSsNorm`을 쓴다 — 의도된 구분이다.

## 한눈 요약

```
행 채택 = PRODUCT_LINE 일치
        ∧ (MARKET 와일드카드 ∨ 시장 교집합 있음)
        ∧ 13개 조건 중 fail 없음           // 빈 조건/unknown 은 통과
보류 컬럼(4개) = 평가하지 않고 '미평가'로만 표시
```
