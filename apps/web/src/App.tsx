/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Database,
  Settings,
  Upload,
  Download,
  Plus,
  ClipboardList,
  PieChart,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

import { CATEGORIES } from './types';
import type { TestItem, AuditLog, FilterOptions } from './types';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import TestItemTable from './components/TestItemTable';
import TestItemModal from './components/TestItemModal';
import ExcelUploadModal from './components/ExcelUploadModal';
import TestItemDetailModal from './components/TestItemDetailModal';

export default function App() {
  // --- 1. Persistent State Management ---
  const [items, setItems] = useState<TestItem[]>(() => {
    const saved = localStorage.getItem('hankook_rd_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('hankook_rd_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hankook_rd_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('hankook_rd_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // --- 2. Navigational View States ---
  const [activeModule, setActiveModule] = useState('test-master'); // Left sidebar modules
  const [activeTab, setActiveTab] = useState('dashboard');         // Top global header tabs
  const [globalSearch, setGlobalSearch] = useState('');            // Top bar search field

  // --- 3. Filter States ---
  const initialFilters: FilterOptions = {
    productLine: '',
    category: '',
    searchQuery: '',
    status: '',
    startDate: '',
    endDate: '',
  };
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>(initialFilters);

  // --- 4. Selection and Table Configuration States ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // --- 5. Interactive Modals Triggers ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestItem | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<TestItem | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Recent system updates toast triggers
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --- 6. Filtering & Search Execution ---
  const handleSearchExecute = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleSearchReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  };

  // Get final items combining local filter panel and global top header search
  const filteredItems = items.filter((item) => {
    // A. Product Line Filter
    if (appliedFilters.productLine) {
      if (!item.productLines.includes(appliedFilters.productLine)) return false;
    }

    // B. Category Filter
    if (appliedFilters.category && item.category !== appliedFilters.category) return false;

    // C. Search Input Filter (Checks item ID, Korean / English Name, or Specification)
    if (appliedFilters.searchQuery) {
      const q = appliedFilters.searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchKr = item.nameKr.toLowerCase().includes(q);
      const matchEn = item.nameEn.toLowerCase().includes(q);
      const matchSpec = item.specification.toLowerCase().includes(q);
      if (!matchId && !matchKr && !matchEn && !matchSpec) return false;
    }

    // D. Global Top Bar Search (Acts over the general grid dynamically)
    if (globalSearch) {
      const gq = globalSearch.toLowerCase();
      const gmatchId = item.id.toLowerCase().includes(gq);
      const gmatchKr = item.nameKr.toLowerCase().includes(gq);
      const gmatchEn = item.nameEn.toLowerCase().includes(gq);
      const gmatchSpec = item.specification.toLowerCase().includes(gq);
      if (!gmatchId && !gmatchKr && !gmatchEn && gmatchSpec) return false;
    }

    // E. Status Filter
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;

    // F. Date Range Filter
    if (appliedFilters.startDate && item.lastUpdated < appliedFilters.startDate) return false;
    if (appliedFilters.endDate && item.lastUpdated > appliedFilters.endDate) return false;

    return true;
  });

  // --- 7. Sorting Execution ---
  const sortedItems = [...filteredItems].sort((a, b) => {
    let fieldA = a[sortBy as keyof TestItem] || '';
    let fieldB = b[sortBy as keyof TestItem] || '';

    // Handle string capitalization differences
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      fieldA = fieldA.toLowerCase();
      fieldB = fieldB.toLowerCase();
    }

    if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // --- 8. Core operations Callbacks ---

  // Row CRUD: Save or Update
  const handleSaveItem = (savedItem: TestItem) => {
    const exists = items.some((item) => item.id === savedItem.id);
    let updatedList: TestItem[] = [];
    let logEntry: AuditLog;

    if (exists) {
      // Update
      updatedList = items.map((item) => (item.id === savedItem.id ? savedItem : item));
      logEntry = {
        id: `LOG-0${10 + auditLogs.length}`,
        itemId: savedItem.id,
        itemName: `${savedItem.nameKr} (${savedItem.nameEn})`,
        action: 'UPDATE',
        details: `R&D 항목 정보 패널 수정 진행: ${savedItem.specification} / ${savedItem.unit}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: 'hans.baek@gmail.com'
      };
      triggerToast(`${savedItem.id} 항목이 정상 수정되었습니다.`);
    } else {
      // Create New
      updatedList = [savedItem, ...items];
      logEntry = {
        id: `LOG-0${10 + auditLogs.length}`,
        itemId: savedItem.id,
        itemName: `${savedItem.nameKr} (${savedItem.nameEn})`,
        action: 'CREATE',
        details: `신규 R&D 타이어 시험 기준 항목 신규 구축: ${savedItem.specification}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: 'hans.baek@gmail.com'
      };
      triggerToast(`새 고정 항목 ${savedItem.id}이 등록 및 자동 제정되었습니다.`);
    }

    setItems(updatedList);
    setAuditLogs([logEntry, ...auditLogs]);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Row CRUD: Delete
  const handleDeleteItem = (id: string) => {
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    if (!window.confirm(`선택한 시험 항목 [${id}: ${targetItem.nameKr}]을(를) 마스터 테이블에서 영구 삭제하시겠습니까?`)) {
      return;
    }

    setItems(items.filter((item) => item.id !== id));
    setSelectedIds(selectedIds.filter((item) => item !== id));

    const logEntry: AuditLog = {
      id: `LOG-0${10 + auditLogs.length}`,
      itemId: id,
      itemName: targetItem.nameKr,
      action: 'DELETE',
      details: '기준정보 마스터에서 항목 영구 파기 진행',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'hans.baek@gmail.com'
    };

    setAuditLogs([logEntry, ...auditLogs]);
    triggerToast(`${id} 항목이 파기 제거되었습니다.`);
  };

  // Row CRUD: Bulk Change Status
  const handleBulkStatusChange = (newStatus: 'Active' | 'Pending' | 'Inactive') => {
    let updatedCount = 0;
    const newLogs: AuditLog[] = [];

    const updatedItems = items.map((item) => {
      if (selectedIds.includes(item.id)) {
        updatedCount++;
        newLogs.push({
          id: `LOG-0${10 + auditLogs.length + newLogs.length}`,
          itemId: item.id,
          itemName: item.nameKr,
          action: 'STATUS_CHANGE',
          details: `일괄 편집: 상태 변경 -> [${newStatus}]`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          user: 'hans.baek@gmail.com'
        });
        return { ...item, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] };
      }
      return item;
    });

    setItems(updatedItems);
    setAuditLogs([...newLogs, ...auditLogs]);
    setSelectedIds([]);
    triggerToast(`${updatedCount}개 항목의 작동 상태가 [${newStatus}](으)로 일괄 갱신되었습니다.`);
  };

  // Row CRUD: Bulk Delete
  const handleBulkDelete = () => {
    if (!window.confirm(`선택된 ${selectedIds.length}개 항목들을 마스터 데이터베이스에서 통째로 소거하시겠습니까? 관련 데이터가 소각됩니다.`)) {
      return;
    }

    const remainingItems = items.filter((item) => !selectedIds.includes(item.id));
    const deletedItems = items.filter((item) => selectedIds.includes(item.id));

    const newLogs = deletedItems.map((item, idx) => ({
      id: `LOG-0${10 + auditLogs.length + idx}`,
      itemId: item.id,
      itemName: item.nameKr,
      action: 'DELETE' as const,
      details: '스프레드시트 벌크 선택에 의한 다중 영구 파기 진행',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'hans.baek@gmail.com'
    }));

    setItems(remainingItems);
    setAuditLogs([...newLogs, ...auditLogs]);
    setSelectedIds([]);
    triggerToast(`총 ${deletedItems.length}개 시험 항목 소거 완료.`);
  };

  // Excel Bulk Imports Success
  const handleExcelImportSuccess = (bulkItems: TestItem[]) => {
    setItems((prev) => [...bulkItems, ...prev]);

    const importLogs: AuditLog[] = bulkItems.map((item, idx) => ({
      id: `LOG-0${10 + auditLogs.length + idx}`,
      itemId: item.id,
      itemName: item.nameKr,
      action: 'BULK_IMPORT',
      details: `CSV Spreadsheet 일괄 정합 주입: ${item.specification}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'hans.baek@gmail.com'
    }));

    setAuditLogs((prev) => [...importLogs, ...prev]);
    triggerToast(`엑셀 파싱 완료: ${bulkItems.length}개 고유 시험 기준정보가 주입 로딩되었습니다.`);
  };

  // Real csv downloading helper (Excel Download)
  const handleExportToCsv = () => {
    if (filteredItems.length === 0) {
      alert('다운로드할 R&D 마스터 데이터가 존재하지 않습니다.');
      return;
    }

    const headers = 'TEST_ITEM_ID,CATEGORY,NAME_KR,NAME_EN,SPECIFICATION,UNIT,MANDATORY,LAST_UPDATED,STATUS,PRODUCT_LINES\n';
    const rows = filteredItems.map((item) => {
      // Escape commas inside name or description safely
      const safeKr = item.nameKr.includes(',') ? `"${item.nameKr}"` : item.nameKr;
      const safeEn = item.nameEn.includes(',') ? `"${item.nameEn}"` : item.nameEn;
      const plMerged = `"${item.productLines.join(',')}"`;
      return `${item.id},${item.category},${safeKr},${safeEn},${item.specification},${item.unit},${item.mandatory},${item.lastUpdated},${item.status},${plMerged}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hankook_rd_mdm_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('필터 적용 파일 내보내기 다운로드(CSV Excel)가 개시되었습니다.');
  };

  // Handlers for Row Action triggers
  const handleEditTrigger = (item: TestItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreateNewTrigger = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleViewTrigger = (item: TestItem) => {
    setViewingItem(item);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-surface-base select-none overflow-hidden font-noto">

      {/* 1. Universal Left Corporate Sidebar */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        openNewEntryModal={handleCreateNewTrigger}
        itemsCount={items.length}
      />

      {/* Right side global stack container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* 2. Consistent Global Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            // Auto switch left module focus where appropriate
            if (tab === 'analytics' || tab === 'reports') {
              setActiveModule('data-audit');
            } else {
              setActiveModule('test-master');
            }
          }}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        {/* 3. Main Body Scroll Frame */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f7f9fb]">

          {/* Global toast alerts pop */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 bg-primary border border-[#003366] text-white px-5 py-4 rounded-sm flex items-center gap-3 shadow-2xl z-50 animate-fade-in text-xs font-noto">
              <CheckCircle className="h-4.5 w-4.5 text-accent animate-pulse" />
              <span className="font-bold">{toastMessage}</span>
            </div>
          )}

          {/* Conditional Rendering (Header tabs - Dashboard vs. Analytics vs. Reports) */}
          {activeTab === 'dashboard' ? (
            activeModule === 'test-master' ? (
              /* --- A. Master Table Dashboard View --- */
              <div className="space-y-6">

                {/* Titles Breadcrumbs */}
                <div>
                  <nav className="text-[9px] text-[#545f72] font-bold uppercase tracking-widest font-mono">
                    MDM Home / 시험항목 기준정보 관리 (R&D Master)
                  </nav>
                  <h2 className="font-hanken font-extrabold text-primary text-2xl tracking-tight mt-1.5 uppercase">
                    Test Item Master Database
                  </h2>
                </div>

                {/* Search Filters Card Component */}
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  onSearch={handleSearchExecute}
                  onReset={handleSearchReset}
                />

                {/* Toolbar Control strip */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

                  {/* Left Side Addings */}
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-toolbar-new"
                      onClick={handleCreateNewTrigger}
                      className="bg-accent hover:bg-[#ff7022]/90 text-white text-xs font-bold py-2.5 px-5 rounded-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer h-10 hover:-translate-y-[1px] active:translate-y-0 duration-150"
                    >
                      <Plus className="h-4 w-4 text-white" />
                      신규 등록 (New Entry)
                    </button>
                  </div>

                  {/* Right Side Downloads/Uploads */}
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-toolbar-upload"
                      onClick={() => setIsUploadOpen(true)}
                      className="text-xs text-[#545f72] hover:text-primary hover:bg-surface-base border border-border-subtle bg-white px-4 py-2 rounded-sm flex items-center gap-1.5 transition-all font-bold h-10 cursor-pointer shadow-xs"
                    >
                      <Upload className="h-4 w-4 text-primary" />
                      Excel Upload
                    </button>
                    <button
                      id="btn-toolbar-download"
                      onClick={handleExportToCsv}
                      className="text-xs text-[#545f72] hover:text-primary hover:bg-surface-base border border-border-subtle bg-white px-4 py-2 rounded-sm flex items-center gap-1.5 transition-all font-bold h-10 cursor-pointer shadow-xs"
                    >
                      <Download className="h-4 w-4 text-primary" />
                      Excel Download
                    </button>
                  </div>

                </div>

                {/* Table Container */}
                <div className="w-full">
                  <TestItemTable
                    items={sortedItems}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onEdit={handleEditTrigger}
                    onView={handleViewTrigger}
                    onDelete={handleDeleteItem}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    onBulkStatusChange={handleBulkStatusChange}
                    onBulkDelete={handleBulkDelete}
                  />
                </div>
              </div>
            ) : (
              /* Temporary Sidebar placeholder module views */
              <div className="bg-white border border-border-subtle rounded-sm p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm select-none">
                <Settings className="h-12 w-12 text-slate-300 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
                <h3 className="text-base font-bold text-primary font-hanken">
                  [{activeModule.toUpperCase()}] Module Is Currently Virtualized
                </h3>
                <p className="text-xs text-secondary leading-relaxed font-noto">
                  R&D 고유 위상 체계가 Test Item Master 핵심 DB 영역에 통합 조립 중입니다. 해당 모듈의 커스텀 기준정보는 Master Data Management 탭에서 생성 및 교류하여 주시기 바랍니다.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveModule('test-master')}
                    className="bg-primary hover:bg-[#003366] text-white font-extrabold text-xs py-2.5 px-5 rounded-sm transition-all cursor-pointer shadow-sm"
                  >
                    Test Item Master 데이터로 회귀
                  </button>
                </div>
              </div>
            )
          ) : activeTab === 'analytics' ? (
            /* --- B. R&D Analytics Dashboard Subview --- */
            <div className="space-y-6">

              {/* Top Analytical Banner */}
              <div>
                <nav className="text-[10px] text-secondary font-bold uppercase tracking-widest font-mono">
                  MDM Home / R&D 통계 대시보드
                </nav>
                <h2 className="font-hanken font-extrabold text-primary text-2xl tracking-tight mt-1.5 uppercase">
                  R&D Test Master Metrics
                </h2>
              </div>

              {/* Stat Bento Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <div className="bg-white p-6 border border-border-subtle rounded-sm flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#545f72] font-bold uppercase tracking-wider">전체 등록 수량</span>
                    <p className="text-2xl font-extrabold font-mono text-primary">{items.length} <span className="text-xs font-normal">건</span></p>
                  </div>
                  <Database className="h-10 w-10 text-primary bg-surface-base border border-border-subtle p-2 rounded-sm" />
                </div>

                <div className="bg-white p-6 border border-border-subtle rounded-sm flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#545f72] font-bold uppercase tracking-wider">Active 제어 활성</span>
                    <p className="text-2xl font-extrabold font-mono text-primary">
                      {items.filter(i => i.status === 'Active').length} <span className="text-xs font-normal">건</span>
                    </p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-emerald-600 bg-emerald-50 p-2 rounded-sm" />
                </div>

                <div className="bg-white p-6 border border-border-subtle rounded-sm flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#545f72] font-bold uppercase tracking-wider font-semibold">의무 평가 (Required)</span>
                    <p className="text-2xl font-extrabold font-mono text-rose-650">
                      {items.filter(i => i.mandatory === 'REQUIRED').length} <span className="text-xs font-normal">건</span>
                    </p>
                  </div>
                  <FileText className="h-10 w-10 text-rose-600 bg-rose-50 p-2 rounded-sm" />
                </div>

                <div className="bg-white p-6 border border-border-subtle rounded-sm flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#545f72] font-bold uppercase tracking-wider font-semibold">감가/대기 (Pending)</span>
                    <p className="text-2xl font-extrabold font-mono text-amber-600">
                      {items.filter(i => i.status === 'Pending').length} <span className="text-xs font-normal">건</span>
                    </p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-amber-500 bg-amber-50 p-2 rounded-sm" />
                </div>

              </div>

              {/* Dynamic SVG/CSS Distribution Chart Block */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* CSS Based Interactive Category Density Chart */}
                <div className="bg-white p-6 border border-border-subtle rounded-sm space-y-5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4.5 w-4.5 text-accent" />
                    <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
                      시험 분야 카테고리별 분포 (Distribution)
                    </h3>
                  </div>
                  <div className="space-y-4 pt-1">
                    {CATEGORIES.map(cat => {
                      const count = items.filter(i => i.category === cat).length;
                      const pct = Math.round((count / items.length) * 100) || 0;
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-slate-700 font-semibold">{cat}</span>
                            <span className="text-[#545f72] font-mono font-bold">
                              {count}건 <span className="text-accent">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-sm overflow-hidden w-full flex border border-border-subtle">
                            <div
                              className="bg-primary h-full rounded-sm transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Audit Trial general stream summary */}
                <div className="bg-white p-5 border border-border-subtle rounded-sm space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4.5 w-4.5 text-accent" />
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wide">
                        전체 감사 시스템 이력 스트림 (R&D Global Audit Pipeline)
                      </h3>
                    </div>
                  </div>

                  <div className="max-h-[345px] overflow-y-auto divide-y divide-[#f1f5f9] pr-1.5 space-y-3 pt-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="pt-3 first:pt-0 pb-1 flex flex-col font-noto">
                        <div className="flex items-center justify-between text-[11px] font-medium text-[#545f72] select-none">
                          <span className="font-mono text-[9px] bg-surface-base text-secondary px-1.5 py-0.5 rounded-sm border border-border-subtle">{log.id}</span>
                          <span className="font-mono">{log.timestamp}</span>
                        </div>
                        <p className="text-xs font-bold text-primary mt-1">{log.itemName}</p>
                        <p className="text-xs text-secondary font-medium mt-0.5">{log.details}</p>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 font-mono">
                          <span className={`font-bold uppercase ${log.action === 'CREATE' ? 'text-emerald-600' : log.action === 'DELETE' ? 'text-rose-650' : 'text-primary'
                            }`}>{log.action}</span>
                          <span className="text-[#545f72]">Operator: {log.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          ) : (
            /* --- C. R&D Master Data Reports / Printing subviews --- */
            <div className="space-y-6">

              <div>
                <nav className="text-[10px] text-[#545f72] font-bold uppercase tracking-wider font-mono">
                  MDM Home / 보고서 출력
                </nav>
                <h2 className="font-hanken font-bold text-primary text-2xl tracking-tight mt-1">
                  Formatted R&D Quality Verification Report
                </h2>
              </div>

              <div className="bg-white border border-border-subtle rounded-sm p-6 max-w-3xl mx-auto space-y-6 shadow-sm font-noto">

                {/* Print layout brand header */}
                <div className="border-b border-border-subtle pb-4 text-center select-none">
                  <h4 className="text-sm font-bold tracking-widest text-primary uppercase">Hankook Tire & Technology</h4>
                  <h3 className="text-lg font-bold mt-1 text-primary font-hanken">R&D TEST ITEM MASTER DIRECTORY SPEC SHEET</h3>
                  <div className="flex justify-between text-[10px] text-secondary font-mono mt-4">
                    <span>DOCUMENT NO: HK-RDM-2026-05</span>
                    <span>LOGISTICS DATE: {new Date().toISOString().split('T')[0]}</span>
                  </div>
                </div>

                {/* Database counts and analysis summary brief tables */}
                <div className="space-y-3 text-xs text-gray-700">
                  <p className="leading-relaxed">
                    본 데이터 위생 문서는 한국타이어 R&D 연구 본부에서 기용 및 관리 중인 <strong>일반 승용/전기차/레이싱</strong> 규준의 타이어 시료 시험 제정 항목들에 대한 일괄 검수 및 표준 규준 명세를 실시간 출력한 것입니다.
                  </p>

                  <div className="grid grid-cols-3 gap-4 border border-border-subtle divide-x divide-border-subtle p-3 bg-surface-base rounded-sm text-center">
                    <div>
                      <span className="text-[10px] font-bold text-[#545f72] uppercase">기재 총수</span>
                      <p className="text-base font-bold font-mono text-primary mt-1">{items.length} 건</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#545f72] uppercase">의무 검사(Required)</span>
                      <p className="text-base font-bold font-mono text-primary mt-1">
                        {items.filter(i => i.mandatory === 'REQUIRED').length} 건
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#545f72] uppercase">가용 정합률 (Active)</span>
                      <p className="text-base font-bold font-mono text-emerald-600 mt-1">
                        {Math.round((items.filter(i => i.status === 'Active').length / items.length) * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Printed tabular index listing */}
                  <div className="space-y-2 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">시험 항목 요령 검수 리스트 (Master Index Details)</span>
                    <table className="w-full text-left text-[10px] border border-border-subtle border-collapse">
                      <thead className="bg-[#f2f4f6] text-[#545f72] font-bold border-b border-border-subtle">
                        <tr>
                          <th className="p-2 border-r border-[#eceef0]">ID</th>
                          <th className="p-2 border-r border-[#eceef0]">국문 및 영문 항목명</th>
                          <th className="p-2 border-r border-[#eceef0]">표준 규격</th>
                          <th className="p-2 border-r border-[#eceef0]">제정 부서</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eceef0] font-mono bg-white">
                        {items.slice(0, 10).map(item => (
                          <tr key={item.id} className="h-7 text-xs">
                            <td className="p-2 border-r border-[#eceef0] font-bold text-primary">{item.id}</td>
                            <td className="p-2 border-r border-[#eceef0] font-noto truncate max-w-[200px]">{item.nameKr} <span className="text-[10px] text-gray-400">({item.nameEn})</span></td>
                            <td className="p-2 border-r border-[#eceef0] truncate font-bold text-slate-800">{item.specification} ({item.unit})</td>
                            <td className="p-2 text-[10px] font-noto truncate max-w-[100px]">{item.createdBy.split('@')[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer confirmation stamp layout */}
                <div className="pt-6 border-t border-border-subtle text-center select-none text-xs text-gray-400 flex justify-between items-end font-mono">
                  <span>PRINTED OPERATOR: hans.baek@gmail.com</span>
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 border border-[#ba1a1a]/30 text-rose-600 font-bold text-[9px] uppercase rounded-full flex items-center justify-center border-dashed animate-pulse" style={{ transform: 'rotate(-10deg)' }}>
                      R&D SEAL
                    </div>
                    <span className="mt-1 text-[9px]">Hankook Tire HQ Approved</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>

        {/* 4. Constant Footer */}
        <footer className="h-12 bg-primary border-t border-transparent px-6 flex items-center justify-between text-[11px] text-[#eff1f3] shrink-0 font-noto">
          <span>&copy; 2026 Hankook Tire & Technology. All Rights Reserved.</span>
          <div className="flex items-center gap-4 text-[#eff1f3]/70 font-semibold select-none">
            <a href="#privacy" className="hover:text-white transition-all">Privacy Policy</a>
            <span>|</span>
            <a href="#teams" className="hover:text-white transition-all">Terms of Service</a>
          </div>
        </footer>

      </div>

      {/* --- 5. App level Overlay Modals --- */}

      {/* A. Register/Edit Spec Modal */}
      <TestItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
        itemsCount={items.length}
      />

      {/* B. Excel CSV Parse Imports Modal */}
      <ExcelUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleExcelImportSuccess}
      />

      {/* C. Detail Visual Card Inspections Modal */}
      <TestItemDetailModal
        isOpen={isDetailOpen}
        item={viewingItem}
        onClose={() => {
          setIsDetailOpen(false);
          setViewingItem(null);
        }}
        auditLogs={auditLogs}
      />

    </div>
  );
}
