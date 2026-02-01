import {
  GoldRiskSnapshot,
  GoldPrice,
  GoldPriceHistoryPoint,
  GoldPriceHistoryResponse,
  Indicator,
  IndicatorValue,
  IndicatorHistoryPoint,
  IndicatorHistoryResponse,
  Signal,
  AIExplanationResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) {
  console.warn('NEXT_PUBLIC_API_BASE environment variable is not set. API calls will fail.');
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  if (!API_BASE) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

export async function getLatestGoldRisk(): Promise<GoldRiskSnapshot | null> {
  return fetchApi<GoldRiskSnapshot>('/api/gold-risk/latest');
}

export async function getLatestGoldPrice(): Promise<GoldPrice | null> {
  const result = await fetchApi<{
    price: number;
    currency: string;
    unit: string;
    asOf: string;
    source?: string;
  }>('/api/gold-price/latest');
  
  if (!result) return null;
  
  return {
    price: result.price,
    currency: result.currency,
    unit: result.unit,
    updatedAt: result.asOf,
  };
}

export async function getGoldPriceHistory(days: number = 30): Promise<GoldPriceHistoryPoint[]> {
  const result = await fetchApi<GoldPriceHistoryResponse>(`/api/gold/price/history?days=${days}`);
  if (!result || !result.points || !Array.isArray(result.points)) return [];
  return result.points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getIndicators(): Promise<Indicator[]> {
  const result = await fetchApi<Indicator[]>('/api/indicators');
  return result || [];
}

export async function getLatestIndicatorValue(code: string): Promise<IndicatorValue | null> {
  return fetchApi<IndicatorValue>(`/api/indicators/${code}/latest`);
}

export async function getLatestSignal(code: string): Promise<Signal | null> {
  return fetchApi<Signal>(`/api/signals/${code}/latest`);
}

export async function getIndicatorHistory(code: string, days: number = 30): Promise<IndicatorHistoryPoint[]> {
  const result = await fetchApi<IndicatorHistoryResponse>(`/api/indicators/${code}/history?days=${days}`);
  if (!result || !result.points || !Array.isArray(result.points)) return [];
  return result.points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function explainGoldRisk(context?: string): Promise<string | null> {
  const result = await fetchApi<AIExplanationResponse>('/api/ai/explain/gold-risk', {
    method: 'POST',
    body: JSON.stringify({ context }),
  });
  return result?.explanation || null;
}

export async function explainIndicator(code: string, context?: string): Promise<string | null> {
  const result = await fetchApi<AIExplanationResponse>('/api/ai/explain/indicator', {
    method: 'POST',
    body: JSON.stringify({ indicatorCode: code, context }),
  });
  return result?.explanation || null;
}

export async function explainSignal(code: string, context?: string): Promise<string | null> {
  const result = await fetchApi<AIExplanationResponse>('/api/ai/explain/signal', {
    method: 'POST',
    body: JSON.stringify({ indicatorCode: code, context }),
  });
  return result?.explanation || null;
}

export interface GoldNewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface GoldNewsResponse {
  items: GoldNewsItem[];
  provider: string;
  fetchedAt: string;
}

export async function getGoldNews(): Promise<GoldNewsResponse | null> {
  return fetchApi<GoldNewsResponse>('/api/news/gold');
}

import { EtfFlowResponse } from './types';

export async function getEtfFlows(months: number = 24): Promise<EtfFlowResponse | null> {
  return fetchApi<EtfFlowResponse>(`/api/gold/etf/flows?months=${months}`);
}
