import { SalesRecord, CampaignEvent, StoreTarget } from '@/types/sales';
import { getDayOfWeek, formatDate } from './utils';

export const BRANDS = [
  {
    id: 'b1',
    name: '감자버거',
    category: '수제버거 & 프렌치프라이',
    stores: [
      '감자버거 강남점',
      '감자버거 역삼점',
      '감자버거 마포점',
      '감자버거 인천점',
    ],
    color: '#6366f1',
  },
  {
    id: 'b2',
    name: '독일피자',
    category: '정통 화덕피자 & 수제맥주',
    stores: [
      '독일피자 삼성점',
      '독일피자 송파점',
      '독일피자 시흥점',
    ],
    color: '#f97316',
  },
  {
    id: 'b3',
    name: '평범하지않은커피',
    category: '스페셜티 커피 & 로스터리',
    stores: [
      '평범하지않은커피 봉구점',
      '평범하지않은커피 수원점',
      '평범하지않은커피 판교점',
    ],
    color: '#10b981',
  },
  {
    id: 'b4',
    name: '면스토랑',
    category: '프리미엄 누들 & 키친 다이닝',
    stores: [
      '면스토랑 강남점',
      '면스토랑 해운대점',
    ],
    color: '#ec4899',
  },
];

export const CHANNELS = [
  '오프라인 매장',
  '배달의민족',
  '쿠팡이츠',
  '자사몰',
  '팝업스토어',
] as const;

export const INITIAL_EVENTS: CampaignEvent[] = [
  {
    id: 'ev-1',
    date: '2026-10-14',
    brandName: '감자버거',
    storeName: '감자버거 강남점',
    type: 'VMD/인테리어',
    title: '강남 플래그십 파사드 & 가을 시그니처 세트 VMD 리뉴얼',
    description: '오픈 키친 포토존 사인물 전면 교체 및 전용 감자 패키징 도입으로 집객수 급증',
    color: '#6366f1',
  },
  {
    id: 'ev-2',
    date: '2026-10-18',
    brandName: '독일피자',
    storeName: '독일피자 삼성점',
    type: '신메뉴',
    title: '가을 시그니처 독일식 슈바인학센 피자 & 수제맥주 세트 런칭',
    description: '독일 정통 크래프트 비어 페어링 프로모션 진행으로 디너 객단가 대폭 상승',
    color: '#f97316',
  },
  {
    id: 'ev-3',
    date: '2026-10-10',
    brandName: '평범하지않은커피',
    storeName: '평범하지않은커피 판교점',
    type: '프로모션',
    title: '판교 IT밸리 오피스 가을 페스타 2+1 시그니처 음료 프로모션',
    description: '판교 직장인 테이크아웃 단체 주문 집중 및 결제 건수 역대 최고 기록 달성',
    color: '#10b981',
  },
  {
    id: 'ev-4',
    date: '2026-10-22',
    brandName: '면스토랑',
    storeName: '면스토랑 강남점',
    type: 'VMD/인테리어',
    title: '프리미엄 누들 밀키트 선물세트 쇼케이스 개편',
    description: '가을 선물용 골드 에디션 누들 패키지 런칭 및 매장 메인 쇼케이스 조명 리뉴얼',
    color: '#ec4899',
  },
];

export const INITIAL_TARGETS: StoreTarget[] = [
  // 감자버거
  { id: 't-1', yearMonth: '2026-10', brandName: '감자버거', storeName: '감자버거 강남점', targetSales: 95000000 },
  { id: 't-2', yearMonth: '2026-10', brandName: '감자버거', storeName: '감자버거 역삼점', targetSales: 85000000 },
  { id: 't-3', yearMonth: '2026-10', brandName: '감자버거', storeName: '감자버거 마포점', targetSales: 65000000 },
  { id: 't-4', yearMonth: '2026-10', brandName: '감자버거', storeName: '감자버거 인천점', targetSales: 60000000 },
  // 독일피자
  { id: 't-5', yearMonth: '2026-10', brandName: '독일피자', storeName: '독일피자 삼성점', targetSales: 120000000 },
  { id: 't-6', yearMonth: '2026-10', brandName: '독일피자', storeName: '독일피자 송파점', targetSales: 100000000 },
  { id: 't-7', yearMonth: '2026-10', brandName: '독일피자', storeName: '독일피자 시흥점', targetSales: 80000000 },
  // 평범하지않은커피
  { id: 't-8', yearMonth: '2026-10', brandName: '평범하지않은커피', storeName: '평범하지않은커피 봉구점', targetSales: 70000000 },
  { id: 't-9', yearMonth: '2026-10', brandName: '평범하지않은커피', storeName: '평범하지않은커피 수원점', targetSales: 65000000 },
  { id: 't-10', yearMonth: '2026-10', brandName: '평범하지않은커피', storeName: '평범하지않은커피 판교점', targetSales: 80000000 },
  // 면스토랑
  { id: 't-11', yearMonth: '2026-10', brandName: '면스토랑', storeName: '면스토랑 강남점', targetSales: 90000000 },
  { id: 't-12', yearMonth: '2026-10', brandName: '면스토랑', storeName: '면스토랑 해운대점', targetSales: 75000000 },
];

