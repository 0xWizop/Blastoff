# Firebase / Firestore Setup for BLASTOFF

This doc describes Firestore collections, indexes, and rules. We **do not** seed mock tokens; TokenData is filled when users create/launch tokens.

---

## Collections We Use

| Collection / Path | Purpose | Who writes | Who reads |
|------------------|----------|------------|-----------|
| **TokenData** (doc ID = token address) | Token metadata: name, symbol, price, volume, status, creator, social links, launch info. | API (create, launch, admin seed) via Admin SDK | API (tokens list, token by address, trending, creators) |
| **TokenData/{tokenAddress}/chat** | Per-token chat (walletAddress, message, timestamp). | Client (addDoc) from TokenChat | Client (onSnapshot) |
| **TradeHistory** | One doc per swap for PnL / average entry. | Backend only (when recording a swap). | Backend only (positions API). |
| **UserPositions** | Cached position per wallet+token (balance, averageEntry, cost basis). | Backend only (when recording trades or reconciling). | Backend only (positions API). |

---

## Collection Details

### TokenData

- **Identity:** `name`, `symbol`, `contractID`, `image` (logoUrl)
- **Creator:** `creatorAddress` or `account`
- **Stats:** `volume`, `marketCap`, `price` / `priceUsd`, `priceChange24h` / `change24h`, `status`
- **Launch:** `createdAt`, `startTime`, `raised`, `hardCap`, `softCap`, `totalSupply`, `decimals`, `chainId`
- **Post-launch:** `launchedAt`, `launchTxHash`, `poolAddress`, `dex`, `feeTier`, `wethLiquidity`, `collateralRaised`
- **Social:** `website`, `twitter`, `telegram`, `discord`, `description`

### TradeHistory (PnL tracking)

Suggested fields per doc (backend writes when a swap is confirmed):

- `walletAddress` (string)
- `tokenAddress` (string)
- `type` ('buy' | 'sell')
- `tokenAmount` (number)
- `quoteAmount` (number, ETH side)
- `priceUsd` (number, at time of trade)
- `txHash` (string)
- `timestamp` (number or Firestore Timestamp)
- `chainId` (number)

**Indexes:** `(walletAddress, tokenAddress, timestamp desc)` for “trades for this user+token” (PnL); `(tokenAddress, timestamp desc)` for “recent trades for token”.

### UserPositions (cached position)

Suggested doc ID: `{walletAddress}_{tokenAddress}` or auto-id with fields:

- `walletAddress`, `tokenAddress`
- `balance` (number)
- `averageEntry` (number)
- `totalCostBasis` (number)
- `lastUpdated` (timestamp)

**Index:** `walletAddress` for “all positions for wallet”.

---

## Indexes (`firestore.indexes.json`)

- **TokenData:** volume desc; creatorAddress; contractID
- **chat** (subcollection): timestamp desc
- **TradeHistory:** (walletAddress, tokenAddress, timestamp desc); (tokenAddress, timestamp desc)
- **UserPositions:** walletAddress

---

## Rules (`firestore.rules`)

- **TokenData:** read everyone; write no one from client (backend only).
- **TokenData/{id}/chat:** read everyone; create only with valid `walletAddress`, `message`, `timestamp`, `message.size() <= 500`.
- **TradeHistory:** read/write `false` from client (backend only).
- **UserPositions:** read/write `false` from client (backend only).

---

## Deploying Rules and Indexes

1. Install Firebase CLI if needed: `npm install -g firebase-tools`
2. Log in and select project: `firebase login` then `firebase use <project-id>`
3. From project root:

   ```bash
   npm run firestore:deploy
   ```

   or: `npx firebase deploy --only firestore --project blastoff-eccba`

---

## No Mock Token Seeding

We do **not** seed mock tokens into TokenData. Tokens come from:

- User flows: create token → launch token (API writes to TokenData).
- Optional dev: `POST /api/admin/seed-mock-tokens` with header `x-seed-secret` (same as `SEED_SECRET` in env).

The `npm run seed` script is a no-op; it does not add tokens.
