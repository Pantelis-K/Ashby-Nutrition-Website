import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { PageShell } from '../components/layout/PageShell';
import { Panel } from '../components/layout/Panel';
import { GoalInputs } from '../components/controls/GoalInputs';
import { SearchBar } from '../components/controls/SearchBar';
import { CategoryFilter } from '../components/controls/CategoryFilter';
import { ResetButton } from '../components/controls/ResetButton';
import { FoodScatterPlot } from '../components/plot/FoodScatterPlot';
import { PlotEmptyState } from '../components/plot/PlotEmptyState';
import { PlotLegend } from '../components/plot/PlotLegend';
import { FoodDetailsCard } from '../components/details/FoodDetailsCard';
import { SelectedFoodBadge } from '../components/details/SelectedFoodBadge';
import { SummaryStats } from '../components/details/SummaryStats';
import { Footer } from '../components/layout/Footer';
import { LoadingState } from '../components/feedback/LoadingState';
import { ErrorState } from '../components/feedback/ErrorState';
import { FOOD_CATEGORIES, type FoodCategory } from '../domain/models/FoodCategory';
import type { UserGoal } from '../domain/models/UserGoal';
import { categoryColors } from '../domain/services/categoryColors';
import { validateGoal } from '../domain/validators/goalValidators';
import { useFoods } from '../hooks/useFoods';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { useFilteredFoods } from '../hooks/useFilteredFoods';
import { useGoalLine } from '../hooks/useGoalLine';
import { useSelectedFood } from '../hooks/useSelectedFood';

const DEFAULT_GOAL: UserGoal = {
  proteinTarget: 160,
  calorieTarget: 2200,
};

const DEFAULT_GOAL_INPUTS = {
  proteinTargetInput: String(DEFAULT_GOAL.proteinTarget),
  calorieTargetInput: String(DEFAULT_GOAL.calorieTarget),
};

interface Metadata {
  datasetName: string;
  version: string;
  buildDate: string;
}

async function loadMetadata(): Promise<Metadata> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/metadata.json`);
  if (!response.ok) {
    throw new Error('Failed to load metadata');
  }

  return (await response.json()) as Metadata;
}

export function App() {
  const { foods, isLoading, error } = useFoods();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<FoodCategory>>(new Set(FOOD_CATEGORIES));
  const [proteinTargetInput, setProteinTargetInput] = useState(DEFAULT_GOAL_INPUTS.proteinTargetInput);
  const [calorieTargetInput, setCalorieTargetInput] = useState(DEFAULT_GOAL_INPUTS.calorieTargetInput);
  const [metadata, setMetadata] = useState<Metadata>({
    datasetName: 'Ashby Nutrition Curated Static Dataset',
    version: '1.0.0',
    buildDate: '2026-04-10',
  });

  useEffect(() => {
    void loadMetadata().then(setMetadata).catch(() => undefined);
  }, []);

  const parsedGoal: UserGoal = {
    proteinTarget: Number(proteinTargetInput),
    calorieTarget: Number(calorieTargetInput),
  };

  const goalError = validateGoal(parsedGoal);
  const activeGoal = goalError ? DEFAULT_GOAL : parsedGoal;

  const { bestMatch, hasNoResults } = useFoodSearch(foods, searchQuery);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSelectedFoodId(bestMatch?.id ?? null);
    }
  }, [bestMatch, searchQuery]);

  const visibleFoods = useFilteredFoods(foods, selectedCategories);
  const selectedFood = useSelectedFood(foods, selectedFoodId);

  useEffect(() => {
    if (selectedFood && !selectedCategories.has(selectedFood.category)) {
      setSelectedFoodId(null);
    }
  }, [selectedCategories, selectedFood]);

  const selectedFoodVisible = selectedFood ? visibleFoods.some((food) => food.id === selectedFood.id) : false;
  const plotFoods = selectedFoodVisible || !selectedFood ? visibleFoods : [...visibleFoods, selectedFood];
  const { ratio, points } = useGoalLine(activeGoal, visibleFoods);

  const categoryCounts = useMemo(() => {
    return foods.reduce<Record<FoodCategory, number>>(
      (accumulator, food) => {
        accumulator[food.category] += 1;
        return accumulator;
      },
      {
        Dairy: 0,
        Meat: 0,
        Fish: 0,
        Eggs: 0,
        Legumes: 0,
        Grains: 0,
        Fruit: 0,
        Vegetables: 0,
        NutsSeeds: 0,
        FatsOils: 0,
        SnacksDesserts: 0,
        Beverages: 0,
        Other: 0,
      },
    );
  }, [foods]);

  const handleToggleCategory = (category: FoodCategory) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleClearCategories = () => {
    setSelectedCategories(new Set());
    setSelectedFoodId(null);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedFoodId(null);
    setSelectedCategories(new Set(FOOD_CATEGORIES));
    setProteinTargetInput(DEFAULT_GOAL_INPUTS.proteinTargetInput);
    setCalorieTargetInput(DEFAULT_GOAL_INPUTS.calorieTargetInput);
  };

  return (
    <PageShell>
      <Header />
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!isLoading && !error ? (
        <main className="app-grid">
          <div className="left-column">
            <Panel title="Controls" subtitle="Define the target line, search for foods, and filter the dataset.">
              <GoalInputs
                proteinTargetInput={proteinTargetInput}
                calorieTargetInput={calorieTargetInput}
                goalError={goalError}
                onProteinTargetChange={setProteinTargetInput}
                onCalorieTargetChange={setCalorieTargetInput}
              />
              <SearchBar value={searchQuery} hasNoResults={hasNoResults} onChange={setSearchQuery} />
              <CategoryFilter
                selectedCategories={selectedCategories}
                counts={categoryCounts}
                onToggle={handleToggleCategory}
                onClearAll={handleClearCategories}
              />
              <ResetButton onReset={handleReset} />
            </Panel>
            <Panel title="Selection" subtitle="Use the plot or search to inspect a specific food.">
              <SelectedFoodBadge name={selectedFood?.name ?? null} />
              <FoodDetailsCard food={selectedFood} goal={activeGoal} />
            </Panel>
          </div>
          <div className="right-column">
            <Panel title="Ashby-style food plot" subtitle="x-axis = calories per 100 g, y-axis = protein per 100 g.">
              <SummaryStats totalFoods={foods.length} visibleFoods={visibleFoods.length} ratio={ratio} />
              {visibleFoods.length === 0 ? (
                <PlotEmptyState />
              ) : (
                <FoodScatterPlot
                  foods={plotFoods}
                  selectedFoodId={selectedFoodId}
                  selectedCategories={selectedCategories}
                  categoryColors={categoryColors}
                  goalLinePoints={points}
                  onSelectFood={setSelectedFoodId}
                />
              )}
              <PlotLegend />
            </Panel>
          </div>
        </main>
      ) : null}
      <Footer datasetName={metadata.datasetName} version={metadata.version} buildDate={metadata.buildDate} />
    </PageShell>
  );
}
