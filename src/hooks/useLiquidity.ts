import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ARCFLUX_ADDRESS, ARCFLUX_ABI, ERC20_ABI } from '../config/contracts';
import { parseUnits, formatUnits } from 'viem';

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;
const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as `0x${string}`;

export function useLiquidity(usdcAmountText: string, eurcAmountText: string) {
  const { address, isConnected } = useAccount();

  const isUsdcZero = !usdcAmountText || parseFloat(usdcAmountText) <= 0 || isNaN(parseFloat(usdcAmountText));
  const isEurcZero = !eurcAmountText || parseFloat(eurcAmountText) <= 0 || isNaN(parseFloat(eurcAmountText));

  // Parse input amounts
  let parsedUSDC = 0n;
  let parsedEURC = 0n;
  try {
    if (!isUsdcZero) parsedUSDC = parseUnits(usdcAmountText, 6);
  } catch (e) {}
  try {
    if (!isEurcZero) parsedEURC = parseUnits(eurcAmountText, 6);
  } catch (e) {}

  // 1. Fetch User LP Balance
  const { data: lpBalanceRaw, refetch: refetchLPBalance, isPending: isLPBalancePending } = useReadContract({
    address: ARCFLUX_ADDRESS as `0x${string}`,
    abi: ARCFLUX_ABI,
    functionName: 'lpBalances',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    }
  });

  const lpBalanceFormatted = lpBalanceRaw !== undefined ? formatUnits(lpBalanceRaw, 6) : '0.00';

  // 2. Fetch Pool Info
  const { data: poolInfo, refetch: refetchPoolInfo, isPending: isPoolInfoPending } = useReadContract({
    address: ARCFLUX_ADDRESS as `0x${string}`,
    abi: ARCFLUX_ABI,
    functionName: 'getPoolInfo',
    query: {
      refetchInterval: 12000,
    }
  });

  const reserveUSDC = poolInfo ? poolInfo[0] : 0n;
  const reserveEURC = poolInfo ? poolInfo[1] : 0n;
  const totalLP = poolInfo ? poolInfo[2] : 0n;
  const feeRate = poolInfo ? poolInfo[3] : 0n;

  // 3. Check Allowances for both tokens
  const { data: usdcAllowance, refetch: refetchUSDCAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, ARCFLUX_ADDRESS as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !isUsdcZero,
    }
  });

  const { data: eurcAllowance, refetch: refetchEURCAllowance } = useReadContract({
    address: EURC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, ARCFLUX_ADDRESS as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !isEurcZero,
    }
  });

  const usdcNeedsApproval = usdcAllowance !== undefined && usdcAllowance < parsedUSDC;
  const eurcNeedsApproval = eurcAllowance !== undefined && eurcAllowance < parsedEURC;

  // 4. Contract Writers
  const { writeContractAsync: writeApprove, isPending: isApprovePending } = useWriteContract();
  const { writeContractAsync: writeLiquidity, isPending: isLiquidityPending } = useWriteContract();

  // Approve function for standard tokens
  const handleApproveToken = async (tokenAddress: `0x${string}`, amount: bigint) => {
    if (!writeApprove) throw new Error('Wallet not ready');
    const tx = await writeApprove({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ARCFLUX_ADDRESS as `0x${string}`, amount * 2n], // double approve for ease
    } as any);
    return tx;
  };

  // Add Liquidity Call
  const handleAddLiquidity = async (minLP: bigint) => {
    if (!writeLiquidity) throw new Error('Wallet not ready');
    const tx = await writeLiquidity({
      address: ARCFLUX_ADDRESS as `0x${string}`,
      abi: ARCFLUX_ABI,
      functionName: 'addLiquidity',
      args: [parsedUSDC, parsedEURC, minLP],
    } as any);
    return tx;
  };

  // Remove Liquidity Call
  const handleRemoveLiquidity = async (lpAmount: bigint, minUSDC: bigint, minEURC: bigint) => {
    if (!writeLiquidity) throw new Error('Wallet not ready');
    const tx = await writeLiquidity({
      address: ARCFLUX_ADDRESS as `0x${string}`,
      abi: ARCFLUX_ABI,
      functionName: 'removeLiquidity',
      args: [lpAmount, minUSDC, minEURC],
    } as any);
    return tx;
  };

  const refetchAll = () => {
    refetchLPBalance();
    refetchPoolInfo();
    refetchUSDCAllowance();
    refetchEURCAllowance();
  };

  return {
    lpBalanceRaw,
    lpBalanceFormatted,
    reserveUSDC,
    reserveEURC,
    totalLP,
    feeRate,
    usdcNeedsApproval,
    eurcNeedsApproval,
    isApprovePending,
    isLiquidityPending,
    isPoolInfoPending,
    isLPBalancePending,
    handleApproveToken,
    handleAddLiquidity,
    handleRemoveLiquidity,
    refetchAll,
  };
}
