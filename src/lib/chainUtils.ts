import { createPublicClient, http, formatUnits, parseAbi, decodeFunctionData, type Address, type Log } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { erc20Abi, uniswapV2PairAbi, uniswapV2FactoryAbi, tokenFactoryAbi } from './abis';
import { getChainConfig, getContracts } from '@/config/contracts';

// Contract addresses for Base Sepolia
const TOKEN_FACTORY_ADDRESS = '0x7E7618828FE3e2BA6a81d609E7904E3CE2c15fB3' as const;

// Buy function selector for decoding transactions
const BUY_FUNCTION_SELECTOR = '0xa6f2ae3a'; // buy(address,uint256) - first 4 bytes of keccak256

// Note: The TokenFactory uses Ethereum mainnet Uniswap addresses which don't work on Base Sepolia
const UNISWAP_V2_FACTORY_SEPOLIA = '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6' as const;
const WETH_SEPOLIA = '0x4200000000000000000000000000000000000006' as const;

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  tokenAddress: string;
  walletAddress: string;
  amount: number;
  price: number;
  totalValue: number;
  txHash: string;
  timestamp: number;
  blockNumber: bigint;
}

export interface Holder {
  address: string;
  balance: string;
  percentage: number;
  rank: number;
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TokenICOStats {
  state: 'NOT_CREATED' | 'ICO' | 'GRADUATED';
  collateralRaised: number; // ETH raised
  fundingGoal: number; // 30 ETH
  fundingProgress: number; // percentage
  currentPrice: number;
  tokensSold: number;
  tokensRemaining: number;
}

/**
 * Create a viem public client for the specified chain
 */
export function getClient(chainId?: number) {
  const config = getChainConfig(chainId);
  const chain = config.chainId === 84532 ? baseSepolia : base;
  
  return createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });
}

/**
 * Get TokenFactory state for a token
 */
export async function getTokenFactoryState(
  tokenAddress: Address,
  chainId?: number
): Promise<{ collateral: bigint; state: number }> {
  const client = getClient(chainId);
  
  try {
    const [collateral, state] = await Promise.all([
      client.readContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: tokenFactoryAbi,
        functionName: 'collateral',
        args: [tokenAddress],
      }),
      client.readContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: tokenFactoryAbi,
        functionName: 'tokens',
        args: [tokenAddress],
      }),
    ]);
    
    return { collateral, state };
  } catch (error) {
    console.error('Error getting TokenFactory state:', error);
    return { collateral: 0n, state: 0 };
  }
}

/**
 * Calculate price from TokenFactory bonding curve
 * Uses the exponential formula from the contract
 */
export async function calculateTokenPrice(
  tokenAddress: Address,
  chainId?: number
): Promise<number> {
  const client = getClient(chainId);
  
  try {
    // Get a small quote to determine current price
    const testAmount = BigInt(1e18); // 1 token
    
    const requiredEth = await client.readContract({
      address: TOKEN_FACTORY_ADDRESS,
      abi: tokenFactoryAbi,
      functionName: 'calculateRequiredBaseCoinExp',
      args: [tokenAddress, testAmount],
    });
    
    // Price per token = ETH required / token amount
    const price = Number(formatUnits(requiredEth, 18));
    return price;
  } catch (error) {
    console.error('Error calculating token price:', error);
    return 0.00003; // Default ICO starting price
  }
}

/**
 * Get comprehensive ICO stats for a token
 */
