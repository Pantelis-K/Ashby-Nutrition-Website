import type { Food } from '../models/Food';
import type { UserGoal } from '../models/UserGoal';
import { computeFoodRatio, computeTargetRatio } from './nutritionMath';

export type FoodGoalClassification = 'above' | 'below' | 'on';

const EPSILON = 0.005;

export function classifyFoodAgainstGoal(food: Food, goal: UserGoal): FoodGoalClassification {
  const difference = computeFoodRatio(food) - computeTargetRatio(goal);

  if (Math.abs(difference) <= EPSILON) {
    return 'on';
  }

  return difference > 0 ? 'above' : 'below';
}
