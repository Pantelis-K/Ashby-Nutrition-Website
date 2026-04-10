import { useMemo } from 'react';
import type { Food } from '../domain/models/Food';
import { searchFoods } from '../data/queries/searchFoods';

export function useFoodSearch(foods: Food[], query: string) {
  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return { results: [] as Food[], bestMatch: null as Food | null, hasNoResults: false };
    }

    const results = searchFoods(foods, trimmed);
    return {
      results,
      bestMatch: results[0] ?? null,
      hasNoResults: results.length === 0,
    };
  }, [foods, query]);
}
