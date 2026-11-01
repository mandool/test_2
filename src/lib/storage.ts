import { SalesRecord, CampaignEvent, StoreTarget, FilterState, AnomalyInfo } from '@/types/sales';
import { generateMockSales, INITIAL_EVENTS, INITIAL_TARGETS } from './mockData';

const SALES_STORAGE_KEY = 'sales_records_v4_brands';
const EVENTS_STORAGE_KEY = 'campaign_events_v4_brands';
const TARGETS_STORAGE_KEY = 'store_targets_v4_brands';

export function getStoredSales(): SalesRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SALES_STORAGE_KEY);
    if (!raw) {
      const initial = generateMockSales();
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: SalesRecord[] = JSON.parse(raw);
    // 이전 데모 브랜드가 남아있는 경우 새 브랜드 데이터로 자동 마이그레이션
    if (
      parsed.length === 0 ||
      parsed.some(
        (r) =>
          r.brandName.includes('블루노트') ||
          r.brandName.includes('오트베이크') ||
          r.brandName.includes('베질루르') ||
          r.brandName.includes('목탄장') ||
          r.brandName.includes('교토퍼펙트말차') ||
          r.brandName.includes('라콩비에트')
      )
    ) {
      const fresh = generateMockSales();
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load sales records from storage', e);
    return generateMockSales();
  }
}

export function saveSales(records: SalesRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save sales to storage', e);
  }
}

export function getStoredEvents(): CampaignEvent[] {
  if (typeof window === 'undefined') return INITIAL_EVENTS;
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    const parsed: CampaignEvent[] = JSON.parse(raw);
    if (
      parsed.length === 0 ||
      parsed.some(
        (e) =>
          e.brandName.includes('블루노트') ||
          e.brandName.includes('오트베이크') ||
          e.brandName.includes('베질루르') ||
          e.brandName.includes('목탄장') ||
          e.brandName.includes('교토퍼펙트말차') ||
          e.brandName.includes('라콩비에트')
      )
    ) {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    return parsed;
  } catch (e) {
    return INITIAL_EVENTS;
  }
}

export function saveEvents(events: CampaignEvent[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

export function getStoredTargets(): StoreTarget[] {
  if (typeof window === 'undefined') return INITIAL_TARGETS;
  try {
    const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(INITIAL_TARGETS));
      return INITIAL_TARGETS;
    }
    const parsed: StoreTarget[] = JSON.parse(raw);
    if (
      parsed.length === 0 ||
      parsed.some(
        (t) =>
          t.brandName.includes('블루노트') ||
          t.brandName.includes('오트베이크') ||
          t.brandName.includes('베질루르') ||
          t.brandName.includes('목탄장') ||
          t.brandName.includes('교토퍼펙트말차') ||
          t.brandName.includes('라콩비에트')
      )
    ) {
      localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(INITIAL_TARGETS));
      return INITIAL_TARGETS;
    }
    return parsed;
  } catch (e) {
    return INITIAL_TARGETS;
  }
}

export function saveTargets(targets: StoreTarget[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
}

export function resetAllDataToDefault(): void {
  if (typeof window === 'undefined') return;
  const initialSales = generateMockSales();
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(initialSales));
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(INITIAL_TARGETS));
}

// 특정 지점의 최근 평균 대비 이상치(±50% 변동) 판정
export function checkAnomaly(record: SalesRecord, allRecords: SalesRecord[]): AnomalyInfo {
  const storeRecords = allRecords.filter(
    (r) => r.storeName === record.storeName && r.channel === record.channel && r.id !== record.id
  );

  if (storeRecords.length < 5) {
    return { isAnomaly: false };
  }

  // 최근 14일 또는 전체 데이터의 평균 실매출
  const total = storeRecords.reduce((sum, r) => sum + r.netSales, 0);
  const avg = total / storeRecords.length;

  const diffPercent = ((record.netSales - avg) / avg) * 100;

  if (diffPercent >= 50) {
    return {
      isAnomaly: true,
      type: 'spike',
      percentDiff: diffPercent,
      averageSales: avg,
    };
  } else if (diffPercent <= -50) {
    return {
      isAnomaly: true,
      type: 'drop',
      percentDiff: diffPercent,
      averageSales: avg,
    };
  }

  return { isAnomaly: false, percentDiff: diffPercent, averageSales: avg };
}

// 필터링 적용
export function filterRecords(records: SalesRecord[], filter: FilterState): SalesRecord[] {
  return records.filter((r) => {
    // 날짜 필터
    if (filter.startDate && r.date < filter.startDate) return false;
    if (filter.endDate && r.date > filter.endDate) return false;

    // 브랜드 필터
    if (filter.selectedBrand !== 'all' && r.brandName !== filter.selectedBrand) return false;

    // 매장 필터
    if (filter.selectedStore !== 'all' && r.storeName !== filter.selectedStore) return false;

    // 채널 필터
    if (filter.selectedChannel !== 'all' && r.channel !== filter.selectedChannel) return false;

    // 검색어 필터 (담당자, 메모, 태그, 지점명)
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      const inManager = r.manager.toLowerCase().includes(q);
      const inNotes = (r.notes || '').toLowerCase().includes(q);
      const inTags = r.issueTags.some((t) => t.toLowerCase().includes(q));
      const inStore = r.storeName.toLowerCase().includes(q);
      if (!inManager && !inNotes && !inTags && !inStore) return false;
    }

    return true;
  });
}

// Supabase PostgreSQL DDL 스키마 SQL 텍스트 제공
export const SUPABASE_SCHEMA_SQL = `-- 매출 자동화 플랫폼 PostgreSQL / Supabase DB Schema
-- 1. 브랜드 및 지점 테이블
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- 2. 일일 매출 테이블
CREATE TABLE IF NOT EXISTS daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  day_of_week VARCHAR(10) NOT NULL,
  weather VARCHAR(20),
  manager VARCHAR(50) NOT NULL,
  
  brand_id UUID REFERENCES brands(id),
  store_id UUID REFERENCES stores(id),
  channel VARCHAR(50) NOT NULL, -- '오프라인 매장', '배달의민족', etc.

  gross_sales BIGINT NOT NULL DEFAULT 0,
  discount_amount BIGINT NOT NULL DEFAULT 0,
  net_sales BIGINT GENERATED ALWAYS AS (gross_sales - discount_amount) STORED,
  order_count INT NOT NULL DEFAULT 1,
  average_order_value INT GENERATED ALWAYS AS (
    CASE WHEN order_count > 0 THEN (gross_sales - discount_amount) / order_count ELSE 0 END
  ) STORED,

  issue_tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (시간, 소속, 채널 축 최적화)
CREATE INDEX IF NOT EXISTS idx_sales_date ON daily_sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_store_channel ON daily_sales(store_id, channel);
CREATE INDEX IF NOT EXISTS idx_sales_brand ON daily_sales(brand_id);

-- 3. 이벤트 / 캠페인 타임라인 테이블
CREATE TABLE IF NOT EXISTS campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  brand_id UUID REFERENCES brands(id),
  store_name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'VMD/인테리어', '프로모션', '신메뉴', etc.
  title VARCHAR(200) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 월별 목표 매출 테이블
CREATE TABLE IF NOT EXISTS store_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  brand_name VARCHAR(100) NOT NULL,
  store_name VARCHAR(100) NOT NULL,
  target_sales BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year_month, store_name)
);
`;
