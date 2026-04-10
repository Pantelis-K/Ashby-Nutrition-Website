interface ResetButtonProps {
  onReset: () => void;
}

export function ResetButton({ onReset }: ResetButtonProps) {
  return (
    <button type="button" className="reset-button" onClick={onReset}>
      Reset to defaults
    </button>
  );
}
