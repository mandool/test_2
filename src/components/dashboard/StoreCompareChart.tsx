'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { SalesRecord } from '@/types/sales';
import { formatCurrency } from '@/lib/utils';
import { GitCompare } from 'lucide-react';

interface StoreCompareChartProps {
  sales: SalesRecord[];
}

const STORE_COLORS: Record<string, string> = {
  // 감자버거
  '감자버거 강남점': '#6366f1',
  '감자버거 역삼점': '#818cf8',
  '감자버거 마포점': '#4f46e5',
  '감자버거 인천점': '#a5b4fc',

  // 독일피자
  '독일피자 삼성점': '#f97316',
  '독일피자 송파점': '#ea580c',
  '독일피자 시흥점': '#fb923c',

  // 평범하지않은커피
  '평범하지않은커피 봉구점': '#10b981',
  '평범하지않은커피 수원점': '#059669',
  '평범하지않은커피 판교점': '#34d399',

  // 면스토랑
  '면스토랑 강남점': '#ec4899',
  '면스토랑 해운대점': '#f472b6',
};

export default function StoreCompareChart({ sales }: StoreCompareChartProps) {
  // 날짜별 각 지점의 실매출 피벗 테이블 데이터 생성
  const { pivotData, storesInView } = React.useMemo(() => {
    const dateMap = new Map<string, Record<string, any>>();
    const storeSet = new Set<string>();

    sales.forEach((r) => {
      storeSet.add(r.storeName);
      const row = dateMap.get(r.date) || { date: r.date, dateFormatted: r.date.slice(5) };
      row[r.storeName] = (row[r.storeName] || 0) + r.netSales;
      dateMap.set(r.date, row);
    });

    const sorted = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    return { pivotData: sorted, storesInView: Array.from(storeSet) };
  }, [sales]);

  return (
    <div className="glass-panel rounded-2xl p-5 border flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            지점별 일일 매출 추이 비교
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">매장별 실매출 실시간 교차 추적</p>
        </div>
      </div>

      <div className="w-full h-56">
        {pivotData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            데이터가 없습니다.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pivotData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} />
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
                    return (
                      <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl text-xs space-y-1.5 shadow-xl">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
                        {payload.map((p: any) => (
                          <div key={p.name} className="flex items-center justify-between gap-4">
                            <span style={{ color: p.color }} className="font-medium truncate max-w-[100px]">
                              {p.name}
                            </span>
                            <span className="font-bold text-white">{formatCurrency(p.value)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} iconSize={8} />
              {storesInView.map((st) => (
                <Line
                  key={st}
                  type="monotone"
                  dataKey={st}
                  name={st}
                  stroke={STORE_COLORS[st] || '#818cf8'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
