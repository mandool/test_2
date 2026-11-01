import * as XLSX from 'xlsx';
import { SalesRecord, CampaignEvent, StoreTarget, FilterState } from '@/types/sales';
import { formatDate } from './utils';

/**
 * 브라우저 환경에서 파일명이 UUID로 바뀌거나 확장자가 유실되지 않도록
 * File 객체 및 안전한 다운로드 트리거를 실행하는 헬퍼 함수
 */
function downloadFileInBrowser(data: BlobPart, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. File 객체 생성: Chromium 브라우저 엔진이 파일명 및 확장자를 최우선 보존하도록 보장
    let fileObj: Blob;
    try {
      fileObj = new File([data], filename, { type: mimeType });
    } catch {
      fileObj = new Blob([data], { type: mimeType });
    }

    // 2. IE / 레거시 Edge 대응
    if (typeof (window.navigator as any)?.msSaveOrOpenBlob === 'function') {
      (window.navigator as any).msSaveOrOpenBlob(fileObj, filename);
      return;
    }

    // 3. Object URL 생성
    const blobUrl = URL.createObjectURL(fileObj);

    // 4. a 태그 생성 및 명시적 다운로드 트리거
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = filename;
    link.setAttribute('download', filename);
    link.rel = 'noopener';
    link.target = '_self';

    // Next.js 라우터의 클라이언트 네비게이션 가로채기 방지
    link.onclick = (e) => e.stopPropagation();

    document.body.appendChild(link);
    link.click();

    // 5. 다운로드가 완전히 처리된 후 안전하게 URL 해제 (1분 유지)
    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    }, 60000);
  } catch (err) {
    console.error('Download error:', err);
  }
}

/**
 * 4~5개 시트가 포함된 종합 Excel (.xlsx) 파일 직접 생성 및 다운로드
 */
