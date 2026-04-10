import { useMemo } from 'react';
import type { Food } from '../domain/models/Food';
import type { FoodCategory } from '../domain/models/FoodCategory';
import { filterFoods } from '../data/queries/filterFoods';

export function useFilteredFoods(foods: Food[], selectedCategories: Set<FoodCategory>) {
  return useMemo(() => filterFoods(foods, selectedCategories), [foods, selectedCategories]);
}
