'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { useTokenChart } from '@/hooks/useTokens';
import { InlineLoader } from './Spinner';

interface TokenChartProps {
  address: string;
}

interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: Time;
}

const timeframes = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
] as const;

function formatPrice(price: number): string {
  if (price < 0.0001) return price.toExponential(4);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 1000) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(2)}K`;
  return volume.toFixed(2);
}

function UTCClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toISOString().slice(11, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-[11px] text-blastoff-text-muted">
      {time}
    </span>
  );
}

export function TokenChart({ address }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [ohlc, setOhlc] = useState<OHLCData | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const { data: chartData, isLoading } = useTokenChart(address, timeframe);

  // Get current/latest candle data
  const currentCandle = chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const displayOhlc = isHovering && ohlc ? ohlc : currentCandle;
  const priceChange = displayOhlc ? ((displayOhlc.close - displayOhlc.open) / displayOhlc.open) * 100 : 0;
  const isPositive = priceChange >= 0;

  const handleCrosshairMove = useCallback((param: any) => {
    if (!param || !param.time || !param.seriesData) {
      setIsHovering(false);
      return;
    }
    
    const candleData = param.seriesData.get(candleSeriesRef.current) as CandlestickData<Time> | undefined;
    const volumeData = param.seriesData.get(volumeSeriesRef.current);
    
    if (candleData) {
      setIsHovering(true);
      setOhlc({
        open: candleData.open,
        high: candleData.high,
        low: candleData.low,
        close: candleData.close,
        volume: volumeData?.value,
        time: candleData.time,
      });
    }
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || isLoading || !chartData) return;

    // Handle empty chart data
    if (chartData.length === 0) {
      // Clean up existing chart if any
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      return;
    }

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#a0a0a0',
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { 
          color: 'rgba(255, 255, 255, 0.06)',
          visible: true,
        },
        horzLines: { 
          color: 'rgba(255, 255, 255, 0.06)',
          visible: true,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#ff6b00',
          width: 1,
          style: 2,
          labelBackgroundColor: '#ff6b00',
        },
        horzLine: {
          color: '#ff6b00',
          width: 1,
          style: 2,
          labelBackgroundColor: '#ff6b00',
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderVisible: true,
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 12,
        minBarSpacing: 4,
        fixLeftEdge: false,
        fixRightEdge: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderVisible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        autoScale: true,
        alignLabels: true,
      },
      localization: {
        priceFormatter: (price: number) => {
          if (price < 0.0001) return price.toExponential(2);
          if (price < 0.01) return price.toFixed(6);
          if (price < 1) return price.toFixed(4);
          return price.toFixed(2);
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(chartData);
    candleSeriesRef.current = candlestickSeries;

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#3b82f6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    const volumeData = chartData.map((candle) => ({
      time: candle.time,
      value: candle.volume || 0,
      color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    }));

    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    // Set visible range to show last ~50 candles if we have enough data
    if (chartData.length > 50) {
      const from = chartData[chartData.length - 50].time;
      const to = chartData[chartData.length - 1].time;
      chart.timeScale().setVisibleRange({ from, to });
    } else {
      chart.timeScale().fitContent();
    }
    
    chartRef.current = chart;

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove(handleCrosshairMove);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, [chartData, isLoading, handleCrosshairMove]);

  return (
    <div className="border border-blastoff-border bg-[#0a0a0a] h-full flex flex-col overflow-hidden">
      {/* Header with OHLC and Controls */}
      <div className="shrink-0 flex flex-col gap-2 p-3 border-b border-blastoff-border sm:flex-row sm:items-center sm:justify-between">
        {/* OHLC Display */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {displayOhlc ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-blastoff-text-muted">O</span>
                <span className={`font-mono text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(displayOhlc.open)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-blastoff-text-muted">H</span>
                <span className={`font-mono text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(displayOhlc.high)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-blastoff-text-muted">L</span>
                <span className={`font-mono text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(displayOhlc.low)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-blastoff-text-muted">C</span>
                <span className={`font-mono text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(displayOhlc.close)}
                </span>
              </div>
              {displayOhlc.volume !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-blastoff-text-muted">Vol</span>
                  <span className="font-mono text-xs text-blue-400">
                    {formatVolume(displayOhlc.volume)}
                  </span>
                </div>
              )}
              <div className={`font-mono text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </>
          ) : chartData && chartData.length === 0 ? (
            <span className="text-xs text-blastoff-text-muted">Awaiting first trade...</span>
          ) : (
            <span className="text-xs text-blastoff-text-muted">Loading...</span>
          )}
        </div>

        {/* Right side: UTC Clock + Timeframes */}
        <div className="flex items-center gap-3">
          <UTCClock />
          <div className="h-4 w-px bg-blastoff-border" />
          <div className="flex gap-0.5">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2 py-1 text-[11px] font-medium transition-all ${
                  timeframe === tf.value
                    ? 'bg-blastoff-orange text-white'
                    : 'text-blastoff-text-muted hover:text-blastoff-text hover:bg-blastoff-border/50'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <InlineLoader />
        </div>
      ) : chartData && chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <svg className="h-12 w-12 text-blastoff-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="text-sm text-blastoff-text-secondary font-medium">No Trading Activity Yet</p>
          <p className="text-xs text-blastoff-text-muted mt-1">Chart will populate when trades occur</p>
        </div>
      ) : (
        <div ref={chartContainerRef} className="flex-1 w-full min-h-0" />
      )}
    </div>
  );
}
