import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ARCFLUX_ADDRESS, ARCFLUX_ABI } from '../config/contracts';
import { Card } from './ui/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface PricePoint {
  timestamp: number;
  rate: number;
}

export function PriceChart() {
  const { isConnected } = useAccount();
  const [activePeriod, setActivePeriod] = useState<'1H' | '24H' | '7D'>('24H');
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [currentRate, setCurrentRate] = useState<number>(1.00);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('light') ? 'light' : 'dark';
    }
    return 'dark';
  });

  // Fetch Pool Reserves to compute rate
  const { data: poolInfo, refetch, isPending } = useReadContract({
    address: ARCFLUX_ADDRESS as `0x${string}`,
    abi: ARCFLUX_ABI,
    functionName: 'getPoolInfo',
    query: {
      refetchInterval: 12000,
    }
  });

  // Calculate live rate from pool reserves
  useEffect(() => {
    if (poolInfo) {
      const reserveUSDC = poolInfo[0];
      const reserveEURC = poolInfo[1];
      if (reserveUSDC > 0n && reserveEURC > 0n) {
        // USDC decimals: 6, EURC decimals: 6
        // rate = reserveEURC / reserveUSDC
        const rate = Number(reserveEURC) / Number(reserveUSDC);
        setCurrentRate(rate);

        // Add to history
        recordRateInHistory(rate);
      } else {
        setCurrentRate(1.00);
      }
    }
  }, [poolInfo]);

  // Handle recorded rate in history
  const recordRateInHistory = (rate: number) => {
    const raw = localStorage.getItem('arcflux_price_history');
    let rates: PricePoint[] = [];
    if (raw) {
      try {
        rates = JSON.parse(raw);
      } catch (e) {
        rates = [];
      }
    }

    // Check if the last recorded rate was within the last 30 seconds
    const now = Date.now();
    const lastPoint = rates[rates.length - 1];
    if (lastPoint && now - lastPoint.timestamp < 30000 && Math.abs(lastPoint.rate - rate) < 0.0001) {
      // Don't record redundant points within 30s unless rate changed significantly
      return;
    }

    const newPoint: PricePoint = {
      timestamp: now,
      rate: parseFloat(rate.toFixed(5)),
    };

    const updated = [...rates, newPoint];
    
    // Sort and limit history size (max 500 records to prevent localstoragebloat)
    const sorted = updated.sort((a, b) => a.timestamp - b.timestamp).slice(-500);
    localStorage.setItem('arcflux_price_history', JSON.stringify(sorted));
    setHistory(sorted);
  };

  // Load history from localStorage or generate defaults
  const loadHistory = () => {
    const raw = localStorage.getItem('arcflux_price_history');
    let rates: PricePoint[] = [];
    if (raw) {
      try {
        rates = JSON.parse(raw);
      } catch (e) {
        rates = [];
      }
    }

    if (rates.length === 0) {
      // If no history exists, we create a beautiful flat line of 1.00 backfilled
      // for the past 7 days to fulfill: "If no history: show flat line at 1.00"
      const now = Date.now();
      const defaultRates: PricePoint[] = [];
      for (let i = 24; i >= 0; i--) {
        defaultRates.push({
          timestamp: now - i * 60 * 60 * 1000,
          rate: 1.00,
        });
      }
      localStorage.setItem('arcflux_price_history', JSON.stringify(defaultRates));
      setHistory(defaultRates);
    } else {
      setHistory(rates);
    }
  };

  useEffect(() => {
    loadHistory();

    // Set up real-time sync with localStorage
    const syncInterval = setInterval(() => {
      loadHistory();
    }, 5000);

    const handleThemeChange = () => {
      setThemeMode(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    };
    window.addEventListener('themeChanged', handleThemeChange);
    const themeInterval = setInterval(handleThemeChange, 1000);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('themeChanged', handleThemeChange);
      clearInterval(themeInterval);
    };
  }, []);

  // Filter history based on activePeriod
  const getFilteredData = () => {
    if (history.length === 0) return [];
    const now = Date.now();
    let periodMs = 24 * 60 * 60 * 1000; // 24H default

    if (activePeriod === '1H') {
      periodMs = 1 * 60 * 60 * 1000;
    } else if (activePeriod === '7D') {
      periodMs = 7 * 24 * 60 * 60 * 1000;
    }

    const filtered = history.filter((p) => now - p.timestamp <= periodMs);

    // If filtered data has fewer than 2 points, backfill with flat lines at currentRate
    if (filtered.length < 2) {
      const result: PricePoint[] = [];
      const steps = activePeriod === '1H' ? 6 : activePeriod === '24H' ? 12 : 7;
      const stepSize = periodMs / steps;
      for (let i = steps; i >= 0; i--) {
        result.push({
          timestamp: now - i * stepSize,
          rate: currentRate,
        });
      }
      return result;
    }

    return filtered;
  };

  const chartData = getFilteredData();

  // Highlight rate metrics
  const minRate = chartData.length > 0 ? Math.min(...chartData.map(d => d.rate)) : 1.00;
  const maxRate = chartData.length > 0 ? Math.max(...chartData.map(d => d.rate)) : 1.00;
  const changeRate = chartData.length > 1 
    ? ((chartData[chartData.length - 1].rate - chartData[0].rate) / chartData[0].rate) * 100 
    : 0.00;

  // XAxis tick formatter
  const formatXAxis = (tickItem: number) => {
    const d = new Date(tickItem);
    if (activePeriod === '1H') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (activePeriod === '24H') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as PricePoint;
      const isLight = themeMode === 'light';
      return (
        <div className={`px-3 py-2 rounded-xl text-[10px] font-mono shadow-md ${
          isLight 
            ? 'bg-white border border-[#E0E7FF] text-[#1A1A2E]' 
            : 'bg-slate-950/95 border border-[#00D4FF]/20 text-white shadow-[0_0_15px_rgba(0,212,255,0.15)]'
        }`}>
          <p className={`${isLight ? 'text-slate-500' : 'text-slate-400'} mb-0.5`}>
            {new Date(dataPoint.timestamp).toLocaleString()}
          </p>
          <p className="font-extrabold flex justify-between gap-4">
            <span>Rate:</span>
            <span className={isLight ? 'text-[#0066FF]' : 'text-[#00D4FF]'}>
              {dataPoint.rate.toFixed(4)} EURC/USDC
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-md mx-auto relative overflow-hidden bg-black/80 border border-white/5 shadow-2xl p-5 rounded-3xl backdrop-blur-3xl select-none animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">USDC / EURC Rate</h3>
        </div>
        
        {/* Period Selector Tabs */}
        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 text-[10px] font-mono">
          {(['1H', '24H', '7D'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-2 py-1 rounded-md font-bold transition-all duration-200 cursor-pointer ${
                activePeriod === period
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Prominent current rate Display */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black font-mono ${themeMode === 'light' ? 'text-[#1A1A2E]' : 'text-white'}`}>
              {currentRate.toFixed(4)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${themeMode === 'light' ? 'text-[#1A1A2E]' : 'text-slate-500'}`}>
              EURC/USDC
            </span>
          </div>
          <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
            changeRate >= 0 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-rose-500/10 text-rose-400'
          }`}>
            <span>{changeRate >= 0 ? '+' : ''}{changeRate.toFixed(2)}%</span>
          </div>
        </div>
        <p className={`text-[9px] mt-0.5 font-sans ${themeMode === 'light' ? 'text-[#4A5568]' : 'text-slate-500'}`}>
          Computed in real-time from automated market maker reserves.
        </p>
      </div>

      {/* Recharts Area */}
      <div className="h-44 w-full relative -mx-1.5 opacity-95 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke={themeMode === 'light' ? '#E2E8F0' : '#475569'}
              tick={{ fontSize: 8, fontFamily: 'monospace', fill: themeMode === 'light' ? '#2D3748' : '#cbd5e1' }}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis
              domain={[Math.max(0.5, minRate - 0.05), maxRate + 0.05]}
              stroke={themeMode === 'light' ? '#E2E8F0' : '#475569'}
              tick={{ fontSize: 8, fontFamily: 'monospace', fill: themeMode === 'light' ? '#2D3748' : '#cbd5e1' }}
              tickLine={false}
              axisLine={false}
              dx={-8}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: themeMode === 'light' ? '#0066FF' : '#00D4FF', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={themeMode === 'light' ? '#0066FF' : '#00D4FF'}
              strokeWidth={2}
              dot={{ r: 0 }}
              activeDot={{ r: 4, strokeWidth: 0, fill: themeMode === 'light' ? '#0066FF' : '#00D4FF' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Reload action stats footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[9px] font-mono text-slate-500">
        <span>Min: {minRate.toFixed(4)} | Max: {maxRate.toFixed(4)}</span>
        <button 
          onClick={() => refetch()} 
          className="flex items-center gap-1 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Sync Pool</span>
        </button>
      </div>
    </Card>
  );
}
