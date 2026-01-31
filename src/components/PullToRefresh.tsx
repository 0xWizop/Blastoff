'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Spinner } from './Spinner';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const startY = useRef(0);

  const handlePanStart = useCallback((_: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;
    
    // Only start pull if at top of scroll
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = info.point.y;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handlePan = useCallback((_: any, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setIsPulling(false);
      setPullProgress(0);
      return;
    }

    const deltaY = info.point.y - startY.current;
    if (deltaY < 0) {
      setPullProgress(0);
      return;
    }

    // Rubber band effect - decreases as you pull further
    const resistance = 0.4;
    const pullDistance = Math.min(deltaY * resistance, MAX_PULL);
    const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
    
    setPullProgress(progress);
    controls.set({ y: pullDistance });
  }, [disabled, isRefreshing, isPulling, controls]);

  const handlePanEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    setIsPulling(false);

    if (pullProgress >= 1) {
      setIsRefreshing(true);
      controls.start({ y: PULL_THRESHOLD * 0.5 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullProgress(0);
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
      }
    } else {
      setPullProgress(0);
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
    }
  }, [disabled, isRefreshing, pullProgress, onRefresh, controls]);

  // Check if device supports touch (mobile)
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  if (!isTouchDevice || disabled) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative overflow-auto">
      {/* Pull indicator */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex justify-center">
        <motion.div
          className="flex h-12 items-center justify-center"
          style={{ opacity: isPulling || isRefreshing ? 1 : 0 }}
          animate={{ y: isPulling ? pullProgress * 40 : isRefreshing ? 20 : -40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2 rounded-full bg-blastoff-surface px-4 py-2 shadow-lg">
              <Spinner size="sm" />
              <span className="text-xs text-blastoff-text-secondary">Refreshing...</span>
            </div>
          ) : (
            <motion.div
              className="flex items-center gap-2 rounded-full bg-blastoff-surface px-4 py-2 shadow-lg"
              animate={{ scale: pullProgress >= 1 ? 1.1 : 1 }}
            >
              <motion.svg
                className="h-4 w-4 text-blastoff-orange"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ rotate: pullProgress * 180 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </motion.svg>
              <span className="text-xs text-blastoff-text-secondary">
                {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        animate={controls}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
