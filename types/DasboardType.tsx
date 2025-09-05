export interface DashboardType {
  seller: {
    slpCode: number;
    slpName: string;
  };
  period: string;
  currency: string;
  mode: string;
  target: number;
  actual: number;
  progressPct: number;
  segments: {
    achieved: number;
    remaining: number;
    overAchievement: number;
  };
  centerLabel: {
    primary: string;
    secondary: string;
  };
  colorHints: any | null;
  lastUpdated: string;
}

export interface GoalDonutType {
  current: number;
  target: number;
  progressPct?: number;
  currency?: string;
  centerLabelPrimary?: string;
  centerLabelSecondary?: string;
  lastUpdated?: string;
}

export interface SalesDataType {
  slpCode: number;
  period: string;
  currency: string;
  cash: number;
  transfer: number;
  card: number;
  checksDeposited: number;
  total: number;
  start: string;
  end: string;
  dateField: string;
}

export interface TableDataType {
  title: string;
  slpCode: number;
  asOf: string;
  items: Array<{
    cardCode: string;
    cardName: string;
    days: number;
    pending: number;
  }>;
}