import type { FoodCategory } from './FoodCategory';

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumMgPer100g?: number;
  aliases?: string[];
  source: {
    system: string;
    sourceId?: string;
    sourceName?: string;
  };
  plot: {
    x: number;
    y: number;
  };
}
