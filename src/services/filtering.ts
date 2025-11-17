// src/services/filtering.ts

import { AggregatedToken, PaginatedResponse } from '../types';

// Define the expected query parameters
interface QueryParams {
  sortBy?: 'volume_sol' | 'price_1hr_change' | 'market_cap_sol';
  sortOrder?: 'asc' | 'desc';
  limit?: string;
  cursor?: string;
  // Note: We only have '1h' data in our normalized model.
  // A full implementation would require fetching 1d/7d data from APIs.
  // We'll filter by 'price_1hr_change' to demonstrate the concept.
  timePeriod?: '1h'; 
}

/**
 * Applies sorting and filtering to the token list.
 */
export const applyFilters = (
  tokens: AggregatedToken[],
  query: QueryParams
): AggregatedToken[] => {
  let filteredTokens = [...tokens];

  // --- Sorting ---
  const { sortBy, sortOrder = 'desc' } = query;

  if (sortBy) {
    filteredTokens.sort((a, b) => {
      const valA = a[sortBy] || 0;
      const valB = b[sortBy] || 0;

      if (sortOrder === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }

  // --- Filtering (by timePeriod) ---
  // This is a placeholder. Since our data model only has 'price_1hr_change',
  // we'll just return all tokens. A real app would have different properties
  // for 24h, 7d and filter based on the 'timePeriod' query param.
  // e.g., if (query.timePeriod === '24h') { ... }

  return filteredTokens;
};

/**
 * Applies cursor-based pagination.
 */
export const applyPagination = (
  tokens: AggregatedToken[],
  query: QueryParams
): PaginatedResponse => {
  const limit = parseInt(query.limit || '20', 10);
  const { cursor } = query;

  let startIndex = 0;

  if (cursor) {
    // Find the index of the token matching the cursor
    // We use token_address as the cursor
    const cursorIndex = tokens.findIndex(
      (token) => token.token_address === cursor
    );
    if (cursorIndex > -1) {
      startIndex = cursorIndex + 1; // Start *after* the cursor
    }
  }

  const paginatedTokens = tokens.slice(startIndex, startIndex + limit);

  const nextCursor =
    paginatedTokens.length === limit
      ? paginatedTokens[paginatedTokens.length - 1].token_address
      : null;

  return {
    tokens: paginatedTokens,
    next_cursor: nextCursor,
  };
};