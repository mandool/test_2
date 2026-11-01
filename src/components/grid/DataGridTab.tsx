'use client';

import React, { useState, useMemo } from 'react';
import { SalesRecord, WeatherType, ChannelType, UserRole } from '@/types/sales';
import { formatCurrency, formatNumber, getDayOfWeek, formatDate } from '@/lib/utils';
import { checkAnomaly } from '@/lib/storage';
import { BRANDS, CHANNELS } from '@/lib/mockData';
import { exportComprehensiveExcel } from '@/lib/excelExport';
import * as XLSX from 'xlsx';
import {
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Search,
  Filter,
  Save,
  HelpCircle,
} from 'lucide-react';

interface DataGridTabProps {
  sales: SalesRecord[];
  allSales: SalesRecord[];
  onSaveRecord: (record: SalesRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBulkAddRecords: (records: SalesRecord[]) => void;
  userRole: UserRole;
  selectedStore: string;
}

export default function DataGridTab({
  sales,
  allSales,
  onSaveRecord,
  onDeleteRecord,
  onBulkAddRecords,
  userRole,
  selectedStore,
}: DataGridTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SalesRecord>>({});
  const [localSearch, setLocalSearch] = useState('');
  const [showAnomalyOnly, setShowAnomalyOnly] = useState(false);

  // 새 행 추가 모달/인라인 상태
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRow, setNewRow] = useState<Partial<SalesRecord>>({
    date: '2026-10-25',
    dayOfWeek: '일',
    weather: '맑음',
    manager: '정해진',
    brandName: BRANDS[0].name,
    storeName: BRANDS[0].stores[0],
    channel: '오프라인 매장',
    grossSales: 2000000,
    discountAmount: 100000,
    orderCount: 150,
    issueTags: [],
    notes: '',
  });

