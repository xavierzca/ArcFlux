import { TOKENS, TokenInfo } from '../config/tokens';
import { X, Search } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { useState } from 'react';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  selectedTokenAddress?: string;
}

export function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  selectedTokenAddress,
}: TokenSelectorProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Filter tokens based on search string
  const filteredTokens = TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <Card className="relative w-full max-w-md max-h-[85vh] flex flex-col p-6 overflow-hidden border border-white/10 bg-slate-950/90 shadow-2xl z-10 rounded-3xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Select a Token</h2>
          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or symbol"
            className="pl-10 h-11 bg-white/5 border-white/5 placeholder:text-slate-500 rounded-2xl"
          />
        </div>

        {/* Tokens List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredTokens.map((token) => {
            const isSelected = selectedTokenAddress === token.address;
            const isSoon = token.isComingSoon;

            return (
              <button
                key={token.symbol}
                disabled={isSoon}
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                  isSoon
                    ? 'opacity-40 cursor-not-allowed border-transparent bg-transparent'
                    : isSelected
                    ? 'bg-blue-600/10 border-blue-500 text-white'
                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/5 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-9 h-9 rounded-full bg-slate-900 object-contain p-0.5 border border-white/10"
                    onError={(e) => {
                      // Fallback image icon
                      (e.target as HTMLImageElement).src =
                        'https://assets.coingecko.com/coins/images/6319/small/usdc.png';
                    }}
                  />
                  <div className="text-left">
                    <p className="font-bold text-base leading-none mb-1 flex items-center gap-1.5">
                      {token.symbol}
                      {isSoon && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-semibold font-mono">
                          Soon
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {token.name}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredTokens.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-500 font-medium">No tokens found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
