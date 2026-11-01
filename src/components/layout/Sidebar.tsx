'use client';

import React from 'react';
import {
  LayoutDashboard,
  TableProperties,
  FileSpreadsheet,
  CalendarDays,
  Target,
  FileText,
  Database,
  ShieldCheck,
  Store,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { UserRole } from '@/types/sales';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedStore: string;
  setSelectedStore: (store: string) => void;
  storeList: string[];
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  selectedStore,
  setSelectedStore,
  storeList,
}: SidebarProps) {
  const navItems = [
    { id: 'overview', label: '대시보드 개요', icon: LayoutDashboard, badge: '실시간' },
    { id: 'grid', label: '빠른 일괄 입력 (Grid)', icon: TableProperties, badge: '스프레드시트' },
    { id: 'import', label: 'POS/배달앱 엑셀 연동', icon: FileSpreadsheet },
    { id: 'events', label: '이벤트 전후 성과 (A/B)', icon: TrendingUp, highlight: true },
    { id: 'targets', label: '목표 & 캠페인 캘린더', icon: CalendarDays },
    { id: 'report', label: '주간/월간 리포트', icon: FileText },
    { id: 'settings', label: 'DB 스키마 & 연동', icon: Database },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">SalesFlow AI</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">매출 자동화 & 인텔리전스</p>
          </div>
        </div>

        {/* Role Switcher Box (권한 분리 시뮬레이션) */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              접속 권한 시뮬레이터
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              userRole === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {userRole === 'ADMIN' ? '본사 관리자' : '지점 매니저'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700/40 text-xs">
            <button
              type="button"
              onClick={() => setUserRole('ADMIN')}
              className={`py-1.5 px-2 rounded font-medium transition-all ${
                userRole === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              본사 총괄
            </button>
            <button
              type="button"
              onClick={() => {
                setUserRole('MANAGER');
                if (selectedStore === 'all' && storeList.length > 0) {
                  setSelectedStore(storeList[0]);
                }
              }}
              className={`py-1.5 px-2 rounded font-medium transition-all ${
                userRole === 'MANAGER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              매장 매니저
            </button>
          </div>

          {userRole === 'MANAGER' && (
            <div className="mt-2.5 pt-2 border-t border-slate-700/40">
              <label className="text-[11px] text-slate-400 mb-1 block">담당 소속 매장:</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md py-1 px-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {storeList.map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-white">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Box */}
      <div className="p-4 border-t border-slate-800/80 m-3 rounded-xl bg-slate-900/50 border">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-300">DB 실시간 동기화 완료</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          PostgreSQL 로컬 캐시 동작 중<br />
          3축(시간, 소속, 채널) 정규화 적용
        </p>
      </div>
    </aside>
  );
}
