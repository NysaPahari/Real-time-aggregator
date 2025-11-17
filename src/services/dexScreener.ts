// src/services/dexScreener.ts

import axios from 'axios';
import { Token } from '../types';

// We will use the search endpoint directly
const API_URL = 'https://api.dexscreener.com/latest/dex/search?q=solana';

// This function normalizes the raw data from DexScreener into our Token interface
const normalize = (pair: any): Token | null => {
  if (!pair.baseToken || !pair.priceUsd) {
    return null; // Skip pairs without basic info
  }

  // DexScreener prices are in USD. We need to convert to SOL.
  // For this task, we'll assume a static 1 SOL = $150 USD for simplicity.
  // A real-world app would fetch the SOL/USD price dynamically.
  const SOL_PRICE_USD = 150;

  const priceSol = parseFloat(pair.priceUsd) / SOL_PRICE_USD;

  return {
    token_address: pair.baseToken.address,
    token_name: pair.baseToken.name,
    token_ticker: pair.baseToken.symbol,
    price_sol: priceSol,
    market_cap_sol: (pair.marketCap ?? 0) / SOL_PRICE_USD,
    volume_sol: (pair.volume?.h24 ?? 0) / SOL_PRICE_USD,
    liquidity_sol: (pair.liquidity?.usd ?? 0) / SOL_PRICE_USD,
    transaction_count: pair.txns?.h24?.buys + pair.txns?.h24?.sells || 0,
    price_1hr_change: pair.priceChange?.h1 ?? 0,
    protocol: pair.dexId,
    source: 'dexscreener',
  };
};

export const fetchDexScreenerTokens = async (): Promise<Token[]> => {
  try {
    // We'll search for new pairs on Solana
    const response = await axios.get(API_URL);

    if (!response.data?.pairs) {
      return [];
    }

    const tokens: Token[] = response.data.pairs
      .map(normalize)
      .filter((token: Token | null): token is Token => token !== null); // Filter out any nulls

    console.log(`[DexScreener] Fetched ${tokens.length} tokens.`);
    return tokens;
  } catch (error: any) {
    // Handle rate limiting (429) and other errors
    if (error.response?.status === 429) {
      console.warn('[DexScreener] Rate limited! Will retry later.');
    } else {
      console.error('[DexScreener] Error fetching tokens:', error.message);
    }
    return []; // Return empty array on error
  }
};