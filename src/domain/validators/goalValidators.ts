import type { UserGoal } from '../models/UserGoal';

export function validateGoal(goal: UserGoal): string | null {
  if (!Number.isFinite(goal.proteinTarget) || !Number.isFinite(goal.calorieTarget)) {
    return 'Goals must be valid numbers.';
  }

  if (goal.proteinTarget <= 0 || goal.calorieTarget <= 0) {
    return 'Goals must be greater than zero.';
  }

  return null;
}
