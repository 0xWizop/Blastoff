import { Token, ChartCandle, UserPosition } from '@/types';

export const mockTokens: Token[] = [
  {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Quantum AI',
    symbol: 'QAI',
    status: 'LIVE',
    raised: 45.5,
    hardCap: 100,
    softCap: 25,
    startTime: Date.now() - 86400000,
    endTime: Date.now() + 172800000,
    price: 0.0001,
    marketCap: 1000000,
    volume24h: 250000,
    priceChange24h: 5.25,
    description: 'Next-gen AI protocol on Base',
    website: 'https://quantumai.io',
    twitter: '@quantumai',
    telegram: 'quantumai',
    discord: 'https://discord.gg/quantumai',
    logoUrl: '/tokens/qai.png',
  },
  {
    address: '0x2345678901abcdef2345678901abcdef23456789',
    name: 'Neural Network',
    symbol: 'NEURAL',
    status: 'LIVE',
    raised: 78.2,
    hardCap: 150,
    softCap: 50,
    startTime: Date.now() - 172800000,
    endTime: Date.now() + 86400000,
    price: 0.00025,
    marketCap: 2750000,
    volume24h: 540000,
    priceChange24h: -2.14,
    description: 'Decentralized neural computing',
    website: 'https://neural.network',
    twitter: '@neuralnet',
    logoUrl: '/tokens/neural.png',
  },
  {
    address: '0x3456789012abcdef3456789012abcdef34567890',
    name: 'Cyber Core',
    symbol: 'CYBER',
    status: 'UPCOMING',
    raised: 0,
    hardCap: 200,
    softCap: 75,
    startTime: Date.now() - 72000000,
    endTime: Date.now() + 604800000,
    price: 0.0005,
    marketCap: 0,
    volume24h: 0,
    priceChange24h: 0,
    description: 'Infrastructure for the cyber economy',
    website: 'https://cybercore.io',
    twitter: '@cybercore',
    logoUrl: '/tokens/cyber.png',
  },
  {
    address: '0x4567890123abcdef4567890123abcdef45678901',
    name: 'Digital Nexus',
    symbol: 'DNEX',
    status: 'LIVE',
    raised: 125.8,
    hardCap: 175,
    softCap: 60,
    startTime: Date.now() - 259200000,
    endTime: Date.now() + 43200000,
    price: 0.00015,
    marketCap: 1850000,
    volume24h: 310000,
    priceChange24h: 0.88,
    description: 'Connecting digital ecosystems',
    logoUrl: '/tokens/dnex.png',
  },
  {
    address: '0x5678901234abcdef5678901234abcdef56789012',
    name: 'Synth Protocol',
    symbol: 'SYNTH',
    status: 'ENDED',
    raised: 200,
    hardCap: 200,
    softCap: 100,
    startTime: Date.now() - 604800000,
    endTime: Date.now() - 86400000,
    price: 0.0003,
    marketCap: 4200000,
    volume24h: 0,
    priceChange24h: 0,
    description: 'Synthetic asset protocol',
    logoUrl: '/tokens/synth.png',
  },
  {
    address: '0x6789012345abcdef6789012345abcdef67890123',
    name: 'Meta Forge',
    symbol: 'MFORGE',
    status: 'UPCOMING',
    raised: 0,
    hardCap: 250,
    softCap: 100,
    startTime: Date.now() - 108000000,
    endTime: Date.now() + 864000000,
    price: 0.00075,
    marketCap: 0,
    volume24h: 0,
    priceChange24h: 0,
    description: 'Metaverse creation toolkit',
    logoUrl: '/tokens/mforge.png',
  },
  {
    address: '0x7890123456abcdef7890123456abcdef78901234',
    name: 'Pulse Network',
    symbol: 'PULSE',
    status: 'LIVE',
    raised: 89.4,
    hardCap: 120,
    softCap: 40,
    startTime: Date.now() - 129600000,
    endTime: Date.now() + 129600000,
    price: 0.0002,
    marketCap: 950000,
    volume24h: 610000,
    priceChange24h: 12.43,
    description: 'Real-time data streaming',
    logoUrl: '/tokens/pulse.png',
  },
  {
    address: '0x8901234567abcdef8901234567abcdef89012345',
    name: 'Void Chain',
    symbol: 'VOID',
    status: 'ENDED',
    raised: 150,
    hardCap: 150,
    softCap: 50,
    startTime: Date.now() - 864000000,
    endTime: Date.now() - 259200000,
    price: 0.0004,
    marketCap: 2250000,
    volume24h: 0,
    priceChange24h: 0,
    description: 'Privacy-first blockchain',
    logoUrl: '/tokens/void.png',
  },
];

export function generateMockChartData(basePrice: number, count: number = 100): ChartCandle[] {
  const candles: ChartCandle[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  const interval = 60000; // 1 minute

  for (let i = count; i >= 0; i--) {
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.random() * 1000000;

    candles.push({
      time: Math.floor((now - i * interval) / 1000),
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export function generateMockUserPosition(token: Token, walletAddress: string): UserPosition | null {
  if (!walletAddress) return null;
  
  const hasPosition = Math.random() > 0.3;
  if (!hasPosition) return null;

  const balance = Math.random() * 100000;
  const averageEntry = token.price * (0.8 + Math.random() * 0.4);
  const currentValue = balance * token.price;
  const costBasis = balance * averageEntry;
  const pnlUsd = currentValue - costBasis;
  const pnlPercent = ((currentValue - costBasis) / costBasis) * 100;

  return {
    tokenAddress: token.address,
    balance,
    averageEntry,
    currentValue,
    pnlUsd,
    pnlPercent,
  };
}

export const trendingTokens = mockTokens
  .filter((t) => t.status === 'LIVE')
  .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
  .slice(0, 5);
