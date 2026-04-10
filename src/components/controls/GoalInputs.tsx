import type { ChangeEvent } from 'react';

interface GoalInputsProps {
  proteinTargetInput: string;
  calorieTargetInput: string;
  goalError: string | null;
  onProteinTargetChange: (value: string) => void;
  onCalorieTargetChange: (value: string) => void;
}

export function GoalInputs({
  proteinTargetInput,
  calorieTargetInput,
  goalError,
  onProteinTargetChange,
  onCalorieTargetChange,
}: GoalInputsProps) {
  const handleChange = (handler: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    handler(event.target.value);
  };

  return (
    <div className="goal-input-grid">
      <label>
        <span>Protein target (g/day)</span>
        <input type="number" min="1" step="1" value={proteinTargetInput} onChange={handleChange(onProteinTargetChange)} />
      </label>
      <label>
        <span>Calorie target (kcal/day)</span>
        <input type="number" min="1" step="1" value={calorieTargetInput} onChange={handleChange(onCalorieTargetChange)} />
      </label>
      <p className={`inline-feedback ${goalError ? 'is-error' : ''}`}>
        {goalError ?? 'Target ratio updates instantly as you adjust either goal.'}
      </p>
    </div>
  );
}
