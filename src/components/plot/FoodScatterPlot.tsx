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
  selectedCategories: Set<FoodCategory>;
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

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const hexValue = normalized.length === 3
    ? normalized.split('').map((character) => character + character).join('')
    : normalized;

  const red = Number.parseInt(hexValue.slice(0, 2), 16);
  const green = Number.parseInt(hexValue.slice(2, 4), 16);
  const blue = Number.parseInt(hexValue.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function smoothCircularSeries(values: number[], passes: number): number[] {
  let smoothed = [...values];

  for (let pass = 0; pass < passes; pass += 1) {
    smoothed = smoothed.map((_, index, source) => {
      const previous = source[(index - 1 + source.length) % source.length];
      const current = source[index];
      const next = source[(index + 1) % source.length];
      return previous * 0.25 + current * 0.5 + next * 0.25;
    });
  }

  return smoothed;
}

function fillMissingCircularValues(values: number[]): number[] {
  const filled = [...values];

  for (let index = 0; index < filled.length; index += 1) {
    if (filled[index] > 0) {
      continue;
    }

    let leftDistance = 1;
    while (leftDistance < filled.length && filled[(index - leftDistance + filled.length) % filled.length] === 0) {
      leftDistance += 1;
    }

    let rightDistance = 1;
    while (rightDistance < filled.length && filled[(index + rightDistance) % filled.length] === 0) {
      rightDistance += 1;
    }

    const leftValue = filled[(index - leftDistance + filled.length) % filled.length];
    const rightValue = filled[(index + rightDistance) % filled.length];

    if (leftValue > 0 && rightValue > 0) {
      const totalDistance = leftDistance + rightDistance;
      filled[index] = leftValue * (rightDistance / totalDistance) + rightValue * (leftDistance / totalDistance);
    } else if (leftValue > 0) {
      filled[index] = leftValue;
    } else if (rightValue > 0) {
      filled[index] = rightValue;
    }
  }

  return filled;
}

function getInterpolatedCircularValue(values: number[], position: number): number {
  const length = values.length;
  const wrapped = ((position % length) + length) % length;
  const leftIndex = Math.floor(wrapped);
  const rightIndex = (leftIndex + 1) % length;
  const fraction = wrapped - leftIndex;
  return values[leftIndex] * (1 - fraction) + values[rightIndex] * fraction;
}

function expandRadiiToCapturePoints(
  radii: number[],
  points: Array<{ angle: number; radius: number }>,
  sectorCount: number,
): number[] {
  const expanded = [...radii];

  points.forEach((point) => {
    const position = (point.angle / (Math.PI * 2)) * sectorCount;
    const currentRadius = getInterpolatedCircularValue(expanded, position);
    const requiredRadius = point.radius + 0.32;

    if (currentRadius >= requiredRadius) {
      return;
    }

    const delta = requiredRadius - currentRadius;
    const centerIndex = Math.round(position) % sectorCount;

    for (let offset = -3; offset <= 3; offset += 1) {
      const index = (centerIndex + offset + sectorCount) % sectorCount;
      const distanceWeight = Math.max(0, 1 - Math.abs(offset) / 4);
      expanded[index] = Math.max(expanded[index], expanded[index] + delta * distanceWeight);
    }
  });

  return expanded;
}

function buildCategoryRegionTrace(
  category: FoodCategory,
  foods: Food[],
  categoryColors: Record<FoodCategory, string>,
): Data | null {
  const categoryFoods = foods.filter((food) => food.category === category);
  if (categoryFoods.length < 4) {
    return null;
  }

  const centroidX = categoryFoods.reduce((sum, food) => sum + food.plot.x, 0) / categoryFoods.length;
  const centroidY = categoryFoods.reduce((sum, food) => sum + food.plot.y, 0) / categoryFoods.length;
  const xSpread = Math.max(
    1,
    Math.sqrt(categoryFoods.reduce((sum, food) => sum + (food.plot.x - centroidX) ** 2, 0) / categoryFoods.length),
  );
  const ySpread = Math.max(
    1,
    Math.sqrt(categoryFoods.reduce((sum, food) => sum + (food.plot.y - centroidY) ** 2, 0) / categoryFoods.length),
  );

  const sectorCount = 28;
  const radii = new Array<number>(sectorCount).fill(0);
  const normalizedPoints = categoryFoods.map((food) => {
    const normalizedX = (food.plot.x - centroidX) / xSpread;
    const normalizedY = (food.plot.y - centroidY) / ySpread;
    return {
      angle: ((Math.atan2(normalizedY, normalizedX) + Math.PI * 2) % (Math.PI * 2)),
      radius: Math.hypot(normalizedX, normalizedY),
    };
  });

  normalizedPoints.forEach((point) => {
    const sectorIndex = Math.floor((point.angle / (Math.PI * 2)) * sectorCount) % sectorCount;
    radii[sectorIndex] = Math.max(radii[sectorIndex], point.radius);
  });

  const filledRadii = fillMissingCircularValues(radii);
  const expandedRadii = expandRadiiToCapturePoints(filledRadii, normalizedPoints, sectorCount);
  const smoothedRadii = smoothCircularSeries(expandedRadii, 3).map((radius) => radius * 1.18 + 0.38);

  const regionPoints = smoothedRadii.map((radius, index) => {
    const angle = (index / sectorCount) * Math.PI * 2;
    return {
      x: Math.max(0, centroidX + Math.cos(angle) * radius * xSpread),
      y: Math.max(-0.5, centroidY + Math.sin(angle) * radius * ySpread),
    };
  });

  regionPoints.push(regionPoints[0]);

  const color = categoryColors[category];

  return {
    type: 'scatter',
    mode: 'lines',
    name: `${category} region`,
    x: regionPoints.map((point) => point.x),
    y: regionPoints.map((point) => point.y),
    hoverinfo: 'skip',
    showlegend: false,
    fill: 'toself',
    fillcolor: hexToRgba(color, 0.14),
    line: {
      color: hexToRgba(color, 0.26),
      width: 1.5,
      shape: 'spline',
      smoothing: 1.15,
    },
  };
}

export function FoodScatterPlot({
  foods,
  selectedFoodId,
  selectedCategories,
  categoryColors,
  goalLinePoints,
  onSelectFood,
}: FoodScatterPlotProps) {
  const unselectedFoods = foods.filter((food) => food.id !== selectedFoodId);
  const selectedFood = foods.find((food) => food.id === selectedFoodId) ?? null;
  const regionTraces = Array.from(selectedCategories)
    .map((category) => buildCategoryRegionTrace(category, foods, categoryColors))
    .filter((trace): trace is Data => trace !== null);

  const traces: Data[] = [];

  if (regionTraces.length > 0) {
    traces.push(...regionTraces);
  }

  traces.push(
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
  );

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
