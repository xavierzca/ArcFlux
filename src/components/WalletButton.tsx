import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { LogOut, Wallet, ChevronDown, ShieldAlert, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function WalletButton() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch true USDC Balance (native/paid gas token on Arc)
  const { formatted: usdcBalance } = useTokenBalance(
    '0x3600000000000000000000000000000000000000',
    6
  );

  // Fetch true EURC Balance
  const { formatted: eurcBalance } = useTokenBalance(
    '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    6
  );

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <div className="h-10 w-32 animate-pulse bg-white/5 rounded-xl border border-white/10" />
          );
        }

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              id="wallet-connect-btn"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-5 h-10 rounded-xl transition-all duration-300 active:scale-95 shadow-lg shadow-blue-500/15 hover:shadow-[0_0_20px_rgba(0,102,255,0.4)] border border-white/10 hover:border-blue-400/30 cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>Connect Wallet</span>
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 font-semibold px-4 h-10 rounded-xl hover:bg-red-500/25 transition-all duration-200"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Wrong Network</span>
            </button>
          );
        }

        return (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 px-4 py-1.5 bg-black/50 border border-white/10 hover:border-cyan-500/35 rounded-xl transition-all duration-300 shadow-lg cursor-pointer max-w-[210px] sm:max-w-none text-left"
            >
              {/* Green pulsing dot */}
              <div className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-sans">
                  Connected • Arc Testnet
                </span>
                <span className="text-[11px] font-bold text-[#00D4FF] font-mono truncate mt-0.5">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : account.displayName}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Address Display + Copy */}
                  <div className="px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl mb-3.5 flex items-center justify-between gap-3 font-mono">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Full Address</span>
                      <p className="text-xs text-slate-300 truncate font-semibold mt-0.5">{address}</p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-1 px-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer flex items-center gap-1 text-[10px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* USDC/EURC Balances */}
                  <div className="space-y-2 mb-3.5 px-1 select-none">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 font-semibold">USDC Balance:</span>
                      <span className="text-[#00D4FF] font-black">
                        {parseFloat(usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 font-semibold">EURC Balance:</span>
                      <span className="text-purple-400 font-black">
                        {parseFloat(eurcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} EURC
                      </span>
                    </div>
                  </div>

                  {/* Disconnect Button */}
                  <button
                    onClick={() => {
                      disconnect();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-black tracking-tight uppercase text-rose-400 rounded-xl hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/15 hover:border-rose-500/30 transition-all duration-300 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
