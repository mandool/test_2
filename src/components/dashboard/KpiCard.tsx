'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  changeRate?: number;
  changeLabel?: string;
  progress?: number; // 0 to 100
  progressLabel?: string;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet';
}

export default function KpiCard({
  title,
  value,
  subValue,
  icon: Icon,
  changeRate,
  changeLabel = '전주 대비',
  progress,
  progressLabel,
  colorScheme = 'indigo',
}: KpiCardProps) {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      progressBg: 'bg-indigo-500',
      badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      progressBg: 'bg-emerald-500',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      progressBg: 'bg-amber-500',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      progressBg: 'bg-rose-500',
      badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    violet: {
      iconBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      progressBg: 'bg-violet-500',
      badge: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
  }[colorScheme];

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border flex flex-col justify-between relative overflow-hidden group">
      {/* Background ambient glow on hover */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400">{title}</span>
          <div className={cn('p-2 rounded-xl border', colorStyles.iconBg)}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-black text-white tracking-tight">{value}</div>
          {subValue && <div className="text-xs text-slate-400 font-normal">{subValue}</div>}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80">
        {progress !== undefined ? (
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400">{progressLabel || '목표 달성률'}</span>
              <span className="font-bold text-white">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700 ease-out', colorStyles.progressBg)}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        ) : changeRate !== undefined ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{changeLabel}</span>
            <div
              className={cn(
                'flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-xs border',
                changeRate > 0
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : changeRate < 0
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-slate-400 bg-slate-800 border-slate-700'
              )}
            >
              {changeRate > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : changeRate < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>{formatPercent(changeRate)}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
