import type { Food } from '../models/Food';
import type { UserGoal } from '../models/UserGoal';

const EPSILON = 1e-6;

export function computeTargetRatio(goal: UserGoal): number {
  if (goal.calorieTarget <= 0 || goal.proteinTarget <= 0) {
    return 0;
  }

  return goal.proteinTarget / goal.calorieTarget;
}

export function computeFoodRatio(food: Food): number {
  if (food.caloriesPer100g <= EPSILON) {
    return food.proteinPer100g > EPSILON ? Number.POSITIVE_INFINITY : 0;
  }

  return food.proteinPer100g / food.caloriesPer100g;
}
