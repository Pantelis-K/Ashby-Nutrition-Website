import type { Food } from '../../domain/models/Food';

export interface FoodRepository {
  getFoods(): Promise<Food[]>;
  getFoodById(id: string): Promise<Food | null>;
  searchFoods(query: string): Promise<Food[]>;
}
