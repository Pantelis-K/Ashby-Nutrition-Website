import { useMemo } from 'react';
import type { Food } from '../domain/models/Food';

export function usePlotState(foods: Food[], selectedFoodId: string | null) {
  return useMemo(
    () => ({
      selectedFoodId,
      hasFoods: foods.length > 0,
    }),
    [foods.length, selectedFoodId],
  );
}
