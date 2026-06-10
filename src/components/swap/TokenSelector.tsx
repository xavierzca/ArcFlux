import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { ARC_TESTNET_TOKENS, TokenInfo } from '@/src/constants/tokens';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
}

export function TokenSelector({ isOpen, onClose, onSelect }: TokenSelectorProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredTokens = ARC_TESTNET_TOKENS.filter(t => 
    t.symbol.toLowerCase().includes(search.toLowerCase()) || 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.address.toLowerCase() === search.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md max-h-[80vh] flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Select a token</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or paste address" 
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredTokens.map(token => (
            <button
              key={token.address}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors"
            >
              <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full bg-slate-800 object-cover" />
              <div className="flex flex-col items-start">
                <span className="font-medium text-slate-200">{token.symbol}</span>
                <span className="text-xs text-slate-500">{token.name}</span>
              </div>
            </button>
          ))}
          {filteredTokens.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              No results found.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
