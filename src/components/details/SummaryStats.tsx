interface SummaryStatsProps {
  totalFoods: number;
  visibleFoods: number;
  ratio: number;
}

export function SummaryStats({ totalFoods, visibleFoods, ratio }: SummaryStatsProps) {
  return (
    <div className="summary-stats-grid">
      <div>
        <span>Total foods</span>
        <strong>{totalFoods}</strong>
      </div>
      <div>
        <span>Visible foods</span>
        <strong>{visibleFoods}</strong>
      </div>
      <div>
        <span>Target ratio</span>
        <strong>{ratio.toFixed(3)}</strong>
      </div>
    </div>
  );
}
