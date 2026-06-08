/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Calendar, User, FileText, Bookmark, Info, Key, Check } from 'lucide-react';
import { PRODUCT_LINES } from '../types';
import type { TestItem, AuditLog } from '../types';

interface TestItemDetailModalProps {
  isOpen: boolean;
  item: TestItem | null;
  onClose: () => void;
  auditLogs: AuditLog[];
}

export default function TestItemDetailModal({ isOpen, item, onClose, auditLogs }: TestItemDetailModalProps) {
  if (!isOpen || !item) return null;

  // Filter logs associated with this particular test item
  const itemLogs = auditLogs.filter(log => log.itemId === item.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in font-noto text-slate-700">
      <div className="bg-white rounded-lg w-full max-w-xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header toolbar */}
        <div className="bg-slate-50 border-b border-border-subtle py-4 px-6 text-slate-800 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] bg-primary text-white font-mono px-2.5 py-0.5 rounded-sm uppercase tracking-wider font-extrabold">
              {item.id}
            </span>
            <h3 className="font-hanken font-extrabold text-primary text-sm tracking-tight pt-0.5">
              R&D Master Specification
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-primary transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable specs frame */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          
          {/* Main Titles Area */}
          <div className="border-b border-border-subtle pb-3.5 select-none">
            <span className="text-[9px] text-slate-400 font-extrabold block tracking-wider uppercase">TEST ITEM CATEGORY & NAME</span>
            <h4 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              {item.nameKr}
              <span className={`text-[9px] border px-2.5 py-0.5 rounded-sm font-extrabold uppercase ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </h4>
            <p className="text-slate-400 font-mono text-[10px] mt-0.5 font-bold">({item.nameEn})</p>
          </div>

          {/* Specs Metas Bento Section */}
          <div className="grid grid-cols-2 gap-4 select-none">
            
            {/* Category */}
            <div className="bg-surface-base p-3 border border-border-subtle rounded-sm">
              <span className="text-[9px] text-slate-400 font-extrabold flex items-center gap-1">
                <Bookmark className="h-3.5 w-3.5 text-slate-400" />
                시험 분류 (Category)
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">{item.category}</p>
            </div>

            {/* Specification Standard */}
            <div className="bg-surface-base p-3 border border-border-subtle rounded-sm">
              <span className="text-[9px] text-slate-400 font-extrabold flex items-center gap-1 font-mono">
                <Key className="h-3.5 w-3.5 text-slate-400" />
                표준 제정 규격 (Specification)
              </span>
              <p className="text-xs font-bold text-slate-800 font-mono mt-1">{item.specification}</p>
            </div>

            {/* Physical Unit */}
            <div className="bg-surface-base p-3 border border-border-subtle rounded-sm">
              <span className="text-[9px] text-slate-400 font-extrabold flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                적용 단위 (Physical Unit)
              </span>
              <p className="text-xs font-bold text-slate-800 font-mono mt-1">{item.unit}</p>
            </div>

            {/* Mandatory Rating Status */}
            <div className="bg-surface-base p-3 border border-border-subtle rounded-sm">
              <span className="text-[9px] text-slate-400 font-extrabold flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                의무적 평가 여부
              </span>
              <p className="text-xs mt-1">
                <span className={`inline-block px-2.5 py-0.5 text-[9px] font-mono font-extrabold rounded-sm ${
                  item.mandatory === 'REQUIRED' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {item.mandatory}
                </span>
              </p>
            </div>

          </div>

          {/* Description Block */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">기준 등록 사유 및 개요 (Description)</span>
            <div className="bg-surface-base px-4 py-3 border border-border-subtle rounded-sm text-xs text-slate-600 leading-relaxed font-semibold">
              {item.description}
            </div>
          </div>

          {/* Mapped Multi-Product Lines tags */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">적용 대상 제품군 (Mapped Product Lines)</span>
            <div className="flex flex-wrap gap-1.5 matches-box">
              {item.productLines.map(plCode => {
                const verbose = PRODUCT_LINES.find(p => p.value === plCode)?.label || plCode;
                return (
                  <span 
                    key={plCode} 
                    className="bg-accent/5 text-slate-700 border border-accent/20 text-[10px] px-3 py-1 rounded-sm font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Check className="h-3 w-3 text-accent" />
                    {verbose}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Audit Logs Trail History Section */}
          <div className="space-y-2.5">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">데이터 감사 이력 (Audit Change Log Trail)</span>
            
            {itemLogs.length === 0 ? (
              <div className="bg-slate-50/40 py-4 text-center text-slate-400 text-xs italic border border-border-subtle rounded-sm select-none font-bold">
                이 마스터 항목에 매핑된 특수 이력 로그가 아직 없습니다.
              </div>
            ) : (
              <div className="relative border-l border-border-subtle pl-4 py-1 space-y-3 font-noto">
                {itemLogs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Ring dot indicator */}
                    <span className="absolute -left-[20.5px] top-0.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-accent flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    </span>
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">{log.action}</span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-500 mt-1 font-semibold">{log.details}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5 font-mono select-none">
                        <User className="h-3 w-3 text-slate-300" />
                        <span>By: {log.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Creator/Update Metas */}
          <div className="pt-3 border-t border-border-subtle grid grid-cols-2 text-[9px] text-slate-400 font-mono select-none font-bold">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              LAST MODIFIED: {item.lastUpdated}
            </span>
            <span className="flex items-center gap-1 justify-end">
              <User className="h-3.5 w-3.5" />
              OPERATOR: {item.createdBy}
            </span>
          </div>

        </div>

        {/* Footer toolbar */}
        <div className="bg-slate-50 border-t border-border-subtle px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="text-xs text-white bg-primary hover:bg-[#003366] px-6 py-2 rounded-sm font-bold h-9 cursor-pointer transition-all shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
