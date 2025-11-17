// src/services/geckoTerminal.ts

import axios from 'axios';
import { Token } from '../types';

const API_URL = 'https://api.geckoterminal.com/api/v2/networks/solana/pools?page=1';

// Normalizes GeckoTerminal pool data into our Token interface
const normalize = (pool: any): Token | null => {
  try {
    const attributes = pool.attributes;
    const baseToken = pool.relationships.base_token.data;

    if (!attributes || !baseToken || !attributes.base_token_price_usd) {
      return null;
    }

    // Prices are in USD. We use the same static conversion.
    const SOL_PRICE_USD = 150;
    const priceSol = parseFloat(attributes.base_token_price_usd) / SOL_PRICE_USD;

    return {
      token_address: baseToken.id.split('_')[1], // Address is like 'solana_ADDRESS'
      token_name: attributes.name,
      token_ticker: attributes.base_token_price_usd, // Ticker isn't provided here, using price as placeholder
      price_sol: priceSol,
      market_cap_sol: 0, // Not provided
      volume_sol: (attributes.volume_usd.h24 ?? 0) / SOL_PRICE_USD,
      liquidity_sol: (attributes.reserve_in_usd ?? 0) / SOL_PRICE_USD,
      transaction_count: attributes.transactions.h24.buys + attributes.transactions.h24.sells,
      price_1hr_change: parseFloat(attributes.price_change_percentage.h1 ?? 0),
      protocol: pool.relationships.dex.data.id,
      source: 'gecko',
    };
  } catch (e) {
    // Handle complex data structures failing
    console.warn('[GeckoTerminal] Error normalizing pool:', pool.id);
    return null;
  }
};

export const fetchGeckoTerminalTokens = async (): Promise<Token[]> => {
  try {
    const response = await axios.get(API_URL);

    if (!response.data || !Array.isArray(response.data.data)) {
      console.warn('[GeckoTerminal] Unexpected API response structure.');
      return [];
    }

    const tokens: Token[] = response.data.data
      .map(normalize)
      .filter((token: Token | null): token is Token => token !== null);

    console.log(`[GeckoTerminal] Fetched ${tokens.length} tokens.`);
    return tokens;
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.warn('[GeckoTerminal] Rate limited! Will retry later.');
    } else {
      console.error('[GeckoTerminal] Error fetching tokens:', error.message);
    }
    return [];
  }
};