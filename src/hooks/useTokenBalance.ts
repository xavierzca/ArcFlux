import { useReadContract, useAccount } from 'wagmi';
import { ERC20_ABI } from '../config/contracts';
import { formatUnits } from 'viem';

export function useTokenBalance(tokenAddress?: `0x${string}`, decimals: number = 6) {
  const { address } = useAccount();

  const { data: balance, isPending, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10000, // auto refresh every 10 seconds
    },
  });

  const formatted = balance !== undefined ? formatUnits(balance, decimals) : '0.00';

  return {
    raw: balance,
    formatted,
    isPending,
    error,
    refetch,
  };
}
