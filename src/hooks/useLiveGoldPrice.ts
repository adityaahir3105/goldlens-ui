'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

interface UseLiveGoldPriceOptions {
  price: number;
  updatedAt: string;
  interpolationDurationMs?: number;
}

interface UseLiveGoldPriceResult {
  displayPrice: number;
  secondsAgo: number;
  isAnimating: boolean;
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function subscribeToClock(onTick: () => void): () => void {
  const interval = setInterval(onTick, 1000);
  return () => clearInterval(interval);
}

// Server render (and hydration) shows 0s, matching the previous useState(0) behavior.
function getServerSecondsAgo(): number {
  return 0;
}

export function useLiveGoldPrice({
  price,
  updatedAt,
  interpolationDurationMs = 120000,
}: UseLiveGoldPriceOptions): UseLiveGoldPriceResult {
  const [displayPrice, setDisplayPrice] = useState(price);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastPrice, setLastPrice] = useState(price);
  
  const previousPriceRef = useRef(price);
  const targetPriceRef = useRef(price);
  const animationStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const calculateSecondsAgo = useCallback(() => {
    const updated = new Date(updatedAt).getTime();
    const now = Date.now();
    return Math.floor((now - updated) / 1000);
  }, [updatedAt]);

  // Flag the animation as soon as a new price arrives, during render rather than in an effect.
  if (price !== lastPrice) {
    setLastPrice(price);
    setIsAnimating(true);
  }

  useEffect(() => {
    if (price !== targetPriceRef.current) {
      previousPriceRef.current = displayPrice;
      targetPriceRef.current = price;
      animationStartTimeRef.current = Date.now();
    }
  }, [price, displayPrice]);

  useEffect(() => {
    const animate = () => {
      if (animationStartTimeRef.current === null) {
        setDisplayPrice(targetPriceRef.current);
        setIsAnimating(false);
        return;
      }

      const elapsed = Date.now() - animationStartTimeRef.current;
      const progress = Math.min(elapsed / interpolationDurationMs, 1);
      const easedProgress = easeOutQuad(progress);

      const priceDiff = targetPriceRef.current - previousPriceRef.current;
      const newPrice = previousPriceRef.current + priceDiff * easedProgress;

      setDisplayPrice(newPrice);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayPrice(targetPriceRef.current);
        setIsAnimating(false);
        animationStartTimeRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [price, interpolationDurationMs]);

  const secondsAgo = useSyncExternalStore(subscribeToClock, calculateSecondsAgo, getServerSecondsAgo);

  return {
    displayPrice,
    secondsAgo,
    isAnimating,
  };
}