export async function getTokenICOStats(
  tokenAddress: Address,
  chainId?: number
): Promise<TokenICOStats> {
  const client = getClient(chainId);
  const FUNDING_GOAL = 30; // 30 ETH from contract
  const INITIAL_MINT = 200_000_000; // 200M tokens (20% of 1B)
  
  try {
    const { collateral, state } = await getTokenFactoryState(tokenAddress, chainId);
    
    const stateMap: Record<number, 'NOT_CREATED' | 'ICO' | 'GRADUATED'> = {
      0: 'NOT_CREATED',
      1: 'ICO',
      2: 'GRADUATED',
    };
    
    const collateralRaised = Number(formatUnits(collateral, 18));
    const fundingProgress = (collateralRaised / FUNDING_GOAL) * 100;
    
    // Get current price from bonding curve
    const currentPrice = await calculateTokenPrice(tokenAddress, chainId);
    
    // Get tokens remaining in factory
    let tokensRemaining = INITIAL_MINT;
    try {
      const factoryBalance = await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [TOKEN_FACTORY_ADDRESS],
      });
      tokensRemaining = Number(formatUnits(factoryBalance, 18));
    } catch {
      // Use default
    }
    
    const tokensSold = INITIAL_MINT - tokensRemaining;
    
    return {
      state: stateMap[state] || 'NOT_CREATED',
      collateralRaised,
      fundingGoal: FUNDING_GOAL,
      fundingProgress: Math.min(fundingProgress, 100),
      currentPrice,
      tokensSold,
      tokensRemaining,
    };
  } catch (error) {
    console.error('Error getting ICO stats:', error);
    return {
      state: 'NOT_CREATED',
      collateralRaised: 0,
      fundingGoal: FUNDING_GOAL,
      fundingProgress: 0,
      currentPrice: 0.00003,
      tokensSold: 0,
      tokensRemaining: INITIAL_MINT,
    };
  }
}

/**
 * Get the Uniswap V2 pair address for a token
 */
export async function getUniswapV2Pair(
  tokenAddress: Address,
  chainId?: number
): Promise<Address | null> {
  const client = getClient(chainId);
  const contracts = getContracts(chainId);
  
  // Use chain-specific factory if available
  const factoryAddress = UNISWAP_V2_FACTORY_SEPOLIA;
  const weth = contracts.WETH;
  
  try {
    const pairAddress = await client.readContract({
      address: factoryAddress,
      abi: uniswapV2FactoryAbi,
      functionName: 'getPair',
      args: [tokenAddress, weth],
    });
    
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    
    return pairAddress;
  } catch (error) {
    console.error('Error getting Uniswap V2 pair:', error);
    return null;
  }
}

/**
 * Fetch ERC20 Transfer events for a token
 */
export async function getTransferEvents(
  tokenAddress: Address,
  fromBlock: bigint,
  toBlock: bigint | 'latest',
  chainId?: number
): Promise<Log[]> {
  const client = getClient(chainId);
  
  try {
    const logs = await client.getLogs({
      address: tokenAddress,
      event: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)'])[0],
      fromBlock,
      toBlock,
    });
    
    return logs;
  } catch (error) {
    console.error('Error fetching Transfer events:', error);
    return [];
  }
}

/**
 * Fetch Uniswap V2 Swap events for a pair
 */
export async function getSwapEvents(
  pairAddress: Address,
  fromBlock: bigint,
  toBlock: bigint | 'latest',
  chainId?: number
): Promise<Log[]> {
  const client = getClient(chainId);
  
  try {
    const logs = await client.getLogs({
      address: pairAddress,
      event: parseAbi(['event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)'])[0],
      fromBlock,
      toBlock,
    });
    
    return logs;
  } catch (error) {
    console.error('Error fetching Swap events:', error);
    return [];
  }
}

/**
 * Get buy transactions from TokenFactory for a specific token
 * Scans transactions to the factory and decodes buy() calls
 */