export function generateMockSales(): SalesRecord[] {
  const records: SalesRecord[] = [];
  const weathers = ['맑음', '맑음', '흐림', '비', '맑음'] as const;

  const managers: Record<string, string> = {
    '감자버거 강남점': '김민준',
    '감자버거 역삼점': '정해진',
    '감자버거 마포점': '이서윤',
    '감자버거 인천점': '박도현',
    '독일피자 삼성점': '윤상혁',
    '독일피자 송파점': '강태우',
    '독일피자 시흥점': '송지은',
    '평범하지않은커피 봉구점': '오세훈',
    '평범하지않은커피 수원점': '조예린',
    '평범하지않은커피 판교점': '정유나',
    '면스토랑 강남점': '한승우',
    '면스토랑 해운대점': '배수진',
  };

  const today = new Date('2026-10-25');

  // 과거 35일치 생성 (9월 20일 ~ 10월 25일)
  for (let i = 35; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    const dayOfWeek = getDayOfWeek(dateStr);
    const isWknd = dayOfWeek === '토' || dayOfWeek === '일';
    const weather = weathers[(d.getDate() + i) % weathers.length];

    BRANDS.forEach((brand) => {
      brand.stores.forEach((store) => {
        // 브랜드별 기본 일일 매출 및 객단가 세팅
        let baseOfflineSales = 2200000;
        let avgOrderBase = 15000;

        if (brand.name.includes('감자버거')) {
          baseOfflineSales = store.includes('강남점') || store.includes('역삼점') ? 3100000 : 2200000;
          avgOrderBase = 16500;
        } else if (brand.name.includes('독일피자')) {
          baseOfflineSales = store.includes('삼성점') ? 4300000 : 3500000;
          avgOrderBase = 48000;
        } else if (brand.name.includes('평범하지않은커피')) {
          baseOfflineSales = store.includes('판교점') || store.includes('봉구점') ? 2600000 : 1900000;
          avgOrderBase = 12500;
        } else if (brand.name.includes('면스토랑')) {
          baseOfflineSales = store.includes('강남점') ? 3200000 : 2500000;
          avgOrderBase = 24000;
        }

        const weekendMultiplier = isWknd ? (brand.name.includes('독일피자') ? 1.55 : 1.4) : 1.0;
        const rainMultiplier = weather === '비' ? 0.82 : 1.0;

        // VMD 이벤트 영향 시뮬레이션
        let eventBoost = 1.0;
        let eventTag = '';

        if (store === '감자버거 강남점' && dateStr >= '2026-10-14') {
          eventBoost = 1.38;
          eventTag = '강남 플래그십 VMD 리뉴얼 효과';
        } else if (store === '독일피자 삼성점' && dateStr >= '2026-10-18') {
          eventBoost = 1.28;
          eventTag = '가을 슈바인학센 신메뉴 효과';
        } else if (store === '평범하지않은커피 판교점' && dateStr >= '2026-10-10' && dateStr <= '2026-10-16') {
          eventBoost = 1.32;
          eventTag = '판교 IT밸리 오피스 프로모션';
        } else if (store === '면스토랑 강남점' && dateStr >= '2026-10-22') {
          eventBoost = 1.25;
          eventTag = '골드에디션 선물세트 런칭';
        }

        // 10월 24일 토요일 강남점 피크 이상치(Spike) 샘플
        let anomalyMultiplier = 1.0;
        if (store === '감자버거 강남점' && dateStr === '2026-10-24') {
          anomalyMultiplier = 1.82;
          eventTag = '강남 페스티벌 거리 인파 대박';
        }

        const variance = 0.92 + Math.random() * 0.16;
        const gross = Math.round(baseOfflineSales * weekendMultiplier * rainMultiplier * eventBoost * anomalyMultiplier * variance);
        const discount = Math.round(gross * (0.02 + Math.random() * 0.04));
        const net = gross - discount;
        const orders = Math.max(1, Math.round(net / (avgOrderBase * (0.95 + Math.random() * 0.1))));
        const aov = Math.round(net / orders);

        records.push({
          id: `rec-off-${store}-${dateStr}`,
          date: dateStr,
          dayOfWeek,
          weather,
          manager: managers[store] || '담당매니저',
          brandId: brand.id,
          brandName: brand.name,
          storeId: `st-${store}`,
          storeName: store,
          channel: '오프라인 매장',
          grossSales: gross,
          discountAmount: discount,
          netSales: net,
          orderCount: orders,
          averageOrderValue: aov,
          issueTags: eventTag ? [eventTag] : (isWknd ? ['주말 피크'] : []),
          notes: eventTag ? `${eventTag} 반영 집계` : undefined,
        });

        // 배달 / 포장 / 온라인 채널
        const deliveryMultiplier = weather === '비' ? 1.65 : 1.0;
        const channelName = brand.name.includes('면스토랑')
          ? (store.includes('해운대') ? '배달의민족' : '자사몰')
          : (brand.name.includes('독일피자') ? '쿠팡이츠' : '배달의민족');

        const delGross = Math.round((baseOfflineSales * 0.28) * deliveryMultiplier * (0.85 + Math.random() * 0.3));
        const delDiscount = Math.round(delGross * 0.08);
        const delNet = delGross - delDiscount;
        const delAov = Math.round(avgOrderBase * 1.3);
        const delOrders = Math.max(1, Math.round(delNet / delAov));

        records.push({
          id: `rec-del-${store}-${dateStr}`,
          date: dateStr,
          dayOfWeek,
          weather,
          manager: managers[store] || '담당매니저',
          brandId: brand.id,
          brandName: brand.name,
          storeId: `st-${store}`,
          storeName: store,
          channel: channelName,
          grossSales: delGross,
          discountAmount: delDiscount,
          netSales: delNet,
          orderCount: delOrders,
          averageOrderValue: Math.round(delNet / delOrders),
          issueTags: weather === '비' ? ['우천 주문 급증'] : [],
          notes: weather === '비' ? '비로 인한 주문량 급증' : undefined,
        });
      });
    });
  }

  return records;
}
