export function Header() {
  return (
    <header className="hero-card">
      <div>
        <p className="eyebrow">Ashby Nutrition Website</p>
        <h1>Protein vs calorie clarity for practical nutrition analysis.</h1>
        <p className="hero-copy">
          Explore foods by calories and protein density, compare them against a personalized target line,
          and spot the most protein-efficient options quickly.
        </p>
      </div>
      <div className="hero-stat-grid" aria-label="Application highlights">
        <div>
          <span>Interactive plot</span>
          <strong>Plotly scatter</strong>
        </div>
        <div>
          <span>Data source</span>
          <strong>Static repository</strong>
        </div>
        <div>
          <span>Units</span>
          <strong>Per 100 g</strong>
        </div>
      </div>
    </header>
  );
}
