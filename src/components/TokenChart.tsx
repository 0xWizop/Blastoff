'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { useTokenChart } from '@/hooks/useTokens';
import { InlineLoader } from './Spinner';

interface TokenChartProps {
  address: string;
}

const timeframes = ['1m', '5m', '15m', '1h'] as const;

export function TokenChart({ address }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1m');
  const { data: chartData, isLoading } = useTokenChart(address, timeframe);

  useEffect(() => {
    if (!chartContainerRef.current || isLoading || !chartData) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#111111' },
        textColor: '#a0a0a0',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: '#1a1a1a',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#1a1a1a',
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00c853',
      downColor: '#ff3d00',
      borderUpColor: '#00c853',
      borderDownColor: '#ff3d00',
      wickUpColor: '#00c853',
      wickDownColor: '#ff3d00',
    });

    candlestickSeries.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData, isLoading]);

  return (
    <div className="border border-blastoff-border bg-blastoff-surface p-4 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-blastoff-text">
          Price Chart
        </h3>
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-medium transition-all ${
                timeframe === tf
                  ? 'bg-blastoff-orange text-white'
                  : 'bg-blastoff-bg text-blastoff-text-secondary hover:text-blastoff-text'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <InlineLoader />
        </div>
      ) : (
        <div ref={chartContainerRef} className="flex-1 w-full min-h-0" />
      )}
    </div>
  );
}
