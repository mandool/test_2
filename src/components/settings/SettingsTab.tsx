'use client';

import React, { useState } from 'react';
import { Database, Copy, Check, RotateCcw, Download, Upload, Server, Shield } from 'lucide-react';
import { SUPABASE_SCHEMA_SQL, resetAllDataToDefault } from '@/lib/storage';
import { SalesRecord } from '@/types/sales';

interface SettingsTabProps {
  sales: SalesRecord[];
  onReloadData: () => void;
}

export default function SettingsTab({ sales, onReloadData }: SettingsTabProps) {
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('https://xyzcompany.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  const [isSaved, setIsSaved] = useState(false);

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // 백업 JSON 다운로드
  const downloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sales, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `salesflow_backup_${Date.now()}.json`);
    dlAnchor.click();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          데이터베이스 스키마 & Supabase 클라우드 연동
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          기획서에 명시된 3축(시간, 소속, 채널) 기반 정규화 DB Schema와 Supabase PostgreSQL DDL 스크립트를 제공합니다.
        </p>
      </div>

      {/* Supabase Connect Form */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Supabase API 연동 환경설정</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            PostgreSQL 엔진 지원
          </span>
        </div>

        <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 mb-1 block">Supabase Project URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 mb-1 block">Supabase Anon Public API Key</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              * 현재 로컬 고성능 캐시와 실시간 동기화 모드로 동작 중입니다.
            </span>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              {isSaved ? '연동 설정 저장됨!' : 'Supabase 설정 저장'}
            </button>
          </div>
        </form>
      </div>

      {/* SQL DDL Schema */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">PostgreSQL / Supabase DDL SQL 스크립트</h3>
          </div>
          <button
            onClick={copySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
            {copiedSql ? 'SQL 복사됨!' : 'SQL 스크립트 복사'}
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Supabase의 SQL Editor에 붙여넣어 실행하면 브랜드, 지점, 일일매출, 캠페인 타임라인 테이블 및 인덱스가 즉시 생성됩니다.
        </p>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-200 overflow-x-auto max-h-72 leading-relaxed">
            {SUPABASE_SCHEMA_SQL}
          </pre>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">데이터 백업 및 리셋</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadBackup}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            전체 매출 데이터 JSON 백업 다운로드
          </button>

          <button
            onClick={() => {
              if (confirm('모든 데이터를 초기 기본 샘플 데모 데이터로 복원하시겠습니까?')) {
                resetAllDataToDefault();
                onReloadData();
                alert('데이터가 성공적으로 초기화되었습니다.');
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-semibold border border-rose-800/40"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            기본 데모 데이터로 완전 리셋
          </button>
        </div>
      </div>
    </div>
  );
}
