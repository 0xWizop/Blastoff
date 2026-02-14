'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DOCS_NAV, isDocsSection } from '../docsNav';
import {
  Code,
  Pre,
  Icons,
  MockImage,
  SectionTitle,
  ApiEndpoint,
} from '../components';

export default function DocSectionPage({
  params,
}: {
  params: { section: string };
}) {
  const section = params.section;
  if (!section || !isDocsSection(section)) notFound();

  return (
    <>
      <header className="mb-6">
        <h1 className="font-logo text-2xl tracking-wide text-blastoff-orange md:text-3xl">
          BLASTOFF Documentation
        </h1>
        <p className="mt-1 text-sm text-blastoff-text-secondary">
          Fair launch token pad on Base. Create tokens and deploy liquidity straight to Uniswap & Aerodrome.
        </p>
      </header>

      {section === 'launch-mechanism' && (
        <div className="space-y-6">
          <SectionTitle icon={Icons.TrendingUp}>Launch mechanism</SectionTitle>
          <p className="text-sm text-blastoff-text-secondary">
            Tokens are created and liquidity is deployed straight to DEX. No bonding curve or ICO phase—fair launch only.
          </p>
          <div className="rounded border border-blastoff-border bg-blastoff-surface p-4">
            <h3 className="mb-3 text-center text-sm font-semibold text-blastoff-text">Token lifecycle</h3>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-3">
              <div className="flex flex-1 flex-col items-center sm:max-w-[180px]">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blastoff-orange font-mono text-sm font-bold text-blastoff-orange">1</div>
                <p className="mt-1.5 text-center font-mono text-xs font-semibold text-blastoff-text">Create token</p>
                <p className="mt-0.5 text-center text-xs text-blastoff-text-secondary">Deploy ERC‑20 (name, symbol)</p>
              </div>
              <span className="text-lg text-blastoff-text-muted sm:mt-8">→</span>
              <div className="flex flex-1 flex-col items-center sm:max-w-[180px]">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blastoff-success font-mono text-sm font-bold text-blastoff-success">2</div>
                <p className="mt-1.5 text-center font-mono text-xs font-semibold text-blastoff-text">Deploy to DEX</p>
                <p className="mt-0.5 text-center text-xs text-blastoff-text-secondary">Uniswap V3 & Aerodrome</p>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-blastoff-text-muted">Time →</p>
          </div>
          <MockImage label="Deploy liquidity — Uniswap V3 & Aerodrome pools" />
          <p className="text-sm text-blastoff-text-secondary">
            Swaps use Uniswap V3 and Aerodrome. Quote and execute APIs return DEX router transactions.
          </p>
        </div>
      )}

      {section === 'create-token' && (
        <div className="space-y-6">
          <SectionTitle icon={Icons.Pen}>Create token</SectionTitle>
          <p className="text-sm text-blastoff-text-secondary">
            Create flow at <Link href="/create" className="text-blastoff-orange hover:underline">/create</Link>.
            Required: <strong className="text-blastoff-text">Name</strong>, <strong className="text-blastoff-text">Symbol</strong>,{' '}
            <strong className="text-blastoff-text">Total supply</strong>, <strong className="text-blastoff-text">Decimals</strong>.
            Optional: website, Twitter, Telegram, Discord.
          </p>
          <MockImage label="Create token form" />
          <div className="rounded border border-blastoff-border bg-blastoff-surface p-3">
            <h3 className="text-sm font-semibold text-blastoff-text">Flow</h3>
            <ol className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4">
              {[
                'User submits form',
                'POST /api/tokens/create (no txHash) → transaction',
                'User signs in wallet',
                'App polls for confirmation',
                'POST /api/tokens/create (with txHash) → Firestore',
                'Redirect to /token/[address]',
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-blastoff-text-secondary">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blastoff-orange/20 font-mono text-[10px] text-blastoff-orange">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <p className="text-sm text-blastoff-text-secondary">
            On-chain, <Code>createToken(name, symbol)</Code> mints the ERC‑20. Liquidity is then deployed to Uniswap V3 and/or Aerodrome. Supply/decimals in the UI are for display and Firestore.
          </p>
        </div>
      )}

      {section === 'tokens-api' && (
        <div className="space-y-6">
          <SectionTitle icon={Icons.Code}>Tokens API</SectionTitle>
          <p className="text-sm text-blastoff-text-secondary">
            All routes under <Code>/api</Code>. Optional <Code>chainId</Code> (8453 = Base, 84532 = Base Sepolia); default Base Sepolia.
          </p>
          <MockImage label="Tokens API — list, trending, single token, chart, trades" aspectRatio="wide" />
          <div className="space-y-3">
            <ApiEndpoint method="GET" path="/api/tokens" desc="List all tokens. Query: live=true, chainId." response='{ "tokens": [...] }' />
            <ApiEndpoint method="GET" path="/api/tokens/trending" desc="Top 5 by trending score (volume + momentum)." />
            <ApiEndpoint method="GET" path="/api/tokens/[address]" desc="Single token + on-chain stats, trades, holders." response='{ "token": { ... } }' />
            <ApiEndpoint method="GET" path="/api/tokens/[address]/chart" desc="OHLCV candles. Query: timeframe, chainId." />
            <ApiEndpoint method="GET" path="/api/tokens/[address]/trades" desc="Recent trades. Query: limit, chainId." />
            <ApiEndpoint method="GET" path="/api/tokens/[address]/holders" desc="Holder list/count." />
          </div>
        </div>
      )}

      {section === 'launch-api' && (
        <div className="space-y-6">
          <SectionTitle icon={Icons.Code}>Launch API</SectionTitle>
          <MockImage label="Launch API — create token, deploy to DEX" aspectRatio="video" />
          <div className="space-y-3">
            <ApiEndpoint method="POST" path="/api/tokens/create" desc="Without txHash: returns transaction. With txHash: parses receipt, writes Firestore, returns tokenAddress." />
            <ApiEndpoint method="POST" path="/api/tokens/launch" desc="Deploy liquidity or update launch status. Body: tokenAddress, dex (UNISWAP_V3 | AERODROME), initialPriceWeth, wethLiquidity, feeTier, chainId." />
            <ApiEndpoint method="GET" path="/api/tokens/launch" desc="Query: tokenAddress, chainId. Returns launch status and pool info." />
          </div>
        </div>
      )}

      {section === 'swap-api' && (
        <div className="space-y-6">
          <SectionTitle icon={Icons.Code}>Swap & quote API</SectionTitle>
          <MockImage label="Swap API — quote & execute via Uniswap V3 / Aerodrome" aspectRatio="video" />
          <div className="space-y-3">
            <ApiEndpoint method="GET" path="/api/swap/quote" desc="Query: tokenAddress, inputAmount, isBuy, slippage, chainId, feeTier. Uses Uniswap V3 quoter (or Aerodrome where configured)." response='{ "quote": { ... } }' />
            <ApiEndpoint method="POST" path="/api/swap/execute" desc="Body: wallet, tokenAddress, inputAmount, isBuy, slippage, feeTier, chainId. Returns Uniswap V3 tx." response='{ "transaction": { ... } }' />
          </div>
        </div>
      )}

      {section === 'other-apis' && (
        <div className="space-y-6">
          <SectionTitle icon={Icons.Code}>Other endpoints</SectionTitle>
          <MockImage label="Other API — positions, trade record, balances, creators" aspectRatio="video" />
          <div className="space-y-3">
            <ApiEndpoint method="GET" path="/api/positions/[tokenAddress]" desc="Query: wallet, chainId. Returns balance, averageEntry, pnlUsd, pnlPercent." />
            <ApiEndpoint method="POST" path="/api/trades/record" desc="Record swap for PnL. Body: txHash, tokenAddress, wallet, isBuy, inputAmount, outputAmount, chainId." />
            <ApiEndpoint method="GET" path="/api/balances" desc="Wallet balances." />
            <ApiEndpoint method="GET" path="/api/creators/[address]" desc="Tokens created by address." />
          </div>
        </div>
      )}

      {section === 'networks' && (
        <div className="space-y-6">
          <SectionTitle icon={Icons.Globe}>Networks & contracts</SectionTitle>
          <p className="text-sm text-blastoff-text-secondary">
            Supported: <Code>8453</Code> (Base Mainnet), <Code>84532</Code> (Base Sepolia). Default Base Sepolia. Config: <Code>src/config/contracts.ts</Code>.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-blastoff-border bg-blastoff-surface p-3">
              <div className="flex items-center gap-2">
                <span className="text-blastoff-orange"><Icons.Globe /></span>
                <div>
                  <h3 className="text-sm font-semibold text-blastoff-text">Base Sepolia (84532)</h3>
                  <p className="text-xs text-blastoff-text-muted">Testnet</p>
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-blastoff-text-secondary">
                <li>• WETH, token creation</li>
                <li>• Uniswap V3, Aerodrome for liquidity & swap</li>
              </ul>
            </div>
            <div className="rounded border border-blastoff-border bg-blastoff-surface p-3">
              <div className="flex items-center gap-2">
                <span className="text-blastoff-orange"><Icons.Globe /></span>
                <div>
                  <h3 className="text-sm font-semibold text-blastoff-text">Base Mainnet (8453)</h3>
                  <p className="text-xs text-blastoff-text-muted">Production</p>
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-blastoff-text-secondary">
                <li>• WETH, Uniswap V3, Aerodrome</li>
                <li>• Straight DEX deployment</li>
              </ul>
            </div>
          </div>
          <MockImage label="Contract addresses & RPC" />
          <p className="text-sm text-blastoff-text-secondary">
            Firestore: <Code>TokenData</Code>, <Code>UserPositions</Code>.
          </p>
        </div>
      )}

      <footer className="mt-8 border-t border-blastoff-border pt-4 text-xs text-blastoff-text-muted">
        <Link href="/app" className="text-blastoff-orange hover:underline">Back to app</Link>
      </footer>
    </>
  );
}
