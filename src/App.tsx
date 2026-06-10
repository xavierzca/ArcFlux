/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { SwapCard } from './components/SwapCard';
import { LiquidityCard } from './components/LiquidityCard';
import { Dashboard } from './components/Dashboard';
import { NetworkBanner } from './components/NetworkBanner';
import { HistoryTab } from './components/HistoryTab';
import { PriceChart } from './components/PriceChart';

export default function App() {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'dashboard' | 'history'>('swap');

  return (
    <>
      <NetworkBanner />
      <Layout>
        <div className="flex flex-col items-center justify-center pt-8 pb-12 w-full max-w-4xl mx-auto">
          
          {/* Main Display Slogans */}
          <div className="text-center mb-10 max-w-3xl px-4 select-none">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 leading-snug">
              {"⚡ Experience Ultra-Fast | Instant Swaps | Native USDC Settlement".split(" ").map((word, i) => (
                <span
                  key={i}
                  className="inline-block animate-word-fade opacity-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent"
                  style={{ 
                    animationDelay: `${i * 120}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>
            {/* Glowing underline animation */}
            <div className="mx-auto mt-5 h-[3px] w-32 bg-gradient-to-r from-[#0066FF] via-[#8B5CF6] to-[#00D4FF] rounded-full shadow-[0_0_15px_rgba(0,212,255,0.7)] animate-pulse" />
          </div>

          {/* Glassmorphic Interaction Tabs */}
          <div className="flex bg-white/5 backdrop-blur-2xl border border-white/5 p-1 rounded-2xl mb-8 relative z-10 shadow-lg flex-wrap justify-center gap-1 sm:gap-0">
            <button
              onClick={() => setActiveTab('swap')}
              className={`px-4 sm:px-7 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 relative overflow-hidden cursor-pointer ${
                activeTab === 'swap'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-500/20 shimmer-btn-shine'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Swap Tokens
            </button>
            <button
              onClick={() => setActiveTab('liquidity')}
              className={`px-4 sm:px-7 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 relative overflow-hidden cursor-pointer ${
                activeTab === 'liquidity'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-500/20 shimmer-btn-shine'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Liquidity Provision
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 sm:px-7 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 relative overflow-hidden cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-500/20 shimmer-btn-shine'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pool Analytics
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 sm:px-7 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 relative overflow-hidden cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-500/20 shimmer-btn-shine'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Swap History
            </button>
          </div>

          {/* Interactive View Section */}
          <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-300">
            {activeTab === 'swap' && (
              <div className="w-full space-y-6">
                <SwapCard />
                <PriceChart />
              </div>
            )}
            {activeTab === 'liquidity' && <LiquidityCard />}
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'history' && <HistoryTab onNavigateToSwap={() => setActiveTab('swap')} />}
          </div>

        </div>
      </Layout>
    </>
  );
}