  // 검색 및 이상치 필터
  const displayRecords = useMemo(() => {
    return sales
      .filter((r) => {
        if (localSearch.trim()) {
          const q = localSearch.toLowerCase();
          const match =
            r.date.includes(q) ||
            r.storeName.toLowerCase().includes(q) ||
            r.manager.toLowerCase().includes(q) ||
            (r.notes || '').toLowerCase().includes(q) ||
            r.issueTags.some((t) => t.toLowerCase().includes(q));
          if (!match) return false;
        }

        if (showAnomalyOnly) {
          const anomaly = checkAnomaly(r, allSales);
          if (!anomaly.isAnomaly) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, allSales, localSearch, showAnomalyOnly]);

  // 편집 시작
  const startEdit = (record: SalesRecord) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  // 편집 필드 변경 시 자동 계산
  const handleEditChange = (field: keyof SalesRecord, value: any) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'grossSales' || field === 'discountAmount') {
        const gross = Number(field === 'grossSales' ? value : updated.grossSales || 0);
        const discount = Number(field === 'discountAmount' ? value : updated.discountAmount || 0);
        const net = Math.max(0, gross - discount);
        updated.netSales = net;
        const orders = Number(updated.orderCount || 1);
        updated.averageOrderValue = orders > 0 ? Math.round(net / orders) : 0;
      }
      if (field === 'orderCount') {
        const orders = Number(value || 1);
        const net = Number(updated.netSales || 0);
        updated.averageOrderValue = orders > 0 ? Math.round(net / orders) : 0;
      }
      return updated;
    });
  };

  // 저장 완료
  const saveEdit = () => {
    if (!editingId || !editForm) return;
    onSaveRecord(editForm as SalesRecord);
    setEditingId(null);
    setEditForm({});
  };

  // 새 레코드 추가 제출
  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = Number(newRow.grossSales || 0);
    const discount = Number(newRow.discountAmount || 0);
    const net = Math.max(0, gross - discount);
    const orders = Number(newRow.orderCount || 1);
    const aov = orders > 0 ? Math.round(net / orders) : 0;

    const brand = BRANDS.find((b) => b.name === newRow.brandName) || BRANDS[0];

    const record: SalesRecord = {
      id: `rec-manual-${Date.now()}`,
      date: newRow.date || '2026-10-25',
      dayOfWeek: getDayOfWeek(newRow.date || '2026-10-25'),
      weather: newRow.weather as WeatherType,
      manager: newRow.manager || '담당자',
      brandId: brand.id,
      brandName: brand.name,
      storeId: `st-${newRow.storeName}`,
      storeName: newRow.storeName || brand.stores[0],
      channel: (newRow.channel as ChannelType) || '오프라인 매장',
      grossSales: gross,
      discountAmount: discount,
      netSales: net,
      orderCount: orders,
      averageOrderValue: aov,
      issueTags: newRow.notes ? [newRow.notes.split(' ')[0]] : [],
      notes: newRow.notes || '',
    };

    onBulkAddRecords([record]);
    setIsAddingNew(false);
  };

  // XLSX 엑셀 종합 정산 보고서 내보내기 (다중 시트 지원)
  const exportToExcel = () => {
    exportComprehensiveExcel({
      sales: displayRecords,
      allSales,
      filterDescription: 'DataGrid 현재 조회 데이터',
    });
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />새 매출 행 추가 (Enter)
          </button>

          <button
            onClick={() => setShowAnomalyOnly(!showAnomalyOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              showAnomalyOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            이상치(±50% 변동)만 보기
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Excel 다운로드
          </button>
        </div>

        {/* Local Search & Count */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="그리드 내 실시간 검색..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>
          <span className="text-xs text-slate-400">
            총 <b className="text-white font-semibold">{displayRecords.length}</b>건
          </span>
        </div>
      </div>

      {/* Guide notice */}
      <div className="px-4 py-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <b>스프레드시트 인라인 편집 팁:</b> 행을 더블클릭하거나 우측 [수정] 버튼을 눌러 인라인으로
            금액/건수를 수정하면 <b>실매출(Net)과 객단가(AOV)가 실시간 자동 계산</b>됩니다.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> +50% 급등(Spike)
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> -50% 급락(Drop)
          </span>
        </div>
      </div>

      {/* Data Grid Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/90 sticky top-0 z-20 border-b border-slate-800 text-slate-400 font-semibold select-none">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 min-w-[100px]">일자 (요일)</th>
                <th className="py-3 px-3 min-w-[110px]">브랜드</th>
                <th className="py-3 px-3 min-w-[120px]">매장 (지점)</th>
                <th className="py-3 px-3 min-w-[100px]">판매 채널</th>
                <th className="py-3 px-3 min-w-[110px] text-right">총매출(Gross)</th>
                <th className="py-3 px-3 min-w-[100px] text-right">할인금액</th>
                <th className="py-3 px-3 min-w-[120px] text-right">실매출(Net)</th>
                <th className="py-3 px-3 min-w-[90px] text-right">결제건수</th>
                <th className="py-3 px-3 min-w-[100px] text-right">객단가(AOV)</th>
                <th className="py-3 px-3 min-w-[130px]">이상치 알림</th>
                <th className="py-3 px-3 min-w-[140px]">이슈 태그 / 메모</th>
                <th className="py-3 px-3 w-20 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500">
                    조건에 해당하는 매출 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                displayRecords.map((record, index) => {
                  const isEditing = editingId === record.id;
                  const anomaly = checkAnomaly(record, allSales);

                  // 이상치 배경색 하이라이트
                  let rowBgClass = 'hover:bg-slate-800/40 transition-colors';
                  if (anomaly.isAnomaly) {
                    if (anomaly.type === 'spike') {
                      rowBgClass = 'bg-emerald-950/25 hover:bg-emerald-950/40 border-l-4 border-l-emerald-500';
                    } else if (anomaly.type === 'drop') {
                      rowBgClass = 'bg-rose-950/25 hover:bg-rose-950/40 border-l-4 border-l-rose-500';
                    }
                  }

                  return (
                    <tr
                      key={record.id}
                      onDoubleClick={() => !isEditing && startEdit(record)}
                      className={rowBgClass}
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                        {index + 1}
                      </td>

                      {/* Date & Day */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editForm.date || ''}
                            onChange={(e) => handleEditChange('date', e.target.value)}
                            className="bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">{record.date}</span>
                            <span
                              className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                                record.dayOfWeek === '토' || record.dayOfWeek === '일'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {record.dayOfWeek}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Brand */}
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[120px]">
                        {record.brandName}
                      </td>

                      {/* Store */}
                      <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[130px]">
                        {record.storeName}
                      </td>

                      {/* Channel */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            record.channel === '오프라인 매장'
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                              : record.channel === '배달의민족'
                              ? 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}
                        >
                          {record.channel}
                        </span>
                      </td>

                      {/* Gross Sales */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.grossSales ?? 0}
                            onChange={(e) => handleEditChange('grossSales', Number(e.target.value))}
                            className="w-24 bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-right text-xs text-white"
                          />
                        ) : (
                          <span className="text-slate-400">{formatCurrency(record.grossSales)}</span>
                        )}
                      </td>

                      {/* Discount Amount */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.discountAmount ?? 0}
                            onChange={(e) => handleEditChange('discountAmount', Number(e.target.value))}
                            className="w-20 bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-right text-xs text-white"
                          />
                        ) : (
                          <span className="text-rose-400/90 font-mono">
                            -{formatCurrency(record.discountAmount)}
                          </span>
                        )}
                      </td>

                      {/* Net Sales */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-bold text-indigo-300 text-xs">
                          {formatCurrency(isEditing ? editForm.netSales || 0 : record.netSales)}
                        </span>
                      </td>

                      {/* Order Count */}
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.orderCount ?? 0}
                            onChange={(e) => handleEditChange('orderCount', Number(e.target.value))}
                            className="w-16 bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-right text-xs text-white"
                          />
                        ) : (
                          <span className="text-slate-300">{formatNumber(record.orderCount)}건</span>
                        )}
                      </td>

                      {/* AOV (객단가) */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-semibold text-slate-300">
                          {formatCurrency(isEditing ? editForm.averageOrderValue || 0 : record.averageOrderValue)}
                        </span>
                      </td>

                      {/* Anomaly Badge */}
                      <td className="py-2.5 px-3">
                        {anomaly.isAnomaly ? (
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              anomaly.type === 'spike'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse_subtle'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                            title={`평균(${formatCurrency(anomaly.averageSales || 0)}) 대비 ${anomaly.percentDiff?.toFixed(1)}% 변동`}
                          >
                            {anomaly.type === 'spike' ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-400" />
                            )}
                            <span>{anomaly.type === 'spike' ? '급등' : '급락'}</span>
                            <span>{anomaly.percentDiff && `${Math.abs(anomaly.percentDiff).toFixed(0)}%`}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">정상</span>
                        )}
                      </td>

                      {/* Notes / Tags */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.notes || ''}
                            onChange={(e) => handleEditChange('notes', e.target.value)}
                            placeholder="특이사항 메모 입력"
                            className="w-full bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {record.issueTags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              >
                                #{tag}
                              </span>
                            ))}
                            {record.notes && (
                              <span className="text-[11px] text-slate-400 truncate max-w-[120px]" title={record.notes}>
                                {record.notes}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={saveEdit}
                              title="저장"
                              className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              title="취소"
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(record)}
                              title="수정"
                              className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('해당 매출 행을 삭제하시겠습니까?')) {
                                  onDeleteRecord(record.id);
                                }
                              }}
                              title="삭제"
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 새 행 추가 인라인 모달/폼 */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                새 일일 매출 레코드 추가
              </h3>
              <button
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">매출 일자</label>
                  <input
                    type="date"
                    required
                    value={newRow.date}
                    onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">날씨 상태</label>
                  <select
                    value={newRow.weather}
                    onChange={(e) => setNewRow({ ...newRow, weather: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="맑음" className="bg-slate-900 text-white">☀️ 맑음</option>
                    <option value="흐림" className="bg-slate-900 text-white">☁️ 흐림</option>
                    <option value="비" className="bg-slate-900 text-white">🌧️ 비</option>
                    <option value="눈" className="bg-slate-900 text-white">❄️ 눈</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">소속 브랜드</label>
                  <select
                    value={newRow.brandName}
                    onChange={(e) => {
                      const brand = BRANDS.find((b) => b.name === e.target.value) || BRANDS[0];
                      setNewRow({
                        ...newRow,
                        brandName: brand.name,
                        storeName: brand.stores[0],
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {BRANDS.map((b) => (
                      <option key={b.id} value={b.name} className="bg-slate-900 text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">매장 (지점)</label>
                  <select
                    value={newRow.storeName}
                    onChange={(e) => setNewRow({ ...newRow, storeName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {(BRANDS.find((b) => b.name === newRow.brandName)?.stores || []).map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">판매 채널</label>
                  <select
                    value={newRow.channel}
                    onChange={(e) => setNewRow({ ...newRow, channel: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch} value={ch} className="bg-slate-900 text-white">
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">담당자 이름</label>
                  <input
                    type="text"
                    required
                    value={newRow.manager}
                    onChange={(e) => setNewRow({ ...newRow, manager: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">총매출(Gross, 원)</label>
                  <input
                    type="number"
                    required
                    value={newRow.grossSales}
                    onChange={(e) => setNewRow({ ...newRow, grossSales: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">할인/프로모션(원)</label>
                  <input
                    type="number"
                    value={newRow.discountAmount}
                    onChange={(e) => setNewRow({ ...newRow, discountAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">결제 건수(영수증)</label>
                  <input
                    type="number"
                    required
                    value={newRow.orderCount}
                    onChange={(e) => setNewRow({ ...newRow, orderCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              {/* 실시간 계산 결과 프리뷰 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">실매출(Net): </span>
                  <span className="font-bold text-indigo-400 text-sm">
                    {formatCurrency(Math.max(0, (newRow.grossSales || 0) - (newRow.discountAmount || 0)))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">자동 계산 객단가: </span>
                  <span className="font-bold text-white text-sm">
                    {formatCurrency(
                      (newRow.orderCount || 0) > 0
                        ? Math.round(
                            Math.max(0, (newRow.grossSales || 0) - (newRow.discountAmount || 0)) /
                              (newRow.orderCount || 1)
                          )
                        : 0
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">이슈/캠페인 태그 및 비고</label>
                <input
                  type="text"
                  placeholder="예: 윈도우 그래픽 교체 후 첫 주말, 신메뉴 출시 등"
                  value={newRow.notes}
                  onChange={(e) => setNewRow({ ...newRow, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/30"
                >
                  DB에 즉시 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
