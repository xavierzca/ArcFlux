import { parseAbi } from 'viem';

// ArcFlux Contract Address Placeholder
// Replace this with the deployed contract address on Arc Testnet when ready
export const ARCFLUX_ADDRESS = '0xa7dBD4375Fb339b47525e63301E89dCcb30392f8'; 

export const ARCFLUX_ABI = parseAbi([
  'function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut, uint256 deadline) external returns (uint256 amountOut)',
  'function getQuote(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut, uint256 priceImpact)',
  'function getPoolInfo() external view returns (uint256 reserveUSDC, uint256 reserveEURC, uint256 totalLP, uint256 feeRate)',
  'function addLiquidity(uint256 usdcAmount, uint256 eurcAmount, uint256 minLPTokens) external returns (uint256 lpTokens)',
  'function removeLiquidity(uint256 lpTokens, uint256 minUSDC, uint256 minEURC) external returns (uint256 usdcAmount, uint256 eurcAmount)',
  'function lpBalances(address) external view returns (uint256)'
]);

export const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)'
]);
