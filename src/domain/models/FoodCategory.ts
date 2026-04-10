export const FOOD_CATEGORIES = [
  'Dairy',
  'Meat',
  'Fish',
  'Eggs',
  'Legumes',
  'Grains',
  'Fruit',
  'Vegetables',
  'NutsSeeds',
  'FatsOils',
  'SnacksDesserts',
  'Beverages',
  'Other',
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  Dairy: 'Dairy',
  Meat: 'Meat',
  Fish: 'Fish',
  Eggs: 'Eggs',
  Legumes: 'Legumes',
  Grains: 'Grains',
  Fruit: 'Fruit',
  Vegetables: 'Vegetables',
  NutsSeeds: 'Nuts & Seeds',
  FatsOils: 'Fats & Oils',
  SnacksDesserts: 'Snacks & Desserts',
  Beverages: 'Beverages',
  Other: 'Other',
};
