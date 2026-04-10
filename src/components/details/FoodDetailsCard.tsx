import type { Food } from '../../domain/models/Food';
import type { UserGoal } from '../../domain/models/UserGoal';
import { classifyFoodAgainstGoal } from '../../domain/services/foodScoring';
import { formatGoalStatusLabel } from '../../domain/services/labelFormatting';
import { computeFoodRatio } from '../../domain/services/nutritionMath';

interface FoodDetailsCardProps {
  food: Food | null;
  goal: UserGoal;
}

export function FoodDetailsCard({ food, goal }: FoodDetailsCardProps) {
  if (!food) {
    return (
      <div className="details-empty">
        <h3>Select a food</h3>
        <p>Use the plot or search to inspect a food&apos;s macro profile and target alignment.</p>
      </div>
    );
  }

  const status = classifyFoodAgainstGoal(food, goal);
  const ratio = computeFoodRatio(food);

  return (
    <article className="details-card">
      <div className="details-card-header">
        <div>
          <p className="eyebrow">Selected food</p>
          <h3>{food.name}</h3>
          <p>{food.category}</p>
        </div>
        <span className={`status-pill is-${status}`}>{formatGoalStatusLabel(status)}</span>
      </div>
      <dl className="details-grid">
        <div>
          <dt>Calories</dt>
          <dd>{food.caloriesPer100g} kcal</dd>
        </div>
        <div>
          <dt>Protein</dt>
          <dd>{food.proteinPer100g} g</dd>
        </div>
        <div>
          <dt>Carbs</dt>
          <dd>{food.carbsPer100g} g</dd>
        </div>
        <div>
          <dt>Fat</dt>
          <dd>{food.fatPer100g} g</dd>
        </div>
        <div>
          <dt>Protein/calorie ratio</dt>
          <dd>{ratio.toFixed(3)}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{food.source.sourceName ?? food.source.system}</dd>
        </div>
      </dl>
    </article>
  );
}
