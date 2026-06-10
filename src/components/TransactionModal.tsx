import { TokenInfo } from '../config/tokens';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, ArrowDown, CheckCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type TxStep = 'review' | 'approve' | 'pending' | 'success' | 'error';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: TxStep;
  errorReason?: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  networkFee: string;
  feeAmount: string;
  txHash?: `0x${string}`;
  onConfirm: () => void;
  isApprovalNeeded: boolean;
}

export function TransactionModal({
  isOpen,
  onClose,
  step,
  errorReason,
  fromToken,
  toToken,
  amountIn,
  amountOut,
  priceImpact,
  networkFee,
  feeAmount,
  txHash,
  onConfirm,
  isApprovalNeeded,
}: TransactionModalProps) {
  if (!isOpen) return null;

  const truncateHash = (hash?: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getImpactColor = (impact: number) => {
    if (impact < 1) return 'text-emerald-400';
    if (impact < 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        {/* Backdrop overlay trigger */}
        <div className="fixed inset-0" onClick={step !== 'pending' && step !== 'approve' ? onClose : undefined} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="z-10 w-full max-w-md"
        >
          <Card className="relative overflow-hidden border border-white/10 bg-slate-950/95 shadow-2xl rounded-3xl p-6">
            
            {/* Header / Dismiss */}
            {step !== 'pending' && step !== 'approve' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                id="close-tx-modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Step 1: REVIEW SWAP */}
            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Review Swap</h3>
                  <p className="text-sm text-slate-400 mt-1">Review your trade route and price details.</p>
                </div>

                <div className="space-y-2">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Paying</p>
                      <p className="text-2xl font-bold font-mono text-white mt-1">{amountIn}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl">
                      <img src={fromToken.logoURI} className="w-5 h-5 rounded-full" alt="" />
                      <span className="font-bold text-sm text-white">{fromToken.symbol}</span>
                    </div>
                  </div>

                  <div className="flex justify-center -my-1">
                    <div className="bg-slate-900 p-2 border border-white/10 rounded-xl relative z-10">
                      <ArrowDown className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Receiving</p>
                      <p className="text-2xl font-bold font-mono text-white mt-1">{amountOut}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl">
                      <img src={toToken.logoURI} className="w-5 h-5 rounded-full" alt="" />
                      <span className="font-bold text-sm text-white">{toToken.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Swap Details List */}
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-sm font-medium">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>AMM Swap Fee (0.3%)</span>
                    <span className="font-mono text-slate-200">{feeAmount} {fromToken.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Price Impact</span>
                    <span className={`font-mono ${getImpactColor(priceImpact)}`}>
                      {priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Estimated Network Gas</span>
                    <span className="font-mono text-slate-200">{networkFee} USDC</span>
                  </div>
                  <div className="pt-2.5 border-t border-white/5 text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    Gas paid in USDC natively on Arc Testnet
                  </div>
                </div>

                <Button
                  onClick={onConfirm}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold h-12 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-300 rounded-2xl"
                  id="confirm-swap-action-btn"
                >
                  {isApprovalNeeded ? 'Approve & Confirm' : 'Confirm Swap'}
                </Button>
              </div>
            )}

            {/* Step 2: APPROVE TOKEN */}
            {step === 'approve' && (
              <div className="flex flex-col items-center py-8 text-center space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-dashed border-violet-500 border-t-transparent rounded-full animate-spin flex items-center justify-center p-2" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src={fromToken.logoURI} className="w-7 h-7 rounded-full" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Approving {fromToken.symbol}...</h3>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                    A one-time token contract approval is required to allow ArcFlux to trade your {fromToken.symbol}.
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-mono font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                  Confirm the approval transaction in your wallet.
                </div>
              </div>
            )}

            {/* Step 3: PENDING */}
            {step === 'pending' && (
              <div className="flex flex-col items-center py-8 text-center space-y-5">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                <div>
                  <h3 className="text-xl font-extrabold text-white">Transaction Submitted</h3>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                    Swapping {amountIn} {fromToken.symbol} for {amountOut} {toToken.symbol} on Arc Testnet...
                  </p>
                </div>
                
                {txHash && (
                  <div className="space-y-2 w-full">
                    <p className="text-xs text-slate-500">Tx Hash: {truncateHash(txHash)}</p>
                    <a
                      href={`https://testnet.arcscan.app/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-semibold hover:underline"
                    >
                      <span>View on ArcScan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: SUCCESS */}
            {step === 'success' && (
              <div className="flex flex-col items-center py-4 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-emerald-400">Swap Successful!</h3>
                  <p className="text-sm text-slate-300 mt-2 max-w-xs mx-auto font-medium">
                    Successfully swapped <span className="font-bold text-white">{amountIn} {fromToken.symbol}</span> for <span className="font-bold text-white">{amountOut} {toToken.symbol}</span>.
                  </p>
                </div>

                <div className="w-full space-y-3">
                  {txHash && (
                    <a
                      href={`https://testnet.arcscan.app/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-200 font-bold h-11 rounded-2xl transition-all duration-200"
                    >
                      <span>View on ArcScan</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <Button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-2xl"
                  >
                    Swap Again
                  </Button>
                </div>
              </div>
            )}

            {/* Error Fallback */}
            {step === 'error' && (
              <div className="flex flex-col items-center py-4 text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center shadow-lg shadow-red-500/10">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-red-500">Transaction Failed</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                    {errorReason || 'An unknown transaction error occurred on Arc Testnet.'}
                  </p>
                </div>

                <Button
                  onClick={onClose}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold h-11 rounded-2xl"
                >
                  Dismiss
                </Button>
              </div>
            )}

          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
