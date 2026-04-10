import { FOOD_CATEGORIES } from '../models/FoodCategory';
import type { Food } from '../models/Food';

export function isValidFoodCategory(category: string): boolean {
  return FOOD_CATEGORIES.includes(category as (typeof FOOD_CATEGORIES)[number]);
}

export function validateFood(food: Food): string[] {
  const errors: string[] = [];

  if (!food.id) errors.push('Missing id');
  if (!food.name) errors.push('Missing name');
  if (!isValidFoodCategory(food.category)) errors.push('Invalid category');

  for (const value of [food.caloriesPer100g, food.proteinPer100g, food.carbsPer100g, food.fatPer100g]) {
    if (value < 0 || Number.isNaN(value)) {
      errors.push('Negative or invalid macro value');
      break;
    }
  }

  if (food.plot.x !== food.caloriesPer100g) errors.push('plot.x mismatch');
  if (food.plot.y !== food.proteinPer100g) errors.push('plot.y mismatch');

  return errors;
}
