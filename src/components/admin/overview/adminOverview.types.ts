export interface AdminOverviewProps {
  userRole?: string;
  showFilter?: boolean;
  dateFormat?: string;
}

export interface ChartPoint {
  dateKey: string;
  label: string;
  revenue: number;
  orders: number;
  aov: number;
}

export type MetricType = 'REVENUE' | 'ORDERS' | 'AOV';
export type GranularityType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
