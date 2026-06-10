import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ARCFLUX_ADDRESS, ARCFLUX_ABI, ERC20_ABI } from '../config/contracts';
import { TokenInfo } from '../config/tokens';
import { parseUnits } from 'viem';

export interface SwapHistoryItem {
  id: string;
  type: 'Swap' | 'Approve';
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
  timestamp: number;
  hash: `0x${string}`;
}

export function useSwap(
  fromToken: TokenInfo,
  toToken: TokenInfo,
  amountInText: string,
  amountOutRaw: bigint,
  amountOutText: string,
  slippage: number // e.g. 0.5 for 0.5%
) {
  const { address } = useAccount();
  const [history, setHistory] = useState<SwapHistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('arcflux_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        // ignore parsing errors
      }
    }
  }, []);

  const saveHistory = (item: SwapHistoryItem) => {
    const updated = [item, ...history].slice(0, 20); // Keep up to 20 items
    setHistory(updated);
    localStorage.setItem('arcflux_history', JSON.stringify(updated));
  };

  const isZeroAmount = !amountInText || parseFloat(amountInText) <= 0 || isNaN(parseFloat(amountInText));
  
  let parsedAmountIn = 0n;
  try {
    if (!isZeroAmount) {
      parsedAmountIn = parseUnits(amountInText, fromToken.decimals);
    }
  } catch (e) {
    // catch parsing errors
  }

  // 1. Check Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, ARCFLUX_ADDRESS as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !isZeroAmount && fromToken.address !== '0x0000000000000000000000000000000000000000',
    }
  });

  const needsApproval = allowance !== undefined && allowance < parsedAmountIn;

  // 2. Token Approval Write Hook
  const { writeContractAsync: writeApprove, isPending: isApprovePending } = useWriteContract();

  // 3. Swap Write Hook
  const { writeContractAsync: writeSwap, isPending: isSwapPending } = useWriteContract();

  const handleApprove = async () => {
    if (!writeApprove) throw new Error('Wallet not ready');
    const tx = await writeApprove({
      address: fromToken.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ARCFLUX_ADDRESS as `0x${string}`, parsedAmountIn * 2n], // Double approve to save future gas approvals
    } as any);
    return tx;
  };

  const handleSwap = async () => {
    if (!writeSwap) throw new Error('Wallet not ready');

    // Calculate minAmountOut based on slippage
    // slippage is a percentage, e.g. 0.5. 
    // minAmountOut = amountOut * (100 - slippage) / 100
    const slippageMultiplier = 100n - BigInt(Math.floor(slippage * 100));
    const minAmountOut = (amountOutRaw * slippageMultiplier) / 10000n; // 10000 because slippage is scaled by 100 (e.g. 0.5% => 50 basis points)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes from now

    const tx = await writeSwap({
      address: ARCFLUX_ADDRESS as `0x${string}`,
      abi: ARCFLUX_ABI,
      functionName: 'swap',
      args: [fromToken.address, parsedAmountIn, minAmountOut, deadline],
    } as any);

    return tx;
  };

  return {
    needsApproval,
    isApprovePending,
    isSwapPending,
    handleApprove,
    handleSwap,
    refetchAllowance,
    history,
    saveHistory,
  };
}
