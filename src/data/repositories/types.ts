import type { Food } from '../../domain/models/Food';

export interface FoodSearchResult {
  food: Food;
  score: number;
}
