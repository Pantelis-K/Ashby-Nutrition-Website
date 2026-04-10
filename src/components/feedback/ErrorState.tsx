interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return <div className="feedback-card is-error">{message}</div>;
}
