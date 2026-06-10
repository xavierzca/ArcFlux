import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { NetworkStatusBar } from '../NetworkStatusBar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--bg-color)] font-sans text-[var(--text-color)] transition-colors duration-300 selection:bg-blue-500/30">
      {/* Background animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[-1] select-none">
        {/* Orb 1: blue #0066FF, top-left area */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0066FF]/12 blur-[130px] animate-orb-1" />
        {/* Orb 2: purple #8B5CF6, bottom-right area */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#8B5CF6]/12 blur-[140px] animate-orb-2" />
        {/* Orb 3: cyan #00D4FF, center-right area */}
        <div className="absolute top-[25%] right-[-15%] w-[450px] h-[450px] rounded-full bg-[#00D4FF]/12 blur-[120px] animate-orb-3" />
      </div>
      <NetworkStatusBar />
      <Header />
      <main className="relative flex-1 container mx-auto px-4 py-8 sm:px-6 lg:px-8 z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}

