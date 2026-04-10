# Ashby Nutrition Website

An interactive nutrition visualization tool that maps foods by calories and protein density, helping users compare foods against a personalized protein-to-calorie target line.

## Live Demo

After GitHub Pages is enabled for GitHub Actions, the expected URL is:

`https://pantelis-k.github.io/Ashby-Nutrition-Website/`

## Features

- Plotly-powered interactive scatter plot with zoom, pan, hover tooltips, and click-to-select behavior
- Goal inputs for protein and calorie targets with a live target line through the origin
- Ranked food search with automatic best-match highlighting
- Category filter chips for fast dataset slicing
- Selected food details card with target classification and protein/calorie ratio
- Static normalized dataset in `public/data/foods.json`
- Repository abstraction so the data source can later switch to an API-backed implementation
- GitHub Pages deployment workflow via GitHub Actions

## Stack

- React
- TypeScript
- Vite
- Plotly via `react-plotly.js`

## Architecture

The app is intentionally split so business logic and data access live outside the UI.

- `src/domain`: models, nutrition math, goal line logic, classification, validation, category colors
- `src/data`: repository interface, static repository, and food search/filter queries
- `src/hooks`: orchestration hooks that prepare data for the UI
- `src/components`: layout, controls, plot, feedback, and details components
- `public/data`: runtime JSON dataset and metadata consumed by the static repository

### Repository boundary

UI components do not fetch `foods.json` directly. They read data through `StaticFoodRepository`, which implements the `FoodRepository` interface:

- `getFoods()`
- `getFoodById(id)`
- `searchFoods(query)`

That keeps the UI stable if a future `ApiFoodRepository` replaces the static implementation.

## Local Setup

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`
3. Build the production bundle:
   `npm run build`
4. Preview the production build locally:
   `npm run preview`

## Data Notes

- All nutrition values are normalized to `per 100 g`
- Runtime data lives in `public/data/foods.json`
- Metadata lives in `public/data/metadata.json`
- The sample dataset is curated to demonstrate all required UI features and category coverage

## Deployment Notes

The project is configured for the GitHub repository `Ashby-Nutrition-Website`, so `vite.config.ts` uses:

`base: '/Ashby-Nutrition-Website/'`

The workflow at `.github/workflows/deploy.yml`:

- installs dependencies with `npm ci`
- builds the Vite app
- uploads `dist/` as the Pages artifact
- deploys through `actions/deploy-pages`

## GitHub Pages Checklist

In the GitHub repository settings, confirm:

1. `Settings -> Pages -> Build and deployment -> Source` is set to `GitHub Actions`
2. The default branch is `main`
3. Actions are enabled for the repository
4. The first workflow run completes successfully after pushing

## Extending Later

To move from the static dataset to an API later:

1. Create an `ApiFoodRepository` implementing the same `FoodRepository` interface
2. Swap the repository instance used by `useFoods`
3. Keep domain logic and UI components unchanged
