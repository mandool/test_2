'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { SalesRecord } from '@/types/sales';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { CalendarRange } from 'lucide-react';

interface WeekdayWeekendChartProps {
  sales: SalesRecord[];
}

export default function WeekdayWeekendChart({ sales }: WeekdayWeekendChartProps) {
  const comparisonData = React.useMemo(() => {
    let weekdaySales = 0;
    let weekdayOrders = 0;
    let weekdayDays = new Set<string>();

    let weekendSales = 0;
    let weekendOrders = 0;
    let weekendDays = new Set<string>();

    sales.forEach((r) => {
      const isWknd = r.dayOfWeek === '토' || r.dayOfWeek === '일';
      if (isWknd) {
        weekendSales += r.netSales;
        weekendOrders += r.orderCount;
        weekendDays.add(r.date);
      } else {
        weekdaySales += r.netSales;
        weekdayOrders += r.orderCount;
        weekdayDays.add(r.date);
      }
    });

    const weekdayAvgDaily = weekdayDays.size > 0 ? Math.round(weekdaySales / weekdayDays.size) : 0;
    const weekendAvgDaily = weekendDays.size > 0 ? Math.round(weekendSales / weekendDays.size) : 0;

    const weekdayAov = weekdayOrders > 0 ? Math.round(weekdaySales / weekdayOrders) : 0;
    const weekendAov = weekendOrders > 0 ? Math.round(weekendSales / weekendOrders) : 0;

    const diffPercent = weekdayAvgDaily > 0 ? ((weekendAvgDaily - weekdayAvgDaily) / weekdayAvgDaily) * 100 : 0;

    return [
      {
        category: '평일 (월~금)',
        avgSales: weekdayAvgDaily,
        aov: weekdayAov,
      },
      {
        category: '주말 (토~일)',
        avgSales: weekendAvgDaily,
        aov: weekendAov,
        diffPercent,
      },
    ];
  }, [sales]);

  const weekendMultiplier =
    comparisonData[0].avgSales > 0
      ? (comparisonData[1].avgSales / comparisonData[0].avgSales).toFixed(2)
      : '1.0';

  return (
    <div className="glass-panel rounded-2xl p-5 border flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CalendarRange className="w-4 h-4 text-indigo-400" />
            평일 vs 주말 성과 비교
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            주말 일평균 매출이 평일 대비 <span className="text-emerald-400 font-bold">{weekendMultiplier}배</span> 수준
          </p>
        </div>
      </div>

      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${Math.round(val / 10000)}만`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl text-xs space-y-1.5 shadow-xl">
                      <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
                      <div className="flex justify-between gap-4 text-indigo-400 font-semibold">
                        <span>일평균 실매출:</span>
                        <span>{formatCurrency(data.avgSales)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-amber-400 font-medium">
                        <span>평균 객단가(AOV):</span>
                        <span>{formatCurrency(data.aov)}</span>
                      </div>
                      {data.diffPercent !== undefined && (
                        <div className="text-[11px] text-emerald-400 font-bold">
                          평일 대비: {formatPercent(data.diffPercent)}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} iconSize={8} />
            <Bar dataKey="avgSales" name="일평균 실매출" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45} />
            <Bar dataKey="aov" name="평균 객단가" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-center">
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">평일 객단가</div>
          <div className="text-xs font-bold text-slate-200 mt-0.5">{formatCurrency(comparisonData[0].aov)}</div>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">주말 객단가</div>
          <div className="text-xs font-bold text-amber-400 mt-0.5">{formatCurrency(comparisonData[1].aov)}</div>
        </div>
      </div>
    </div>
  );
}