export async function getTokenFactoryBuys(
  tokenAddress: Address,
  chainId?: number,
  limit: number = 50
): Promise<Trade[]> {
  const client = getClient(chainId);
  const trades: Trade[] = [];
  
  try {
    // Get current block
    const currentBlock = await client.getBlockNumber();
    // Look back ~100000 blocks for more history
    const fromBlock = currentBlock > 100000n ? currentBlock - 100000n : 0n;
    
    // Get Transfer events FROM the TokenFactory TO users (these are buy fulfillments)
    // When someone buys and withdraws, tokens transfer from factory to user
    const logs = await client.getLogs({
      address: tokenAddress,
      event: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)'])[0],
      args: {
        from: TOKEN_FACTORY_ADDRESS,
      },
      fromBlock,
      toBlock: 'latest',
    });
    
    // Also get mints - tokens minted to factory during token creation
    // These establish the initial supply
    
    // Get token decimals
    let decimals = 18;
    try {
      decimals = await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      });
    } catch {
      // Default to 18
    }
    
    // Process transfers from factory (withdrawals after buy)
    for (const log of logs.slice(-limit)) {
      const args = log.args as { from?: Address; to?: Address; value?: bigint };
      
      try {
        // Get the original buy transaction
        const tx = await client.getTransaction({ hash: log.transactionHash });
        const block = await client.getBlock({ blockNumber: log.blockNumber });
        
        const amount = Number(formatUnits(args.value || 0n, decimals));
        if (amount === 0) continue;
        
        // Get ETH value from the transaction
        const ethValue = Number(formatUnits(tx.value, 18));
        const price = amount > 0 && ethValue > 0 ? ethValue / amount : 0.00003;
        
        trades.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          type: 'buy',
          tokenAddress: tokenAddress,
          walletAddress: args.to || tx.from,
          amount,
          price,
          totalValue: ethValue || amount * price,
          txHash: log.transactionHash,
          timestamp: Number(block.timestamp) * 1000,
          blockNumber: log.blockNumber,
        });
      } catch (txError) {
        console.warn('Could not get tx details:', log.transactionHash);
      }
    }
    
    // Also check for direct buy transactions to factory
    // (buys where tokens are held in balances, not yet withdrawn)
    // We can detect these by looking at transactions to the factory
    const factoryTxLogs = await client.getLogs({
      address: TOKEN_FACTORY_ADDRESS,
      fromBlock,
      toBlock: 'latest',
    });
    
    // For each factory tx, check if it's a buy for this token
    // This is expensive, so we limit it
    const recentFactoryLogs = factoryTxLogs.slice(-100);
    const processedTxs = new Set(trades.map(t => t.txHash));
    
    for (const log of recentFactoryLogs) {
      if (processedTxs.has(log.transactionHash)) continue;
      processedTxs.add(log.transactionHash);
      
      try {
        const tx = await client.getTransaction({ hash: log.transactionHash });
        
        // Check if this is a buy() call for our token
        if (tx.input && tx.input.length >= 10) {
          const selector = tx.input.slice(0, 10);
          
          // buy(address,uint256) selector
          if (selector === '0xd96a094a' || selector === '0xa6f2ae3a') {
            // Decode the buy call - the first param is the token address
            // Format: selector (4 bytes) + tokenAddress (32 bytes padded) + amount (32 bytes)
            const inputData = tx.input.slice(10);
            const buyTokenAddress = ('0x' + inputData.slice(24, 64)) as Address;
            
            if (buyTokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
              const block = await client.getBlock({ blockNumber: log.blockNumber });
              const amountHex = '0x' + inputData.slice(64, 128);
              const amount = Number(formatUnits(BigInt(amountHex), decimals));
              const ethValue = Number(formatUnits(tx.value, 18));
              const price = amount > 0 && ethValue > 0 ? ethValue / amount : 0.00003;
              
              trades.push({
                id: `${log.transactionHash}-buy`,
                type: 'buy',
                tokenAddress: tokenAddress,
                walletAddress: tx.from,
                amount,
                price,
                totalValue: ethValue,
                txHash: log.transactionHash,
                timestamp: Number(block.timestamp) * 1000,
                blockNumber: log.blockNumber,
              });
            }
          }
        }
      } catch {
        // Skip if we can't decode
      }
    }
    
    // Sort by timestamp descending and dedupe
    const uniqueTrades = trades.reduce((acc, trade) => {
      if (!acc.find(t => t.txHash === trade.txHash)) {
        acc.push(trade);
      }
      return acc;
    }, [] as Trade[]);
    
    return uniqueTrades
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching TokenFactory buys:', error);
    return [];
  }
}

/**
 * Build trades from Transfer events (legacy, for graduated tokens)
 */
export async function getTokenTradesFromTransfers(
  tokenAddress: Address,
  chainId?: number,
  limit: number = 50
): Promise<Trade[]> {
  // For ICO tokens, use the factory buy scanner
  return getTokenFactoryBuys(tokenAddress, chainId, limit);
}

/**
 * Build trades from Uniswap V2 Swap events (for graduated tokens)
 */