export function exportComprehensiveExcel({
  sales = [],
  events = [],
  targets = [],
  allSales = [],
  filters,
  filterDescription = '전체',
}: {
  sales?: SalesRecord[];
  events?: CampaignEvent[];
  targets?: StoreTarget[];
  allSales?: SalesRecord[];
  filters?: FilterState;
  filterDescription?: string;
}): string {
  if (typeof window === 'undefined') return 'SalesReport.xlsx';

  const todayStr = formatDate(new Date()).replace(/-/g, '');
  const filename = `매출분석보고서_${todayStr}.xlsx`;

  const wb = XLSX.utils.book_new();

  // 1. 매출 상세 원장 시트
  const detailRows = sales.map((r, idx) => ({
    No: idx + 1,
    일자: r.date,
    요일: r.dayOfWeek,
    브랜드명: r.brandName,
    매장명: r.storeName,
    판매채널: r.channel,
    총매출: r.grossSales,
    할인금액: r.discountAmount,
    실매출: r.netSales,
    결제건수: r.orderCount,
    평균객단가: r.averageOrderValue,
    날씨: r.weather || '맑음',
    담당자: r.manager,
    이슈태그: r.issueTags ? r.issueTags.join(', ') : '',
    비고: r.notes || '',
  }));
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 6 },
    { wch: 20 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 22 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '매출상세원장');

  // 2. 지점별 집계 시트
  const storeMap = new Map<
    string,
    { brand: string; gross: number; discount: number; net: number; orders: number }
  >();
  sales.forEach((r) => {
    const existing = storeMap.get(r.storeName) || {
      brand: r.brandName,
      gross: 0,
      discount: 0,
      net: 0,
      orders: 0,
    };
    existing.gross += r.grossSales;
    existing.discount += r.discountAmount;
    existing.net += r.netSales;
    existing.orders += r.orderCount;
    storeMap.set(r.storeName, existing);
  });

  const storeSummaryRows = Array.from(storeMap.entries())
    .map(([storeName, item]) => ({
      순위: 1,
      매장명: storeName,
      브랜드명: item.brand,
      총매출: item.gross,
      할인금액: item.discount,
      실매출: item.net,
      결제건수: item.orders,
      평균객단가: item.orders > 0 ? Math.round(item.net / item.orders) : 0,
    }))
    .sort((a, b) => b.실매출 - a.실매출)
    .map((row, idx) => ({ ...row, 순위: idx + 1 }));

  const wsStore = XLSX.utils.json_to_sheet(storeSummaryRows);
  wsStore['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStore, '지점별집계');

  // 3. 채널별 점유율 시트
  const channelMap = new Map<string, { net: number; orders: number }>();
  let totalNet = 0;
  sales.forEach((r) => {
    const existing = channelMap.get(r.channel) || { net: 0, orders: 0 };
    existing.net += r.netSales;
    existing.orders += r.orderCount;
    channelMap.set(r.channel, existing);
    totalNet += r.netSales;
  });

  const channelSummaryRows = Array.from(channelMap.entries()).map(([channel, item]) => ({
    판매채널: channel,
    실매출: item.net,
    결제건수: item.orders,
    매출비중: totalNet > 0 ? `${((item.net / totalNet) * 100).toFixed(1)}%` : '0%',
    평균객단가: item.orders > 0 ? Math.round(item.net / item.orders) : 0,
  }));
  const wsChannel = XLSX.utils.json_to_sheet(channelSummaryRows);
  wsChannel['!cols'] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsChannel, '채널별점유율');

  // 4. 캠페인 및 프로모션 이벤트 시트 (있을 경우)
  if (events && events.length > 0) {
    const eventRows = events.map((ev, idx) => ({
      No: idx + 1,
      일자: ev.date,
      브랜드명: ev.brandName,
      대상매장: ev.storeName,
      구분: ev.type,
      이벤트제목: ev.title,
      상세내용: ev.description,
    }));
    const wsEvent = XLSX.utils.json_to_sheet(eventRows);
    wsEvent['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, wsEvent, '캠페인이벤트이력');
  }

  // 5. 지점별 목표 매출 진척도 시트 (있을 경우)
  if (targets && targets.length > 0) {
    const targetMap = new Map<string, number>();
    sales.forEach((s) => {
      targetMap.set(s.storeName, (targetMap.get(s.storeName) || 0) + s.netSales);
    });

    const targetRows = targets.map((t, idx) => {
      const curNet = targetMap.get(t.storeName) || 0;
      const rate = t.targetSales > 0 ? ((curNet / t.targetSales) * 100).toFixed(1) + '%' : '0%';
      return {
        No: idx + 1,
        기준월: t.yearMonth,
        브랜드명: t.brandName,
        매장명: t.storeName,
        목표매출액: t.targetSales,
        현재누적실매출: curNet,
        달성률: rate,
      };
    });
    const wsTarget = XLSX.utils.json_to_sheet(targetRows);
    wsTarget['!cols'] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 18 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTarget, '목표대비달성현황');
  }

  // 바이너리 버퍼 생성 후 브라우저 안전 다운로드 실행
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadFileInBrowser(
    wbout,
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  return filename;
}

/**
 * CSV 형식 다운로드
 */
export function exportSalesCsv(sales: SalesRecord[]): string {
  if (typeof window === 'undefined') return 'SalesReport.csv';

  const todayStr = formatDate(new Date()).replace(/-/g, '');
  const filename = `매출상세원장_${todayStr}.csv`;

  const header = [
    'No',
    '일자',
    '요일',
    '브랜드명',
    '매장명',
    '판매채널',
    '총매출',
    '할인금액',
    '실매출',
    '결제건수',
    '평균객단가',
    '날씨',
    '담당자',
    '비고',
  ];

  const rows = sales.map((r, idx) => [
    idx + 1,
    r.date,
    r.dayOfWeek,
    `"${r.brandName}"`,
    `"${r.storeName}"`,
    `"${r.channel}"`,
    r.grossSales,
    r.discountAmount,
    r.netSales,
    r.orderCount,
    r.averageOrderValue,
    r.weather || '맑음',
    `"${r.manager}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + [header.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  downloadFileInBrowser(csvContent, filename, 'text/csv;charset=utf-8;');

  return filename;
}
