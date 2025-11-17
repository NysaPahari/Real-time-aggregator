// src/services/jupiter.ts

import axios from 'axios';
import { Token } from '../types';

// NEW API URL
const JUPITER_API_URL = 'https://api.jup.ag/v6/token-list';

// This function normalizes the raw data from Jupiter into our Token interface
const normalize = (coin: any): Token | null => {
  // This new endpoint doesn't provide price, so we'll mock it.
  // A real app would need to use /v6/price for each token.
  // For this project, we just need *a* second data source.
  if (!coin.address) {
    return null;
  }
  
  // This endpoint is just a list, it doesn't have prices.
  // We will fill what we can and give it a dummy price.
  const SOL_PRICE_USD = 150;

  return {
    token_address: coin.address,
    token_name: coin.name,
    token_ticker: coin.symbol,
    price_sol: (coin.price ?? 0) / SOL_PRICE_USD, // Will be 0, which is fine
    market_cap_sol: 0,
    volume_sol: 0, 
    liquidity_sol: 0, 
    transaction_count: 0, 
    price_1hr_change: 0,
    protocol: 'Jupiter',
    source: 'jupiter',
  };
};

export const fetchJupiterTokens = async (): Promise<Token[]> => {
  try {
    const response = await axios.get(JUPITER_API_URL);

    // This new endpoint has the list inside a 'data' property
    if (!response.data || !Array.isArray(response.data.data)) {
      console.warn('[Jupiter] Unexpected API response structure.');
      return [];
    }
    
    // We map over response.data.data
    const tokens: Token[] = response.data.data
      .map(normalize)
      .filter((token: Token | null): token is Token => token !== null);

    console.log(`[Jupiter] Fetched ${tokens.length} tokens.`);
    return tokens;
  } catch (error: any) { // <-- Added the missing '{'
    if (error.response?.status === 429) {
      console.warn('[Jupiter] Rate limited! Will retry later.');
    } else {
      console.error('[Jupiter] Error fetching tokens:', error.message);
    }
    return [];
  } // <-- Added the missing '}'
};