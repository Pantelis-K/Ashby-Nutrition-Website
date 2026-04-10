import type { Food } from '../../domain/models/Food';
import type { FoodCategory } from '../../domain/models/FoodCategory';

export function filterFoods(foods: Food[], selectedCategories: Set<FoodCategory>): Food[] {
  return foods.filter((food) => selectedCategories.has(food.category));
}
