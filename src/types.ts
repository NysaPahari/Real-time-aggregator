// src/types.ts

export interface Token {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  market_cap_sol: number;
  volume_sol: number;
  liquidity_sol: number;
  transaction_count: number;
  price_1hr_change: number;
  protocol: string;
  source: 'dexscreener' | 'jupiter' | 'gecko'; // To track origin
}

// We'll use this for the final merged data
export type AggregatedToken = Omit<Token, 'source'> & {
  sources: string[];
};

// For pagination
export interface PaginatedResponse {
  tokens: AggregatedToken[];
  next_cursor: string | null;
}