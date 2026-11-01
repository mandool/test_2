import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { generateMockSales, INITIAL_EVENTS, BRANDS } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import { SalesRecord } from '@/types/sales';

function buildExcelBuffer(sales: SalesRecord[]) {
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
    메모: r.notes || '',
  }));
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 6 },
    { wch: 22 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 20 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '매출상세원장');

  // 2. 지점별 집계 시트
  const storeMap = new Map<
    string,
    { brand: string; gross: number; discount: number; net: number; orders: number }
  >();
  sales.forEach((r) => {
    const existing = storeMap.get(r.storeName) || { brand: r.brandName, gross: 0, discount: 0, net: 0, orders: 0 };
    existing.gross += r.grossSales;
    existing.discount += r.discountAmount;
    existing.net += r.netSales;
    existing.orders += r.orderCount;
    storeMap.set(r.storeName, existing);
  });

  const storeSummaryRows = Array.from(storeMap.entries())
    .map(([storeName, item], idx) => ({
      순위: idx + 1,
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
    { wch: 26 },
    { wch: 22 },
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
    객단가: item.orders > 0 ? Math.round(item.net / item.orders) : 0,
  }));
  const wsChannel = XLSX.utils.json_to_sheet(channelSummaryRows);
  XLSX.utils.book_append_sheet(wb, wsChannel, '채널별점유율');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

// GET 방식 (URL 쿼리 파라미터 필터 지원)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand') || 'all';
    const store = searchParams.get('store') || 'all';
    const channel = searchParams.get('channel') || 'all';
    const start = searchParams.get('start') || '';
    const end = searchParams.get('end') || '';

    let sales = generateMockSales();

    // 쿼리 파라미터 필터 적용
    sales = sales.filter((r) => {
      if (brand !== 'all' && r.brandName !== brand) return false;
      if (store !== 'all' && r.storeName !== store) return false;
      if (channel !== 'all' && r.channel !== channel) return false;
      if (start && r.date < start) return false;
      if (end && r.date > end) return false;
      return true;
    });

    const todayStr = formatDate(new Date()).replace(/-/g, '');
    const buffer = buildExcelBuffer(sales);
    const filename = `SalesReport_${todayStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST 방식 (클라이언트의 현재 커스텀/필터링된 sales 레코드 직접 수신)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sales: SalesRecord[] = Array.isArray(body.sales) ? body.sales : generateMockSales();

    const todayStr = formatDate(new Date()).replace(/-/g, '');
    const buffer = buildExcelBuffer(sales);
    const filename = `SalesReport_${todayStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
