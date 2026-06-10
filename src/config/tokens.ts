export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  color: string;
  isComingSoon?: boolean;
}

export const TOKENS: TokenInfo[] = [
  {
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    color: '#2775CA',
  },
  {
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    decimals: 6,
    symbol: 'EURC',
    name: 'Euro Coin',
    logoURI: 'https://assets.coingecko.com/coins/images/26045/small/euro-coin.png',
    color: '#1A9AFF',
  },
  {
    address: '0x0000000000000000000000000000000000000000', // Placeholder or arbitrary coming soon address
    decimals: 8,
    symbol: 'cirBTC',
    name: 'Circle Wrapped Bitcoin',
    logoURI: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    color: '#F7931A',
    isComingSoon: true,
  },
];
