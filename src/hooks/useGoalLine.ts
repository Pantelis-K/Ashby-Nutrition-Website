import { useMemo } from 'react';
import type { Food } from '../domain/models/Food';
import type { UserGoal } from '../domain/models/UserGoal';
import { computeTargetRatio } from '../domain/services/nutritionMath';
import { getGoalLinePoints } from '../domain/services/goalLine';

export function useGoalLine(goal: UserGoal, foods: Food[]) {
  return useMemo(() => {
    const maxCalories = foods.reduce((currentMax, food) => Math.max(currentMax, food.caloriesPer100g), 0) * 1.1;
    return {
      ratio: computeTargetRatio(goal),
      points: getGoalLinePoints(goal, maxCalories),
    };
  }, [foods, goal]);
}
