import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { TOKENS, TokenInfo } from '../config/tokens';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useQuote } from '../hooks/useQuote';
import { useSwap } from '../hooks/useSwap';
import { TokenSelector } from './TokenSelector';
import { TransactionModal, TxStep } from './TransactionModal';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ArrowDown, Settings2, Sliders, WalletCards, ShieldAlert } from 'lucide-react';
import { formatUnits } from 'viem';
import { ARCFLUX_ADDRESS, ARCFLUX_ABI } from '../config/contracts';

export function SwapCard() {
  const { isConnected, address } = useAccount();

  // Read contract to get reserves for recording price point
  const { data: poolInfo, refetch: refetchPoolInfo } = useReadContract({
    address: ARCFLUX_ADDRESS as `0x${string}`,
    abi: ARCFLUX_ABI,
    functionName: 'getPoolInfo',
  });

  // Selected Tokens
  const [fromToken, setFromToken] = useState<TokenInfo>(TOKENS[0]); // USDC default
  const [toToken, setToToken] = useState<TokenInfo>(TOKENS[1]); // EURC default

  // Input states
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState<number>(0.5); // Default 0.5%
  const [showCustomSlippage, setShowCustomSlippage] = useState(false);
  const [customSlippageVal, setCustomSlippageVal] = useState('');

  // Selector modals
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<'from' | 'to'>('from');

  // Balances
  const { formatted: fromBalance, refetch: refetchFromBalance } = useTokenBalance(
    fromToken.address,
    fromToken.decimals
  );
  const { formatted: toBalance, refetch: refetchToBalance } = useTokenBalance(
    toToken.address,
    toToken.decimals
  );

  // Quote Hook
  const { amountOut, priceImpact, isPending: isQuotePending, error: quoteError, rawAmountOut } = useQuote(
    fromToken,
    toToken,
    amountIn
  );

  // Swap Hook
  const {
    needsApproval,
    isApprovePending,
    isSwapPending,
    handleApprove,
    handleSwap,
    refetchAllowance,
    saveHistory,
  } = useSwap(fromToken, toToken, amountIn, rawAmountOut, amountOut, slippage);

  // Transaction Modal state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStep, setTxStep] = useState<TxStep>('review');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [txErrorReason, setTxErrorReason] = useState<string | undefined>(undefined);

  // Max Button handler
  const handleMax = () => {
    if (fromBalance) {
      setAmountIn(fromBalance);
    }
  };

  // Switch Tokens handler
  const handleFlip = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmountIn('');
  };

  // Custom slippage setter
  useEffect(() => {
    if (customSlippageVal) {
      const parsedSlippage = parseFloat(customSlippageVal);
      if (!isNaN(parsedSlippage) && parsedSlippage > 0 && parsedSlippage <= 50) {
        setSlippage(parsedSlippage);
      }
    }
  }, [customSlippageVal]);

  const hasInsufficientBalance = isConnected && 
    parseFloat(amountIn) > 0 && 
    parseFloat(amountIn) > parseFloat(fromBalance);

  const isZeroIn = !amountIn || parseFloat(amountIn) <= 0 || isNaN(parseFloat(amountIn));

  // Swap action trigger
  const triggerSwap = () => {
    if (isZeroIn) return;
    setTxErrorReason(undefined);
    setTxHash(undefined);
    setTxStep('review');
    setTxModalOpen(true);
  };

  const handleConfirmSwap = async () => {
    try {
      if (needsApproval) {
        setTxStep('approve');
        const appTx = await handleApprove();
        // Wait briefly for confirmation if needed, otherwise continue
        setTxStep('pending');
        setTxHash(appTx);
      }
      
      setTxStep('pending');
      const swapTx = await handleSwap();
      setTxHash(swapTx);

      // Record in trade history
      saveHistory({
        id: Math.random().toString(),
        type: 'Swap',
        fromSymbol: fromToken.symbol,
        toSymbol: toToken.symbol,
        fromAmount: amountIn,
        toAmount: amountOut || '0.00',
        timestamp: Date.now(),
        hash: swapTx,
      });

      // Fetch latest pool reserves and record new price in history
      try {
        const poolData = await refetchPoolInfo();
        if (poolData && poolData.data) {
          const reserveUSDC = poolData.data[0];
          const reserveEURC = poolData.data[1];
          if (reserveUSDC > 0n && reserveEURC > 0n) {
            const rxRate = Number(reserveEURC) / Number(reserveUSDC);
            const rawHist = localStorage.getItem('arcflux_price_history');
            let hist = [];
            if (rawHist) {
              try { hist = JSON.parse(rawHist); } catch (e) {}
            }
            hist.push({
              timestamp: Date.now(),
              rate: parseFloat(rxRate.toFixed(5)),
            });
            localStorage.setItem('arcflux_price_history', JSON.stringify(hist.slice(-500)));
          }
        }
      } catch (err) {
        console.error('Failed to report post-swap price rate in history:', err);
      }

      // Refetch balances for user
      refetchFromBalance();
      refetchToBalance();

      setTxStep('success');
    } catch (e: any) {
      console.error(e);
      setTxErrorReason(e?.message || 'Transaction was rejected or failed on Arc Testnet.');
      setTxStep('error');
    }
  };

  // Fees calculations
  const feeAmount = !isZeroIn ? (parseFloat(amountIn) * 0.003).toFixed(5) : '0';
  const networkFee = '0.05'; // Static USDC network fee illustration for Arc testnet

  return (
    <>
      <Card className="w-full max-w-md mx-auto relative overflow-hidden glass-card-premium p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-5 duration-500">
        
        {/* Settings Header */}
        <div className="flex items-center justify-between mb-5 select-none">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="font-extrabold">Swap</span>
            <span className="font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Routes</span>
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomSlippage(!showCustomSlippage)}
              className={`p-2 rounded-xl transition duration-200 cursor-pointer ${
                showCustomSlippage
                  ? 'bg-blue-600/10 text-cyan-400 border border-blue-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Custom Slippage Controls */}
        {showCustomSlippage && (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold font-mono">Max Slippage Offer</span>
              <span className="text-xs font-mono font-bold text-blue-400">{slippage}% limit</span>
            </div>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setSlippage(item);
                    setCustomSlippageVal('');
                  }}
                  className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold transition-all duration-300 cursor-pointer ${
                    slippage === item && !customSlippageVal
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/15'
                      : 'bg-slate-950 border border-white/5 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {item}%
                </button>
              ))}
              <Input
                value={customSlippageVal}
                onChange={(e) => setCustomSlippageVal(e.target.value)}
                placeholder="Custom %"
                className="w-24 text-center h-8 bg-slate-900 border-white/10 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Input Boxes */}
        <div className="space-y-3.5 relative">
          
          {/* Selling Input Box */}
          <div className="bg-[#ffffff]/[0.02] border border-white/5 p-4 rounded-3xl hover:border-white/10 transition-colors">
            <div className="flex justify-between items-center mb-1.5 text-xs text-slate-400 font-medium font-mono">
              <span className="text-slate-400">Pay with</span>
              <div className="flex items-center gap-1.5">
                <WalletCards className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Balance: <span className="text-[#00D4FF] font-bold">{fromBalance}</span></span>
                {isConnected && parseFloat(fromBalance) > 0 && (
                  <button
                    onClick={handleMax}
                    className="text-blue-400 hover:text-blue-300 font-extrabold ml-1 hover:underline cursor-pointer"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-3xl font-bold font-mono outline-none text-[#00D4FF] placeholder:text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => {
                  setSelectorTarget('from');
                  setSelectorOpen(true);
                }}
                className="flex items-center gap-2 shrink-0 bg-slate-950/80 border border-white/10 hover:border-blue-500/30 p-2.5 rounded-2xl transition duration-300 shadow-xl cursor-pointer"
              >
                <img 
                  src={fromToken.symbol === 'USDC' ? 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' : 'https://assets.coingecko.com/coins/images/26045/small/euro-coin.png'} 
                  className="w-5 h-5 rounded-full" 
                  alt="" 
                />
                <span className="font-black text-white text-sm">{fromToken.symbol}</span>
                <span className="text-slate-550 text-xs font-bold font-mono">▾</span>
              </button>
            </div>
          </div>

          {/* Flip / Toggle Button */}
          <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <button
              onClick={handleFlip}
              className="p-3 bg-black/60 border-4 border-black rounded-2xl text-cyan-400 hover:text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all duration-300 group cursor-pointer hover:scale-110 active:scale-90"
              title="Flip Trading Route"
            >
              <ArrowDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 animate-bounce" />
            </button>
          </div>

          {/* Buying Input Box */}
          <div className="bg-[#ffffff]/[0.02] border border-white/5 p-4 rounded-3xl hover:border-white/10 transition-colors">
            <div className="flex justify-between items-center mb-1.5 text-xs text-slate-400 font-medium font-mono">
              <span className="text-slate-400">Receive (estimated)</span>
              <span className="text-slate-400">Balance: <span className="text-[#00D4FF] font-bold">{toBalance}</span></span>
            </div>

            <div className="flex items-center justify-between gap-3">
              {isQuotePending ? (
                <div className="h-9 w-32 bg-white/5 animate-pulse rounded-full" />
              ) : (
                <input
                  type="text"
                  value={amountOut}
                  disabled
                  placeholder="0.0"
                  className="w-full bg-transparent text-3xl font-bold font-mono outline-none text-[#00D4FF]/80 cursor-not-allowed placeholder:text-slate-800 transition-all duration-300"
                />
              )}
              <button
                onClick={() => {
                  setSelectorTarget('to');
                  setSelectorOpen(true);
                }}
                className="flex items-center gap-2 shrink-0 bg-slate-950/80 border border-white/10 hover:border-blue-500/30 p-2.5 rounded-2xl transition duration-300 shadow-xl cursor-pointer"
              >
                <img 
                  src={toToken.symbol === 'USDC' ? 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' : 'https://assets.coingecko.com/coins/images/26045/small/euro-coin.png'} 
                  className="w-5 h-5 rounded-full" 
                  alt="" 
                />
                <span className="font-black text-white text-sm">{toToken.symbol}</span>
                <span className="text-slate-550 text-xs font-bold font-mono">▾</span>
              </button>
            </div>
          </div>
        </div>

        {/* Exchange Rate and Fee Calculations Banner */}
        {!isZeroIn && (
          <div className="mt-4 p-4 bg-black/40 border border-white/5 rounded-2xl text-xs font-semibold text-slate-400 space-y-2.5 font-mono animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center text-slate-200">
              <span>Exchange Rate</span>
              <span className="pulse-rate text-[#00D4FF] font-extrabold">
                1 {fromToken.symbol} = {amountOut && amountIn ? (parseFloat(amountOut) / parseFloat(amountIn)).toFixed(5) : '0.00'} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>AMM Swap Fee (0.3%)</span>
              <span className="text-slate-300 font-bold">{feeAmount} {fromToken.symbol}</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
              <span>Price Impact</span>
              <span className={`font-black ${
                priceImpact < 1.0 
                  ? 'text-emerald-400' 
                  : priceImpact <= 3.0 
                  ? 'text-yellow-400' 
                  : 'text-red-500 animate-pulse'
              }`}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Gas Limit paid in</span>
              <span className="text-blue-400 font-bold font-mono">~{networkFee} USDC</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5">
          {!isConnected ? (
            <div className="text-center bg-white/[0.02] border border-white/5 p-4 rounded-3xl animate-in zoom-in-95 duration-200">
              <p className="text-xs font-semibold text-slate-400 mb-3.5 flex items-center justify-center gap-1.5 font-mono">
                <ShieldAlert className="w-4 h-4 text-amber-500 animate-bounce" />
                Connect your web3 wallet to access Router
              </p>
              <Button
                onClick={() => {
                  const el = document.getElementById('wallet-connect-btn');
                  el?.click();
                }}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold transition-all duration-300 rounded-2xl hover:shadow-[0_0_15px_rgba(59,130,246,0.35)] cursor-pointer"
              >
                Connect Wallet
              </Button>
            </div>
          ) : hasInsufficientBalance ? (
            <Button
              disabled
              size="lg"
              className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black h-12 rounded-2xl cursor-not-allowed"
            >
              Insufficient {fromToken.symbol} Balance
            </Button>
          ) : isZeroIn ? (
            <Button
              disabled
              size="lg"
              className="w-full bg-white/5 border border-white/5 text-slate-600 font-black h-12 rounded-2xl cursor-not-allowed"
            >
              Enter amount to trade
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={triggerSwap}
                size="lg"
                className="w-full bg-gradient-to-r from-[#0066FF] via-[#8B5CF6] to-[#00D4FF] hover:shadow-[0_0_25px_rgba(0,102,255,0.45)] text-white font-extrabold h-12 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer shimmer-btn-shine"
                id="main-swap-trigger-btn"
              >
                Swap Tokens
              </Button>
              <div className="text-center select-none pt-1">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                  ⚡ Powered by ArcFlux Engine
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error message logs layout if pool is invalid */}
        {quoteError && (
          <p className="mt-3 text-center text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/10 p-2.5 rounded-2xl">
            Liquidity pool query rejected. Check if reserves exist in pool.
          </p>
        )}

      </Card>

      {/* Target selector modal */}
      <TokenSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        selectedTokenAddress={selectorTarget === 'from' ? fromToken.address : toToken.address}
        onSelect={(token) => {
          if (selectorTarget === 'from') {
            setFromToken(token);
            if (token.symbol === toToken.symbol) {
              setToToken(TOKENS.find((item) => item.symbol !== token.symbol)!);
            }
          } else {
            setToToken(token);
            if (token.symbol === fromToken.symbol) {
              setFromToken(TOKENS.find((item) => item.symbol !== token.symbol)!);
            }
          }
          setAmountIn('');
        }}
      />

      {/* Transaction Modal 4-screen layout */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        step={txStep}
        errorReason={txErrorReason}
        fromToken={fromToken}
        toToken={toToken}
        amountIn={amountIn}
        amountOut={amountOut || '0.00'}
        priceImpact={priceImpact}
        networkFee={networkFee}
        feeAmount={feeAmount}
        txHash={txHash}
        isApprovalNeeded={needsApproval}
        onConfirm={handleConfirmSwap}
      />
    </>
  );
}
