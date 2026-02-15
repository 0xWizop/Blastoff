# Backend Integration Guide

This document outlines all API endpoints the frontend expects. The backend engineer should implement these endpoints.

## Current Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/tokens` | ✅ Done | Firestore |
| `GET /api/tokens/[address]` | ✅ Done | Firestore |
| `GET /api/tokens/trending` | ✅ Done | Firestore |
| `GET /api/tokens/[address]/chart` | ❌ TODO | Price history |
| `GET /api/balances` | ❌ TODO | On-chain reads |
| `GET /api/positions/[tokenAddress]` | ❌ TODO | Position tracking |
| `GET /api/swap/quote` | ❌ TODO | DEX quotes |
| `POST /api/swap/execute` | ❌ TODO | Build swap tx |
| `POST /api/tokens/create` | ❌ TODO | Factory contract |
| `POST /api/tokens/launch` | ❌ TODO | Liquidity provision |

---

## API Endpoints

### 1. Chart Data

```
GET /api/tokens/[address]/chart?timeframe=1m
```

**Query Params:**
- `timeframe`: `1m` | `5m` | `15m` | `1h` | `4h` | `1d`

**Response:**
```json
{
  "candles": [
    {
      "time": 1706547600,
      "open": 0.0001,
      "high": 0.00011,
      "low": 0.00009,
      "close": 0.000105,
      "volume": 50000
    }
  ]
}
```

**Data Sources:**
- The Graph (Uniswap V3 or Aerodrome subgraph)
- GeckoTerminal API (free tier)
- Custom indexer

---

### 2. Balances

```
GET /api/balances?wallet=0x...&token=0x...
```

**Query Params:**
- `wallet`: User's wallet address (required)
- `token`: Token address (optional)

**Response:**
```json
{
  "balances": {
    "eth": {
      "address": "0x0000000000000000000000000000000000000000",
      "balance": "1000000000000000000",
      "formatted": 1.0,
      "decimals": 18
    },
    "weth": {
      "address": "0x4200000000000000000000000000000000000006",
      "balance": "500000000000000000",
      "formatted": 0.5,
      "decimals": 18
    },
    "token": {
      "address": "0x...",
      "balance": "1000000000",
      "formatted": 1000,
      "decimals": 6
    }
  }
}
```

**Implementation:**
```typescript
// Option 1: Direct RPC
const balance = await provider.getBalance(wallet);
const tokenBalance = await tokenContract.balanceOf(wallet);

// Option 2: Alchemy Token API
// https://docs.alchemy.com/reference/alchemy-gettokenbalances
```

---

### 3. User Position

```
GET /api/positions/[tokenAddress]?wallet=0x...
```

**Response:**
```json
{
  "position": {
    "tokenAddress": "0x...",
    "balance": 10000,
    "averageEntry": 0.00008,
    "currentValue": 1.0,
    "pnlUsd": 0.2,
    "pnlPercent": 25
  }
}
```

**Note:** Average entry price requires tracking historical swaps. Options:
1. Index swap events from DEX pools
2. Track via your own database when users swap through your app
3. Return `null` for averageEntry if not tracking

---

### 4. Swap Quote

```
GET /api/swap/quote?tokenAddress=0x...&inputAmount=0.1&isBuy=true&slippage=1
```

**Query Params:**
- `tokenAddress`: Token to swap
- `inputAmount`: Amount in human-readable format
- `isBuy`: `true` = WETH→Token, `false` = Token→WETH
- `slippage`: Percentage (e.g., `1` for 1%)

**Response:**
```json
{
  "quote": {
    "inputAmount": 0.1,
    "outputAmount": 1000,
    "priceImpact": 0.5,
    "fee": 0.0003
  }
}
```

**Implementation:**
```typescript
// Uniswap V3 Quoter
const quoter = new ethers.Contract(QUOTER_ADDRESS, QuoterABI, provider);
const quote = await quoter.callStatic.quoteExactInputSingle(
  tokenIn,
  tokenOut,
  fee,
  amountIn,
  sqrtPriceLimitX96
);
```

---

### 5. Swap Execution (Optional)

```
POST /api/swap/execute
```

**Request Body:**
```json
{
  "wallet": "0x...",
  "tokenAddress": "0x...",
  "inputAmount": 0.1,
  "minOutputAmount": 990,
  "isBuy": true,
  "deadline": 1706548000
}
```

**Response:**
```json
{
  "transaction": {
    "to": "0x...",
    "data": "0x...",
    "value": "0x16345785d8a0000",
    "gasLimit": "0x30d40"
  }
}
```

Frontend will send this via user's wallet. Alternatively, swaps can be executed directly from frontend using wagmi.

---

### 6. Token Creation (Future)

```
POST /api/tokens/create
```

**Request Body:**
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "totalSupply": "1000000000000000000000000",
  "decimals": 18,
  "description": "A cool token",
  "website": "https://...",
  "twitter": "@...",
  "logoUrl": "https://..."
}
```

**Response:**
```json
{
  "transaction": { "to": "...", "data": "...", "value": "...", "gasLimit": "..." },
  "predictedAddress": "0x..."
}
```

---

### 7. Token Launch (Future)

```
POST /api/tokens/launch
```

**Request Body:**
```json
{
  "tokenAddress": "0x...",
  "dex": "UNISWAP_V3",
  "initialPriceWeth": 0.0001,
  "wethLiquidity": 1.0,
  "feeTier": 3000
}
```

**Response:**
```json
{
  "transaction": { "to": "...", "data": "...", "value": "...", "gasLimit": "..." },
  "poolAddress": "0x..."
}
```

---

## Types Reference

```typescript
interface Token {
  address: string;
  name: string;
  symbol: string;
  status: 'LIVE' | 'UPCOMING' | 'ENDED';
  raised: number;
  hardCap: number;
  softCap: number;
  startTime: number;
  endTime: number;
  price: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  logoUrl: string;
}

interface ChartCandle {
  time: number;      // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UserPosition {
  tokenAddress: string;
  balance: number;
  averageEntry: number;
  currentValue: number;
  pnlUsd: number;
  pnlPercent: number;
}

interface SwapQuote {
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
}
```

---

## Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| WETH | `0x4200000000000000000000000000000000000006` |
| Uniswap V3 Router | `0x2626664c2603336E57B271c5C0b26F421741e481` |
| Uniswap V3 Quoter | `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a` |
| Aerodrome Router | `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43` |

---

## Frontend Files Reference

| File | Purpose |
|------|---------|
| `src/hooks/useTokens.ts` | Token data fetching hooks |
| `src/hooks/useBalances.ts` | Balance fetching hook |
| `src/hooks/useSwap.ts` | Swap execution hook |
| `src/config/contracts.ts` | Contract addresses config |
| `src/types/index.ts` | TypeScript interfaces |
