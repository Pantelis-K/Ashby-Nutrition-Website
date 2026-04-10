import createPlotlyComponent from 'react-plotly.js/factory';
import type { Data, Layout, PlotMouseEvent } from 'plotly.js';
import Plotly from 'plotly.js-basic-dist-min';
import type { Food } from '../../domain/models/Food';
import type { FoodCategory } from '../../domain/models/FoodCategory';
import { FOOD_CATEGORY_LABELS } from '../../domain/models/FoodCategory';
import type { GoalLinePoint } from '../../domain/services/goalLine';

interface FoodScatterPlotProps {
  foods: Food[];
  selectedFoodId: string | null;
  categoryColors: Record<FoodCategory, string>;
  goalLinePoints: GoalLinePoint[];
  onSelectFood: (id: string) => void;
}

function buildTooltip(food: Food): string {
  return [
    `<b>${food.name}</b>`,
    `${FOOD_CATEGORY_LABELS[food.category]}`,
    `Calories: ${food.caloriesPer100g} kcal`,
    `Protein: ${food.proteinPer100g} g`,
    `Carbs: ${food.carbsPer100g} g`,
    `Fat: ${food.fatPer100g} g`,
  ].join('<br>');
}

export function FoodScatterPlot({
  foods,
  selectedFoodId,
  categoryColors,
  goalLinePoints,
  onSelectFood,
}: FoodScatterPlotProps) {
  const unselectedFoods = foods.filter((food) => food.id !== selectedFoodId);
  const selectedFood = foods.find((food) => food.id === selectedFoodId) ?? null;

  const traces: Data[] = [
    {
      type: 'scattergl',
      mode: 'markers',
      name: 'Foods',
      x: unselectedFoods.map((food) => food.plot.x),
      y: unselectedFoods.map((food) => food.plot.y),
      text: unselectedFoods.map((food) => buildTooltip(food)),
      customdata: unselectedFoods.map((food) => food.id),
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        size: 11,
        color: unselectedFoods.map((food) => categoryColors[food.category]),
        line: {
          width: 1,
          color: 'rgba(255,255,255,0.22)',
        },
        opacity: 0.9,
      },
    },
    {
      type: 'scatter',
      mode: 'lines',
      name: 'Target line',
      x: goalLinePoints.map((point) => point.x),
      y: goalLinePoints.map((point) => point.y),
      hoverinfo: 'skip',
      line: {
        color: '#f59e0b',
        width: 3,
        dash: 'dash',
      },
    },
  ];

  if (selectedFood) {
    traces.push({
      type: 'scatter',
      mode: 'markers',
      name: 'Selected food',
      x: [selectedFood.plot.x],
      y: [selectedFood.plot.y],
      text: [buildTooltip(selectedFood)],
      customdata: [selectedFood.id],
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        size: 18,
        color: categoryColors[selectedFood.category],
        symbol: 'diamond',
        line: {
          width: 3,
          color: '#f8fafc',
        },
      },
    });
  }

  const layout: Partial<Layout> = {
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: '#09161d',
    margin: { l: 60, r: 24, t: 30, b: 60 },
    legend: {
      orientation: 'h',
      y: -0.22,
      font: { color: '#cbd5e1', size: 12 },
    },
    xaxis: {
      title: { text: 'Calories per 100 g' },
      gridcolor: 'rgba(148,163,184,0.16)',
      zerolinecolor: 'rgba(148,163,184,0.26)',
      color: '#e2e8f0',
    },
    yaxis: {
      title: { text: 'Protein per 100 g' },
      gridcolor: 'rgba(148,163,184,0.16)',
      zerolinecolor: 'rgba(148,163,184,0.26)',
      color: '#e2e8f0',
    },
    hoverlabel: {
      bgcolor: '#0f172a',
      bordercolor: '#334155',
      font: { color: '#f8fafc' },
    },
    font: {
      family: '"Space Grotesk", "Segoe UI", sans-serif',
      color: '#e2e8f0',
    },
  };

  const handleClick = (event: Readonly<PlotMouseEvent>) => {
    const id = event.points[0]?.customdata;
    if (typeof id === 'string') {
      onSelectFood(id);
    }
  };

  return (
    <div className="plot-frame">
      <Plot
        data={traces}
        layout={layout}
        config={{ displaylogo: false, responsive: true }}
        useResizeHandler
        className="plot-surface"
        onClick={handleClick}
      />
    </div>
  );
}
const Plot = createPlotlyComponent(Plotly);
