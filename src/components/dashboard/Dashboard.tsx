import { useAccount, useBalance } from 'wagmi';
import { Activity, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';

export function Dashboard() {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  const recentSwaps = [
    { id: 1, type: 'Swap', from: 'ETH', to: 'USDC', amount: '0.1', date: '2 mins ago', explorer: '#' },
    { id: 2, type: 'Swap', from: 'USDT', to: 'ETH', amount: '100', date: '1 hr ago', explorer: '#' },
    { id: 3, type: 'Approve', from: 'USDC', to: '', amount: 'Max', date: '1 day ago', explorer: '#' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Wallet Balance</h3>
          <div className="text-3xl font-bold text-white mb-2">
            {balance ? Number(balance.value) / (10 ** balance.decimals) : '0.0000'} <span className="text-lg text-slate-500">{balance?.symbol || 'ARC'}</span>
          </div>
          <div className="text-sm text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Securely connected
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Network Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Arc Testnet</span>
              <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Block Time</span>
              <span className="text-slate-200">~2s</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Gas Price</span>
              <span className="text-slate-200 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> ~0.1 Gwei</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Total Volume</h3>
          <div className="text-2xl font-bold text-white">
            $14,230.00
          </div>
          <p className="text-xs text-slate-500 mt-1">Global 24h volume on Arc Testnet</p>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="p-0 overflow-hidden h-full">
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-medium text-white">Recent Activity</h3>
            {!address && <span className="text-xs text-slate-500">Connect wallet to view</span>}
          </div>
          
          {address ? (
            <div className="divide-y divide-white/5">
              {recentSwaps.map(swap => (
                <div key={swap.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{swap.type} {swap.from} {swap.to && `for ${swap.to}`}</div>
                      <div className="text-xs text-slate-500">{swap.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">{swap.amount} {swap.from}</div>
                    <a href={swap.explorer} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end mt-1">
                      View <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <Activity className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-500">Connect your wallet to see your recent transactions across the Arc ecosystem.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
