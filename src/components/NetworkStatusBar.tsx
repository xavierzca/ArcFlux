import { useAccount } from 'wagmi';
import { Zap } from 'lucide-react';

export function NetworkStatusBar() {
  const { isConnected } = useAccount();

  return (
    <div className="w-full h-8 bg-[#030303] border-b border-white/5 flex items-center px-4 text-[10px] sm:text-[11px] font-mono tracking-wide text-slate-400 select-none z-50 overflow-hidden relative">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left Side: status dot + network name */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
          )}
          <span className="font-bold text-slate-300">Arc Testnet</span>
        </div>

        {/* Right Side: Gas type + lightning */}
        <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-slate-300">
          <span>Gas: <span className="text-cyan-400 font-extrabold">USDC</span></span>
          <Zap className="w-3 h-3 text-yellow-400 fill-current animate-pulse" />
        </div>
      </div>
    </div>
  );
}
