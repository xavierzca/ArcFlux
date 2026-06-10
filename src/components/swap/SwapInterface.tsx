import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useSimulateContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Settings, ArrowDown, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TokenSelector } from './TokenSelector';
import { ARC_TESTNET_TOKENS, TokenInfo, NATIVE_TOKEN_ADDRESS, ROUTER_ADDRESS } from '@/src/constants/tokens';
import { ERC20_ABI } from '@/src/constants/abis';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const [amountIn, setAmountIn] = useState('');
  const [fromToken, setFromToken] = useState<TokenInfo>(ARC_TESTNET_TOKENS[0]);
  const [toToken, setToToken] = useState<TokenInfo>(ARC_TESTNET_TOKENS[1]);
  
  const [isSelectingFrom, setIsSelectingFrom] = useState(false);
  const [isSelectingTo, setIsSelectingTo] = useState(false);

  // Balances
  const { data: ethBalance } = useBalance({ address, query: { enabled: !!address && fromToken.address === NATIVE_TOKEN_ADDRESS } });
  const { data: tokenBalance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && fromToken.address !== NATIVE_TOKEN_ADDRESS,
    }
  });

  const displayBalance = fromToken.address === NATIVE_TOKEN_ADDRESS 
    ? (ethBalance ? formatUnits(ethBalance.value, ethBalance.decimals) : '0')
    : tokenBalance ? formatUnits(tokenBalance, fromToken.decimals) : '0';

  const handleMax = () => {
    if (!displayBalance) return;
    setAmountIn(displayBalance);
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmountIn('');
  };

  // Mock Quote (Since we don't have a real router synced)
  const exchangeRate = 1.05; // Mock rate for visual
  const amountOut = amountIn ? (parseFloat(amountIn) * exchangeRate).toFixed(toToken.decimals) : '';

  const [txState, setTxState] = useState<'idle' | 'review' | 'pending' | 'success'>('idle');

  const startSwap = () => {
    setTxState('review');
  };

  const confirmSwap = () => {
    setTxState('pending');
    setTimeout(() => {
      setTxState('success');
      setAmountIn('');
    }, 3000); // mock network delay
  };

  const closeTxModal = () => {
    setTxState('idle');
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto relative overflow-hidden p-2 sm:p-4">
      {/* Settings Header */}
      <div className="flex items-center justify-between px-2 pb-4">
        <h2 className="text-lg font-medium">Swap</h2>
        <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* From Box */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors relative">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-slate-400">Sell</label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-slate-600"
          />
          <button 
            onClick={() => setIsSelectingFrom(true)}
            className="flex shrink-0 items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full shadow-sm transition-colors"
          >
            <img src={fromToken.logoURI} alt="" className="w-5 h-5 rounded-full bg-slate-700" />
            <span className="font-medium">{fromToken.symbol}</span>
            <ArrowDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-500">$0.00</span>
          <div className="flex gap-2 items-center text-slate-400">
            <span>Balance: {displayBalance ? Number(displayBalance).toFixed(4) : '0.0'}</span>
            <button onClick={handleMax} className="text-blue-400 hover:text-blue-300">Max</button>
          </div>
        </div>
      </div>

      {/* Flip Button */}
      <div className="relative h-2 my-1 flex justify-center z-10">
        <button 
          onClick={switchTokens}
          className="absolute top-1/2 -translate-y-1/2 p-2 bg-slate-800 border-4 border-slate-900/50 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors group"
        >
          <ArrowDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>

      {/* To Box */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors relative">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-slate-400">Buy</label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amountOut}
            readOnly
            placeholder="0"
            className="w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-slate-600 text-slate-300 cursor-not-allowed"
          />
          <button 
            onClick={() => setIsSelectingTo(true)}
            className="flex shrink-0 items-center gap-2 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-full shadow-sm transition-colors"
          >
            <img src={toToken.logoURI} alt="" className="w-5 h-5 rounded-full bg-blue-700" />
            <span className="font-medium">{toToken.symbol}</span>
            <ArrowDown className="w-3 h-3 text-white/70" />
          </button>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-500">$0.00</span>
          <span className="text-slate-400">Balance: 0.0</span>
        </div>
      </div>

      {/* Details Box */}
      {amountIn && parseFloat(amountIn) > 0 && (
        <div className="mt-4 p-3 bg-slate-900/50 rounded-xl border border-white/5 text-sm space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Rate</span>
            <span>1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Price Impact</span>
            <span className="text-emerald-400">{'<0.01%'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Network Fee</span>
            <span>~0.001 ARC</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4">
        {!isConnected ? (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button onClick={openConnectModal} size="lg" className="w-full bg-blue-600 hover:bg-blue-500">
                Connect Wallet
              </Button>
            )}
          </ConnectButton.Custom>
        ) : !amountIn || parseFloat(amountIn) === 0 ? (
          <Button disabled size="lg" className="w-full bg-slate-800 text-slate-500">
            Enter an amount
          </Button>
        ) : (
          <Button 
            size="lg" 
            className="w-full relative overflow-hidden group bg-blue-600 hover:bg-blue-500"
            onClick={startSwap}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative font-bold">Swap</span>
          </Button>
        )}
      </div>

      <TokenSelector 
        isOpen={isSelectingFrom} 
        onClose={() => setIsSelectingFrom(false)} 
        onSelect={setFromToken} 
      />
      
      <TokenSelector 
        isOpen={isSelectingTo} 
        onClose={() => setIsSelectingTo(false)} 
        onSelect={setToToken} 
      />
    </Card>
    {txState !== 'idle' && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <Card className="w-full max-w-sm flex flex-col p-6 animate-in fade-in zoom-in duration-200">
          {txState === 'review' && (
            <>
              <h3 className="text-xl font-bold mb-6">Review Swap</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src={fromToken.logoURI} className="w-6 h-6 rounded-full" />
                    <span className="font-medium">{amountIn}</span>
                  </div>
                  <span className="text-slate-400">{fromToken.symbol}</span>
                </div>
                <div className="flex justify-center text-slate-500">
                  <ArrowDown className="w-4 h-4" />
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src={toToken.logoURI} className="w-6 h-6 rounded-full" />
                    <span className="font-medium">{amountOut}</span>
                  </div>
                  <span className="text-slate-400">{toToken.symbol}</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="secondary" className="flex-1" onClick={closeTxModal}>Cancel</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-500" onClick={confirmSwap}>Confirm Swap</Button>
              </div>
            </>
          )}

          {txState === 'pending' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <h3 className="text-lg font-bold mb-2">Waiting for confirmation...</h3>
              <p className="text-slate-400 text-center text-sm">
                Swapping {amountIn} {fromToken.symbol} for {amountOut} {toToken.symbol}
              </p>
            </div>
          )}

          {txState === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-emerald-400">Swap Successful</h3>
              <p className="text-slate-400 text-center text-sm mb-6">
                Transaction confirmed on Arc Testnet Explorer.
              </p>
              <Button className="w-full bg-slate-800 hover:bg-slate-700" onClick={closeTxModal}>
                Close
              </Button>
            </div>
          )}
        </Card>
      </div>
    )}
    </>
  );
}
