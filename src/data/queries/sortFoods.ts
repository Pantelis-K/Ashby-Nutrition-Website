import type { Food } from '../../domain/models/Food';

export function sortFoodsByName(foods: Food[]): Food[] {
  return [...foods].sort((left, right) => left.name.localeCompare(right.name));
}
