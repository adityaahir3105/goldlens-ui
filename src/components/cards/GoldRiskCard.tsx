'use client';

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { GoldRiskSnapshot } from '@/lib/types';
import { getRiskLevelColor, formatShortDate, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';

interface GoldRiskCardProps {
  data: GoldRiskSnapshot | null;
}

export function GoldRiskCard({ data }: GoldRiskCardProps) {
  if (!data) {
    return (
      <Card className="border-zinc-700/50">
        <CardContent>
          <div className="flex items-center gap-3 text-zinc-500">
            <Shield className="h-5 w-5" />
            <p className="text-sm">
              Macro signals are stabilizing — analysis will update as new data arrives
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const colors = getRiskLevelColor(data.riskLevel);
  
  const RiskIcon = {
    LOW: Shield,
    MEDIUM: AlertTriangle,
    HIGH: ShieldAlert,
  }[data.riskLevel];

  const riskDescription = {
    LOW: 'Current macro conditions suggest relatively stable gold risk exposure.',
    MEDIUM: 'Elevated uncertainty in macro indicators warrants attention.',
    HIGH: 'Significant macro stress detected across multiple indicators.',
  }[data.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className={cn('border', colors.border, 'shadow-lg', colors.glow)}>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-1 text-sm font-medium uppercase tracking-wider text-zinc-500">
                Gold Risk Assessment
              </div>
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    colors.bg
                  )}
                >
                  <RiskIcon className={cn('h-6 w-6', colors.text)} />
                </motion.div>
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className={cn('text-2xl font-bold', colors.text)}
                  >
                    {data.riskLevel}
                  </motion.div>
                  <div className="text-sm text-zinc-400">{riskDescription}</div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mt-4 rounded-lg bg-zinc-800/50 p-3"
          >
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Analysis Summary
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{data.reason}</p>
          </motion.div>

          {data.asOf && formatShortDate(data.asOf) !== 'Date unavailable' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mt-4 flex items-center gap-2 text-xs text-zinc-500"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>As of {formatShortDate(data.asOf)}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
