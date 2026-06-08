/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { CATEGORIES } from '../types';
import type { TestItem } from '../types';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newItems: TestItem[]) => void;
}

export default function ExcelUploadModal({ isOpen, onClose, onUploadSuccess }: ExcelUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<Partial<TestItem>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate Sample CSV Template file string download
  const handleDownloadTemplate = () => {
    const csvHeader = 'CATEGORY,NAME_KR,NAME_EN,SPECIFICATION,UNIT,MANDATORY,STATUS,PRODUCT_LINES,DESCRIPTION\n';
    const csvRow1 = 'Material Strength,접착력 평가 테스트,Adhesion Property Test,ASTM D903,N,REQUIRED,Active,"PCR,LTR,EV",고무 복합재 골격 계면 분리 박리 점착 하중 한계 정량 기계 규격\n';
    const csvRow2 = 'Durability,동적 반복 피로 시험,Dynamic Flex Fatigue,ISO 132,cycles,OPTIONAL,Pending,"PCR,RAC",굴곡 회전 운동에 따른 타이어 사이드 월 표면 가황 제품 내부 미세 균열 진전 파단 측정';
    
    const blob = new Blob([csvHeader + csvRow1 + csvRow2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hankook_rd_mdm_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and Drop support
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const parseCsvContent = (text: string) => {
    try {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        throw new Error('CSV 파일에 헤더와 데이터 줄이 모두 포함되어야 합니다.');
      }

      // Check header columns
      const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
      const requiredHeaders = ['CATEGORY', 'NAME_KR', 'NAME_EN', 'SPECIFICATION', 'UNIT', 'MANDATORY', 'STATUS'];
      
      const hasAllHeaders = requiredHeaders.every(rh => headers.includes(rh));
      if (!hasAllHeaders) {
        throw new Error(`CSV 헤더가 일치하지 않습니다. 필수 필드: ${requiredHeaders.join(', ')}`);
      }

      const tempItems: Partial<TestItem>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // RegEx to handle comma within quotes safely
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const values = matches.map(val => val.replace(/^"|"$/g, '').trim());

        if (values.length < headers.length) continue;

        const rowObj: Record<string, string> = {};
        headers.forEach((header, idx) => {
          rowObj[header] = values[idx] || '';
        });

        // Safe parser checks
        const productLineStr = rowObj['PRODUCT_LINES'] || 'PCR';
        const plArray = productLineStr.split(';').map(p => p.trim());

        tempItems.push({
          category: CATEGORIES.includes(rowObj['CATEGORY']) ? rowObj['CATEGORY'] : 'Material Strength',
          nameKr: rowObj['NAME_KR'] || '미확인 업로드 시험',
          nameEn: rowObj['NAME_EN'] || 'Unidentified Test Item',
          specification: rowObj['SPECIFICATION'] || 'HK-STD-GEN',
          unit: rowObj['UNIT'] || 'N/A',
          mandatory: rowObj['MANDATORY']?.toUpperCase() === 'OPTIONAL' ? 'OPTIONAL' : 'REQUIRED',
          status: ['Active', 'Pending', 'Inactive'].includes(rowObj['STATUS']) ? (rowObj['STATUS'] as any) : 'Active',
          productLines: plArray,
          description: rowObj['DESCRIPTION'] || 'Excel/CSV 업로드를 통해 일괄 추가된 R&D 계측 항목입니다.'
        });
      }

      if (tempItems.length === 0) {
        throw new Error('가져올 유효한 데이터 행이 존재하지 않습니다.');
      }

      setParsedItems(tempItems);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'CSV 파싱 도중 치명적 오류가 발생했습니다.');
      setParsedItems([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            parseCsvContent(evt.target.result as string);
          }
        };
        reader.readAsText(file);
      } else {
        setErrorMessage('오직 .csv 확장자 형식의 일괄 데이터만 지원합니다. 양식 다운로드를 참조해 주세요.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          parseCsvContent(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Trigger Confirmation and Emit upward to main page
  const handleConfirmImport = () => {
    const finalUploadedItems: TestItem[] = parsedItems.map((pi, idx) => ({
      id: `T-101${(80 + idx + Math.floor(Math.random() * 90))}`, // safe dynamic block ID
      category: pi.category || 'Material Strength',
      nameKr: pi.nameKr || 'R&D 주입 데이터',
      nameEn: pi.nameEn || 'Bulk Imported Item',
      specification: pi.specification || 'HK-STD-000',
      unit: pi.unit || 'N/A',
      mandatory: pi.mandatory || 'REQUIRED',
      lastUpdated: new Date().toISOString().split('T')[0],
      status: pi.status || 'Active',
      productLines: pi.productLines || ['PCR'],
      description: pi.description || 'Excel/CSV 일괄 등록 항목.',
      createdBy: 'hans.baek@gmail.com'
    }));

    onUploadSuccess(finalUploadedItems);
    setParsedItems([]);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in font-noto text-slate-700">
      <div className="bg-white rounded-lg w-full max-w-xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header toolbar */}
        <div className="bg-slate-50 border-b border-border-subtle py-4 px-6 text-slate-800 flex items-center justify-between select-none shrink-0">
          <div>
            <h3 className="font-hanken font-extrabold text-primary text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4.5 w-4.5 text-accent" />
              Standard CSV Excel 일괄 등록 (Bulk Upload)
            </h3>
            <p className="text-[9px] text-secondary font-mono tracking-widest mt-0.5 uppercase font-bold">
              Precision R&D Import Utilities
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-primary transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contents Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Brief info and templates download buttons */}
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-sm p-4 text-xs text-slate-700 leading-normal flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1 select-none">
              <p>대량의 R&D 기준정보 시험 항목을 일괄 추가하기 위하여 사전에 정의된 표준 스프레드시트 템플릿 양식을 활용해 주세요.</p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-accent hover:text-accent/80 font-bold flex items-center gap-1 cursor-pointer underline hover:no-underline select-none"
              >
                <Download className="h-3 w-3" />
                표준 양식 템플릿 다운로드 (.CSV)
              </button>
            </div>
          </div>

          {/* Drap-and-Drop Area Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-sm py-8 px-4 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all select-none ${
              dragActive 
                ? 'border-accent bg-accent/5' 
                : 'border-border-subtle hover:border-secondary bg-surface-base hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className="h-10 w-10 text-secondary" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">스프레드시트 CSV 드래그 앤 드롭 또는 클릭 요망</p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">Only .csv templates up to 50MB are supported natively</p>
            </div>
          </div>

          {/* Diagnostics Error Alert */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-sm p-3 flex items-start gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Spreadsheet Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 select-none">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                성공적으로 파싱 완료: <span className="text-emerald-600 font-bold">{parsedItems.length}</span>개 행 로딩됨 (Preview Grid)
              </p>
              
              <div className="border border-border-subtle rounded-sm overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-left text-[10px] border-collapse font-mono">
                  <thead className="bg-[#f1f5f9] text-secondary uppercase font-bold h-8 select-none sticky top-0 border-b border-border-subtle">
                    <tr>
                      <th className="px-3 py-1">NAME (KR)</th>
                      <th className="px-3 py-1">SPECIFICATION</th>
                      <th className="px-3 py-1">UNIT</th>
                      <th className="px-3 py-1">MANDATORY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650 bg-white">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-base h-7 text-[9.5px]">
                        <td className="px-3 py-1 truncate max-w-[150px] font-bold text-slate-800">{item.nameKr}</td>
                        <td className="px-3 py-1 font-mono">{item.specification}</td>
                        <td className="px-3 py-1 font-mono">{item.unit}</td>
                        <td className="px-3 py-1 font-bold">
                          <span className={item.mandatory === 'REQUIRED' ? 'text-rose-650 font-bold' : 'text-slate-400'}>
                            {item.mandatory}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Actions Frame */}
        <div className="bg-slate-50 border-t border-border-subtle px-6 py-4 flex items-center justify-end gap-3 shrink-0 select-none">
          <button
            onClick={onClose}
            className="text-xs text-secondary hover:text-primary font-bold border border-border-subtle bg-white hover:bg-surface-base px-5 py-1.5 rounded-sm h-[36px] cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedItems.length === 0}
            className="text-xs text-white bg-accent hover:bg-[#ff7022]/90 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed px-6 py-1.5 rounded-sm font-bold h-[36px] cursor-pointer shadow-sm transition-all"
          >
            시스템 일괄 정합 주입 ({parsedItems.length} Items)
          </button>
        </div>

      </div>
    </div>
  );
}
