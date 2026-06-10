import { useReadContract } from 'wagmi';
import { ARCFLUX_ADDRESS, ARCFLUX_ABI } from '../config/contracts';
import { parseUnits, formatUnits } from 'viem';
import { TokenInfo } from '../config/tokens';

export function useQuote(
  fromToken: TokenInfo,
  toToken: TokenInfo,
  amountInText: string
) {
  const isZeroAmount = !amountInText || parseFloat(amountInText) <= 0 || isNaN(parseFloat(amountInText));
  
  // Parse inputs based on fromToken's decimals
  let parsedAmountIn = 0n;
  try {
    if (!isZeroAmount) {
      parsedAmountIn = parseUnits(amountInText, fromToken.decimals);
    }
  } catch (e) {
    // catch parsing errors
  }

  const { data, isPending, error, refetch } = useReadContract({
    address: ARCFLUX_ADDRESS as `0x${string}`,
    abi: ARCFLUX_ABI,
    functionName: 'getQuote',
    args: !isZeroAmount && fromToken.address && toToken.address
      ? [fromToken.address, parsedAmountIn]
      : undefined,
    query: {
      enabled: !isZeroAmount && !!fromToken.address && !!toToken.address && fromToken.address !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10000, // Refresh every 10 seconds as requested
    }
  });

  // Extract amountOut and priceImpact from data [amountOut, priceImpact]
  const amountOutRaw = data ? data[0] : 0n;
  const priceImpactRaw = data ? data[1] : 0n; // basis points or percent, let's format it as percentage

  const amountOutFormatted = amountOutRaw > 0n 
    ? formatUnits(amountOutRaw, toToken.decimals) 
    : '';

  // Price impact in percent (e.g. priceImpactRaw of 100 = 1%)
  const priceImpact = data ? Number(priceImpactRaw) / 100 : 0;

  return {
    rawAmountOut: amountOutRaw,
    amountOut: amountOutFormatted,
    priceImpact,
    isPending: !isZeroAmount && isPending,
    error,
    refetch,
  };
}
