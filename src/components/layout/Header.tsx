import { useEffect, useState } from 'react';
import { WalletButton } from '../WalletButton';
import { Zap, Sun, Moon } from 'lucide-react';

export function Header() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 select-none group cursor-pointer transition-all duration-300 hover:scale-105">
          <svg
            viewBox="0 0 120 140"
            className="h-[45px] w-auto transition-all duration-300 filter drop-shadow-[0_0_6px_rgba(0,102,255,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(0,102,255,0.75)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="fluxGrad-header" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D4FF"/>
                <stop offset="100%" stopColor="#8B5CF6"/>
              </linearGradient>
              <filter id="glow-header">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Outer F shape - geometric double line style */}
            <path d="M20,10 L75,10 L75,22 L32,22 L32,58 
                     L68,58 L68,70 L32,70 L32,110 L20,110 Z" 
              fill="none" stroke="url(#fluxGrad-header)" 
              strokeWidth="3" filter="url(#glow-header)"/>
            
            {/* Inner parallel line */}
            <path d="M26,16 L72,16 L72,28 L38,28 L38,64 
                     L65,64 L65,76 L38,76 L38,104 L26,104 Z" 
              fill="none" stroke="url(#fluxGrad-header)" 
              strokeWidth="1.2" opacity="0.5"/>

            {/* FLUX text */}
            <text x="60" y="132" 
              textAnchor="middle"
              fontFamily="Arial Black, sans-serif"
              fontWeight="900"
              fontSize="18"
              letterSpacing="6"
              fill="url(#fluxGrad-header)"
              filter="url(#glow-header)">FLUX</text>
          </svg>
          <span className="font-bold tracking-tight flex items-center select-none" style={{ fontSize: '22px' }}>
            <span className="text-white">Arc</span>
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00D4FF] bg-clip-text text-transparent font-extrabold">Flux</span>
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Faucet Button */}
          <div className="relative group/faucet inline-block">
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-[#00D4FF]/40 hover:border-[#00D4FF] text-[#00D4FF] hover:text-white font-extrabold text-xs px-3 py-2 rounded-xl transition-all duration-300 hover:shadow-[0_0_12px_rgba(0,212,255,0.4)] cursor-pointer select-none active:scale-95 bg-black/20"
            >
              <span className="text-xs">💧</span>
              <span className="hidden sm:inline">Get Test Tokens</span>
              <span className="sm:hidden">Faucet</span>
            </a>
            <div className="absolute top-full mt-2 right-0 bg-slate-950 border border-[#00D4FF]/35 text-[#00D4FF] text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/faucet:opacity-100 transition-opacity duration-200 pointer-events-none shadow-[0_0_12px_rgba(0,212,255,0.25)] z-[100] font-mono font-bold">
              Get free USDC & EURC for testing
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-300 cursor-pointer active:scale-95 select-none"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-yellow-500 animate-in spin-in-12 duration-300" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-indigo-400 animate-in spin-in-6 duration-300" />
            )}
          </button>

          <WalletButton />
        </div>
      </div>
    </header>
  );
}

