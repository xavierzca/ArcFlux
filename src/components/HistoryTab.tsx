import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { ExternalLink, ArrowUpRight, ArrowRight } from 'lucide-react';

interface SwapHistoryItem {
  id: string;
  type: 'Swap' | 'Approve';
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
  timestamp: number;
  hash: string;
}

interface HistoryTabProps {
  onNavigateToSwap: () => void;
}

export function HistoryTab({ onNavigateToSwap }: HistoryTabProps) {
  const [history, setHistory] = useState<SwapHistoryItem[]>([]);

  const loadHistory = () => {
    const stored = localStorage.getItem('arcflux_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SwapHistoryItem[];
        // Filter swaps, slice to last 20
        const swapsOnly = parsed
          .filter(item => item.type === 'Swap')
          .slice(0, 20);
        setHistory(swapsOnly);
      } catch (e) {
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
    // Watch for potential additions/changes
    const interval = setInterval(loadHistory, 1500);
    return () => clearInterval(interval);
  }, []);

  const formatTxHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between select-none">
        <div>
          <h2 className="text-2xl font-black text-white">Transaction History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Displaying your last 20 swap record routes on Arc Testnet
          </p>
        </div>
      </div>

      <Card className="bg-black/85 border border-white/5 shadow-2xl p-6 rounded-3xl backdrop-blur-3xl relative overflow-hidden">
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-medium whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-xs uppercase font-mono tracking-wider font-extrabold select-none">
                  <th className="pb-3 text-slate-400">Date & Time</th>
                  <th className="pb-3 text-slate-400">Pair Route</th>
                  <th className="pb-3 text-slate-400">Paid Amount</th>
                  <th className="pb-3 text-slate-400">Received Amount</th>
                  <th className="pb-3 text-slate-400 text-right">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {history.map((tx) => (
                  <tr key={tx.id || tx.hash} className="hover:bg-white/[0.02] transition-colors duration-200 group">
                    <td className="py-3 text-slate-400 text-xs text-left">
                      {formatDate(tx.timestamp)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs select-none">
                        <span>{tx.fromSymbol}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span>{tx.toSymbol}</span>
                      </div>
                    </td>
                    <td className="py-3 text-[#00D4FF] font-black text-xs">
                      {parseFloat(tx.fromAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {tx.fromSymbol}
                    </td>
                    <td className="py-3 text-emerald-400 font-black text-xs">
                      {parseFloat(tx.toAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {tx.toSymbol}
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold text-xs bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg hover:border-blue-500/30 transition-all duration-300"
                      >
                        <span className="font-mono">{formatTxHash(tx.hash)}</span>
                        <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center select-none flex flex-col items-center justify-center space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 animate-pulse">
              <span className="text-2xl">⏳</span>
            </div>
            
            <div className="space-y-1.5 max-w-md">
              <p className="text-slate-350 text-base font-black tracking-tight">
                No swaps yet — make your first swap!
              </p>
              <p className="text-xs text-slate-500">
                Execute automatic exchanges instantly on Arc Testnet to write permanent transactions.
              </p>
            </div>

            {/* Pulsing Arrow directing them to swap box */}
            <button
              onClick={onNavigateToSwap}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:scale-103 active:scale-97 text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] cursor-pointer group"
            >
              <span>Go swap tokens</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
