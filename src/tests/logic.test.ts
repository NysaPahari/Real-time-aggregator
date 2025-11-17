import { applyFilters, applyPagination } from '../services/filtering';
import { AggregatedToken } from '../types';

// Mock Data
const mockTokens: AggregatedToken[] = [
  { token_address: 'A', volume_sol: 100, price_1hr_change: 5, sources: [] } as any,
  { token_address: 'B', volume_sol: 300, price_1hr_change: 10, sources: [] } as any,
  { token_address: 'C', volume_sol: 200, price_1hr_change: -5, sources: [] } as any,
  { token_address: 'D', volume_sol: 50, price_1hr_change: 0, sources: [] } as any,
  { token_address: 'E', volume_sol: 500, price_1hr_change: 20, sources: [] } as any,
];

describe('Service: Filtering & Sorting', () => {
  test('1. should sort tokens by volume_sol descending', () => {
    const result = applyFilters(mockTokens, { sortBy: 'volume_sol', sortOrder: 'desc' });
    expect(result[0].token_address).toBe('E');
  });

  test('2. should sort tokens by volume_sol ascending', () => {
    const result = applyFilters(mockTokens, { sortBy: 'volume_sol', sortOrder: 'asc' });
    expect(result[0].token_address).toBe('D');
  });

  test('3. should sort by price_1hr_change descending', () => {
    const result = applyFilters(mockTokens, { sortBy: 'price_1hr_change', sortOrder: 'desc' });
    expect(result[0].token_address).toBe('E');
  });

  test('4. should default to descending if sortOrder is missing', () => {
    const result = applyFilters(mockTokens, { sortBy: 'volume_sol' });
    expect(result[0].token_address).toBe('E');
  });

  test('5. should handle empty token list safely', () => {
    const result = applyFilters([], { sortBy: 'volume_sol' });
    expect(result).toEqual([]);
  });
});

describe('Service: Pagination', () => {
  test('6. should respect the limit parameter', () => {
    const result = applyPagination(mockTokens, { limit: '2' });
    expect(result.tokens.length).toBe(2);
  });

  test('7. should return items AFTER the cursor', () => {
    const result = applyPagination(mockTokens, { cursor: 'B', limit: '2' });
    expect(result.tokens[0].token_address).toBe('C');
  });

  test('8. should return null next_cursor when list ends', () => {
    const result = applyPagination(mockTokens, { cursor: 'D', limit: '5' });
    expect(result.next_cursor).toBeNull();
  });

  test('9. should start from beginning if cursor is invalid', () => {
    const result = applyPagination(mockTokens, { cursor: 'XYZ', limit: '2' });
    expect(result.tokens[0].token_address).toBe('A');
  });

  test('10. should default to limit 20', () => {
    const result = applyPagination(mockTokens, {});
    expect(result.tokens.length).toBe(5); 
  });
});