import { useAccount, useSwitchChain } from 'wagmi';
import { arcTestnet } from '../config/wagmi';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function NetworkBanner() {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  const isWrongChain = chain?.id !== arcTestnet.id;

  if (!isWrongChain) return null;

  return (
    <div className="w-full bg-red-500/10 border-b border-red-500/20 backdrop-blur-md sticky top-16 z-40 px-4 py-3">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-red-400 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span>You are connected to the wrong network. Please switch to Arc Testnet.</span>
        </div>
        <button
          onClick={() => switchChain?.({ chainId: arcTestnet.id })}
          disabled={isPending}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium px-4 py-1.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-red-500/20"
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <span>Switch to Arc Testnet</span>
          )}
        </button>
      </div>
    </div>
  );
}
