'use client';

import React, { useState, useRef } from 'react';
import { SalesRecord, WeatherType, ChannelType } from '@/types/sales';
import { formatCurrency, formatNumber, getDayOfWeek, formatDate } from '@/lib/utils';
import { BRANDS } from '@/lib/mockData';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ExcelUploadTabProps {
  onBulkAddRecords: (records: SalesRecord[]) => void;
  onSuccessNavigateToOverview: () => void;
}

export default function ExcelUploadTab({
  onBulkAddRecords,
  onSuccessNavigateToOverview,
}: ExcelUploadTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<SalesRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 헤더 지능형 매핑 헬퍼
  const normalizeKey = (key: string): string => {
    const k = key.trim().toLowerCase();
    if (k.includes('일자') || k.includes('날짜') || k.includes('date')) return 'date';
    if (k.includes('매장') || k.includes('지점') || k.includes('store')) return 'storeName';
    if (k.includes('브랜드') || k.includes('brand')) return 'brandName';
    if (k.includes('채널') || k.includes('channel') || k.includes('구분')) return 'channel';
    if (k.includes('총매출') || k.includes('총액') || k.includes('gross')) return 'grossSales';
    if (k.includes('할인') || k.includes('프로모션') || k.includes('discount')) return 'discountAmount';
    if (k.includes('실매출') || k.includes('순매출') || k.includes('정산') || k.includes('net')) return 'netSales';
    if (k.includes('건수') || k.includes('수량') || k.includes('count') || k.includes('order')) return 'orderCount';
    if (k.includes('담당') || k.includes('매니저') || k.includes('manager')) return 'manager';
    if (k.includes('비고') || k.includes('메모') || k.includes('note') || k.includes('이슈')) return 'notes';
    return key;
  };

  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    setIsSuccess(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        if (json.length === 0) {
          setErrorMsg('엑셀 파일에 데이터가 비어 있습니다.');
          return;
        }

        // 정규화 변환
        const records: SalesRecord[] = json.map((row, idx) => {
          const mapped: Record<string, any> = {};
          Object.keys(row).forEach((rawKey) => {
            const normalized = normalizeKey(rawKey);
            mapped[normalized] = row[rawKey];
          });

          // 기본값 및 자동 보정
          const date = mapped.date ? String(mapped.date).slice(0, 10) : '2026-10-25';
          const gross = Number(mapped.grossSales || mapped.netSales || 1500000);
          const discount = Number(mapped.discountAmount || 0);
          const net = mapped.netSales ? Number(mapped.netSales) : Math.max(0, gross - discount);
          const orders = Number(mapped.orderCount || 100);
          const aov = orders > 0 ? Math.round(net / orders) : 0;
          const storeName = mapped.storeName || BRANDS[0].stores[0];

          // 소속 브랜드 추론
          const matchedBrand =
            BRANDS.find((b) => b.stores.includes(storeName)) ||
            BRANDS.find((b) => b.name === mapped.brandName) ||
            BRANDS[0];

          return {
            id: `rec-import-${Date.now()}-${idx}`,
            date,
            dayOfWeek: getDayOfWeek(date),
            weather: '맑음',
            manager: mapped.manager || 'POS 자동정산',
            brandId: matchedBrand.id,
            brandName: matchedBrand.name,
            storeId: `st-${storeName}`,
            storeName,
            channel: (mapped.channel as ChannelType) || '오프라인 매장',
            grossSales: gross,
            discountAmount: discount,
            netSales: net,
            orderCount: orders,
            averageOrderValue: aov,
            issueTags: mapped.notes ? [String(mapped.notes).split(' ')[0]] : ['POS자동연동'],
            notes: mapped.notes ? String(mapped.notes) : 'POS 정산 엑셀 일괄 업로드',
          };
        });

        setParsedRows(records);
      } catch (err) {
        console.error(err);
        setErrorMsg('엑셀 파일을 파싱하는 도중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // DB에 최종 적용
  const handleApplyToDb = () => {
    if (parsedRows.length === 0) return;
    onBulkAddRecords(parsedRows);
    setIsSuccess(true);
  };

  // 샘플 템플릿 엑셀 생성 및 다운로드
  const downloadSampleTemplate = () => {
    const sampleRows = [
      {
        일자: '2026-10-25',
        브랜드명: '감자버거',
        매장명: '감자버거 강남점',
        판매채널: '오프라인 매장',
        총매출: 3850000,
        할인금액: 150000,
        실매출: 3700000,
        결제건수: 235,
        담당자: '김민준',
        비고: '주말 런치 피크',
      },
      {
        일자: '2026-10-25',
        브랜드명: '독일피자',
        매장명: '독일피자 삼성점',
        판매채널: '오프라인 매장',
        총매출: 6200000,
        할인금액: 200000,
        실매출: 6000000,
        결제건수: 68,
        담당자: '윤상혁',
        비고: '슈바인학센 & 크래프트 맥주 풀 부킹',
      },
      {
        일자: '2026-10-25',
        브랜드명: '평범하지않은커피',
        매장명: '평범하지않은커피 판교점',
        판매채널: '배달의민족',
        총매출: 2800000,
        할인금액: 140000,
        실매출: 2660000,
        결제건수: 195,
        담당자: '정유나',
        비고: '오피스 단체 주문 적용',
      },
      {
        일자: '2026-10-25',
        브랜드명: '면스토랑',
        매장명: '면스토랑 강남점',
        판매채널: '오프라인 매장',
        총매출: 3200000,
        할인금액: 120000,
        실매출: 3080000,
        결제건수: 105,
        담당자: '한승우',
        비고: '골드에디션 누들 패키지 판매',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'POS_정산_양식');
    XLSX.writeFile(wb, 'POS_매출정산_표준템플릿.xlsx');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            POS & 배달앱 정산 엑셀 파일 일괄 자동 연동
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            매장 POS기나 배달의민족/쿠팡이츠 정산 내역 CSV/XLSX 파일을 드래그하면, 사전에 매핑된 3축 규칙에 따라
            자동 정규화되어 DB에 저장됩니다.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          표준 템플릿 다운로드 (.xlsx)
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="glass-panel border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl p-10 text-center cursor-pointer transition-all hover:bg-indigo-950/10 group relative"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
          <UploadCloud className="w-8 h-8 text-indigo-400" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-white">
            POS 정산용 Excel / CSV 파일을 이 곳에 끌어다 놓으세요
          </p>
          <p className="text-xs text-slate-400">
            또는 클릭하여 컴퓨터에서 파일 선택 (.xlsx, .xls, .csv 지원)
          </p>
        </div>

        {fileName && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            선택된 파일: {fileName}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                파싱 및 정규화 결과 미리보기 ({parsedRows.length}건 감지됨)
              </h3>
            </div>

            <button
              onClick={handleApplyToDb}
              disabled={isSuccess}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
                isSuccess
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.02]'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  DB 저장 완료됨!
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  {parsedRows.length}건 데이터 DB에 최종 반영하기
                </>
              )}
            </button>
          </div>

          {isSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <span>
                🎉 정규화된 {parsedRows.length}건의 매출 데이터가 데이터베이스에 성공적으로 반영되었습니다!
              </span>
              <button
                onClick={onSuccessNavigateToOverview}
                className="flex items-center gap-1 font-bold underline hover:text-white"
              >
                대시보드 개요에서 확인 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 sticky top-0 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">날짜</th>
                  <th className="py-2.5 px-3">브랜드</th>
                  <th className="py-2.5 px-3">매장</th>
                  <th className="py-2.5 px-3">채널</th>
                  <th className="py-2.5 px-3 text-right">총매출</th>
                  <th className="py-2.5 px-3 text-right">할인</th>
                  <th className="py-2.5 px-3 text-right">실매출</th>
                  <th className="py-2.5 px-3 text-right">결제수</th>
                  <th className="py-2.5 px-3 text-right">객단가</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {parsedRows.slice(0, 15).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-semibold text-white">{row.date}</td>
                    <td className="py-2 px-3">{row.brandName}</td>
                    <td className="py-2 px-3">{row.storeName}</td>
                    <td className="py-2 px-3">{row.channel}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{formatCurrency(row.grossSales)}</td>
                    <td className="py-2 px-3 text-right text-rose-400">-{formatCurrency(row.discountAmount)}</td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-400">{formatCurrency(row.netSales)}</td>
                    <td className="py-2 px-3 text-right">{formatNumber(row.orderCount)}건</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(row.averageOrderValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 15 && (
            <p className="text-[11px] text-slate-500 text-center">
              외 {parsedRows.length - 15}건의 데이터가 더 있습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
