// Configuration based on provided screenshots
// Note: Borrow APRs in the screenshots that are negative (e.g. -31.2%) imply rewards.
// In the calculator, a negative Borrow APY will correctly increase Net APY.

export interface MarketPreset {
  name: string;
  collateral: string;
  debt: string;
  supplyApy: number;
  borrowApy: number;
  liquidationLtv: number;
  coingeckoIds: {
    collateral: string;
    debt: string;
  };
}

// RESTRICTED TO SOFT-PEGGED PAIRS FOR MULTIPLY
export const MARKET_PRESETS: Record<string, MarketPreset> = {
  'haSUI/SUI': {
    name: 'Loop haSUI',
    collateral: 'haSUI',
    debt: 'SUI',
    supplyApy: 45.2,
    borrowApy: 1.0,
    liquidationLtv: 90, // Soft pegs usually allow higher LTV
    coingeckoIds: { collateral: 'ha-sui', debt: 'sui' }
  },
  'stSUI/SUI': {
    name: 'Loop stSUI',
    collateral: 'stSUI',
    debt: 'SUI',
    supplyApy: 17.3,
    borrowApy: 1.0, 
    liquidationLtv: 85, 
    coingeckoIds: { collateral: 'staking-sui', debt: 'sui' }
  },
  // Volatile pairs removed for Multiply Calculator per request
};

export interface TokenDef {
  symbol: string;
  name: string;
  id: string;
  logoUrl: string;
}

export const SUPPORTED_TOKENS: TokenDef[] = [
  { 
    symbol: 'SUI', 
    name: 'Sui', 
    id: 'sui',
    logoUrl: 'https://icons.llamao.fi/icon/sui'
  },
  { 
    symbol: 'stSUI', 
    name: 'Staked SUI', 
    id: 'staking-sui',
    logoUrl: 'https://icons.llamao.fi/icon/stSUI' 
  },
  { 
    symbol: 'haSUI', 
    name: 'Haedal SUI', 
    id: 'ha-sui',
    logoUrl: 'https://icons.llamao.fi/icon/haSUI'
  },
  { 
    symbol: 'DEEP', 
    name: 'DeepBook', 
    id: 'deepbook',
    logoUrl: 'https://icons.llamao.fi/icon/DEEP'
  },
  { 
    symbol: 'WAL', 
    name: 'Walrus', 
    id: 'walrus',
    logoUrl: 'https://icons.llamao.fi/icon/WAL'
  },
  { 
    symbol: 'wBTC', 
    name: 'Wrapped Bitcoin', 
    id: 'wrapped-bitcoin',
    logoUrl: 'https://icons.llamao.fi/icon/wBTC'
  },
  { 
    symbol: 'USDC', 
    name: 'USDC', 
    id: 'usd-coin',
    logoUrl: 'https://icons.llamao.fi/icon/USDC'
  },
];

// Fallback prices in case API fails (Rate limits, CORS, etc.)
export const FALLBACK_PRICES: Record<string, number> = {
  'sui': 3.35,
  'staking-sui': 3.42,
  'ha-sui': 3.45,
  'deepbook': 0.06,
  'walrus': 0.15, 
  'wrapped-bitcoin': 96500,
  'usd-coin': 1.00
};

export const fetchLivePriceRatio = async (collateralId: string, debtId: string): Promise<number | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${collateralId},${debtId}&vs_currencies=usd`,
      { 
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    const colPrice = data[collateralId]?.usd;
    const debtPrice = data[debtId]?.usd;

    if (colPrice && debtPrice) {
      return colPrice / debtPrice;
    }
    throw new Error('Missing price data in response');
  } catch (error) {
    // Silently use fallback without console warning to avoid clutter
    const colPrice = FALLBACK_PRICES[collateralId];
    const debtPrice = FALLBACK_PRICES[debtId];
    
    if (colPrice && debtPrice) {
      return colPrice / debtPrice;
    }
    
    return null;
  }
};