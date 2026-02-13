import { NextRequest } from 'next/server';
import { createPublicClient, formatUnits, http, isAddress, parseAbi, type Address, type Log } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { tokenFactoryAbi, erc20Abi } from '@/lib/abis';
import { getChainConfig, getContracts } from '@/config/contracts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TokenFactory address on Base Sepolia
const TOKEN_FACTORY_ADDRESS = '0x7E7618828FE3e2BA6a81d609E7904E3CE2c15fB3' as const;

// Polling interval in ms
const POLL_INTERVAL = 3000; // 3 seconds

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

      // Polling function
      const pollForTrades = async () => {
        if (!isActive) return;

        try {
          const currentBlock = await client.getBlockNumber();
          
          if (currentBlock <= lastBlockProcessed) {
            return;
          }

          // Get Transfer events FROM the TokenFactory TO users (buy events)
          const buyLogs = await client.getLogs({
            address: tokenAddress as Address,
            event: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)'])[0],
            args: {
              from: TOKEN_FACTORY_ADDRESS,
            },
            fromBlock: lastBlockProcessed + 1n,
            toBlock: currentBlock,
          });

          // Get Transfer events FROM users TO the TokenFactory (potential sells/refunds)
          const sellLogs = await client.getLogs({
            address: tokenAddress as Address,
            event: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)'])[0],
            args: {
              to: TOKEN_FACTORY_ADDRESS,
            },
            fromBlock: lastBlockProcessed + 1n,
            toBlock: currentBlock,
          });

          // Process buy events
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
              console.error('Error processing buy log:', e);
            }
          }

          // Process sell events (if any)
          for (const log of sellLogs) {
            try {
              const args = log.args as { from?: Address; to?: Address; value?: bigint };
              const block = await client.getBlock({ blockNumber: log.blockNumber });

              const amount = Number(formatUnits(args.value || 0n, decimals));
              if (amount === 0) continue;

              // For sells, we don't have direct ETH value, estimate from price
              const price = 0.00003; // Default price estimate
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
              console.error('Error processing sell log:', e);
            }
          }

          // Send ICO stats update
          try {
            const [tokenState, collateral] = await Promise.all([
              client.readContract({
                address: TOKEN_FACTORY_ADDRESS,
                abi: tokenFactoryAbi,
                functionName: 'tokens',
                args: [tokenAddress as Address],
              }),
              client.readContract({
                address: TOKEN_FACTORY_ADDRESS,
                abi: tokenFactoryAbi,
                functionName: 'collateral',
                args: [tokenAddress as Address],
              }),
            ]);

            const factoryBalance = await client.readContract({
              address: tokenAddress as Address,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [TOKEN_FACTORY_ADDRESS],
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
            // Stats fetch failed, continue
          }

          lastBlockProcessed = currentBlock;
        } catch (e) {
          console.error('Polling error:', e);
          // Send error but continue polling
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Polling error' })}\n\n`));
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