export async function getTokenTradesFromSwaps(
  tokenAddress: Address,
  pairAddress: Address,
  chainId?: number,
  limit: number = 50
): Promise<Trade[]> {
  const client = getClient(chainId);
  const trades: Trade[] = [];
  
  try {
    // Get pair token order
    const token0 = await client.readContract({
      address: pairAddress,
      abi: uniswapV2PairAbi,
      functionName: 'token0',
    });
    
    const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
    
    // Get current block
    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
    
    const logs = await getSwapEvents(pairAddress, fromBlock, 'latest', chainId);
    
    // Get token decimals
    let decimals = 18;
    try {
      decimals = await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      });
    } catch {
      // Default to 18
    }
    
    for (const log of logs.slice(-limit)) {
      const args = log.args as {
        sender?: Address;
        amount0In?: bigint;
        amount1In?: bigint;
        amount0Out?: bigint;
        amount1Out?: bigint;
        to?: Address;
      };
      
      const block = await client.getBlock({ blockNumber: log.blockNumber });
      
      // Determine if buy or sell based on token flow
      let isBuy: boolean;
      let tokenAmount: bigint;
      let ethAmount: bigint;
      
      if (isToken0) {
        // Token is token0
        isBuy = (args.amount0Out || 0n) > 0n;
        tokenAmount = isBuy ? (args.amount0Out || 0n) : (args.amount0In || 0n);
        ethAmount = isBuy ? (args.amount1In || 0n) : (args.amount1Out || 0n);
      } else {
        // Token is token1
        isBuy = (args.amount1Out || 0n) > 0n;
        tokenAmount = isBuy ? (args.amount1Out || 0n) : (args.amount1In || 0n);
        ethAmount = isBuy ? (args.amount0In || 0n) : (args.amount0Out || 0n);
      }
      
      const amount = Number(formatUnits(tokenAmount, decimals));
      const ethValue = Number(formatUnits(ethAmount, 18));
      const price = amount > 0 ? ethValue / amount : 0;
      
      trades.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        type: isBuy ? 'buy' : 'sell',
        tokenAddress: tokenAddress,
        walletAddress: args.to || '',
        amount,
        price,
        totalValue: ethValue,
        txHash: log.transactionHash,
        timestamp: Number(block.timestamp) * 1000,
        blockNumber: log.blockNumber,
      });
    }
    
    return trades.reverse();
  } catch (error) {
    console.error('Error building trades from swaps:', error);
    return [];
  }
}

/**
 * Get all trades for a token (from both ICO and DEX)
 */
export async function getTokenTrades(
  tokenAddress: Address,
  chainId?: number,
  limit: number = 50
): Promise<Trade[]> {
  // Check token state from factory
  const { state } = await getTokenFactoryState(tokenAddress, chainId);
  
  // State: 0 = NOT_CREATED, 1 = ICO, 2 = GRADUATED
  if (state === 2) {
    // Token has graduated - try to get DEX trades
    const pairAddress = await getUniswapV2Pair(tokenAddress, chainId);
    if (pairAddress) {
      return getTokenTradesFromSwaps(tokenAddress, pairAddress, chainId, limit);
    }
  }
  
  // Token is in ICO phase or no DEX pair found - get factory buys
  return getTokenFactoryBuys(tokenAddress, chainId, limit);
}

/**
 * Build holder list from Transfer events
 */
