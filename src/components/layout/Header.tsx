'use client';

import React from 'react';
import {
  Calendar,
  Building2,
  Store,
  Layers,
  Search,
  PlusCircle,
  UploadCloud,
  RotateCcw,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { FilterState, UserRole } from '@/types/sales';
import { BRANDS, CHANNELS } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  userRole: UserRole;
  onOpenQuickAdd: () => void;
  onOpenUpload: () => void;
  onExportExcel: () => void;
  onExportCsv?: () => void;
  onResetData: () => void;
}

export default function Header({
  filters,
  setFilters,
  userRole,
  onOpenQuickAdd,
  onOpenUpload,
  onExportExcel,
  onExportCsv,
  onResetData,
}: HeaderProps) {
  // 사용 가능한 매장 목록 계산
  const availableStores = React.useMemo(() => {
    if (filters.selectedBrand === 'all') {
      return BRANDS.flatMap((b) => b.stores);
    }
    const found = BRANDS.find((b) => b.name === filters.selectedBrand);
    return found ? found.stores : [];
  }, [filters.selectedBrand]);

  const handleDatePreset = (preset: FilterState['dateRange']) => {
    const today = new Date('2026-10-25');
    let start = '';
    let end = formatDate(today);

    if (preset === 'today') {
      start = end;
    } else if (preset === '7days') {
      const d = new Date(today);
      d.setDate(today.getDate() - 6);
      start = formatDate(d);
    } else if (preset === '30days') {
      const d = new Date(today);
      d.setDate(today.getDate() - 29);
      start = formatDate(d);
    } else if (preset === 'thisMonth') {
      start = '2026-10-01';
      end = '2026-10-31';
    } else if (preset === 'lastMonth') {
      start = '2026-09-01';
      end = '2026-09-30';
    }

    setFilters((prev) => ({
      ...prev,
      dateRange: preset,
      startDate: start || prev.startDate,
      endDate: end || prev.endDate,
    }));
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 space-y-3">
      {/* Top Bar: Title & Fast Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white tracking-tight">매출 인텔리전스 콘솔</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {userRole === 'ADMIN' ? '🏢 본사 전체 통합 뷰' : `🏬 ${filters.selectedStore} 매니저 뷰`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            인라인 매출 입력
          </button>

          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            POS 엑셀 업로드
          </button>

          {/* Excel / CSV Export Button Group */}
          <div className="flex items-center rounded-lg bg-emerald-600/90 border border-emerald-500/40 shadow-sm shadow-emerald-600/30 overflow-hidden">
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
              title="현재 필터링된 전체 매출 데이터를 4개 시트 Excel (.xlsx) 파일로 다운로드"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel 다운로드 (.xlsx)</span>
            </button>
            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="px-2 py-1.5 hover:bg-emerald-500 text-emerald-100 hover:text-white text-[11px] font-semibold border-l border-emerald-500/40 transition-all"
                title="CSV 단일 파일로 빠른 다운로드"
              >
                CSV
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('샘플 데모 데이터를 기본값으로 재설정하시겠습니까?')) {
                onResetData();
              }
            }}
            title="기본 데모 데이터로 초기화"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
        {/* Date Presets */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-indigo-400 ml-1.5 mr-1" />
          {(['today', '7days', 'thisMonth', 'lastMonth'] as const).map((preset) => {
            const labels = {
              today: '오늘',
              '7days': '최근 7일',
              thisMonth: '이번 달',
              lastMonth: '지난 달',
            };
            const isActive = filters.dateRange === preset;
            return (
              <button
                key={preset}
                onClick={() => handleDatePreset(preset)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  isActive ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {labels[preset]}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: 'custom',
                startDate: e.target.value,
              }))
            }
            className="bg-transparent text-slate-200 text-xs focus:outline-none"
          />
          <span className="text-slate-500">~</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: 'custom',
                endDate: e.target.value,
              }))
            }
            className="bg-transparent text-slate-200 text-xs focus:outline-none"
          />
        </div>

        {/* Brand Selector */}
        <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={filters.selectedBrand}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                selectedBrand: e.target.value,
                selectedStore: 'all', // 브랜드 변경 시 매장 초기화
              }))
            }
            className="bg-slate-950 text-white font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-white">전체 브랜드</option>
            {BRANDS.map((b) => (
              <option key={b.id} value={b.name} className="bg-slate-900 text-white">
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Store Selector */}
        <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Store className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={filters.selectedStore}
            disabled={userRole === 'MANAGER'}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                selectedStore: e.target.value,
              }))
            }
            className={`bg-slate-950 text-white font-medium text-xs focus:outline-none cursor-pointer ${
              userRole === 'MANAGER' ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <option value="all" className="bg-slate-900 text-white">전체 지점/매장</option>
            {availableStores.map((st) => (
              <option key={st} value={st} className="bg-slate-900 text-white">
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={filters.selectedChannel}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                selectedChannel: e.target.value,
              }))
            }
            className="bg-slate-950 text-white font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-white">전체 채널 (매장/배달/자사몰)</option>
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch} className="bg-slate-900 text-white">
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* Search Query */}
        <div className="flex-1 min-w-[140px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="이슈태그, 담당자, 특이사항 검색..."
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                searchQuery: e.target.value,
              }))
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </header>
  );
}
