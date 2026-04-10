import type { UserGoal } from '../models/UserGoal';
import { computeTargetRatio } from './nutritionMath';

export interface GoalLinePoint {
  x: number;
  y: number;
}

export function proteinAtCalories(calories: number, ratio: number): number {
  return calories * ratio;
}

export function getGoalLinePoints(goal: UserGoal, maxCalories: number): GoalLinePoint[] {
  const safeMaxCalories = Math.max(maxCalories, goal.calorieTarget, 1);
  const ratio = computeTargetRatio(goal);

  return [
    { x: 0, y: 0 },
    { x: safeMaxCalories, y: proteinAtCalories(safeMaxCalories, ratio) },
  ];
}
