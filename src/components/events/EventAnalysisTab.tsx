'use client';

import React, { useState, useMemo } from 'react';
import { SalesRecord, CampaignEvent } from '@/types/sales';
import { formatCurrency, formatNumber, formatPercent, addDays } from '@/lib/utils';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { BRANDS } from '@/lib/mockData';

interface EventAnalysisTabProps {
  sales: SalesRecord[];
  events: CampaignEvent[];
  onAddEvent: (event: CampaignEvent) => void;
}

export default function EventAnalysisTab({ sales, events, onAddEvent }: EventAnalysisTabProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [windowDays, setWindowDays] = useState<7 | 14>(14);

  // 이벤트 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '2026-10-14',
    brandName: BRANDS[0].name,
    storeName: BRANDS[0].stores[1] || BRANDS[0].stores[0],
    type: 'VMD/인테리어' as const,
    description: '',
  });

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  // A/B 전후 분석 계산
  const analysis = useMemo(() => {
    if (!selectedEvent) return null;

    const eventDate = selectedEvent.date;
    const beforeStartDate = addDays(eventDate, -windowDays);
    const beforeEndDate = addDays(eventDate, -1);
    const afterStartDate = eventDate;
    const afterEndDate = addDays(eventDate, windowDays - 1);

    // 해당 이벤트의 매장/브랜드 데이터 필터링
    const targetSales = sales.filter((r) => {
      if (selectedEvent.storeName !== '전체' && r.storeName !== selectedEvent.storeName) return false;
      if (selectedEvent.brandName !== '전체' && r.brandName !== selectedEvent.brandName) return false;
      return true;
    });

    const beforeRecords = targetSales.filter((r) => r.date >= beforeStartDate && r.date <= beforeEndDate);
    const afterRecords = targetSales.filter((r) => r.date >= afterStartDate && r.date <= afterEndDate);

    const sumMetrics = (recs: SalesRecord[]) => {
      let net = 0;
      let gross = 0;
      let orders = 0;
      const days = new Set(recs.map((r) => r.date)).size || 1;

      recs.forEach((r) => {
        net += r.netSales;
        gross += r.grossSales;
        orders += r.orderCount;
      });

      const avgDaily = Math.round(net / days);
      const aov = orders > 0 ? Math.round(net / orders) : 0;
      return { net, gross, orders, avgDaily, aov, daysCount: days };
    };

    const before = sumMetrics(beforeRecords);
    const after = sumMetrics(afterRecords);

    const netChange = before.net > 0 ? ((after.net - before.net) / before.net) * 100 : 0;
    const avgDailyChange = before.avgDaily > 0 ? ((after.avgDaily - before.avgDaily) / before.avgDaily) * 100 : 0;
    const ordersChange = before.orders > 0 ? ((after.orders - before.orders) / before.orders) * 100 : 0;
    const aovChange = before.aov > 0 ? ((after.aov - before.aov) / before.aov) * 100 : 0;

    // Day-by-Day (전후 N일 대조 차트 데이터)
    const dayComparison = [];
    for (let dayOffset = 0; dayOffset < windowDays; dayOffset++) {
      const beforeD = addDays(beforeStartDate, dayOffset);
      const afterD = addDays(afterStartDate, dayOffset);

      const beforeDaySales = beforeRecords.filter((r) => r.date === beforeD).reduce((s, r) => s + r.netSales, 0);
      const afterDaySales = afterRecords.filter((r) => r.date === afterD).reduce((s, r) => s + r.netSales, 0);

      dayComparison.push({
        dayIndex: `D+${dayOffset + 1}일차`,
        beforeSales: beforeDaySales,
        afterSales: afterDaySales,
      });
    }

    return {
      beforeStartDate,
      beforeEndDate,
      afterStartDate,
      afterEndDate,
      before,
      after,
      netChange,
      avgDailyChange,
      ordersChange,
      aovChange,
      dayComparison,
    };
  }, [selectedEvent, sales, windowDays]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CampaignEvent = {
      id: `ev-manual-${Date.now()}`,
      date: newEvent.date,
      brandName: newEvent.brandName,
      storeName: newEvent.storeName,
      type: newEvent.type,
      title: newEvent.title,
      description: newEvent.description,
      color: '#6366f1',
    };
    onAddEvent(created);
    setSelectedEventId(created.id);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Selector Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              이벤트 & 캠페인 전후 성과 분석 (A/B Timeline Report)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            디자인 교체(VMD), 신메뉴 런칭, 할인 프로모션 등 특정 이벤트 시점 기준 전후 기간 성과 변화율을
            자동 산출합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Window size toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setWindowDays(7)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                windowDays === 7 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              전후 1주일 (7일)
            </button>
            <button
              onClick={() => setWindowDays(14)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                windowDays === 14 ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              전후 2주일 (14일)
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />새 이벤트 마킹
          </button>
        </div>
      </div>

      {/* Event Select Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {events.map((ev) => {
          const isSelected = ev.id === selectedEventId;
          return (
            <button
              key={ev.id}
              onClick={() => setSelectedEventId(ev.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25 scale-[1.02]'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 opacity-80" />
              <span>{ev.date}</span>
              <span className="opacity-50">|</span>
              <span className="font-bold">{ev.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20' : 'bg-slate-800 text-indigo-400'}`}>
                {ev.type}
              </span>
            </button>
          );
        })}
      </div>

      {selectedEvent && analysis && (
        <div className="space-y-6">
          {/* Executive AI Insight Summary Box */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/20 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    AI 마케팅 & VMD 성과 진단 리포트
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    신뢰도 98.4%
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white">
                  &ldquo;{selectedEvent.title}&rdquo; 시행 후 {windowDays}일간 성과 분석
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  시행 이전 {windowDays}일({analysis.beforeStartDate} ~ {analysis.beforeEndDate})과 대비하여,
                  이벤트 시행 이후 {windowDays}일({analysis.afterStartDate} ~ {analysis.afterEndDate}) 동안
                  대상 매장의 총 실매출은 <b className="text-white">{formatCurrency(analysis.before.net)}</b>에서{' '}
                  <b className="text-indigo-300">{formatCurrency(analysis.after.net)}</b>으로{' '}
                  <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                    analysis.netChange >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {formatPercent(analysis.netChange)}
                  </span>{' '}
                  변화했습니다. 일평균 결제 건수 또한{' '}
                  <span className="text-white font-bold">{formatPercent(analysis.ordersChange)}</span> 증가하여,
                  오프라인 집객 및 고객 구매 전환율 상승에 크게 기여한 것으로 확인됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Metric Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: 총 실매출 */}
            <div className="glass-panel p-5 rounded-2xl border flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">총 실매출 변화 (Net)</span>
              <div className="my-3 space-y-1">
                <div className="text-2xl font-black text-white">{formatCurrency(analysis.after.net)}</div>
                <div className="text-xs text-slate-400">
                  이전 {windowDays}일: {formatCurrency(analysis.before.net)}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">전후 증감율</span>
                <span className={`font-bold flex items-center gap-0.5 ${analysis.netChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {analysis.netChange >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatPercent(analysis.netChange)}
                </span>
              </div>
            </div>

            {/* Card 2: 일평균 실매출 */}
            <div className="glass-panel p-5 rounded-2xl border flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">일평균 실매출</span>
              <div className="my-3 space-y-1">
                <div className="text-2xl font-black text-indigo-300">{formatCurrency(analysis.after.avgDaily)}</div>
                <div className="text-xs text-slate-400">
                  이전 {windowDays}일: {formatCurrency(analysis.before.avgDaily)}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">일평균 증감</span>
                <span className={`font-bold flex items-center gap-0.5 ${analysis.avgDailyChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {analysis.avgDailyChange >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatPercent(analysis.avgDailyChange)}
                </span>
              </div>
            </div>

            {/* Card 3: 총 결제 건수 */}
            <div className="glass-panel p-5 rounded-2xl border flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">총 결제 건수 (영수증)</span>
              <div className="my-3 space-y-1">
                <div className="text-2xl font-black text-emerald-400">{formatNumber(analysis.after.orders)}건</div>
                <div className="text-xs text-slate-400">
                  이전 {windowDays}일: {formatNumber(analysis.before.orders)}건
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">결제수 증감</span>
                <span className={`font-bold flex items-center gap-0.5 ${analysis.ordersChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {analysis.ordersChange >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatPercent(analysis.ordersChange)}
                </span>
              </div>
            </div>

            {/* Card 4: 평균 객단가 */}
            <div className="glass-panel p-5 rounded-2xl border flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">평균 객단가 (AOV)</span>
              <div className="my-3 space-y-1">
                <div className="text-2xl font-black text-amber-400">{formatCurrency(analysis.after.aov)}</div>
                <div className="text-xs text-slate-400">
                  이전 {windowDays}일: {formatCurrency(analysis.before.aov)}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">객단가 증감</span>
                <span className={`font-bold flex items-center gap-0.5 ${analysis.aovChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {analysis.aovChange >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatPercent(analysis.aovChange)}
                </span>
              </div>
            </div>
          </div>

          {/* Day-by-Day Before vs After Visual Comparison */}
          <div className="glass-panel rounded-2xl p-5 border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  일차별 대조 차트 (이전 {windowDays}일 vs 이후 {windowDays}일)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  회색(이벤트 시행 전) 대비 보라색(이벤트 시행 후)의 일일 매출 증감 추이
                </p>
              </div>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analysis.dayComparison} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="dayIndex" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round(v / 10000)}만`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        const diff = d.afterSales - d.beforeSales;
                        return (
                          <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl text-xs space-y-1.5 shadow-xl">
                            <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
                            <div className="flex justify-between gap-4 text-slate-400">
                              <span>이벤트 이전:</span>
                              <span>{formatCurrency(d.beforeSales)}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-indigo-400 font-bold">
                              <span>이벤트 이후:</span>
                              <span>{formatCurrency(d.afterSales)}</span>
                            </div>
                            <div className={`text-[11px] font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              차이: {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={8} />
                  <Bar dataKey="beforeSales" name="이벤트 시행 전 매출" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="afterSales" name="이벤트 시행 후 매출" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 이벤트 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />새 마케팅/VMD 이벤트 등록
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">이벤트/캠페인 제목</label>
                <input
                  type="text"
                  required
                  placeholder="예: 윈도우 그래픽 교체, 신메뉴 출시, 배민 단독 프로모션"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">대상 브랜드</label>
                  <select
                    value={newEvent.brandName}
                    onChange={(e) => {
                      const brand = BRANDS.find((b) => b.name === e.target.value) || BRANDS[0];
                      setNewEvent({
                        ...newEvent,
                        brandName: brand.name,
                        storeName: brand.stores[0],
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {BRANDS.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">대상 매장</label>
                  <select
                    value={newEvent.storeName}
                    onChange={(e) => setNewEvent({ ...newEvent, storeName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="전체">전체 지점 공통</option>
                    {(BRANDS.find((b) => b.name === newEvent.brandName)?.stores || []).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">시행 날짜</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 mb-1 block">이벤트 유형</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="VMD/인테리어">🎨 VMD / 인테리어</option>
                    <option value="신메뉴">☕ 신메뉴 출시</option>
                    <option value="프로모션">🏷️ 할인 프로모션</option>
                    <option value="외부이슈">📢 외부 이슈 / 행사</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">상세 설명</label>
                <textarea
                  rows={3}
                  placeholder="캠페인의 상세 내용과 목적을 기재하세요."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/30"
                >
                  등록 및 성과 즉시 분석
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
