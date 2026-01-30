import { RiskLevel, SignalColor } from './types';

export function getRiskLevelColor(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  switch (level) {
    case 'LOW':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/20',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-500/20',
      };
    case 'HIGH':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        glow: 'shadow-rose-500/20',
      };
  }
}

export function getSignalColor(signal: SignalColor): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (signal) {
    case 'GREEN':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
      };
    case 'YELLOW':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
      };
    case 'RED':
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        dot: 'bg-rose-400',
      };
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatValue(value: number, unit: string): string {
  if (unit === '%') {
    return `${value.toFixed(2)}%`;
  }
  if (unit === 'USD' || unit === '$') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (unit === 'bps') {
    return `${value.toFixed(0)} bps`;
  }
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Date unavailable';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return formatShortDate(dateString);
}

export function safePercentChange(latest: number | null | undefined, baseline: number | null | undefined): number | null {
  if (latest === null || latest === undefined || baseline === null || baseline === undefined) return null;
  if (baseline === 0 || !isFinite(baseline) || !isFinite(latest)) return null;
  const result = ((latest - baseline) / baseline) * 100;
  if (!isFinite(result) || isNaN(result)) return null;
  return result;
}

export function formatPercentChange(value: number | null): string {
  if (value === null || !isFinite(value) || isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatAbsoluteChange(value: number | null, decimals: number = 2): string {
  if (value === null || !isFinite(value) || isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}`;
}
