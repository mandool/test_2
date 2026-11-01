'use client';

import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { SalesRecord } from '@/types/sales';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Layers, Building2 } from 'lucide-react';

interface ChannelDonutChartProps {
  sales: SalesRecord[];
}

const PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function ChannelDonutChart({ sales }: ChannelDonutChartProps) {
  const [mode, setMode] = useState<'channel' | 'brand'>('channel');

  const { data, totalSales } = React.useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;

    sales.forEach((r) => {
      const key = mode === 'channel' ? r.channel : r.brandName;
      const current = map.get(key) || 0;
      map.set(key, current + r.netSales);
      total += r.netSales;
    });

    const list = Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return { data: list, totalSales: total };
  }, [sales, mode]);

  return (
    <div className="glass-panel rounded-2xl p-5 border flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            {mode === 'channel' ? <Layers className="w-4 h-4 text-indigo-400" /> : <Building2 className="w-4 h-4 text-indigo-400" />}
            {mode === 'channel' ? '판매 채널별 매출 비중' : '브랜드별 매출 점유율'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">총 실매출: {formatCurrency(totalSales, true)}</p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setMode('channel')}
            className={`px-2 py-0.5 rounded font-medium transition-all ${
              mode === 'channel' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            채널별
          </button>
          <button
            onClick={() => setMode('brand')}
            className={`px-2 py-0.5 rounded font-medium transition-all ${
              mode === 'brand' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            브랜드별
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-52 relative">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            데이터가 없습니다.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-indigo-400 font-semibold">{formatCurrency(item.value)}</div>
                        <div className="text-slate-400">{formatPercent(item.percent, false)}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend list */}
      <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800 text-xs">
        {data.slice(0, 4).map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
              />
              <span className="text-slate-300 truncate max-w-[110px]">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{formatCurrency(item.value, true)}</span>
              <span className="text-[11px] text-slate-400 font-medium w-9 text-right">{item.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
