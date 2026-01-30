'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

interface AIExplainSectionProps {
  title: string;
  fetchExplanation: () => Promise<string | null>;
  fallbackReason?: string;
}

export function AIExplainSection({ title, fetchExplanation, fallbackReason }: AIExplainSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const fetchAIExplanation = async () => {
    setIsLoading(true);
    setHasFailed(false);
    try {
      const result = await fetchExplanation();
      if (result) {
        setExplanation(result);
      } else {
        setHasFailed(true);
      }
    } catch {
      setHasFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isOpen && explanation === null && !isLoading && !hasFailed) {
      await fetchAIExplanation();
    }
    setIsOpen(!isOpen);
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    await fetchAIExplanation();
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30">
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-zinc-800/30"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium text-zinc-200">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-800 p-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Spinner size="sm" />
                  <span className="text-sm">Generating explanation...</span>
                </div>
              ) : explanation ? (
                <p className="text-sm leading-relaxed text-zinc-300">
                  {explanation}
                </p>
              ) : hasFailed && fallbackReason ? (
                <div>
                  <p className="text-sm leading-relaxed text-zinc-300 mb-3">
                    {fallbackReason}
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Retrying...' : 'Retry AI explanation'}
                  </button>
                </div>
              ) : hasFailed ? (
                <div>
                  <p className="text-sm text-zinc-500 mb-3">
                    AI explanation unavailable at this time.
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
