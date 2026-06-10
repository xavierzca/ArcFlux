import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { type Chain } from 'wagmi/chains';

export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: 'ArcFlux',
  projectId: '00000000000000000000000000000000', // Pre-configured projectId fallback
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
});
