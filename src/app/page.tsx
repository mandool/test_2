'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import OverviewTab from '@/components/dashboard/OverviewTab';
import DataGridTab from '@/components/grid/DataGridTab';
import ExcelUploadTab from '@/components/upload/ExcelUploadTab';
import EventAnalysisTab from '@/components/events/EventAnalysisTab';
import TargetCalendarTab from '@/components/targets/TargetCalendarTab';
import WeeklyReportTab from '@/components/reports/WeeklyReportTab';
import SettingsTab from '@/components/settings/SettingsTab';

import { SalesRecord, CampaignEvent, StoreTarget, FilterState, UserRole } from '@/types/sales';
import {
  getStoredSales,
  saveSales,
  getStoredEvents,
  saveEvents,
  getStoredTargets,
  saveTargets,
  filterRecords,
  resetAllDataToDefault,
} from '@/lib/storage';
import { exportComprehensiveExcel, exportSalesCsv } from '@/lib/excelExport';
import { BRANDS } from '@/lib/mockData';
import { CheckCircle2, FileSpreadsheet, X } from 'lucide-react';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string } | null>(null);

  // 데이터 상태
  const [allSales, setAllSales] = useState<SalesRecord[]>([]);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [targets, setTargets] = useState<StoreTarget[]>([]);

  // 글로벌 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'thisMonth',
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    selectedBrand: 'all',
    selectedStore: 'all',
    selectedChannel: 'all',
    searchQuery: '',
  });

  // 모든 매장 목록
  const allStoreList = useMemo(() => {
    return BRANDS.flatMap((b) => b.stores);
  }, []);

  // 클라이언트 로드 시 초기 데이터 로딩
  useEffect(() => {
    setIsClient(true);
    setAllSales(getStoredSales());
    setEvents(getStoredEvents());
    setTargets(getStoredTargets());
  }, []);

  // 매니저 모드 변경 시 매장 필터 자동 조정
  useEffect(() => {
    if (userRole === 'MANAGER') {
      if (filters.selectedStore === 'all') {
        setFilters((prev) => ({ ...prev, selectedStore: allStoreList[0] }));
      }
    }
  }, [userRole, allStoreList, filters.selectedStore]);

  // 필터링된 세일즈 데이터
  const filteredSales = useMemo(() => {
    return filterRecords(allSales, filters);
  }, [allSales, filters]);

  // CRUD 핸들러
  const handleSaveRecord = (record: SalesRecord) => {
    const updated = allSales.map((r) => (r.id === record.id ? record : r));
    setAllSales(updated);
    saveSales(updated);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = allSales.filter((r) => r.id !== id);
    setAllSales(updated);
    saveSales(updated);
  };

  const handleBulkAddRecords = (newRecords: SalesRecord[]) => {
    const updated = [...newRecords, ...allSales];
    setAllSales(updated);
    saveSales(updated);
  };

  const handleAddEvent = (event: CampaignEvent) => {
    const updated = [event, ...events];
    setEvents(updated);
    saveEvents(updated);
  };

  const handleSaveTargets = (newTargets: StoreTarget[]) => {
    setTargets(newTargets);
    saveTargets(newTargets);
  };

  const handleResetData = () => {
    resetAllDataToDefault();
    setAllSales(getStoredSales());
    setEvents(getStoredEvents());
    setTargets(getStoredTargets());
  };

  const handleExportExcel = () => {
    try {
      const filename = exportComprehensiveExcel({
        sales: filteredSales,
        events,
        targets,
        allSales,
        filters,
        filterDescription: `${filters.startDate} ~ ${filters.endDate}`,
      });
      setToastMsg({
        title: 'Excel 종합보고서 다운로드 완료',
        desc: `${filename} 파일이 저장되었습니다. (4개 시트 자동 구성)`,
      });
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    }
  };

  const handleExportCsv = () => {
    try {
      const filename = exportSalesCsv(filteredSales);
      setToastMsg({
        title: 'CSV 원장 데이터 다운로드 완료',
        desc: `${filename} 파일이 저장되었습니다.`,
      });
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('CSV 파일 생성 중 오류가 발생했습니다.');
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">매출 데이터베이스 연결 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        selectedStore={filters.selectedStore}
        setSelectedStore={(st) => setFilters((prev) => ({ ...prev, selectedStore: st }))}
        storeList={allStoreList}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          filters={filters}
          setFilters={setFilters}
          userRole={userRole}
          onOpenQuickAdd={() => setCurrentTab('grid')}
          onOpenUpload={() => setCurrentTab('import')}
          onExportExcel={handleExportExcel}
          onExportCsv={handleExportCsv}
          onResetData={handleResetData}
        />

        <main className="p-6 flex-1">
          {currentTab === 'overview' && (
            <OverviewTab
              sales={filteredSales}
              allSales={allSales}
              events={events}
              targets={targets}
              filters={filters}
              onExportExcel={handleExportExcel}
            />
          )}

          {currentTab === 'grid' && (
            <DataGridTab
              sales={filteredSales}
              allSales={allSales}
              onSaveRecord={handleSaveRecord}
              onDeleteRecord={handleDeleteRecord}
              onBulkAddRecords={handleBulkAddRecords}
              userRole={userRole}
              selectedStore={filters.selectedStore}
            />
          )}

          {currentTab === 'import' && (
            <ExcelUploadTab
              onBulkAddRecords={handleBulkAddRecords}
              onSuccessNavigateToOverview={() => setCurrentTab('overview')}
            />
          )}

          {currentTab === 'events' && (
            <EventAnalysisTab
              sales={allSales}
              events={events}
              onAddEvent={handleAddEvent}
            />
          )}

          {currentTab === 'targets' && (
            <TargetCalendarTab
              targets={targets}
              onSaveTargets={handleSaveTargets}
              events={events}
              onAddEvent={handleAddEvent}
              sales={allSales}
            />
          )}

          {currentTab === 'report' && (
            <WeeklyReportTab
              sales={allSales}
              events={events}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsTab
              sales={allSales}
              onReloadData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Download Success Floating Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-950/90 border border-emerald-500/50 text-white px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-slide-up">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-300">{toastMsg.title}</h4>
            <p className="text-[11px] text-slate-200 mt-0.5">{toastMsg.desc}</p>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
