import { useAccount, useReadContract } from 'wagmi';
import { ARCFLUX_ADDRESS, ARCFLUX_ABI } from '../config/contracts';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { ExternalLink, Landmark, ShieldCheck, Coins, RefreshCw, History } from 'lucide-react';

const client = createPublicClient({
  chain: {
    id: 5042002,
    name: 'Arc Testnet',
    network: 'arc-testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
    rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] }}
  },
  transport: http('https://rpc.testnet.arc.network')
});

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  if (diffMs < 60000) {
    return 'Just now';
  }
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

interface LiquidityEventItem {
  id: string;
  timestamp: number;
  timeAgo: string;
  user: string;
  action: 'Added' | 'Removed';
  usdcAmount: string;
  eurcAmount: string;
  lpTokens: string;
  hash: string;
  blockNumber: bigint;
  rawUsdcAmount: bigint;
  rawEurcAmount: bigint;
}

// Global cache for block timestamps to prevent multiple RPC hits for duplicate blocks
const blockTimeCache: Record<string, number> = {};

export function Dashboard() {
  const { isConnected } = useAccount();

  // 1. Fetch user Custom Token Balances
  const { formatted: usdcBalance, refetch: refetchUSDC } = useTokenBalance(
    '0x3600000000000000000000000000000000000000',
    6
  );
  const { formatted: eurcBalance, refetch: refetchEURC } = useTokenBalance(
    '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    6
  );

  // 2. Fetch Pool Reserves from Contract
  const { data: poolInfo, error: poolError, refetch: refetchPool } = useReadContract({
    address: ARCFLUX_ADDRESS as `0x${string}`,
    abi: ARCFLUX_ABI,
    functionName: 'getPoolInfo',
    query: {
      enabled: isConnected,
      refetchInterval: 12000,
    }
  });

  // State for live Liquidity Activity
  const [liquidityEvents, setLiquidityEvents] = useState<LiquidityEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch contract events
  const fetchLiquidityEvents = async (silent = false) => {
    if (!silent) {
      setIsLoadingEvents(true);
    }
    setEventError(null);
    setIsRefreshing(true);
    try {
      const currentBlock = await client.getBlockNumber();
      let fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;

      let addedLogs: any[] = [];
      let removedLogs: any[] = [];

      try {
        addedLogs = await client.getLogs({
          address: '0xa7dBD4375Fb339b47525e63301E89dCcb30392f8',
          event: parseAbiItem(
            'event LiquidityAdded(address indexed user, uint256 usdcAmt, uint256 eurcAmt, uint256 lp)'
          ),
          fromBlock: fromBlock,
          toBlock: currentBlock
        });
      } catch (err) {
        console.warn('Error fetching LiquidityAdded logs for the last 1000 blocks:', err);
      }

      try {
        removedLogs = await client.getLogs({
          address: '0xa7dBD4375Fb339b47525e63301E89dCcb30392f8',
          event: parseAbiItem(
            'event LiquidityRemoved(address indexed user, uint256 usdcAmt, uint256 eurcAmt, uint256 lp)'
          ),
          fromBlock: fromBlock,
          toBlock: currentBlock
        });
      } catch (err) {
        console.warn('Error fetching LiquidityRemoved logs for the last 1000 blocks:', err);
      }

      // If no events in last 1000 blocks, try a larger range up to the RPC's 10,000 block range limit (e.g. 9900 blocks)
      if (addedLogs.length === 0 && removedLogs.length === 0) {
        fromBlock = currentBlock > 9900n ? currentBlock - 9900n : 0n;
        try {
          addedLogs = await client.getLogs({
            address: '0xa7dBD4375Fb339b47525e63301E89dCcb30392f8',
            event: parseAbiItem(
              'event LiquidityAdded(address indexed user, uint256 usdcAmt, uint256 eurcAmt, uint256 lp)'
            ),
            fromBlock: fromBlock,
            toBlock: currentBlock
          });
        } catch (err) {
          console.error('Error fetching LiquidityAdded logs with maximum safe range:', err);
        }

        try {
          removedLogs = await client.getLogs({
            address: '0xa7dBD4375Fb339b47525e63301E89dCcb30392f8',
            event: parseAbiItem(
              'event LiquidityRemoved(address indexed user, uint256 usdcAmt, uint256 eurcAmt, uint256 lp)'
            ),
            fromBlock: fromBlock,
            toBlock: currentBlock
          });
        } catch (err) {
          console.error('Error fetching LiquidityRemoved logs with maximum safe range:', err);
        }
      }

      // Map Added events
      const mappedAdded = addedLogs.map((log: any) => ({
        id: `${log.blockNumber}-${log.transactionHash}-${log.logIndex}`,
        blockNumber: log.blockNumber,
        hash: log.transactionHash,
        action: 'Added' as const,
        user: log.args.user || log.args[0] || '0x0000000000000000000000000000000000000000',
        usdcAmount: log.args.usdcAmt ? formatUnits(log.args.usdcAmt, 6) : '0.00',
        eurcAmount: log.args.eurcAmt ? formatUnits(log.args.eurcAmt, 6) : '0.00',
        lpTokens: log.args.lp ? formatUnits(log.args.lp, 6) : '0.00',
        rawUsdcAmount: log.args.usdcAmt || 0n,
        rawEurcAmount: log.args.eurcAmt || 0n,
      }));

      // Map Removed events
      const mappedRemoved = removedLogs.map((log: any) => ({
        id: `${log.blockNumber}-${log.transactionHash}-${log.logIndex}`,
        blockNumber: log.blockNumber,
        hash: log.transactionHash,
        action: 'Removed' as const,
        user: log.args.user || log.args[0] || '0x0000000000000000000000000000000000000000',
        usdcAmount: log.args.usdcAmt ? formatUnits(log.args.usdcAmt, 6) : '0.00',
        eurcAmount: log.args.eurcAmt ? formatUnits(log.args.eurcAmt, 6) : '0.00',
        lpTokens: log.args.lp ? formatUnits(log.args.lp, 6) : '0.00',
        rawUsdcAmount: log.args.usdcAmt || 0n,
        rawEurcAmount: log.args.eurcAmt || 0n,
      }));

      // Combined and sorted by blockNumber descending
      const combined = [...mappedAdded, ...mappedRemoved]
        .sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : b.blockNumber < a.blockNumber ? -1 : 0));

      const itemsWithTime = combined.map(item => ({
        ...item,
        timestamp: Date.now() - Number(currentBlock - item.blockNumber) * 2000,
        timeAgo: item.blockNumber.toString() // Time: show block number
      }));

      setLiquidityEvents(itemsWithTime);
      setEventError(null);
    } catch (err) {
      console.error('Error fetching liquidity events:', err);
      setEventError('Unable to load — click refresh to try again');
    } finally {
      setIsLoadingEvents(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiquidityEvents();

    // Refresh every 30 seconds
    const interval = setInterval(() => fetchLiquidityEvents(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshAll = () => {
    refetchUSDC();
    refetchEURC();
    refetchPool();
    fetchLiquidityEvents(false);
  };

  // Safe variables parsing for UI
  const formatReserve = (val?: bigint, decs: number = 6) => {
    if (val === undefined) return '0.00';
    return Number(formatUnits(val, decs)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const poolUSDC = poolInfo ? poolInfo[0] : undefined;
  const poolEURC = poolInfo ? poolInfo[1] : undefined;
  const poolLP = poolInfo ? poolInfo[2] : undefined;
  const poolFee = poolInfo ? poolInfo[3] : undefined;

  // Calculate liquidity added in the last 24 hours
  const now = Date.now();
  const past24h = now - 24 * 60 * 60 * 1000;

  let totalUsdcAdded24h = 0n;
  let totalEurcAdded24h = 0n;

  liquidityEvents.forEach(item => {
    if (item.action === 'Added' && item.timestamp >= past24h) {
      totalUsdcAdded24h += item.rawUsdcAmount;
      totalEurcAdded24h += item.rawEurcAmount;
    }
  });

  const formattedUsdcAdded = parseFloat(formatUnits(totalUsdcAdded24h, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedEurcAdded = parseFloat(formatUnits(totalEurcAdded24h, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Wallet Balances Card */}
        <Card className="flex flex-col justify-between p-6 bg-white/5 border-white/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono">My Wallet</span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#2775CA]" />
                  <span className="text-sm font-semibold text-slate-200">USDC</span>
                </div>
                <span className="font-semibold font-mono text-white text-base">
                  {Number(usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#1A9AFF]" />
                  <span className="text-sm font-semibold text-slate-200">EURC</span>
                </div>
                <span className="font-semibold font-mono text-white text-base">
                  {Number(eurcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-5 flex justify-center">
            {/* Faucet Button */}
            <div className="relative group/faucet inline-block w-full">
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-[#00D4FF]/45 hover:border-[#00D4FF] text-[#00D4FF] hover:text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,212,255,0.45)] cursor-pointer select-none active:scale-95 text-center bg-[#00D4FF]/5"
              >
                <span className="text-sm">💧</span>
                <span>Get Test Tokens</span>
              </a>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-[#00D4FF]/35 text-[#00D4FF] text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/faucet:opacity-100 transition-opacity duration-200 pointer-events-none shadow-[0_0_12px_rgba(0,212,255,0.25)] z-50 font-mono font-bold">
                Get free USDC & EURC for testing
              </div>
            </div>
          </div>
        </Card>

        {/* Pool Reserves Card */}
        <Card className="flex flex-col justify-between p-6 bg-white/5 border-white/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono">Liquidity Pool</span>
              <Landmark className="w-4 h-4 text-violet-400" />
            </div>

            {poolError ? (
              <div className="mt-4 p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-xs text-red-400 leading-snug">
                Pool contract lookup returned error. Pool info will fetch automatically once Liquidity is initially seeded on-chain.
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">Reserve USDC</span>
                  <span className="font-semibold font-mono text-white text-base">{formatReserve(poolUSDC)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">Reserve EURC</span>
                  <span className="font-semibold font-mono text-white text-base">{formatReserve(poolEURC)}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleRefreshAll}
            className="mt-5 text-left inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Force Reload Pool Info</span>
          </button>
        </Card>

        {/* Contract & System Status Card */}
        <Card className="flex flex-col justify-between p-6 bg-white/5 border-white/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono">Arc Network</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-4 mt-4 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Network ID</span>
                <span className="font-mono text-white font-bold bg-white/5 px-2 py-0.5 rounded-md text-xs">5042002</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Gas Paid In</span>
                <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md text-xs">USDC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Slippage Limit</span>
                <span className="font-mono text-slate-200">0.50% default</span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/5 pt-4 text-xs text-slate-500 font-mono flex items-center justify-between truncate">
            <span>AMM Router:</span>
            <span className="truncate ml-1.5 font-bold hover:text-slate-300" title={ARCFLUX_ADDRESS}>{ARCFLUX_ADDRESS.slice(0, 8)}...{ARCFLUX_ADDRESS.slice(-6)}</span>
          </div>
        </Card>

      </div>

      {/* Liquidity Activity Card */}
      <Card className="p-6 bg-white/5 border-white/10 relative overflow-hidden">
        {/* Header and 24h Totals */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/5 select-none">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Liquidity Activity</h3>
            <button
              onClick={() => fetchLiquidityEvents(false)}
              disabled={isLoadingEvents || isRefreshing}
              className="ml-2 p-1.5 rounded-lg border border-white/10 hover:border-blue-500/50 bg-white/5 hover:bg-blue-500/10 text-slate-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              title="Refresh Activity"
            >
              <RefreshCw className={`w-4 h-4 ${(isLoadingEvents || isRefreshing) ? 'animate-spin text-blue-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
          
          <div className="bg-emerald-500/5 border border-emerald-500/10 px-4 py-2 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] font-mono">
              Total Added (Last 24h):
            </span>
            <div className="flex items-center gap-1.5 font-mono font-black text-emerald-400">
              <span>{formattedUsdcAdded} USDC</span>
              <span className="text-slate-600 font-light">•</span>
              <span>{formattedEurcAdded} EURC</span>
            </div>
          </div>
        </div>

        {eventError ? (
          <div className="py-14 text-center select-none flex flex-col items-center justify-center space-y-4">
            <span className="text-3xl text-red-500 font-bold">⚠</span>
            <p className="text-sm font-semibold text-red-400">{eventError}</p>
            <button
              onClick={() => fetchLiquidityEvents(false)}
              className="px-4 py-2 text-xs font-bold border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer animate-pulse"
            >
              Click refresh to try again
            </button>
          </div>
        ) : isLoadingEvents ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 select-none">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400 font-semibold">Streaming real-time events from Arc network...</p>
          </div>
        ) : liquidityEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-medium whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs uppercase font-mono tracking-wider font-extrabold select-none">
                  <th className="pb-3 pt-1">Time</th>
                  <th className="pb-3 pt-1">Wallet Address</th>
                  <th className="pb-3 pt-1">Action</th>
                  <th className="pb-3 pt-1">USDC Amount</th>
                  <th className="pb-3 pt-1">EURC Amount</th>
                  <th className="pb-3 pt-1">LP Tokens</th>
                  <th className="pb-3 pt-1 text-right">TX Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {liquidityEvents.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.015] transition-colors group animate-in fade-in duration-300">
                    <td className="py-3 text-slate-400 text-xs text-left">
                      {tx.timeAgo}
                    </td>
                    <td className="py-3">
                      <a
                        href={`https://testnet.arcscan.app/address/${tx.user}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-200 hover:text-[#00D4FF] font-bold text-xs"
                      >
                        {tx.user.slice(0, 6)}...{tx.user.slice(-4)}
                      </a>
                    </td>
                    <td className="py-3">
                      {tx.action === 'Added' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                          Added
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/15">
                          Removed
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[#00D4FF] font-bold text-xs">
                      {parseFloat(tx.usdcAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDC
                    </td>
                    <td className="py-3 text-purple-400 font-bold text-xs">
                      {parseFloat(tx.eurcAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} EURC
                    </td>
                    <td className="py-3 text-slate-350 font-bold text-xs">
                      {parseFloat(tx.lpTokens).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} LP
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold text-xs bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg hover:border-blue-500/30 transition-all duration-300"
                      >
                        <span className="font-mono">{tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center select-none flex flex-col items-center justify-center space-y-4">
            <span className="text-3xl text-slate-500">🌊</span>
            <p className="text-sm text-slate-400 font-semibold">No liquidity activity found. Add liquidity to see activity here.</p>
          </div>
        )}
      </Card>

    </div>
  );
}
