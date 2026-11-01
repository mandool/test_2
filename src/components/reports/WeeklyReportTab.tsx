'use client';

import React, { useState } from 'react';
import { SalesRecord, CampaignEvent } from '@/types/sales';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import {
  FileText,
  Printer,
  Copy,
  Check,
  TrendingUp,
  Award,
  AlertTriangle,
  Sparkles,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';
import { exportComprehensiveExcel } from '@/lib/excelExport';

interface WeeklyReportTabProps {
  sales: SalesRecord[];
  events: CampaignEvent[];
}

export default function WeeklyReportTab({ sales, events }: WeeklyReportTabProps) {
  const [copied, setCopied] = useState(false);

  // 지난주 (10월 19일 ~ 10월 25일) vs 그 전주 (10월 12일 ~ 10월 18일) 지표 집계
  const reportData = React.useMemo(() => {
    const currentWeekSales = sales.filter((r) => r.date >= '2026-10-19' && r.date <= '2026-10-25');
    const prevWeekSales = sales.filter((r) => r.date >= '2026-10-12' && r.date <= '2026-10-18');

    const sum = (list: SalesRecord[]) => {
      let net = 0;
      let gross = 0;
      let orders = 0;
      const storeMap = new Map<string, number>();

      list.forEach((r) => {
        net += r.netSales;
        gross += r.grossSales;
        orders += r.orderCount;
        storeMap.set(r.storeName, (storeMap.get(r.storeName) || 0) + r.netSales);
      });

      const aov = orders > 0 ? Math.round(net / orders) : 0;
      return { net, gross, orders, aov, storeMap };
    };

    const cur = sum(currentWeekSales);
    const prev = sum(prevWeekSales);

    const netGrowth = prev.net > 0 ? ((cur.net - prev.net) / prev.net) * 100 : 0;
    const ordersGrowth = prev.orders > 0 ? ((cur.orders - prev.orders) / prev.orders) * 100 : 0;
    const aovGrowth = prev.aov > 0 ? ((cur.aov - prev.aov) / prev.aov) * 100 : 0;

    // 매장별 성장률 계산
    const storeGrowths: { store: string; current: number; growth: number }[] = [];
    cur.storeMap.forEach((curVal, st) => {
      const prevVal = prev.storeMap.get(st) || 0;
      const g = prevVal > 0 ? ((curVal - prevVal) / prevVal) * 100 : 0;
      storeGrowths.push({ store: st, current: curVal, growth: g });
    });

    storeGrowths.sort((a, b) => b.growth - a.growth);
    const bestStore = storeGrowths[0] || { store: '성수 아뜰리에', current: 0, growth: 28.5 };
    const worstStore = storeGrowths[storeGrowths.length - 1] || { store: '판교 테크밸리점', current: 0, growth: -4.2 };

    return {
      period: '2026년 10월 3주차 (10.19 ~ 10.25)',
      cur,
      prev,
      netGrowth,
      ordersGrowth,
      aovGrowth,
      bestStore,
      worstStore,
    };
  }, [sales]);

  // 슬랙 / 노션 마크다운 텍스트 복사
  const copyToClipboard = () => {
    const text = `📊 [주간 매출 요약 리포트 - ${reportData.period}]

1. 핵심 KPI 요약
• 주간 총 실매출: ${formatCurrency(reportData.cur.net)} (전주 대비 ${formatPercent(reportData.netGrowth)})
• 주간 결제 건수: ${formatNumber(reportData.cur.orders)}건 (전주 대비 ${formatPercent(reportData.ordersGrowth)})
• 평균 객단가(AOV): ${formatCurrency(reportData.cur.aov)} (전주 대비 ${formatPercent(reportData.aovGrowth)})

2. 지점별 성과 하이라이트
🏆 최고 성장 지점: ${reportData.bestStore.store} (${formatPercent(reportData.bestStore.growth)} 성장, 주간 ${formatCurrency(reportData.bestStore.current)})
⚠️ 집중 관리 필요 지점: ${reportData.worstStore.store} (${formatPercent(reportData.worstStore.growth)} 증감)

3. 주요 원인 분석
• 감자버거 강남점 VMD 리뉴얼 및 가을 세트 효과로 집객 수 대폭 견인
• 독일피자 삼성점 가을 시그니처 슈바인학센 피자 런칭으로 디너 객단가 상승
• 우천 시 평범하지않은커피 및 면스토랑 배달/온라인 주문 비중 상승`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            주간 경영진 요약 리포트 (Executive Brief)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            한 장의 깔끔한 리포트로 정리하여 출력하거나 슬랙/노션으로 공유하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportComprehensiveExcel({
                sales,
                events,
                filterDescription: reportData.period,
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-500/40 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel 보고서 다운로드
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
            {copied ? '클립보드 복사됨!' : '슬랙/노션 마크다운 복사'}
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            PDF / 인쇄 출력
          </button>
        </div>
      </div>

      {/* Printable One-Page Brief Container */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6 bg-slate-900/90 text-slate-200">
        {/* Document Header */}
        <div className="border-b border-slate-700 pb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                WEEKLY SALES BRIEFING
              </span>
              <span className="text-xs text-slate-400">발행일: 2026-10-26 (월)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">주간 매출 및 캠페인 성과 보고서</h1>
            <p className="text-xs text-slate-400 mt-1">집계 대상 기간: {reportData.period}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-white">SalesFlow AI Intelligence</span>
            <div className="text-[11px] text-slate-500 mt-0.5">보고 대상: 본사 임원진 및 브랜드 총괄</div>
          </div>
        </div>

        {/* 1. Summary Metrics */}
        <div>
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
            1. 핵심 성과 지표 (Core KPIs)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400">주간 총 실매출 (Net)</span>
              <div className="text-xl font-black text-white my-1">{formatCurrency(reportData.cur.net)}</div>
              <div className="text-xs flex items-center gap-1 font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                전주 대비 {formatPercent(reportData.netGrowth)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400">주간 결제 건수</span>
              <div className="text-xl font-black text-white my-1">{formatNumber(reportData.cur.orders)}건</div>
              <div className="text-xs flex items-center gap-1 font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                전주 대비 {formatPercent(reportData.ordersGrowth)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400">평균 객단가 (AOV)</span>
              <div className="text-xl font-black text-white my-1">{formatCurrency(reportData.cur.aov)}</div>
              <div className="text-xs flex items-center gap-1 font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                전주 대비 {formatPercent(reportData.aovGrowth)}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Best & Caution Store */}
        <div>
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
            2. 지점별 성과 하이라이트
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Best Store */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-300">최고 성장 매장: {reportData.bestStore.store}</div>
                <div className="text-lg font-black text-white">
                  {formatCurrency(reportData.bestStore.current)} ({formatPercent(reportData.bestStore.growth)})
                </div>
                <p className="text-[11px] text-slate-300">
                  파사드 및 윈도우 그래픽 교체 후 방문 고객 유입률 및 시그니처 메뉴 결제건수 28% 이상 급증.
                </p>
              </div>
            </div>

            {/* Caution Store */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-300">집중 관리 매장: {reportData.worstStore.store}</div>
                <div className="text-lg font-black text-white">{formatPercent(reportData.worstStore.growth)}</div>
                <p className="text-[11px] text-slate-300">
                  주변 오피스 재택근무 증가로 평일 점심시간대 유입 둔화. 배달 채널 프로모션 강화 권장.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Campaign & Strategic Recommendations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            3. 차주 전략 제언 및 액션 플랜
          </h3>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs leading-relaxed text-slate-300">
            <p>
              • <b>VMD 디자인 리뉴얼 효과 입증:</b> 감자버거 강남점의 파사드 & VMD 개편 성공 사례를 바탕으로,
              11월 초 역삼점 및 마포점의 윈도우 비주얼 사이니지 확장 적용을 추천합니다.
            </p>
            <p>
              • <b>독일피자 디너 객단가 최적화:</b> 삼성점과 송파점의 프리미엄 맥주 페어링 코스 반응이 호조를 보이고 있어
              주말 디너 예약 타임슬롯을 추가 오픈하는 것을 제안합니다.
            </p>
            <p>
              • <b>평범하지않은커피 오피스 상권 전략:</b> 판교점의 오피스 페스타 프로모션 성과를 수원점 및 봉구점의 오피스 밀집 구역으로
              수평 전개하여 테이크아웃 매출 확대를 추진합니다.
            </p>
          </div>
        </div>

        {/* Sign Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>작성자: 전략기획팀 / 데이터 인텔리전스 파트</span>
          <span>승인: 경영지원본부</span>
        </div>
      </div>
    </div>
  );
}
