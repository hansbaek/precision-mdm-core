import type { StdTestItem } from '@/types';

/**
 * 시험항목 기준정보 편집 가능 필드 → 표시 라벨.
 * 승인 검토 화면에서 변경 내용을 사람이 읽을 수 있게 보여주는 데 쓴다.
 * (키 순서가 곧 표시 순서)
 */
export const STD_FIELD_LABELS: Record<string, string> = {
  productLine: '제품 라인',
  testItemName: '시험 항목명',
  testMethod: '시험 방법명',
  testCondition: '시험 조건명',
  cdnPattern: '조건명 패턴',
  endurSvrty: '내구 심각도',
  certiTestYn: '인증시험 여부',
  certiType: '인증 유형',
  tempTire: '스페어(임시)타이어',
  snowMark: '스노우 마크',
  frt: 'Free Rolling Tire',
  utqg: 'UTQG',
  por: 'Professional Off Road',
  radialBias: '레이디얼/바이어스',
  rimInch: '림 인치',
  grvDepth: '그루브 깊이',
  ss: '속도 기호',
  li: '하중 지수',
  plyRating: '플라이 레이팅',
  tlIndicator: 'TL 지시자',
  tbrPosition: 'TBR 포지션',
  tbrGrv3: 'TBR 3번 그루브',
  tbrSegment: 'TBR 세그먼트',
  tbrItemCntPerBarcode: 'TBR 바코드당 항목수',
  newSizeYn: '신규 사이즈 여부',
  sizeSmpl: '사이즈 샘플',
  markets: '적용 시장',
};

/** payload/현재값에서 한 필드를 문자열로 정규화. markets 배열은 콤마 문자열로. */
function asText(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join(',');
  return String(value);
}

export interface FieldChange {
  key: string;
  label: string;
  before: string;
  after: string;
}

/** payload의 키 중 라벨이 정의된 것만, 정의된 순서대로 순회. */
function labeledKeys(payload: Record<string, unknown>): string[] {
  return Object.keys(STD_FIELD_LABELS).filter((k) => k in payload);
}

/** CREATE: 비어있지 않은 제안 값 목록. */
export function createdValues(payload: Record<string, unknown>): FieldChange[] {
  return labeledKeys(payload)
    .map((key) => ({
      key,
      label: STD_FIELD_LABELS[key],
      before: '',
      after: asText(payload[key]),
    }))
    .filter((c) => c.after !== '');
}

/** UPDATE: 현재값과 제안값이 다른 필드만. */
export function diffValues(
  current: StdTestItem,
  payload: Record<string, unknown>,
): FieldChange[] {
  const cur = current as unknown as Record<string, unknown>;
  return labeledKeys(payload)
    .map((key) => ({
      key,
      label: STD_FIELD_LABELS[key],
      before: asText(cur[key]),
      after: asText(payload[key]),
    }))
    .filter((c) => c.before !== c.after);
}
