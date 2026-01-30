export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type SignalColor = 'GREEN' | 'YELLOW' | 'RED';

export interface GoldRiskSnapshot {
  id: number;
  riskLevel: RiskLevel;
  reason: string;
  asOf: string;
  createdAt: string;
}

export interface Indicator {
  code: string;
  name: string;
  description: string;
  unit: string;
  source: string;
}

export interface IndicatorValue {
  id: number;
  indicatorCode: string;
  value: number;
  observedAt: string;
  createdAt: string;
}

export interface Signal {
  id: number;
  indicatorCode: string;
  signal: SignalColor;
  confidence: number;
  reason: string;
  generatedAt: string;
  createdAt: string;
}

export interface IndicatorHistoryPoint {
  date: string;
  value: number;
}

export interface IndicatorHistoryResponse {
  indicatorCode: string;
  unit: string;
  points: IndicatorHistoryPoint[];
}

export interface IndicatorWithData {
  indicator: Indicator;
  latestValue: IndicatorValue | null;
  latestSignal: Signal | null;
  history: IndicatorHistoryPoint[];
}

export interface AIExplanationRequest {
  context?: string;
}

export interface AIExplanationResponse {
  explanation: string;
}

export interface GoldPrice {
  price: number;
  currency: string;
  unit: string;
  change?: number;
  changePercent?: number;
  updatedAt: string;
}

export interface GoldPriceHistoryPoint {
  date: string;
  value: number;
}

export interface GoldPriceHistoryResponse {
  unit: string;
  points: GoldPriceHistoryPoint[];
}
