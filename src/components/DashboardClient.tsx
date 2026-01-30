'use client';

import { GoldRiskSnapshot } from '@/lib/types';
import { AIExplainSection } from '@/components/cards/AIExplainSection';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8081';

interface DashboardClientProps {
  goldRisk: GoldRiskSnapshot;
}

async function fetchExplainGoldRisk(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/api/ai/explain/gold-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.explanation || null;
  } catch {
    return null;
  }
}

export function DashboardClient({ goldRisk }: DashboardClientProps) {
  const riskQuestion = goldRisk.riskLevel === 'HIGH'
    ? 'Why is gold risk HIGH?'
    : goldRisk.riskLevel === 'MEDIUM'
    ? 'Why is gold risk MEDIUM?'
    : 'Why is gold risk LOW?';

  return (
    <AIExplainSection
      title={riskQuestion}
      fetchExplanation={fetchExplainGoldRisk}
      fallbackReason={goldRisk.reason}
    />
  );
}
