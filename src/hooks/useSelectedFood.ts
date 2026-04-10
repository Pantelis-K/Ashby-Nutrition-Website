import { useMemo } from 'react';
import type { Food } from '../domain/models/Food';

export function useSelectedFood(foods: Food[], selectedFoodId: string | null) {
  return useMemo(
    () => foods.find((food) => food.id === selectedFoodId) ?? null,
    [foods, selectedFoodId],
  );
}
