# BLASTOFF

A modern token launchpad frontend built on Base chain.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS (custom black + orange theme)
- **Wallet**: Wagmi + Viem
- **State Management**: Zustand (UI state), TanStack Query (data)
- **Charts**: TradingView Lightweight Charts
- **Animations**: Framer Motion (optional)

## Features

- **Wallet Integration**: MetaMask, Coinbase Wallet, Rainbow, Rabby, WalletConnect v2
- **Base Chain Only**: Configured exclusively for Base network
- **Token Feed**: Filterable grid of token launches with status, progress, and time remaining
- **Trending Module**: Momentum-based token rankings with auto-refresh
- **Individual Token Pages**: Detailed view with chart, swap panel, and position tracking
- **TradingView Charts**: Dark themed candlestick charts with multiple timeframes
- **Swap Panel**: Frontend shell for ETH ↔ Token swaps (UI only, no execution logic)
- **User Position**: PnL and balance display for connected wallets

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Add your WalletConnect Project ID to .env.local
# Get one at https://cloud.walletconnect.com/
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to `/app`.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── app/                       # Main token feed (/app)
│   ├── create/                    # Token creation / launch preview
│   ├── token/[address]/           # Individual token page (chart, swap, trades)
│   ├── docs/                      # Documentation layout + pages
│   ├── api/                       # Backend routes (tokens, swap, balances, ICO)
│   ├── globals.css                # Global styles
│   └── layout.tsx                 # Root layout
├── components/                    # Reusable UI
│   ├── Header.tsx                 # App header (switches to DocsHeader on /docs)
│   ├── DocsHeader.tsx             # Documentation header
│   ├── CoinCard.tsx               # Token card in feed
│   ├── FilterBar.tsx              # Search / sort / filters
│   ├── TokenChart.tsx             # Lightweight candlestick chart
│   ├── SwapPanel.tsx              # Buy / sell panel (ICO + DEX)
│   ├── RecentTrades.tsx           # Live trades list
│   ├── TrendingTokens.tsx         # Trending / top movers
│   ├── WalletButton.tsx           # Wallet connect / network
│   └── Skeleton.tsx               # Loading skeletons
├── config/
│   └── contracts.ts               # Chain + contract addresses (TokenFactory, routers)
├── data/
│   └── mockTokens.ts              # Mock tokens for local/dev
├── hooks/                         # React hooks (data + web3)
│   ├── useTokens.ts               # Tokens list, charts, positions, swap quotes
│   ├── useSwap.ts                 # DEX swap execution
│   ├── useBalances.ts             # Wallet balances
│   ├── useTokenFactory.ts         # ICO state + TokenFactory buy/sell
│   └── useTradeStream.ts          # SSE trade stream
├── lib/
│   ├── chainUtils.ts              # On-chain reads, trades, ICO stats
│   ├── firestoreTokenMap.ts       # Map Firestore docs → Token shape
│   ├── firestoreTrades.ts         # Persist / load trades history
│   └── ethPrice.ts                # ETH price helpers
├── providers/
│   └── Web3Provider.tsx           # Wagmi + TanStack Query providers
├── services/
│   └── api.ts                     # Client-side API helpers
├── store/
│   └── useAppStore.ts             # Zustand UI state
└── types/
    └── index.ts                   # Shared TypeScript types
```

## Data Architecture

All data hooks are designed to be easily swapped for real API calls:

- `useTokens(filters?)` - Fetch all tokens with optional filters
- `useToken(address)` - Fetch single token by address
- `useTokenChart(address, timeframe)` - Fetch OHLCV chart data
- `useTrendingTokens()` - Fetch trending tokens
- `useUserPosition(token, wallet)` - Fetch user's position
- `useSwapQuote(params)` - Fetch swap quote

## Routing

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/app` |
| `/app` | Main coin feed with filters and trending |
| `/token/:address` | Individual token page |

All routes are deep-linkable with URL query param sync for filters.

## Design System

- **Background**: `#0a0a0a` (near-black)
- **Surface**: `#111111`
- **Border**: `#1a1a1a`
- **Accent**: `#ff6b00` (orange)
- **Font Display**: Orbitron
- **Font Body**: Inter
- **Font Mono**: JetBrains Mono

## Explicit Non-Goals (v1)

- No homepage (loads directly into `/app`)
- No backend API (mocked)
- No admin panel
- No social features
- No advanced chart indicators
- No presales—fair launches only (straight to Uniswap & Aerodrome)

## License

MIT
