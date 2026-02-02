export const FLOW_THRESHOLDS = {
  strongInflow: 30,
  inflow: 5,
  neutral: 0,
  outflow: -5,
  strongOutflow: -30,
};

export function getFlowColor(netFlow: number | null): string {
  if (netFlow === null) return '#3a3a3a';

  if (netFlow >= FLOW_THRESHOLDS.strongInflow) return '#16a34a';
  if (netFlow >= FLOW_THRESHOLDS.inflow) return '#22c55e';
  if (netFlow > FLOW_THRESHOLDS.outflow) return '#404040';
  if (netFlow > FLOW_THRESHOLDS.strongOutflow) return '#f97316';
  return '#dc2626';
}
