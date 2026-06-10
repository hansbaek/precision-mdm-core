import type { StdStats } from '@/types';

interface ReportsPageProps {
  stats: StdStats | null;
}

export default function ReportsPage({ stats }: ReportsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <nav className="text-[10px] text-[#545f72] font-bold uppercase tracking-wider font-mono">
          MDM Home / 보고서 출력
        </nav>
        <h2 className="font-hanken font-bold text-primary text-2xl tracking-tight mt-1">
          Formatted R&D Quality Verification Report
        </h2>
      </div>

      <div className="bg-white border border-border-subtle rounded-sm p-6 max-w-3xl mx-auto space-y-6 shadow-sm">
        <div className="border-b border-border-subtle pb-4 text-center select-none">
          <h4 className="text-sm font-bold tracking-widest text-primary uppercase">
            Hankook Tire & Technology
          </h4>
          <h3 className="text-lg font-bold mt-1 text-primary font-hanken">
            R&D TEST ITEM MASTER DIRECTORY SPEC SHEET
          </h3>
          <div className="flex justify-between text-[10px] text-secondary font-mono mt-4">
            <span>DOCUMENT NO: HK-RDM-2026-05</span>
            <span>LOGISTICS DATE: {new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-gray-700">
          <p className="leading-relaxed">
            본 데이터 위생 문서는 한국타이어 R&D 연구 본부에서 기용 및 관리 중인{' '}
            <strong>일반 승용/전기차/레이싱</strong> 규준의 타이어 시료 시험 제정 항목들에
            대한 일괄 검수 및 표준 규준 명세를 실시간 출력한 것입니다.
          </p>

          <div className="grid grid-cols-3 gap-4 border border-border-subtle divide-x divide-border-subtle p-3 bg-surface-base rounded-sm text-center">
            <div>
              <span className="text-[10px] font-bold text-[#545f72] uppercase">기재 총수</span>
              <p className="text-base font-bold font-mono text-primary mt-1">
                {stats?.total ?? 0} 건
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#545f72] uppercase">제품라인</span>
              <p className="text-base font-bold font-mono text-primary mt-1">
                {stats?.distinctProductLines ?? 0} 종
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#545f72] uppercase">시험방법</span>
              <p className="text-base font-bold font-mono text-emerald-600 mt-1">
                {stats?.distinctTestMethods ?? 0} 종
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              표준 시험 항목 인덱스 (Recent Template Index)
            </span>
            <table className="w-full text-left text-[10px] border border-border-subtle border-collapse">
              <thead className="bg-[#f2f4f6] text-[#545f72] font-bold border-b border-border-subtle">
                <tr>
                  <th className="p-2 border-r border-[#eceef0]">ID</th>
                  <th className="p-2 border-r border-[#eceef0]">제품라인</th>
                  <th className="p-2 border-r border-[#eceef0]">시험항목 / 방법</th>
                  <th className="p-2 border-r border-[#eceef0]">적용 시장</th>
                  <th className="p-2">등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0] font-mono bg-white">
                {(stats?.recent ?? []).map((item) => (
                  <tr key={item.id} className="h-7 text-xs">
                    <td className="p-2 border-r border-[#eceef0] font-bold text-primary">
                      {item.id}
                    </td>
                    <td className="p-2 border-r border-[#eceef0] font-bold text-slate-800">
                      {item.productLine || '–'}
                    </td>
                    <td className="p-2 border-r border-[#eceef0] truncate max-w-[220px]">
                      {item.testItemName}{' '}
                      <span className="text-[10px] text-gray-400">
                        ({item.testMethod || '–'})
                      </span>
                    </td>
                    <td className="p-2 border-r border-[#eceef0] font-bold text-[#1a56db]">
                      {item.markets.length} 개
                    </td>
                    <td className="p-2 text-[10px] text-slate-500">
                      {formatCreatedAt(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-6 border-t border-border-subtle text-center select-none text-xs text-gray-400 flex justify-between items-end font-mono">
          <span>PRINTED OPERATOR: hans.baek@gmail.com</span>
          <div className="flex flex-col items-center">
            <div
              className="h-10 w-10 border border-[#ba1a1a]/30 text-rose-600 font-bold text-[9px] uppercase rounded-full flex items-center justify-center border-dashed animate-pulse"
              style={{ transform: 'rotate(-10deg)' }}
            >
              R&D SEAL
            </div>
            <span className="mt-1 text-[9px]">Hankook Tire HQ Approved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCreatedAt(raw: string) {
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }

  return raw || '–';
}
