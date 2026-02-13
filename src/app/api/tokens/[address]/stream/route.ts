import { NextRequest } from 'next/server';
import { createPublicClient, formatUnits, http, isAddress, parseAbi, type Address, type Log } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { tokenFactoryAbi, erc20Abi } from '@/lib/abis';
import { getChainConfig, getContracts } from '@/config/contracts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Polling interval in ms
const POLL_INTERVAL = 3000; // 3 seconds
// Max block range per getLogs (RPC limits, e.g. Base Sepolia 10k)
const MAX_BLOCK_RANGE = 2000n;

function getChain(chainId?: number) {
  return chainId === 84532 ? baseSepolia : base;
}

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  tokenAddress: string;
  walletAddress: string;
  amount: number;
  price: number;
  totalValue: number;
  txHash: string;
  timestamp: number;
  blockNumber: string;
}

/**
 * Server-Sent Events endpoint for real-time trade updates
 * Polls the blockchain for new Transfer events from the TokenFactory
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address: tokenAddress } = await params;
  const chainIdParam = req.nextUrl.searchParams.get('chainId');
  const chainId = chainIdParam ? Number(chainIdParam) : undefined;

  if (!tokenAddress || !isAddress(tokenAddress)) {
    return new Response('Invalid token address', { status: 400 });
  }

  const chainConfig = getChainConfig(chainId);
  const factoryAddress = getContracts(chainId).TOKEN_FACTORY as Address | undefined;
  if (!factoryAddress) {
    return new Response('TokenFactory not configured for this chain', { status: 400 });
  }
  const client = createPublicClient({
    chain: getChain(chainConfig.chainId),
    transport: http(chainConfig.rpcUrl),
  });

  // Track the last block we've processed
  let lastBlockProcessed = 0n;
  let isActive = true;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', tokenAddress })}\n\n`));

      // Get initial block number
      try {
        lastBlockProcessed = await client.getBlockNumber();
        // Look back 10 blocks for recent trades on connect
        lastBlockProcessed = lastBlockProcessed > 10n ? lastBlockProcessed - 10n : 0n;
      } catch (e) {
        console.error('Failed to get block number:', e);
      }

      // Get token decimals
      let decimals = 18;
      try {
        decimals = await client.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: 'decimals',
        });
      } catch {
        // Default to 18
      }

      const transferEvent = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)'])[0];

      // Polling function: chunk block range to respect RPC limits; catch per-log so one bad log doesn't break poll
      const pollForTrades = async () => {
        if (!isActive) return;

        try {
          const currentBlock = await client.getBlockNumber();
          if (currentBlock <= lastBlockProcessed) return;

          const fromBlock = lastBlockProcessed + 1n;
          const range = currentBlock - fromBlock + 1n;
          const chunkEnd = range > MAX_BLOCK_RANGE ? fromBlock + MAX_BLOCK_RANGE - 1n : currentBlock;

          // Get Transfer events FROM the TokenFactory TO users (buy events)
          let buyLogs: Log[] = [];
          let sellLogs: Log[] = [];
          try {
            buyLogs = await client.getLogs({
              address: tokenAddress as Address,
              event: transferEvent,
              args: { from: factoryAddress },
              fromBlock,
              toBlock: chunkEnd,
            });
          } catch (e) {
            console.error('[stream] getLogs buy failed:', e);
          }
          try {
            sellLogs = await client.getLogs({
              address: tokenAddress as Address,
              event: transferEvent,
              args: { to: factoryAddress },
              fromBlock,
              toBlock: chunkEnd,
            });
          } catch (e) {
            console.error('[stream] getLogs sell failed:', e);
          }

          for (const log of buyLogs) {
            try {
              const args = log.args as { from?: Address; to?: Address; value?: bigint };
              const tx = await client.getTransaction({ hash: log.transactionHash });
              const block = await client.getBlock({ blockNumber: log.blockNumber });
              const amount = Number(formatUnits(args.value || 0n, decimals));
              if (amount === 0) continue;
              const ethValue = Number(formatUnits(tx.value, 18));
              const price = amount > 0 && ethValue > 0 ? ethValue / amount : 0;
              const trade: Trade = {
                id: `${log.transactionHash}-${log.logIndex}`,
                type: 'buy',
                tokenAddress,
                walletAddress: args.to || tx.from,
                amount,
                price,
                totalValue: ethValue,
                txHash: log.transactionHash,
                timestamp: Number(block.timestamp) * 1000,
                blockNumber: log.blockNumber.toString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'trade', trade })}\n\n`));
            } catch (e) {
              console.warn('[stream] Error processing buy log:', log.transactionHash, e);
            }
          }

          const zero = '0x0000000000000000000000000000000000000000';
          for (const log of sellLogs) {
            try {
              const args = log.args as { from?: Address; to?: Address; value?: bigint };
              if ((args.from || '').toLowerCase() === zero) continue; // mint to factory, not a sell
              const block = await client.getBlock({ blockNumber: log.blockNumber });
              const amount = Number(formatUnits(args.value || 0n, decimals));
              if (amount === 0) continue;
              const price = 0.00003;
              const ethValue = amount * price;
              const trade: Trade = {
                id: `${log.transactionHash}-${log.logIndex}`,
                type: 'sell',
                tokenAddress,
                walletAddress: args.from || '',
                amount,
                price,
                totalValue: ethValue,
                txHash: log.transactionHash,
                timestamp: Number(block.timestamp) * 1000,
                blockNumber: log.blockNumber.toString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'trade', trade })}\n\n`));
            } catch (e) {
              console.warn('[stream] Error processing sell log:', log.transactionHash, e);
            }
          }

          try {
            const [tokenState, collateral] = await Promise.all([
              client.readContract({
                address: factoryAddress,
                abi: tokenFactoryAbi,
                functionName: 'tokens',
                args: [tokenAddress as Address],
              }),
              client.readContract({
                address: factoryAddress,
                abi: tokenFactoryAbi,
                functionName: 'collateral',
                args: [tokenAddress as Address],
              }),
            ]);
            const factoryBalance = await client.readContract({
              address: tokenAddress as Address,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [factoryAddress],
            });
            const stats = {
              state: tokenState === 1 ? 'ICO' : tokenState === 2 ? 'GRADUATED' : 'NOT_CREATED',
              collateralRaised: Number(formatUnits(collateral, 18)),
              fundingGoal: 30,
              progress: (Number(formatUnits(collateral, 18)) / 30) * 100,
              tokensRemaining: Number(formatUnits(factoryBalance, decimals)),
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stats', stats })}\n\n`));
          } catch (e) {
            // Stats fetch failed, skip
          }

          lastBlockProcessed = chunkEnd;
          if (chunkEnd < currentBlock) lastBlockProcessed = currentBlock;
        } catch (e) {
          console.error('[stream] Polling error:', e);
          // Don't spam client with error events every 3s; server log is enough
        }
      };

      // Initial poll
      await pollForTrades();

      // Set up polling interval
      const intervalId = setInterval(pollForTrades, POLL_INTERVAL);

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(intervalId);
        controller.close();
      });
    },
    cancel() {
      isActive = false;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
