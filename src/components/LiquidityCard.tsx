import { useState, useEffect } from 'react';
import { useAccount, useWatchContractEvent } from 'wagmi';
import { useLiquidity } from '../hooks/useLiquidity';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { parseUnits, formatUnits } from 'viem';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { 
  ArrowDownUp, 
  Coins, 
  HelpCircle, 
  Info, 
  Loader2, 
  Percent, 
  PiggyBank, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  PieChart,
  Minus
} from 'lucide-react';

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`;
const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as `0x${string}`;

// Simple Count-Up Component for pool stats
function PoolStatCountUp({ value }: { value: number }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end <= 0) {
      setDisplayVal(0);
      return;
    }
    const duration = 1000; // 1 second duration
    const stepTime = 25; // millisecond steps
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayVal(end);
        clearInterval(timer);
      } else {
        setDisplayVal(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {displayVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function LiquidityCard() {
  const { isConnected } = useAccount();

  // Mode: 'add' | 'remove'
  const [activeSubMode, setActiveSubMode] = useState<'add' | 'remove'>('add');

  // Input states
  const [usdcAmount, setUsdcAmount] = useState('');
  const [eurcAmount, setEurcAmount] = useState('');
  const [removePercentage, setRemovePercentage] = useState<number>(50); // Default 50% slider

  // Transaction Status States
  const [txStatus, setTxStatus] = useState<'idle' | 'approving_usdc' | 'approving_eurc' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [txHash, setTxHash] = useState<string>('');

  // Balances
  const { formatted: usdcBalance, refetch: refetchUSDCBalance } = useTokenBalance(USDC_ADDRESS, 6);
  const { formatted: eurcBalance, refetch: refetchEURCBalance } = useTokenBalance(EURC_ADDRESS, 6);

  // Hook for reading/writing liquidity
  const {
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
    handleApproveToken,
    handleAddLiquidity,
    handleRemoveLiquidity,
    refetchAll,
  } = useLiquidity(usdcAmount, eurcAmount);

  // Auto-ratio logic when typing
  const handleUsdcInput = (val: string) => {
    setUsdcAmount(val);
    if (!val || parseFloat(val) <= 0 || isNaN(parseFloat(val))) {
      setEurcAmount('');
      return;
    }

    if (reserveUSDC > 0n && reserveEURC > 0n) {
      const usdcNum = parseFloat(val);
      const ratio = Number(reserveEURC) / Number(reserveUSDC);
      const eurcNum = usdcNum * ratio;
      // Format to 6 decimals
      setEurcAmount(eurcNum.toFixed(6));
    }
  };

  const handleEurcInput = (val: string) => {
    setEurcAmount(val);
    if (!val || parseFloat(val) <= 0 || isNaN(parseFloat(val))) {
      setUsdcAmount('');
      return;
    }

    if (reserveUSDC > 0n && reserveEURC > 0n) {
      const eurcNum = parseFloat(val);
      const ratio = Number(reserveUSDC) / Number(reserveEURC);
      const usdcNum = eurcNum * ratio;
      // Format to 6 decimals
      setUsdcAmount(usdcNum.toFixed(6));
    }
  };

  // Max handlers
  const handleMaxUSDC = () => {
    if (usdcBalance) {
      handleUsdcInput(usdcBalance);
    }
  };

  const handleMaxEURC = () => {
    if (eurcBalance) {
      handleEurcInput(eurcBalance);
    }
  };

  // LP & Share estimations
  const estimatedLPToReceive = (() => {
    const usdcVal = parseFloat(usdcAmount);
    const eurcVal = parseFloat(eurcAmount);
    if (isNaN(usdcVal) || usdcVal <= 0 || isNaN(eurcVal) || eurcVal <= 0) return 0n;

    if (totalLP === 0n) {
      // If pool is unseeded, estimate LP tokens on a 1:1 ratio with input USDC
      return parseUnits(usdcAmount, 6);
    } else {
      const usdcLPResult = (parseUnits(usdcAmount, 6) * totalLP) / reserveUSDC;
      const eurcLPResult = (parseUnits(eurcAmount, 6) * totalLP) / reserveEURC;
      return usdcLPResult < eurcLPResult ? usdcLPResult : eurcLPResult;
    }
  })();

  const poolSharePct = (() => {
    if (totalLP === 0n) {
      return estimatedLPToReceive > 0n ? '100.00' : '0.00';
    }
    const lpEst = estimatedLPToReceive;
    const share = (Number(lpEst) * 100) / (Number(totalLP) + Number(lpEst));
    return share.toFixed(2);
  })();

  // Remove liquidity estimations
  const userLPRaw = lpBalanceRaw || 0n;
  const lpToRemoveRaw = (userLPRaw * BigInt(removePercentage)) / 100n;

  const estReceiveUSDC = (() => {
    if (totalLP === 0n || lpToRemoveRaw === 0n) return 0n;
    return (reserveUSDC * lpToRemoveRaw) / totalLP;
  })();

  const estReceiveEURC = (() => {
    if (totalLP === 0n || lpToRemoveRaw === 0n) return 0n;
    return (reserveEURC * lpToRemoveRaw) / totalLP;
  })();

  const currentPoolSharePct = (() => {
    if (totalLP === 0n || userLPRaw === 0n) return '0.00';
    const pct = (Number(userLPRaw) * 100) / Number(totalLP);
    return pct.toFixed(2);
  })();

  // Main interaction actions
  const onApproveUSDC = async () => {
    try {
      setTxStatus('approving_usdc');
      setErrorMessage('');
      const amt = parseUnits(usdcAmount, 6);
      const tx = await handleApproveToken(USDC_ADDRESS, amt);
      setTxHash(tx);
      setTxStatus('idle');
      refetchAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Approval of USDC failed or was cancelled.');
      setTxStatus('error');
    }
  };

  const onApproveEURC = async () => {
    try {
      setTxStatus('approving_eurc');
      setErrorMessage('');
      const amt = parseUnits(eurcAmount, 6);
      const tx = await handleApproveToken(EURC_ADDRESS, amt);
      setTxHash(tx);
      setTxStatus('idle');
      refetchAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Approval of EURC failed or was cancelled.');
      setTxStatus('error');
    }
  };

  const onAddLiquiditySubmit = async () => {
    try {
      setTxStatus('submitting');
      setErrorMessage('');
      
      // Compute minLP with slippage
      const minLP = (estimatedLPToReceive * 99n) / 100n;

      const tx = await handleAddLiquidity(minLP);
      setTxHash(tx);
      setTxStatus('success');
      
      // Clean states
      setUsdcAmount('');
      setEurcAmount('');

      // Refresh data
      refetchAll();
      refetchUSDCBalance();
      refetchEURCBalance();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to add liquidity on Arc Testnet.');
      setTxStatus('error');
    }
  };

  const onRemoveLiquiditySubmit = async () => {
    try {
      if (lpToRemoveRaw === 0n) return;
      setTxStatus('submitting');
      setErrorMessage('');

      // Apply 1% slippage factor
      const minUSDC = (estReceiveUSDC * 99n) / 100n;
      const minEURC = (estReceiveEURC * 99n) / 100n;

      const tx = await handleRemoveLiquidity(lpToRemoveRaw, minUSDC, minEURC);
      setTxHash(tx);
      setTxStatus('success');

      // Refresh data
      refetchAll();
      refetchUSDCBalance();
      refetchEURCBalance();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove liquidity from ArcFlux.');
      setTxStatus('error');
    }
  };

  // Validation
  const hasUsdcInsufficient = isConnected && 
    parseFloat(usdcAmount) > 0 && 
    parseFloat(usdcAmount) > parseFloat(usdcBalance);

  const hasEurcInsufficient = isConnected && 
    parseFloat(eurcAmount) > 0 && 
    parseFloat(eurcAmount) > parseFloat(eurcBalance);

  const isAddZero = !usdcAmount || parseFloat(usdcAmount) <= 0 || !eurcAmount || parseFloat(eurcAmount) <= 0;

  // Visual percentages calculations for relative pool depth indicator
  const reserveUSDCNo = parseFloat(formatUnits(reserveUSDC, 6));
  const reserveEURCNo = parseFloat(formatUnits(reserveEURC, 6));
  const sumReserves = reserveUSDCNo + reserveEURCNo;
  const usdcRatioDepth = sumReserves > 0 ? (reserveUSDCNo * 100) / sumReserves : 50;
  const eurcRatioDepth = sumReserves > 0 ? (reserveEURCNo * 100) / sumReserves : 50;

  // Circumference calculations for current active share progress ring
  const circleRadius = 36;
  const poolShareFloat = parseFloat(currentPoolSharePct);
  const strokeCircumference = 2 * Math.PI * circleRadius; // ~226.19
  const progressOffset = strokeCircumference - (Math.min(poolShareFloat, 100) / 100) * strokeCircumference;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="text-center mb-6 max-w-xl mx-auto select-none">
        <span className="text-xs uppercase tracking-widest font-mono font-extrabold text-[#00D4FF] bg-blue-500/10 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,102,255,0.2)]">
          AMM POOLS
        </span>
        <h2 className="text-3xl font-extrabold text-white mt-3">Provide Liquidity</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Supply equal portions of USDC and EURC pairs to collect a standard <span className="text-[#00D4FF] font-bold">0.3% protocol reward fee</span> on every user trade route.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Adding & Removing Card form (7cols) */}
        <div className="lg:col-span-7 p-[1.5px] bg-gradient-to-r from-[#0066FF] via-[#8B5CF6] to-[#00D4FF] rounded-3xl shadow-[0_0_20px_rgba(0,102,255,0.15)] hover:shadow-[0_0_30px_rgba(0,102,255,0.25)] transition-all duration-300">
          <Card className="p-6 bg-black/95 border-0 rounded-3.2xl backdrop-blur-3xl relative">
            
            {/* Form tab switcher */}
            <div className="flex bg-white/5 border border-white/5 p-1 rounded-2xl mb-6 select-none">
              <button
                onClick={() => {
                  setActiveSubMode('add');
                  setTxStatus('idle');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-300 cursor-pointer ${
                  activeSubMode === 'add'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shimmer-btn-shine'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Deposit Liquidity</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubMode('remove');
                  setTxStatus('idle');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all duration-300 cursor-pointer ${
                  activeSubMode === 'remove'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shimmer-btn-shine'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Minus className="w-4 h-4" />
                <span>Withdraw Liquidity</span>
              </button>
            </div>

            {/* STATUS PANELS OVERLAYS (Pending, Success, Error) */}
            {txStatus !== 'idle' && (
              <div className="bg-slate-950/95 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 mb-5 animate-in zoom-in-95 duration-200">
                {txStatus === 'approving_usdc' && (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="font-bold text-white text-base">Approving USDC Allowance</p>
                    <p className="text-xs text-slate-400">Confirm the USDC spending permission inside your web3 wallet.</p>
                  </>
                )}
                {txStatus === 'approving_eurc' && (
                  <>
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                    <p className="font-bold text-white text-base">Approving EURC Allowance</p>
                    <p className="text-xs text-slate-400">Confirm the EURC spending permission inside your web3 wallet.</p>
                  </>
                )}
                {txStatus === 'submitting' && (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="font-bold text-white text-base">Submitting Transaction...</p>
                    <p className="text-xs text-slate-400">Deploying liquidity parameters to AMM Router on Arc Testnet.</p>
                  </>
                )}
                {txStatus === 'success' && (
                  <>
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                    <p className="font-extrabold text-white text-lg">Transaction Completed!</p>
                    <p className="text-xs text-slate-300 max-w-sm">
                      Liquidity pool parameters updated successfully. Your new LP Tokens have been provisioned on-chain.
                    </p>
                    {txHash && (
                      <a
                        href={`https://testnet.arcscan.app/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline font-bold"
                      >
                        View on ArcScan Explorer
                      </a>
                    )}
                    <Button onClick={() => setTxStatus('idle')} size="sm" className="mt-3 bg-slate-800 hover:bg-slate-700 cursor-pointer">
                      Got it
                    </Button>
                  </>
                )}
                {txStatus === 'error' && (
                  <>
                    <AlertTriangle className="w-12 h-12 text-red-400" />
                    <p className="font-extrabold text-red-400 text-base">Action Failed</p>
                    <p className="text-xs text-slate-400 max-w-sm overflow-hidden text-ellipsis line-clamp-3">
                      {errorMessage}
                    </p>
                    <Button onClick={() => setTxStatus('idle')} size="sm" className="mt-2 bg-slate-800 hover:bg-slate-700 cursor-pointer">
                      Try Again
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* FORM VIEW 1: DEPOSIT LIQUIDITY */}
            {activeSubMode === 'add' && txStatus === 'idle' && (
              <div className="space-y-4">
                
                {/* USDC Input Box */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-1 text-xs text-slate-400 font-medium font-mono">
                    <span className="text-slate-400">USDC Amount</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      Balance: <span className="text-[#00D4FF] font-bold">{usdcBalance}</span>
                      {isConnected && parseFloat(usdcBalance) > 0 && (
                        <button onClick={handleMaxUSDC} className="text-blue-400 hover:text-blue-300 font-extrabold ml-1 hover:underline cursor-pointer">
                          MAX
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={usdcAmount}
                      onChange={(e) => handleUsdcInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-bold font-mono outline-none text-[#00D4FF] placeholder:text-slate-800 [appearance:textfield]"
                    />
                    <div className="flex items-center gap-2 bg-slate-950/80 border border-white/15 px-3 py-1.5 rounded-xl shrink-0">
                      <img src="https://assets.coingecko.com/coins/images/6319/small/usdc.png" className="w-5 h-5 rounded-full" alt="" />
                      <span className="font-bold text-sm text-white">USDC</span>
                    </div>
                  </div>
                </div>

                {/* Plus Separator */}
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="bg-slate-950 border border-white/15 p-1.5 rounded-full text-blue-400 shadow-md">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* EURC Input Box */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-center mb-1 text-xs text-slate-400 font-medium font-mono">
                    <span className="text-slate-400">EURC Amount</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      Balance: <span className="text-[#00D4FF] font-bold">{eurcBalance}</span>
                      {isConnected && parseFloat(eurcBalance) > 0 && (
                        <button onClick={handleMaxEURC} className="text-blue-400 hover:text-blue-300 font-extrabold ml-1 hover:underline cursor-pointer">
                          MAX
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={eurcAmount}
                      onChange={(e) => handleEurcInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-bold font-mono outline-none text-[#00D4FF] placeholder:text-slate-800 [appearance:textfield]"
                    />
                    <div className="flex items-center gap-2 bg-slate-950/80 border border-white/15 px-3 py-1.5 rounded-xl shrink-0">
                      <img src="https://assets.coingecko.com/coins/images/26045/small/euro-coin.png" className="w-5 h-5 rounded-full" alt="" />
                      <span className="font-bold text-sm text-white">EURC</span>
                    </div>
                  </div>
                </div>

                {/* Pool Seed Ratio Warning */}
                {reserveUSDC === 0n && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-[11px] leading-relaxed text-amber-400 font-mono">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>
                      <strong>First Pool Depositor:</strong> The pool currently holds zero reserves. You have complete control over establishing the initial ratio of USDC per EURC. Please seed both with standard fair rates.
                    </span>
                  </div>
                )}

                {/* Calculations Stats Panel */}
                {!isAddZero && (
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-xs font-mono text-slate-400 space-y-2.5 mt-4">
                    <div className="flex justify-between">
                      <span>Est LP Recieved</span>
                      <span className="text-slate-200 font-bold">
                        {parseFloat(formatUnits(estimatedLPToReceive, 6)).toLocaleString(undefined, { maximumFractionDigits: 4 })} LP
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>My Pool Share</span>
                      <span className="text-[#00D4FF] font-black">{poolSharePct}%</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-white/5">
                      <span>Pricing Ratio</span>
                      <span className="text-slate-400 font-semibold">
                        1 USDC = {reserveUSDC > 0n ? (Number(reserveEURC) / Number(reserveUSDC)).toFixed(4) : '1.000'} EURC
                      </span>
                    </div>
                  </div>
                )}

                {/* Action CTA Buttons */}
                <div className="pt-3 space-y-3">
                  {!isConnected ? (
                    <Button
                      onClick={() => {
                        const el = document.getElementById('wallet-connect-btn');
                        el?.click();
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold h-11 hover:shadow-[0_0_15px_rgba(59,130,246,0.35)] cursor-pointer"
                    >
                      Connect Wallet
                    </Button>
                  ) : hasUsdcInsufficient ? (
                    <Button disabled className="w-full bg-red-500/10 border border-red-500/10 text-red-500 font-bold cursor-not-allowed">
                      Insufficient USDC Balance
                    </Button>
                  ) : hasEurcInsufficient ? (
                    <Button disabled className="w-full bg-red-500/10 border border-red-500/10 text-red-500 font-bold cursor-not-allowed">
                      Insufficient EURC Balance
                    </Button>
                  ) : isAddZero ? (
                    <Button disabled className="w-full bg-white/5 border border-white/5 text-slate-600 font-black cursor-not-allowed">
                      Input Token Amounts
                    </Button>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1.5">
                      
                      {/* USDC approval button (or checked) */}
                      {usdcNeedsApproval ? (
                        <Button
                          onClick={onApproveUSDC}
                          className="bg-blue-600 text-white font-extrabold h-11 hover:bg-blue-500 transition-colors shadow-md rounded-2xl cursor-pointer"
                          id="approve-usdc-liq"
                        >
                          Approve USDC
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold font-mono h-11 rounded-2xl select-none">
                          USDC Approved ✓
                        </div>
                      )}

                      {/* EURC approval button (or checked) */}
                      {eurcNeedsApproval ? (
                        <Button
                          onClick={onApproveEURC}
                          className="bg-purple-600 text-white font-extrabold h-11 hover:bg-purple-555 transition-colors shadow-md rounded-2xl cursor-pointer"
                          id="approve-eurc-liq"
                        >
                          Approve EURC
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold font-mono h-11 rounded-2xl select-none">
                          EURC Approved ✓
                        </div>
                      )}

                      {/* Main add triggering */}
                      <Button
                        onClick={onAddLiquiditySubmit}
                        disabled={usdcNeedsApproval || eurcNeedsApproval}
                        className="w-full md:col-span-2 bg-gradient-to-r from-[#0066FF] via-[#8B5CF6] to-[#00D4FF] text-white font-extrabold h-12 shadow-xl hover:shadow-[0_0_20px_rgba(0,102,255,0.4)] disabled:opacity-30 disabled:pointer-events-none mt-2 rounded-2xl cursor-pointer shimmer-btn-shine"
                        id="unleased-add-liq-trigger"
                      >
                        Add Liquidity
                      </Button>

                    </div>
                  )}
                </div>

              </div>
            )}

            {/* FORM VIEW 2: WITHDRAW LIQUIDITY */}
            {activeSubMode === 'remove' && txStatus === 'idle' && (
              <div className="space-y-4">
                
                {/* LP Balances Header */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-medium font-mono">
                    <span className="text-slate-400">Your LP Token Balance</span>
                    <span className="text-[#00D4FF] font-black font-mono">{lpBalanceFormatted} LP</span>
                  </div>
                </div>

                {/* Percentage select slider */}
                <div className="space-y-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-bold font-mono">Amount to Remove</label>
                    <span className="text-lg font-black font-mono text-purple-400">{removePercentage}%</span>
                  </div>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={removePercentage}
                    onChange={(e) => setRemovePercentage(Number(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-[#00D4FF]"
                  />

                  {/* Fast presets buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
                    {[25, 50, 75, 100].map((item) => (
                      <button
                        key={item}
                        onClick={() => setRemovePercentage(item)}
                        className={`py-1.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                          removePercentage === item
                            ? 'bg-purple-600/25 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                            : 'bg-slate-950 border border-white/5 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        {item}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expected token returns panel */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 font-mono text-xs text-slate-400">
                  <span className="font-bold text-slate-300 text-xs">Expected Tokens Returned</span>
                  
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center pt-1 border-b border-white/[0.03] pb-1.5">
                      <div className="flex items-center gap-2 text-slate-300">
                        <img src="https://assets.coingecko.com/coins/images/6319/small/usdc.png" className="w-4 h-4 rounded-full" alt="" />
                        <span>USDC</span>
                      </div>
                      <span className="text-white font-bold font-mono">
                        {parseFloat(formatUnits(estReceiveUSDC, 6)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-300">
                        <img src="https://assets.coingecko.com/coins/images/26045/small/euro-coin.png" className="w-4 h-4 rounded-full" alt="" />
                        <span>EURC</span>
                      </div>
                      <span className="text-white font-bold font-mono">
                        {parseFloat(formatUnits(estReceiveEURC, 6)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Withdraw triggers */}
                <div className="pt-3">
                  {!isConnected ? (
                    <Button
                      onClick={() => {
                        const el = document.getElementById('wallet-connect-btn');
                        el?.click();
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-extrabold rounded-2xl cursor-pointer"
                    >
                      Connect Wallet
                    </Button>
                  ) : userLPRaw === 0n ? (
                    <Button disabled className="w-full bg-slate-800 text-slate-500 font-bold cursor-not-allowed">
                      No pool share liquidity on ArcFlux
                    </Button>
                  ) : (
                    <Button
                      onClick={onRemoveLiquiditySubmit}
                      className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 text-white font-extrabold h-12 shadow-xl hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all rounded-2xl cursor-pointer shimmer-btn-shine"
                      id="remove-liq-full-trigger"
                    >
                      Remove Liquidity
                    </Button>
                  )}
                </div>

              </div>
            )}

          </Card>
        </div>

        {/* Right Side: Pools Meta Stats info (5cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-[#ffffff]/[0.03] border border-white/5 rounded-3xl backdrop-blur-3xl font-mono text-slate-300 select-none shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <PieChart className="w-4.5 h-4.5 text-cyan-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">UserPool Share</h3>
            </div>

            {/* Circular Progress Ring display for pool share */}
            <div className="flex flex-col items-center justify-center py-2 select-none">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={circleRadius}
                    className="stroke-white/5 fill-none"
                    strokeWidth="5"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={circleRadius}
                    className="stroke-cyan-400 fill-none transition-all duration-1000 ease-out"
                    strokeWidth="5"
                    strokeDasharray={strokeCircumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-white font-mono leading-none">{currentPoolSharePct}%</span>
                  <span className="text-[7.5px] text-slate-500 tracking-wider uppercase font-mono mt-0.5">My Share</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 text-xs font-semibold mt-4 border-t border-white/5 pt-4">
              <div className="flex justify-between font-mono">
                <span>Total Pool Share</span>
                <span className="text-cyan-400 font-extrabold">{currentPoolSharePct}%</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>My Active LP</span>
                <span className="text-[#00D4FF] font-black">{lpBalanceFormatted} LP</span>
              </div>
              
              <div className="flex items-start gap-2 bg-white/[0.01] p-3 rounded-xl text-[10px] leading-relaxed text-slate-400 mt-2 font-sans border border-white/5">
                <PiggyBank className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  By holding LP tokens you collect rewards on every swap trade executing on ArcTestnet. Withdraw them at any time to recover underlying USDC-EURC assets.
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#ffffff]/[0.03] border border-white/5 rounded-3xl backdrop-blur-3xl font-mono text-slate-300 select-none shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4.5 h-4.5 text-purple-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-white font-mono">Pool Information</h3>
              </div>
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>

            {/* Liquidity Depth Visual Bar (USDC vs EURC) */}
            <div className="space-y-2.5 mb-5 bg-black/40 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center text-[9px] uppercase font-mono tracking-wider font-extrabold">
                <span className="text-blue-400">USDC ({usdcRatioDepth.toFixed(1)}%)</span>
                <span className="text-purple-400">EURC ({eurcRatioDepth.toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 flex overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700" 
                  style={{ width: `${usdcRatioDepth}%` }}
                />
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700" 
                  style={{ width: `${eurcRatioDepth}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 leading-normal font-sans">
                Liquidity depth comparatives represent pooled asset reserves.
              </span>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span>Reserve USDC</span>
                <span className="font-bold text-white font-mono text-right">
                  <PoolStatCountUp value={reserveUSDCNo} /> USDC
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Reserve EURC</span>
                <span className="font-bold text-white font-mono text-right">
                  <PoolStatCountUp value={reserveEURCNo} /> EURC
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Total LP Supply</span>
                <span className="font-mono text-white">
                  <PoolStatCountUp value={parseFloat(formatUnits(totalLP, 6))} /> LP
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 border-t border-white/5 pt-3.5 mt-1">
                <span>Pool Swap Fee</span>
                <span className="text-emerald-400 font-extrabold text-[#00D4FF] font-mono">0.30%</span>
              </div>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
