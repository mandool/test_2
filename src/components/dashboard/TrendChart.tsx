'use client';

import React, { useState } from 'react';
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
  ReferenceLine,
} from 'recharts';
import { SalesRecord, CampaignEvent } from '@/types/sales';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { MapPin, Info, Calendar } from 'lucide-react';

interface TrendChartProps {
  sales: SalesRecord[];
  events: CampaignEvent[];
}

export default function TrendChart({ sales, events }: TrendChartProps) {
  const [selectedEvent, setSelectedEvent] = useState<CampaignEvent | null>(null);

  // 날짜별 그룹핑 데이터 계산
  const chartData = React.useMemo(() => {
    const map = new Map<string, { date: string; netSales: number; grossSales: number; orders: number; aov: number }>();

    sales.forEach((r) => {
      const existing = map.get(r.date) || {
        date: r.date,
        netSales: 0,
        grossSales: 0,
        orders: 0,
        aov: 0,
      };
      existing.netSales += r.netSales;
      existing.grossSales += r.grossSales;
      existing.orders += r.orderCount;
      map.set(r.date, existing);
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 객단가 계산
    return sorted.map((item) => ({
      ...item,
      aov: item.orders > 0 ? Math.round(item.netSales / item.orders) : 0,
      dateFormatted: item.date.slice(5), // '10-15'
    }));
  }, [sales]);

  // 차트 범위 내에 있는 이벤트 필터링
  const activeEvents = React.useMemo(() => {
    const datesInChart = new Set(chartData.map((d) => d.date));
    return events.filter((ev) => datesInChart.has(ev.date));
  }, [chartData, events]);

  return (
    <div className="glass-panel rounded-2xl p-5 border flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            일별 매출 추이 및 이벤트 핀 타임라인
            <span className="text-[11px] font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
              실매출(Bar) + 결제건수(Line)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            특정 날짜의 세로 점선은 마케팅/VMD/신메뉴 이벤트가 발생한 시점입니다.
          </p>
        </div>

        {/* 이벤트 핀 뱃지 리스트 */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {activeEvents.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                selectedEvent?.id === ev.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-indigo-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span>{ev.date.slice(5)}</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="truncate max-w-[120px]">{ev.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Event Detail Banner */}
      {selectedEvent && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start justify-between animate-fade-in text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">{selectedEvent.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  {selectedEvent.type}
                </span>
                <span className="text-slate-400">({selectedEvent.date} • {selectedEvent.storeName})</span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">{selectedEvent.description}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedEvent(null)}
            className="text-slate-400 hover:text-white text-xs ml-3"
          >
            닫기
          </button>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full h-72">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            조회된 기간 내 매출 데이터가 없습니다.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="dateFormatted"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              {/* 왼쪽 Y축: 실매출 */}
              <YAxis
                yAxisId="sales"
                orientation="left"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${(val / 10000).toLocaleString()}만`}
              />
              {/* 오른쪽 Y축: 결제건수 */}
              <YAxis
                yAxisId="orders"
                orientation="right"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}건`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const eventOnThisDate = activeEvents.find((e) => e.date === data.date);
                    return (
                      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[190px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold text-white">
                          <span>{data.date}</span>
                          <span className="text-slate-400 font-normal">객단가: {formatCurrency(data.aov)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-indigo-400 font-semibold">
                            <span>실매출:</span>
                            <span>{formatCurrency(data.netSales)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>총매출(Gross):</span>
                            <span>{formatCurrency(data.grossSales)}</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-400 font-medium">
                            <span>결제 건수:</span>
                            <span>{formatNumber(data.orders)}건</span>
                          </div>
                        </div>
                        {eventOnThisDate && (
                          <div className="mt-2 pt-1.5 border-t border-indigo-500/30 text-indigo-300 text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate font-semibold">{eventOnThisDate.title}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                iconSize={8}
              />
              {/* Event Reference Lines */}
              {activeEvents.map((ev) => (
                <ReferenceLine
                  key={ev.id}
                  x={ev.date.slice(5)}
                  yAxisId="sales"
                  stroke={selectedEvent?.id === ev.id ? '#818cf8' : '#ec4899'}
                  strokeDasharray="4 4"
                  strokeWidth={selectedEvent?.id === ev.id ? 2.5 : 1.5}
                  label={{
                    value: `📌 ${ev.type}`,
                    position: 'top',
                    fill: '#f472b6',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              ))}
              <Bar
                yAxisId="sales"
                dataKey="netSales"
                name="일 실매출"
                fill="url(#salesGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Line
                yAxisId="orders"
                type="monotone"
                dataKey="orders"
                name="결제 건수"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
