import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS, type FoodCategory } from '../../domain/models/FoodCategory';

interface CategoryFilterProps {
  selectedCategories: Set<FoodCategory>;
  counts: Record<FoodCategory, number>;
  onToggle: (category: FoodCategory) => void;
  onClearAll: () => void;
}

export function CategoryFilter({ selectedCategories, counts, onToggle, onClearAll }: CategoryFilterProps) {
  const hasSelectedCategories = selectedCategories.size > 0;

  return (
    <>
      <div className="category-filter-toolbar">
        <button
          type="button"
          className="secondary-button"
          onClick={onClearAll}
          disabled={!hasSelectedCategories}
        >
          Clear all
        </button>
      </div>
      <div className="category-filter-grid">
        {FOOD_CATEGORIES.map((category) => {
          const isActive = selectedCategories.has(category);
          return (
            <button
              key={category}
              type="button"
              className={`filter-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => onToggle(category)}
            >
              <span>{FOOD_CATEGORY_LABELS[category]}</span>
              <strong>{counts[category] ?? 0}</strong>
            </button>
          );
        })}
      </div>
    </>
  );
}
