import { parseAbi } from 'viem';

// TokenFactory ABI - for token creation and ICO buys
export const tokenFactoryAbi = parseAbi([
  'function createToken(string name, string ticker) external returns (address)',
  'function buy(address tokenAddress, uint256 amount) external payable',
  'function withdraw(address tokenAddress, address to) external',
  'function tokens(address) view returns (uint8)',
  'function collateral(address) view returns (uint256)',
  'function balances(address, address) view returns (uint256)',
  'function calculateRequiredBaseCoinExp(address tokenAddress, uint256 amount) view returns (uint256)',
  'function DECIMALS() view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
  'function INITIAL_MINT() view returns (uint256)',
  'function FUNDING_GOAL() view returns (uint256)',
  'function INITIAL_PRICE() view returns (uint256)',
  'function K() view returns (uint256)',
  'event TokenMinted(address indexed tokenAddress, address indexed creator)',
]);

// ERC20 ABI - with Transfer event for tracking holder changes
export const erc20Abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
]);

// Uniswap V2 Factory ABI
export const uniswapV2FactoryAbi = parseAbi([
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'function allPairs(uint256) view returns (address pair)',
  'function allPairsLength() view returns (uint256)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)',
]);

// Uniswap V2 Pair ABI - for swap events and reserves
export const uniswapV2PairAbi = parseAbi([
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)',
  'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)',
  'event Mint(address indexed sender, uint256 amount0, uint256 amount1)',
  'event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)',
]);

// Uniswap V2 Router ABI
export const uniswapV2RouterAbi = parseAbi([
  'function WETH() view returns (address)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) payable returns (uint256[] memory amounts)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)',
  'function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[] memory amounts)',
]);

// Uniswap V3 Quoter ABI (kept for mainnet)
export const uniswapV3QuoterAbi = parseAbi([
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
]);

// Uniswap V3 Swap Router ABI (kept for mainnet)
// Note: Using individual params instead of struct for parseAbi compatibility
export const uniswapV3SwapRouterAbi = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;