export async function getTokenHolders(
  tokenAddress: Address,
  chainId?: number,
  limit: number = 20
): Promise<{ holders: Holder[]; totalHolders: number }> {
  const client = getClient(chainId);
  
  try {
    // Get current block
    const currentBlock = await client.getBlockNumber();
    // Look back more blocks for holder data
    const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;
    
    const logs = await getTransferEvents(tokenAddress, fromBlock, 'latest', chainId);
    
    // Build balance map from transfers
    const balances = new Map<string, bigint>();
    
    for (const log of logs) {
      const args = log.args as { from?: Address; to?: Address; value?: bigint };
      const from = args.from?.toLowerCase() || '';
      const to = args.to?.toLowerCase() || '';
      const value = args.value || 0n;
      
      // Subtract from sender (unless mint from zero address)
      if (from !== '0x0000000000000000000000000000000000000000') {
        const currentBalance = balances.get(from) || 0n;
        balances.set(from, currentBalance - value);
      }
      
      // Add to receiver
      if (to !== '0x0000000000000000000000000000000000000000') {
        const currentBalance = balances.get(to) || 0n;
        balances.set(to, currentBalance + value);
      }
    }
    
    // Get token decimals and total supply
    let decimals = 18;
    let totalSupply = 0n;
    
    try {
      decimals = await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      });
      totalSupply = await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'totalSupply',
      });
    } catch {
      // Use defaults
    }
    
    // Filter out zero/negative balances and sort by balance
    const holders: Array<[string, bigint]> = Array.from(balances.entries())
      .filter(([, balance]) => balance > 0n)
      .sort((a, b) => (b[1] > a[1] ? 1 : -1));
    
    const totalHolders = holders.length;
    const totalSupplyNum = Number(formatUnits(totalSupply, decimals));
    
    // Format top holders
    const topHolders: Holder[] = holders.slice(0, limit).map(([address, balance], index) => {
      const balanceNum = Number(formatUnits(balance, decimals));
      return {
        address,
        balance: balanceNum.toLocaleString(),
        percentage: totalSupplyNum > 0 ? (balanceNum / totalSupplyNum) * 100 : 0,
        rank: index + 1,
      };
    });
    
    return { holders: topHolders, totalHolders };
  } catch (error) {
    console.error('Error building holder list:', error);
    return { holders: [], totalHolders: 0 };
  }
}

/**
 * Aggregate trades into OHLCV candles
 */
export function aggregateToCandles(
  trades: Trade[],
  timeframe: string = '1h'
): ChartCandle[] {
  if (trades.length === 0) return [];
  
  // Parse timeframe to milliseconds
  const timeframeMsMap: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  
  const periodMs = timeframeMsMap[timeframe] || timeframeMsMap['1h'];
  
  // Sort trades by timestamp ascending
  const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  
  // Group trades by period
  const candleMap = new Map<number, Trade[]>();
  
  for (const trade of sortedTrades) {
    const periodStart = Math.floor(trade.timestamp / periodMs) * periodMs;
    const existing = candleMap.get(periodStart) || [];
    existing.push(trade);
    candleMap.set(periodStart, existing);
  }
  
  // Convert to candles
  const candles: ChartCandle[] = [];
  
  for (const [time, periodTrades] of Array.from(candleMap.entries()).sort((a, b) => a[0] - b[0])) {
    const prices = periodTrades.map((t) => t.price);
    const volumes = periodTrades.map((t) => t.amount);
    
    candles.push({
      time: time / 1000, // Convert to seconds for charting libraries
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume: volumes.reduce((a, b) => a + b, 0),
    });
  }
  
  return candles;
}

/**
 * Get current token price from factory bonding curve or DEX
 */
export async function getTokenPrice(
  tokenAddress: Address,
  chainId?: number
): Promise<number> {
  const client = getClient(chainId);
  
  // Check token state
  const { state } = await getTokenFactoryState(tokenAddress, chainId);
  
  // If graduated, try DEX price
  if (state === 2) {
    const pairAddress = await getUniswapV2Pair(tokenAddress, chainId);
    
    if (pairAddress) {
      try {
        const token0 = await client.readContract({
          address: pairAddress,
          abi: uniswapV2PairAbi,
          functionName: 'token0',
        });
        
        const reserves = await client.readContract({
          address: pairAddress,
          abi: uniswapV2PairAbi,
          functionName: 'getReserves',
        });
        
        const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
        const tokenReserve = isToken0 ? reserves[0] : reserves[1];
        const ethReserve = isToken0 ? reserves[1] : reserves[0];
        
        const tokenDecimals = await client.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'decimals',
        });
        
        const price = Number(formatUnits(ethReserve, 18)) / Number(formatUnits(tokenReserve, tokenDecimals));
        return price;
      } catch (error) {
        console.error('Error getting price from pair:', error);
      }
    }
  }
  
  // For ICO tokens, calculate from bonding curve
  if (state === 1) {
    return calculateTokenPrice(tokenAddress, chainId);
  }
  
  // Default starting price
  return 0.00003;
}
