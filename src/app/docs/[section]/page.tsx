'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DOCS_NAV, isDocsSection } from '../docsNav';
import { Code, Icons, SectionTitle, ApiEndpoint, DocBlock } from '../components';

export default function DocSectionPage({
  params,
}: {
  params: { section: string };
}) {
  const section = params.section;
  if (!section || !isDocsSection(section)) notFound();

  return (
    <>
      <DocBlock>
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-blastoff-text sm:text-3xl">
            {DOCS_NAV.find((n) => n.slug === section)?.label ?? 'Documentation'}
          </h1>
          <p className="mt-2 text-sm text-blastoff-text-secondary">
            Fair launch token pad on Base. Create tokens and deploy liquidity straight to Uniswap & Aerodrome.
          </p>
        </header>
      </DocBlock>

      {section === 'launch-mechanism' && (
        <>
          <DocBlock>
            <section>
              <SectionTitle id="overview" icon={Icons.TrendingUp}>
                Launch mechanism
              </SectionTitle>
              <p className="mt-4 text-sm leading-relaxed text-blastoff-text-secondary">
                Tokens are created and liquidity is deployed straight to DEX. No bonding curve or ICO phase—fair launch only.
              </p>
            </section>
          </DocBlock>

          <DocBlock>
            <section id="token-lifecycle" className="scroll-mt-24">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blastoff-text">
                Token lifecycle
              </h3>
              <div className="rounded-lg border border-blastoff-border bg-blastoff-bg p-5">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
                <div className="flex flex-1 flex-col items-center sm:max-w-[200px]">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-blastoff-orange font-mono text-base font-bold text-blastoff-orange">
                    1
                  </div>
                  <p className="mt-2 text-center text-sm font-semibold text-blastoff-text">Create token</p>
                  <p className="mt-0.5 text-center text-xs text-blastoff-text-secondary">Deploy ERC‑20 (name, symbol)</p>
                </div>
                <span className="text-xl text-blastoff-text-muted sm:mt-8" aria-hidden>→</span>
                <div className="flex flex-1 flex-col items-center sm:max-w-[200px]">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500/80 font-mono text-base font-bold text-emerald-400">
                    2
                  </div>
                  <p className="mt-2 text-center text-sm font-semibold text-blastoff-text">Deploy to DEX</p>
                  <p className="mt-0.5 text-center text-xs text-blastoff-text-secondary">Uniswap V3 & Aerodrome</p>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-blastoff-text-muted">Time →</p>
            </div>
          </section>
          </DocBlock>

          <DocBlock>
            <section id="dex" className="scroll-mt-24">
              <p className="text-sm leading-relaxed text-blastoff-text-secondary">
                Swaps use Uniswap V3 and Aerodrome. Quote and execute APIs return DEX router transactions.
              </p>
            </section>
          </DocBlock>
        </>
      )}

      {section === 'create-token' && (
        <>
          <DocBlock>
            <section>
              <SectionTitle id="overview" icon={Icons.Pen}>
                Create token
              </SectionTitle>
              <p className="mt-4 text-sm leading-relaxed text-blastoff-text-secondary">
                Create flow at{' '}
                <Link
                  href="/create"
                  className="text-blastoff-orange underline decoration-blastoff-orange/50 underline-offset-2 hover:decoration-blastoff-orange"
                >
                  /create
                </Link>
                . Required: <strong className="text-blastoff-text">Name</strong>, <strong className="text-blastoff-text">Symbol</strong>,{' '}
                <strong className="text-blastoff-text">Total supply</strong>, <strong className="text-blastoff-text">Decimals</strong>.
                Optional: website, Twitter, Telegram, Discord.
              </p>
            </section>
          </DocBlock>

          <DocBlock>
            <section id="flow" className="scroll-mt-24">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blastoff-text">
                Flow
              </h3>
              <div className="rounded-lg border border-blastoff-border bg-blastoff-bg p-4">
              <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
                {[
                  'User submits form',
                  'POST /api/tokens/create (no txHash) → transaction',
                  'User signs in wallet',
                  'App polls for confirmation',
                  'POST /api/tokens/create (with txHash) → Firestore',
                  'Redirect to /token/[address]',
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-blastoff-text-secondary">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blastoff-orange/20 font-mono text-xs font-semibold text-blastoff-orange">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </section>
          </DocBlock>

          <DocBlock>
            <section id="on-chain" className="scroll-mt-24">
              <p className="text-sm leading-relaxed text-blastoff-text-secondary">
                On-chain, <Code>createToken(name, symbol)</Code> mints the ERC‑20. Liquidity is then deployed to Uniswap V3 and/or Aerodrome. Supply/decimals in the UI are fixed for BLASTOFF launches.
              </p>
            </section>
          </DocBlock>
        </>
      )}

      {section === 'tokens-api' && (
        <>
          <DocBlock>
            <section>
              <SectionTitle id="overview" icon={Icons.Code}>
                Tokens API
              </SectionTitle>
              <p className="mt-4 text-sm leading-relaxed text-blastoff-text-secondary">
                All routes under <Code>/api</Code>. Optional <Code>chainId</Code> (8453 = Base, 84532 = Base Sepolia); default Base Sepolia.
              </p>
            </section>
          </DocBlock>

          <DocBlock>
            <section id="endpoints" className="scroll-mt-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blastoff-text">
                Endpoints
              </h3>
            </section>
          </DocBlock>

          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/tokens"
              desc="List all tokens. Query: live=true, chainId."
              response='{ "tokens": [...] }'
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/tokens/trending"
              desc="Top 5 by trending score (volume + momentum)."
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/tokens/[address]"
              desc="Single token + on-chain stats, trades, holders."
              response='{ "token": { ... } }'
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/tokens/[address]/chart"
              desc="OHLCV candles. Query: timeframe, chainId."
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/tokens/[address]/trades"
              desc="Recent trades. Query: limit, chainId."
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/tokens/[address]/holders"
              desc="Holder list/count."
            />
          </DocBlock>
        </>
      )}

      {section === 'launch-api' && (
        <>
          <DocBlock>
            <section>
              <SectionTitle id="overview" icon={Icons.Code}>
                Launch API
              </SectionTitle>
            </section>
          </DocBlock>

          <DocBlock>
            <section id="endpoints" className="scroll-mt-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blastoff-text">
                Endpoints
              </h3>
            </section>
          </DocBlock>

          <DocBlock>
            <ApiEndpoint
              method="POST"
              path="/api/tokens/create"
              desc="Without txHash: returns transaction. With txHash: parses receipt, writes Firestore, returns tokenAddress."
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="POST"
              path="/api/tokens/launch"
              desc="Deploy liquidity or update launch status. Body: tokenAddress, dex (UNISWAP_V3 | AERODROME), initialPriceWeth, wethLiquidity, feeTier, chainId."
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/tokens/launch"
              desc="Query: tokenAddress, chainId. Returns launch status and pool info."
            />
          </DocBlock>
        </>
      )}

      {section === 'swap-api' && (
        <>
          <DocBlock>
            <section>
              <SectionTitle id="overview" icon={Icons.Code}>
                Swap & quote API
              </SectionTitle>
            </section>
          </DocBlock>

          <DocBlock>
            <section id="endpoints" className="scroll-mt-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blastoff-text">
                Endpoints
              </h3>
            </section>
          </DocBlock>

          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/swap/quote"
              desc="Query: tokenAddress, inputAmount, isBuy, slippage, chainId, feeTier. Uses Uniswap V3 quoter (or Aerodrome where configured)."
              response='{ "quote": { ... } }'
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="POST"
              path="/api/swap/execute"
              desc="Body: wallet, tokenAddress, inputAmount, isBuy, slippage, feeTier, chainId. Returns Uniswap V3 tx."
              response='{ "transaction": { ... } }'
            />
          </DocBlock>
        </>
      )}

      {section === 'other-apis' && (
        <>
          <DocBlock>
            <section>
              <SectionTitle id="overview" icon={Icons.Code}>
                Other endpoints
              </SectionTitle>
            </section>
          </DocBlock>

          <DocBlock>
            <section id="endpoints" className="scroll-mt-24">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blastoff-text">
                Endpoints
              </h3>
            </section>
          </DocBlock>

          <DocBlock>
            <ApiEndpoint
              method="GET"
              path="/api/positions/[tokenAddress]"
              desc="Query: wallet, chainId. Returns balance, averageEntry, pnlUsd, pnlPercent."
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint
              method="POST"
              path="/api/trades/record"
              desc="Record swap for PnL. Body: txHash, tokenAddress, wallet, isBuy, inputAmount, outputAmount, chainId."
            />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint method="GET" path="/api/balances" desc="Wallet balances." />
          </DocBlock>
          <DocBlock>
            <ApiEndpoint method="GET" path="/api/creators/[address]" desc="Tokens created by address." />
          </DocBlock>
        </>
      )}

      {section === 'networks' && (
        <>
          <DocBlock>
            <section>
              <SectionTitle id="overview" icon={Icons.Globe}>
                Networks & contracts
              </SectionTitle>
              <p className="mt-4 text-sm leading-relaxed text-blastoff-text-secondary">
                Supported: <Code>8453</Code> (Base Mainnet), <Code>84532</Code> (Base Sepolia). Default Base Sepolia. Config: <Code>src/config/contracts.ts</Code>.
              </p>
            </section>
          </DocBlock>

          <DocBlock>
            <div className="grid gap-4 sm:grid-cols-2">
            <div id="base-sepolia" className="scroll-mt-24 rounded-lg border border-blastoff-border bg-blastoff-bg p-4">
              <div className="flex items-center gap-2">
                <span className="text-blastoff-orange">
                  <Icons.Globe />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-blastoff-text">Base Sepolia (84532)</h3>
                  <p className="text-xs text-blastoff-text-muted">Testnet</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-blastoff-text-secondary">
                <li>• WETH, token creation</li>
                <li>• Uniswap V3, Aerodrome for liquidity & swap</li>
              </ul>
            </div>
            <div id="base-mainnet" className="scroll-mt-24 rounded-lg border border-blastoff-border bg-blastoff-bg p-4">
              <div className="flex items-center gap-2">
                <span className="text-blastoff-orange">
                  <Icons.Globe />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-blastoff-text">Base Mainnet (8453)</h3>
                  <p className="text-xs text-blastoff-text-muted">Production</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-blastoff-text-secondary">
                <li>• WETH, Uniswap V3, Aerodrome</li>
                <li>• Straight DEX deployment</li>
              </ul>
            </div>
          </div>
          </DocBlock>

          <DocBlock>
            <section id="firestore" className="scroll-mt-24">
              <p className="text-sm leading-relaxed text-blastoff-text-secondary">
                Firestore: <Code>TokenData</Code>, <Code>UserPositions</Code>.
              </p>
            </section>
          </DocBlock>
        </>
      )}

      <DocBlock>
        <footer>
          <Link href="/app" className="inline-flex items-center gap-2 text-sm text-blastoff-orange transition-colors hover:text-blastoff-orange/80">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to app
          </Link>
        </footer>
      </DocBlock>
    </>
  );
}
