interface SelectedFoodBadgeProps {
  name: string | null;
}

export function SelectedFoodBadge({ name }: SelectedFoodBadgeProps) {
  return <div className="selected-food-badge">{name ? `Focused: ${name}` : 'Focused: none'}</div>;
}
