'use client';

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { RiskLevel, SignalColor } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';

interface GoldDriversCardProps {
  riskLevel: RiskLevel | null;
  realYieldSignal: SignalColor | null;
  dxySignal: SignalColor | null;
}

function getDriverBullets(
  riskLevel: RiskLevel | null,
  realYieldSignal: SignalColor | null,
  dxySignal: SignalColor | null
): string[] {
  const bullets: string[] = [];

  if (realYieldSignal === 'RED') {
    bullets.push('Elevated real yields continue to pressure gold');
  } else if (realYieldSignal === 'GREEN') {
    bullets.push('Declining real yields provide support for gold');
  } else if (realYieldSignal === 'YELLOW') {
    bullets.push('Real yields remain in a transitional phase');
  }

  if (dxySignal === 'RED') {
    bullets.push('Dollar strength remains a headwind');
  } else if (dxySignal === 'GREEN') {
    bullets.push('Dollar weakness supports gold positioning');
  } else if (dxySignal === 'YELLOW') {
    bullets.push('Dollar index showing mixed signals');
  }

  if (riskLevel === 'HIGH') {
    bullets.push('Significant macro stress detected across indicators');
  } else if (riskLevel === 'MEDIUM') {
    bullets.push('Mixed signals increase short-term uncertainty');
  } else if (riskLevel === 'LOW') {
    bullets.push('Macro conditions relatively stable for gold');
  }

  if (bullets.length === 0) {
    bullets.push('Macro signals are stabilizing — analysis will update as new data arrives');
  }

  return bullets.slice(0, 4);
}

export function GoldDriversCard({ riskLevel, realYieldSignal, dxySignal }: GoldDriversCardProps) {
  const bullets = getDriverBullets(riskLevel, realYieldSignal, dxySignal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
    >
      <Card className="w-full border-zinc-800">
        <CardContent>
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="h-5 w-5 text-gold" />
            <h3 className="text-base font-semibold text-zinc-200">
              What&apos;s Driving Gold Risk?
            </h3>
          </div>
          <ul className="space-y-3">
            {bullets.map((bullet, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                className="flex items-start gap-2 text-sm text-zinc-400"
              >
                <span className="text-gold mt-0.5">•</span>
                <span>{bullet}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
