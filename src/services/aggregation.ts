// src/services/aggregation.ts

import { AggregatedToken, Token } from '../types';
import { getCache, setCache } from './cache';
import { fetchDexScreenerTokens } from './dexScreener';
// --- UPDATED IMPORT ---
import { fetchGeckoTerminalTokens } from './geckoTerminal';
import { Server as SocketIOServer } from 'socket.io';

const ALL_TOKENS_CACHE_KEY = 'all_tokens';
const POLLING_INTERVAL_MS = 20000;

let io: SocketIOServer;

export const initAggregationService = (socketIoInstance: SocketIOServer) => {
  io = socketIoInstance;
  console.log('[Aggregator] Service initialized with Socket.IO.');
};

/**
 * Intelligently merges token lists.
 */
const mergeTokens = (
  dexTokens: Token[],
  // --- UPDATED PARAMETER ---
  geckoTokens: Token[]
): AggregatedToken[] => {
  const tokenMap = new Map<string, AggregatedToken>();

  // Process DexScreener tokens first (primary source)
  for (const token of dexTokens) {
    tokenMap.set(token.token_address, {
      ...token,
      sources: [token.source],
    });
  }

  // --- UPDATED MERGE LOGIC ---
  // Merge GeckoTerminal tokens
  for (const token of geckoTokens) {
    const existing = tokenMap.get(token.token_address);
    if (existing) {
      existing.sources.push(token.source);
    } else {
      tokenMap.set(token.token_address, {
        ...token,
        sources: [token.source],
      });
    }
  }

  return Array.from(tokenMap.values());
};

/**
 * Fetches fresh data from all APIs, merges, and caches it.
 */
export const fetchAndCacheTokens = async (): Promise<AggregatedToken[]> => {
  console.log('[Aggregator] Fetching fresh data from APIs...');

  // --- UPDATED FETCH ---
  // Fetch from all sources in parallel
  const [dexTokens, geckoTokens] = await Promise.all([
    fetchDexScreenerTokens(),
    fetchGeckoTerminalTokens(), // Replaced Jupiter
  ]);

  // Merge the results
  const aggregatedTokens = mergeTokens(dexTokens, geckoTokens);

  if (aggregatedTokens.length > 0) {
    await setCache(ALL_TOKENS_CACHE_KEY, aggregatedTokens);
    console.log(`[Aggregator] Cached ${aggregatedTokens.length} tokens.`);
  }

  return aggregatedTokens;
};

/**
 * Main function for the API endpoint.
 */
export const getAggregatedTokens = async (): Promise<AggregatedToken[]> => {
  const cachedTokens = await getCache<AggregatedToken[]>(ALL_TOKENS_CACHE_KEY);
  if (cachedTokens) {
    console.log(`[Aggregator] Serving ${cachedTokens.length} tokens from cache.`);
    return cachedTokens;
  }

  console.log('[Aggregator] Cache empty, fetching new data...');
  return await fetchAndCacheTokens();
};

/**
 * Starts the background polling service.
 */
export const startPolling = () => {
  console.log(
    `[Polling] Starting background poller. Refreshing every ${
      POLLING_INTERVAL_MS / 1000
    }s.`
  );

  const poll = async () => {
    try {
      console.log('[Polling] Refreshing token data...');

      const newData = await fetchAndCacheTokens();

      if (newData.length > 0 && io) { 
        io.emit('token_updates', newData);
        console.log(`[Socket.IO] Emitted 'token_updates' to all clients.`);
      } else if (!io) {
        console.warn('[Socket.IO] io object not initialized, skipping emit.');
      }
    } catch (error) {
      console.error('[Polling] Error during background refresh:', error);
    } finally {
      setTimeout(poll, POLLING_INTERVAL_MS);
    }
  };

  poll();
};