import { X } from 'lucide-react';
import type { MarketCode, StdTestItem } from '../types';

type DetailField = {
  column: string;
  label: string;
  value: string | number;
  mono?: boolean;
  wide?: boolean;
  badge?: boolean;
};

type DetailGroup = {
  title: string;
  description: string;
  fields: DetailField[];
};

const MARKET_GROUPS: { title: string; codes: MarketCode[] }[] = [
  { title: 'F Group', codes: ['F1', 'F2', 'F3'] },
  { title: 'A Group', codes: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9'] },
  { title: 'N Group', codes: ['N1', 'N2', 'N3'] },
  { title: 'E Group', codes: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'] },
  { title: 'K Group', codes: ['K1'] },
  { title: 'M Group', codes: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'] },
  { title: 'NA Group', codes: ['NA'] },
  { title: 'L Group', codes: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'] },
];

interface Props {
  isOpen: boolean;
  item: StdTestItem | null;
  onClose: () => void;
  onEdit: (item: StdTestItem) => void;
}

export default function StdTestItemDetailModal({ isOpen, item, onClose, onEdit }: Props) {
  if (!isOpen || !item) return null;

  const groups = buildDetailGroups(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-6xl rounded-sm shadow-2xl border border-border-subtle flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-primary/5">
          <div>
            <p className="text-[10px] text-secondary font-mono uppercase tracking-widest">
              상세 보기 / Detail View · TEMPLATE_STD_TEST_ITEM
            </p>
            <h2 className="text-base font-extrabold text-primary font-hanken mt-0.5">
              STD Test Item #{item.id} · {item.productLine || '–'} · {item.testItemName || '–'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5 flex-1 bg-[#f7f9fb]">
          {groups.map((group) => (
            <DetailSection key={group.title} group={group} />
          ))}

          <MarketSection item={item} />
        </div>

        <div className="px-6 py-4 border-t border-border-subtle flex justify-between gap-2 bg-slate-50">
          <p className="text-[10px] text-slate-400 font-mono self-center">
            전체 66개 컬럼 기준 그룹 표시 · 읽기 전용: TMPLT_ID, CREATED_AT, CREATED_BY
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-border-subtle rounded-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              닫기
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-sm transition-colors cursor-pointer"
            >
              수정 (Edit)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildDetailGroups(item: StdTestItem): DetailGroup[] {
  return [
    {
      title: '1. 기본 식별 정보',
      description: '템플릿 레코드의 고유 식별자와 제품 라인 기준입니다.',
      fields: [
        { column: 'TMPLT_ID', label: '템플릿 ID (PK)', value: item.id, mono: true },
        { column: 'PRODUCT_LINE', label: '제품 라인 (PCR/LTR/TBR)', value: item.productLine, mono: true },
      ],
    },
    {
      title: '2. 시험 항목 정의',
      description: '시험 템플릿의 핵심 항목, 방법, 조건, 내구 가혹도입니다.',
      fields: [
        { column: 'TEST_ITEM_NAME', label: '시험 항목명', value: item.testItemName, wide: true },
        { column: 'TEST_MTH_NAME', label: '시험 방법명', value: item.testMethod },
        { column: 'TEST_CDN_NAME', label: '시험 조건명', value: item.testCondition },
        { column: 'ENDUR_SVRTY', label: '내구 가혹도', value: item.endurSvrty, mono: true },
      ],
    },
    {
      title: '3. 인증 / 특수 시험 속성',
      description: '인증 여부와 특수 시험/타이어 속성 플래그입니다.',
      fields: [
        { column: 'CERTI_TTM', label: '인증 여부 (Y/N)', value: item.certiTtm, badge: true },
        { column: 'CERTI_TYPE', label: '인증 기관 / 유형', value: item.certiType },
        { column: 'TEMP_TIRE', label: '임시타이어 여부', value: item.tempTire, badge: true },
        { column: 'SNOW_MARK', label: '스노우 마크 여부', value: item.snowMark, badge: true },
        { column: 'FRT', label: 'Free Rolling Tire 여부', value: item.frt, badge: true },
        { column: 'UTQG', label: 'UTQG 여부', value: item.utqg, badge: true },
        { column: 'POR', label: 'Professional Off Road Tire 여부', value: item.por, badge: true },
      ],
    },
    {
      title: '4. 타이어 구조 / 기본 스펙 조건',
      description: '구조, 림, 그루브, 속도/하중 조건 등 시험 적용 조건입니다.',
      fields: [
        { column: 'RADIAL_BIAS', label: '레이디얼/바이어스 구분', value: item.radialBias },
        { column: 'RIM_INCH', label: '림 인치 조건', value: item.rimInch, mono: true },
        { column: 'GRV_DEPTH', label: '그루브 깊이 조건', value: item.grvDepth, mono: true },
        { column: 'SS', label: '속도 기호 목록', value: item.ss, mono: true, wide: true },
        { column: 'LI', label: '하중 지수 조건', value: item.li, mono: true },
        { column: 'PLY_RATING', label: '플라이 레이팅', value: item.plyRating, mono: true },
        { column: 'TL_INDICATOR', label: 'TL 지시자', value: item.tlIndicator, badge: true },
      ],
    },
    {
      title: '5. TBR 전용 조건',
      description: 'TBR 제품군에 특화된 포지션, 그루브, 세그먼트, 바코드 조건입니다.',
      fields: [
        { column: 'TBR_POSITION', label: 'TBR 포지션', value: item.tbrPosition },
        { column: 'TBR_GRV_3', label: 'TBR 3번 그루브 여부', value: item.tbrGrv3 },
        { column: 'TBR_SEGMENT', label: 'TBR 세그먼트', value: item.tbrSegment },
        {
          column: 'TBR_ITEM_CNT_PER_BARCODE',
          label: 'TBR 바코드당 시험 항목 수',
          value: item.tbrItemCntPerBarcode,
          mono: true,
        },
      ],
    },
    {
      title: '6. 사이즈 / 샘플 조건',
      description: '신규 사이즈 여부와 특정 사이즈 샘플 지정 조건입니다.',
      fields: [
        { column: 'NEW_SIZE_YN', label: '신규 사이즈 여부', value: item.newSizeYn, badge: true },
        { column: 'SIZE_SMPL', label: '특정 사이즈 샘플 지정', value: item.sizeSmpl, mono: true, wide: true },
      ],
    },
    {
      title: '8. 등록 정보',
      description: '생성 이력 정보이며 기본적으로 읽기 전용으로 관리합니다.',
      fields: [
        { column: 'CREATED_AT', label: '생성일 (YYYYMMDD)', value: formatDate(item.createdAt), mono: true },
        { column: 'CREATED_BY', label: '생성자 사번', value: item.createdBy, mono: true },
      ],
    },
  ];
}

function DetailSection({ group }: { group: DetailGroup }) {
  return (
    <section className="bg-white border border-border-subtle rounded-sm shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border-subtle bg-white">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          {group.title}
        </h3>
        <p className="text-[10px] text-secondary mt-1">{group.description}</p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {group.fields.map((field) => (
          <Field key={field.column} field={field} />
        ))}
      </div>
    </section>
  );
}

function Field({ field }: { field: DetailField }) {
  const value = formatValue(field.value);

  return (
    <div className={`space-y-1 min-w-0 ${field.wide ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
          {field.column}
        </label>
        <span className="text-[9px] text-slate-400 truncate">{field.label}</span>
      </div>
      {field.badge ? (
        <FlagBadge value={value} />
      ) : (
        <p
          className={`text-sm font-semibold text-slate-800 break-words rounded-sm bg-slate-50 border border-slate-100 px-3 py-2 min-h-9 ${
            field.mono ? 'font-mono' : ''
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function FlagBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const active = normalized === 'Y' || normalized === '1' || normalized === 'TRUE';

  if (value === '–') {
    return (
      <span className="inline-flex items-center min-h-9 px-3 py-2 rounded-sm border border-slate-100 bg-slate-50 text-sm font-semibold text-slate-400">
        –
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center min-h-9 px-3 py-2 rounded-sm border text-sm font-bold font-mono ${
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-50 text-slate-600 border-slate-100'
      }`}
    >
      {value}
    </span>
  );
}

function MarketSection({ item }: { item: StdTestItem }) {
  const activeSet = new Set(item.markets);

  return (
    <section className="bg-white border border-border-subtle rounded-sm shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border-subtle bg-white">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          7. 시장 적용 정보
        </h3>
        <p className="text-[10px] text-secondary mt-1">
          F/A/N/E/K/M/NA/L 그룹별 38개 마켓 플래그 컬럼입니다. 적용 {item.markets.length}개 /
          전체 38개
        </p>
      </div>
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MARKET_GROUPS.map((group) => (
          <div key={group.title} className="border border-border-subtle rounded-sm bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-extrabold text-primary uppercase tracking-widest">
                {group.title}
              </h4>
              <span className="text-[10px] font-mono font-bold text-secondary">
                {group.codes.filter((code) => activeSet.has(code)).length}/{group.codes.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.codes.map((code) => {
                const rawValue = item.marketFlags?.[code] || '';
                const on = activeSet.has(code);
                return (
                  <span
                    key={code}
                    title={`${code}: ${rawValue || 'NULL'}`}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-mono font-bold border ${
                      on
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-300 border-slate-200'
                    }`}
                  >
                    <span>{code}</span>
                    <span className={on ? 'text-blue-100' : 'text-slate-300'}>
                      {rawValue || '–'}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDate(raw: string): string {
  if (raw && /^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return raw || '–';
}

function formatValue(value: string | number): string {
  const text = String(value ?? '').trim();
  return text || '–';
}
