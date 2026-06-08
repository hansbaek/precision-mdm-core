/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { PRODUCT_LINES, CATEGORIES } from '../types';
import type { TestItem } from '../types';

interface TestItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: TestItem) => void;
  editingItem: TestItem | null;
  itemsCount: number;
}

export default function TestItemModal({ isOpen, onClose, onSave, editingItem, itemsCount }: TestItemModalProps) {
  const [nameKr, setNameKr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [specification, setSpecification] = useState('');
  const [unit, setUnit] = useState('');
  const [mandatory, setMandatory] = useState<'REQUIRED' | 'OPTIONAL'>('REQUIRED');
  const [status, setStatus] = useState<'Active' | 'Pending' | 'Inactive'>('Active');
  const [productLines, setProductLines] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  // Sync state with editingItem or Reset
  useEffect(() => {
    if (editingItem) {
      setNameKr(editingItem.nameKr);
      setNameEn(editingItem.nameEn);
      setCategory(editingItem.category);
      setSpecification(editingItem.specification);
      setUnit(editingItem.unit);
      setMandatory(editingItem.mandatory);
      setStatus(editingItem.status);
      setProductLines(editingItem.productLines);
      setDescription(editingItem.description);
    } else {
      setNameKr('');
      setNameEn('');
      setCategory(CATEGORIES[0]);
      setSpecification('');
      setUnit('');
      setMandatory('REQUIRED');
      setStatus('Active');
      setProductLines(['PCR']);
      setDescription('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Toggle Checkbox for productLines
  const handleProductLineToggle = (val: string) => {
    if (productLines.includes(val)) {
      setProductLines(productLines.filter(line => line !== val));
    } else {
      setProductLines([...productLines, val]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKr.trim() || !specification.trim()) {
      alert('필수 양식(항목명, 표준규격)을 입력해 주세요.');
      return;
    }

    if (productLines.length === 0) {
      alert('최소 1개 이상의 제품라인(Product Line)을 매핑해야 합니다.');
      return;
    }

    // Resolve or Generate a technical ID T-100XX to match table prefix
    const finalId = editingItem 
      ? editingItem.id 
      : `T-10${(42 + itemsCount + Math.floor(Math.random() * 5))}`; // Smart auto-id sequence safety

    const formattedItem: TestItem = {
      id: finalId,
      category,
      nameKr: nameKr.trim(),
      nameEn: nameEn.trim() || `${nameKr} Evaluation`,
      specification: specification.trim(),
      unit: unit.trim() || 'N/A',
      mandatory,
      lastUpdated: new Date().toISOString().split('T')[0],
      status,
      productLines,
      description: description.trim() || '기준 정보 설명이 입력되지 않았습니다.',
      createdBy: editingItem?.createdBy || 'hans.baek@gmail.com'
    };

    onSave(formattedItem);
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in font-noto">
      <div className="bg-white rounded-lg w-full max-w-2xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Block */}
        <div className="bg-primary py-4 px-6 text-white flex items-center justify-between select-none">
          <div>
            <h3 className="font-hanken font-bold text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              {editingItem ? '시험항목 기준정보 수정 (Update Test Item)' : '신규 시험항목 마스터 등록 (Register New Test Item)'}
            </h3>
            <p className="text-[10px] text-[#eff1f3]/70 font-mono tracking-wide mt-0.5 uppercase">
              R&D DATA MANAGEMENT PORTAL
            </p>
          </div>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Area Scrollable */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-on-surface">
          
          {/* Core Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 시험항목명 (Korean Name) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#545f72] mb-1">
                시험항목명 (Test Item Name - Korean) <span className="text-rose-500">*</span>
              </label>
              <input
                id="modal-input-nameKr"
                type="text"
                required
                placeholder="예: 마모 수명 테스트, 고속 점탄성 평가 등"
                value={nameKr}
                onChange={(e) => setNameKr(e.target.value)}
                className="w-full text-xs border border-border-subtle hover:border-secondary focus:border-primary rounded-sm px-3 py-2 outline-none transition-colors font-noto bg-white"
              />
            </div>

            {/* 영문항목명 (English Name) */}
            <div>
              <label className="block text-xs font-bold text-[#545f72] mb-1">
                영문항목명 (English Name)
              </label>
              <input
                id="modal-input-nameEn"
                type="text"
                placeholder="예: Abrasion Life Test"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full text-xs border border-border-subtle hover:border-secondary focus:border-primary rounded-sm px-3 py-2 outline-none transition-colors font-noto bg-white"
              />
            </div>

            {/* 시험분류 (Test Category) */}
            <div>
              <label className="block text-xs font-bold text-[#545f72] mb-1">
                시험분류 (Category)
              </label>
              <select
                id="modal-select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-border-subtle hover:border-secondary focus:border-primary rounded-sm px-3 py-2 outline-none h-[34px] transition-colors font-noto bg-white cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 표준규격 (Specification) */}
            <div>
              <label className="block text-xs font-bold text-[#545f72] mb-1">
                표준규격 (Specification) <span className="text-rose-500">*</span>
              </label>
              <input
                id="modal-input-specification"
                type="text"
                required
                placeholder="예: ASTM D412, ISO 4649"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                className="w-full text-xs border border-border-subtle hover:border-secondary focus:border-primary rounded-sm px-3 py-2 outline-none transition-colors font-mono bg-white"
              />
            </div>

            {/* 계측 단위 (Unit) */}
            <div>
              <label className="block text-xs font-bold text-[#545f72] mb-1">
                계측 단위 (Unit)
              </label>
              <input
                id="modal-input-unit"
                type="text"
                placeholder="예: MPa, mm³, Cd, %, db(A)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs border border-border-subtle hover:border-secondary focus:border-primary rounded-sm px-3 py-2 outline-none transition-colors font-mono bg-white"
              />
            </div>

            {/* 필수 여부 (Mandatory Toggle) */}
            <div>
              <label className="block text-xs font-bold text-[#545f72] mb-1">
                의무구분 (Mandatory Category)
              </label>
              <div className="flex gap-2">
                {['REQUIRED', 'OPTIONAL'].map((type) => (
                  <button
                    key={type}
                    id={`modal-btn-mandatory-${type}`}
                    type="button"
                    onClick={() => setMandatory(type as any)}
                    className={`flex-1 text-xs py-1.5 border rounded-sm font-semibold transition-all cursor-pointer ${
                      mandatory === type
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-secondary border-border-subtle hover:bg-surface-base'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 진행 상태 (Status Toggle) */}
            <div>
              <label className="block text-xs font-bold text-[#545f72] mb-1">
                상태 구분 (Status)
              </label>
              <div className="flex gap-1.5 h-[34px]">
                {['Active', 'Pending', 'Inactive'].map((stType) => (
                  <button
                    key={stType}
                    id={`modal-btn-status-${stType}`}
                    type="button"
                    onClick={() => setStatus(stType as any)}
                    className={`flex-1 text-[11px] py-1 border rounded-sm font-medium transition-all cursor-pointer ${
                      status === stType
                        ? stType === 'Active'
                          ? 'bg-emerald-500 text-white border-emerald-500 font-bold'
                          : stType === 'Pending'
                            ? 'bg-amber-500 text-white border-amber-500 font-bold'
                            : 'bg-rose-500 text-white border-rose-500 font-bold'
                        : 'bg-white text-gray-400 border-border-subtle hover:bg-surface-base'
                    }`}
                  >
                    {stType}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 적용 대상 제품라인 (Product Lines Mapping) */}
          <div>
            <label className="block text-xs font-bold text-[#545f72] mb-1.5">
              적용 대상 제품라인 (Product Line Mappings) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-surface-base p-3 border border-border-subtle rounded-sm">
              {PRODUCT_LINES.map((pl) => {
                const isSelected = productLines.includes(pl.value);
                return (
                  <label
                    key={pl.value}
                    className={`flex items-center gap-2 cursor-pointer text-xs font-medium p-1.5 rounded-sm transition-all select-none hover:bg-white ${
                      isSelected ? 'text-primary font-bold' : 'text-secondary'
                    }`}
                  >
                    <input
                      id={`modal-chk-pl-${pl.value}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleProductLineToggle(pl.value)}
                      className="rounded-sm cursor-pointer accent-primary border-border-subtle"
                    />
                    <span>{pl.value} ({pl.label.split('-')[1].trim()})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 상세 설명 (Description) */}
          <div>
            <label className="block text-xs font-bold text-[#545f72] mb-1">
              개요 및 시험 설명 (Description)
            </label>
            <textarea
              id="modal-textarea-desc"
              rows={3}
              placeholder="시험 목적, 한계 조건, 샘플 요구 사항 등을 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-border-subtle hover:border-secondary focus:border-primary rounded-sm px-3 py-2 outline-none transition-colors font-noto bg-white"
            />
          </div>

        </form>

        {/* Action Buttons Box */}
        <div className="bg-slate-50 border-t border-border-subtle px-6 py-3.5 flex items-center justify-end gap-2 shrink-0 select-none">
          <button
            id="modal-btn-cancel"
            type="button"
            onClick={onClose}
            className="text-xs text-[#545f72] hover:text-primary font-bold border border-border-subtle bg-white hover:bg-surface-base px-4 py-1.5 rounded-sm h-[32px] cursor-pointer"
          >
            취소 (Cancel)
          </button>
          <button
            id="modal-btn-save"
            type="submit"
            onClick={handleFormSubmit}
            className="text-xs text-white bg-primary hover:bg-[#003366] px-6 py-1.5 rounded-sm font-bold h-[32px] flex items-center justify-center cursor-pointer shadow-sm select-none"
          >
            저장 및 승인 (Save & Approve)
          </button>
        </div>

      </div>
    </div>
  );
}
