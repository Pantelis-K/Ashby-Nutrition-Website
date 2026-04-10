import type { FoodGoalClassification } from './foodScoring';

export function formatGoalStatusLabel(status: FoodGoalClassification): string {
  if (status === 'on') {
    return 'On target';
  }

  return status === 'above' ? 'Above target' : 'Below target';
}
