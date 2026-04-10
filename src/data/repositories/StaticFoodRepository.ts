import type { Food } from '../../domain/models/Food';
import { searchFoods } from '../queries/searchFoods';
import type { FoodRepository } from './FoodRepository';

export class StaticFoodRepository implements FoodRepository {
  private cache: Food[] | null = null;

  async getFoods(): Promise<Food[]> {
    if (this.cache) {
      return this.cache;
    }

    const response = await fetch(`${import.meta.env.BASE_URL}data/foods.json`);
    if (!response.ok) {
      throw new Error('Failed to load foods');
    }

    const data = (await response.json()) as Food[];
    this.cache = data;
    return data;
  }

  async getFoodById(id: string): Promise<Food | null> {
    const foods = await this.getFoods();
    return foods.find((food) => food.id === id) ?? null;
  }

  async searchFoods(query: string): Promise<Food[]> {
    const foods = await this.getFoods();
    return searchFoods(foods, query);
  }
}
