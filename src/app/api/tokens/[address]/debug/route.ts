import { NextResponse } from 'next/server';
import { isAddress, createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';

export const runtime = 'nodejs';

const TOKEN_FACTORY = '0x7E7618828FE3e2BA6a81d609E7904E3CE2c15fB3';

const tokenFactoryAbi = parseAbi([
  'function tokens(address) view returns (uint8)',
  'function collateral(address) view returns (uint256)',
  'function calculateRequiredBaseCoinExp(address tokenAddress, uint256 amount) view returns (uint256)',
]);

const erc20Abi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
]);

/**
 * GET /api/tokens/[address]/debug
 * Debug endpoint to check on-chain data directly
 */
export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const tokenAddress = params.address;
  
  if (!tokenAddress || !isAddress(tokenAddress)) {
    return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
  }
  
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http('https://sepolia.base.org'),
  });
  
  const results: Record<string, unknown> = {
    tokenAddress,
    chainId: 84532,
    factoryAddress: TOKEN_FACTORY,
  };
  
  // Test 1: Check token state from factory
  try {
    const state = await client.readContract({
      address: TOKEN_FACTORY as `0x${string}`,
      abi: tokenFactoryAbi,
      functionName: 'tokens',
      args: [tokenAddress as `0x${string}`],
    });
    results.tokenState = state;
    results.tokenStateLabel = state === 0 ? 'NOT_CREATED' : state === 1 ? 'ICO' : 'GRADUATED';
  } catch (e) {
    results.tokenStateError = String(e);
  }
  
  // Test 2: Check collateral raised
  try {
    const collateral = await client.readContract({
      address: TOKEN_FACTORY as `0x${string}`,
      abi: tokenFactoryAbi,
      functionName: 'collateral',
      args: [tokenAddress as `0x${string}`],
    });
    results.collateralWei = String(collateral);
    results.collateralEth = formatUnits(collateral, 18);
  } catch (e) {
    results.collateralError = String(e);
  }
  
  // Test 3: Check current bonding curve price
  try {
    const testAmount = BigInt(1e18); // 1 token
    const requiredEth = await client.readContract({
      address: TOKEN_FACTORY as `0x${string}`,
      abi: tokenFactoryAbi,
      functionName: 'calculateRequiredBaseCoinExp',
      args: [tokenAddress as `0x${string}`, testAmount],
    });
    results.priceFor1TokenWei = String(requiredEth);
    results.priceFor1TokenEth = formatUnits(requiredEth, 18);
  } catch (e) {
    results.priceError = String(e);
  }
  
  // Test 4: Check token contract directly
  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'name',
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'totalSupply',
      }),
    ]);
    
    results.tokenName = name;
    results.tokenSymbol = symbol;
    results.tokenDecimals = decimals;
    results.totalSupplyWei = String(totalSupply);
    results.totalSupply = formatUnits(totalSupply, decimals);
  } catch (e) {
    results.tokenContractError = String(e);
  }
  
  // Test 5: Check factory balance of token (tokens available for sale)
  try {
    const factoryBalance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [TOKEN_FACTORY as `0x${string}`],
    });
    results.factoryBalanceWei = String(factoryBalance);
    results.factoryBalance = formatUnits(factoryBalance, 18);
    results.tokensAvailableForSale = formatUnits(factoryBalance, 18);
  } catch (e) {
    results.factoryBalanceError = String(e);
  }
  
  // Test 6: Get recent Transfer events from this token
  try {
    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
    
    const logs = await client.getLogs({
      address: tokenAddress as `0x${string}`,
      event: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)'])[0],
      fromBlock,
      toBlock: 'latest',
    });
    
    results.transferEventCount = logs.length;
    results.recentTransfers = logs.slice(-5).map(log => ({
      txHash: log.transactionHash,
      blockNumber: String(log.blockNumber),
      from: (log.args as { from?: string }).from,
      to: (log.args as { to?: string }).to,
      value: formatUnits((log.args as { value?: bigint }).value || 0n, 18),
    }));
  } catch (e) {
    results.transferEventsError = String(e);
  }
  
  return NextResponse.json(results);
}
