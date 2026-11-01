export type WeatherType = '맑음' | '흐림' | '비' | '눈' | '폭염/한파';

export type ChannelType = '오프라인 매장' | '배달의민족' | '쿠팡이츠' | '자사몰' | '팝업스토어';

export type UserRole = 'ADMIN' | 'MANAGER';

export interface SalesRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: '월' | '화' | '수' | '목' | '금' | '토' | '일';
  weather?: WeatherType;
  manager: string;
  
  brandId: string;
  brandName: string;
  storeId: string;
  storeName: string;
  channel: ChannelType;

  grossSales: number;       // 총매출
  discountAmount: number;   // 할인/프로모션
  netSales: number;         // 실매출 = grossSales - discountAmount
  orderCount: number;       // 결제 건수 (영수증 수)
  averageOrderValue: number;// 객단가 = netSales / orderCount

  issueTags: string[];      // 이슈 태그
  notes?: string;           // 특이사항 메모
  createdAt?: string;
  updatedAt?: string;
}

export type EventType = 'VMD/인테리어' | '프로모션' | '신메뉴' | '외부이슈' | '운영정책';

export interface CampaignEvent {
  id: string;
  date: string; // YYYY-MM-DD
  brandName: string;
  storeName: string; // '전체' 또는 특정 지점
  type: EventType;
  title: string;
  description: string;
  color?: string;
}

export interface StoreTarget {
  id: string;
  yearMonth: string; // YYYY-MM
  brandName: string;
  storeName: string;
  targetSales: number;
}

export interface FilterState {
  dateRange: 'today' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate: string;
  endDate: string;
  selectedBrand: string; // 'all' or specific brand
  selectedStore: string; // 'all' or specific store
  selectedChannel: string; // 'all' or specific channel
  searchQuery: string;
}

export interface AnomalyInfo {
  isAnomaly: boolean;
  type?: 'spike' | 'drop';
  percentDiff?: number;
  averageSales?: number;
}
