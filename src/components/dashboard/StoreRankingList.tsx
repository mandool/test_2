'use client';

import React from 'react';
import { Trophy, AlertTriangle, ArrowUpRight, Store } from 'lucide-react';
import { SalesRecord } from '@/types/sales';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface StoreRankingListProps {
  sales: SalesRecord[];
}

export default function StoreRankingList({ sales }: StoreRankingListProps) {
  const rankingData = React.useMemo(() => {
    const storeMap = new Map<
      string,
      {
        storeName: string;
        brandName: string;
        netSales: number;
        grossSales: number;
        orderCount: number;
        anomalyCount: number;
      }
    >();

    sales.forEach((r) => {
      const existing = storeMap.get(r.storeName) || {
        storeName: r.storeName,
        brandName: r.brandName,
        netSales: 0,
        grossSales: 0,
        orderCount: 0,
        anomalyCount: 0,
      };

      existing.netSales += r.netSales;
      existing.grossSales += r.grossSales;
      existing.orderCount += r.orderCount;

      // 이슈 태그나 급증/급감 여부
      if (r.issueTags.some((t) => t.includes('콘서트') || t.includes('대박') || t.includes('효과'))) {
        existing.anomalyCount += 1;
      }

      storeMap.set(r.storeName, existing);
    });

    const list = Array.from(storeMap.values()).map((item) => ({
      ...item,
      aov: item.orderCount > 0 ? Math.round(item.netSales / item.orderCount) : 0,
    }));

    return list.sort((a, b) => b.netSales - a.netSales);
  }, [sales]);

  return (
    <div className="glass-panel rounded-2xl p-5 border flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            지점별 매출 성과 랭킹
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">선택된 기간 누적 실매출 기준 순위</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
          총 {rankingData.length}개 매장
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {rankingData.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">데이터가 없습니다.</div>
        ) : (
          rankingData.map((item, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            return (
              <div
                key={item.storeName}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  rank === 1
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : isTop3
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      rank === 1
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : rank === 3
                        ? 'bg-amber-700/80 text-amber-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">{item.storeName}</span>
                      {item.anomalyCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          <ArrowUpRight className="w-2.5 h-2.5" />
                          특수 스파이크
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{item.brandName}</span>
                      <span>•</span>
                      <span>결제 {formatNumber(item.orderCount)}건</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-xs text-indigo-300">{formatCurrency(item.netSales)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    객단가 <span className="text-slate-300">{formatCurrency(item.aov)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
