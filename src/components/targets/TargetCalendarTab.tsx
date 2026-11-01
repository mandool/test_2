'use client';

import React, { useState } from 'react';
import { StoreTarget, CampaignEvent, SalesRecord } from '@/types/sales';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Target, Calendar, Edit3, Check, Plus, Sparkles } from 'lucide-react';
import { BRANDS } from '@/lib/mockData';

interface TargetCalendarTabProps {
  targets: StoreTarget[];
  onSaveTargets: (targets: StoreTarget[]) => void;
  events: CampaignEvent[];
  onAddEvent: (event: CampaignEvent) => void;
  sales: SalesRecord[];
}

export default function TargetCalendarTab({
  targets,
  onSaveTargets,
  events,
  onAddEvent,
  sales,
}: TargetCalendarTabProps) {
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // 각 지점별 당월 누적 실매출 매핑
  const storeSalesMap = React.useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((r) => {
      // 2026-10월 필터
      if (r.date.startsWith('2026-10')) {
        map.set(r.storeName, (map.get(r.storeName) || 0) + r.netSales);
      }
    });
    return map;
  }, [sales]);

  const handleStartEdit = (t: StoreTarget) => {
    setEditingTargetId(t.id);
    setEditValue(t.targetSales);
  };

  const handleSaveEdit = (targetId: string) => {
    const updated = targets.map((t) => (t.id === targetId ? { ...t, targetSales: editValue } : t));
    onSaveTargets(updated);
    setEditingTargetId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          지점별 월간 목표 매출 및 캠페인 캘린더 관리
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          매장별 2026년 10월 목표 매출액을 설정하고, 현재 실시간 실매출 달성률과 함께 예정된 디자인/마케팅 일정을
          통합 모니터링합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Target Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              2026년 10월 지점별 목표 매출 및 진척도
            </h3>
            <span className="text-xs text-slate-400">총 {targets.length}개 매장 설정됨</span>
          </div>

          <div className="space-y-3">
            {targets.map((t) => {
              const currentNet = storeSalesMap.get(t.storeName) || 0;
              const rate = t.targetSales > 0 ? (currentNet / t.targetSales) * 100 : 0;
              const isEditing = editingTargetId === t.id;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{t.storeName}</span>
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                          {t.brandName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        당월 누적 실매출: <b className="text-slate-200">{formatCurrency(currentNet)}</b>
                      </div>
                    </div>

                    <div className="text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-28 bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white text-right"
                          />
                          <button
                            onClick={() => handleSaveEdit(t.id)}
                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-black text-xs text-indigo-300">
                              목표: {formatCurrency(t.targetSales)}
                            </div>
                            <div className="text-[11px] font-bold text-emerald-400">
                              달성률 {rate.toFixed(1)}%
                            </div>
                          </div>
                          <button
                            onClick={() => handleStartEdit(t)}
                            title="목표액 수정"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rate >= 100 ? 'bg-emerald-500' : rate >= 70 ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Campaign Calendar / Timeline List */}
        <div className="glass-panel p-5 rounded-2xl border space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              진행 중 캠페인 일정
            </h3>
            <span className="text-[11px] text-indigo-400 font-semibold">{events.length}건 등록</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400">{ev.date}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {ev.type}
                  </span>
                </div>
                <div className="font-bold text-xs text-white">{ev.title}</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">{ev.description}</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                  <span>📍 {ev.storeName}</span>
                  <span>•</span>
                  <span>{ev.brandName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
