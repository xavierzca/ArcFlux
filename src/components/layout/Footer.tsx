import { Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-black/40 backdrop-blur-md px-4 py-8 mt-auto">
      <div className="container mx-auto flex flex-col items-center justify-center gap-3 text-center">
        <div className="flex flex-col items-center justify-center gap-1.5 mb-1 group cursor-pointer select-none transition-all duration-300 hover:scale-105">
          <svg
            viewBox="0 0 120 140"
            className="h-[35px] w-auto transition-all duration-300 filter drop-shadow-[0_0_5px_rgba(0,102,255,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(0,102,255,0.7)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="fluxGrad-footer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D4FF"/>
                <stop offset="100%" stopColor="#8B5CF6"/>
              </linearGradient>
              <filter id="glow-footer">
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
              fill="none" stroke="url(#fluxGrad-footer)" 
              strokeWidth="3" filter="url(#glow-footer)"/>
            
            {/* Inner parallel line */}
            <path d="M26,16 L72,16 L72,28 L38,28 L38,64 
                     L65,64 L65,76 L38,76 L38,104 L26,104 Z" 
              fill="none" stroke="url(#fluxGrad-footer)" 
              strokeWidth="1.2" opacity="0.5"/>

            {/* FLUX text */}
            <text x="60" y="132" 
              textAnchor="middle"
              fontFamily="Arial Black, sans-serif"
              fontWeight="900"
              fontSize="18"
              letterSpacing="6"
              fill="url(#fluxGrad-footer)"
              filter="url(#glow-footer)">FLUX</text>
          </svg>
          <span className="font-bold tracking-tight flex items-center select-none" style={{ fontSize: '18px' }}>
            <span className="text-white">Arc</span>
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00D4FF] bg-clip-text text-transparent font-extrabold">Flux</span>
          </span>
        </div>
        <p className="text-xs tracking-wider text-slate-550 font-bold font-mono">
          © {new Date().getFullYear()} ARCFLUX. ARC TESTNET DAPP.
        </p>
        <a 
          href="https://x.com/xavierzca5" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 group text-xs text-slate-400 font-medium hover:text-white transition-colors duration-300"
        >
          <img 
            src="https://pbs.twimg.com/profile_images/2062192281113993216/0sZVZ-GW_400x400.jpg" 
            alt="Xavier" 
            className="w-8 h-8 rounded-full border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)] object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <span>
            Built by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-bold group-hover:from-blue-300 group-hover:to-indigo-300 transition-all duration-300">Xavier</span>
          </span>
        </a>
        <div className="flex items-center justify-center gap-3 mt-1">
          <a 
            href="https://x.com/xavierzca5" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-slate-400 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <Twitter className="h-4.5 w-4.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}

