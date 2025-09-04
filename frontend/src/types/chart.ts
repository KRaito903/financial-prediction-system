export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  symbol?: string;
  interval?: string;
}

export interface MarketConfig {
  symbol: string;
  interval: string;
  displayName: string;
}

export interface ChartConfig {
  id: string;
  market: MarketConfig | null;
  candlestickData: CandlestickData[];
  loading: boolean;
  error: string | null;
}

export type ViewMode = 'single' | 'multi';

export interface TimeRange {
  startTime: Date;
  endTime: Date;
}