export const ROUTER_ADDRESS = "0x0000000000000000000000000000000000000000"; // Placeholder Router

export type TokenInfo = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};

export const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// Placeholder token list for UI testing. In production, this would be fetched from a token list or subgraph on Arc Testnet.
export const ARC_TESTNET_TOKENS: TokenInfo[] = [
  {
    address: NATIVE_TOKEN_ADDRESS,
    symbol: "ARC",
    name: "Arc Token",
    decimals: 18,
    logoURI: "https://cryptologos.cc/logos/ethereum-eth-logo.png", // Or Arc logo
  },
  {
    address: "0x1111111111111111111111111111111111111111", // Placeholder USDC
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  },
  {
    address: "0x2222222222222222222222222222222222222222", // Placeholder USDT
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  },
];
