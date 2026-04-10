# Ashby Nutrition Website

An interactive nutrition visualization tool that maps foods by calories and protein density, helping users compare foods against a personalized protein-to-calorie target line.

## Live Demo

Live site:

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
- The current runtime dataset is a transformed USDA Foundation Foods snapshot with `323` foods
- `npm run data:validate` validates the static dataset before build output is generated
- `npm run data:import:foundation` replaces the runtime dataset with a USDA Foundation Foods snapshot

## Deployment Notes

This repository is currently configured for deployment to:

`base: '/Ashby-Nutrition-Website/'`

That matches the current GitHub Pages URL for this repository.

If you clone or fork this project and deploy it from a repository with a different name, update `vite.config.ts` so the `base` value matches your repository path.

The workflow at `.github/workflows/deploy.yml`:

- installs dependencies with `npm ci`
- builds the Vite app
- uploads `dist/` as the Pages artifact
- deploys through `actions/deploy-pages`

## Extending Later

To move from the static dataset to an API later:

1. Create an `ApiFoodRepository` implementing the same `FoodRepository` interface
2. Swap the repository instance used by `useFoods`
3. Keep domain logic and UI components unchanged

## Current Repo State

- React 19 + TypeScript + Vite single-page app
- Plotly scatter plot UI with search, category filters, goal line, summary stats, and food details
- Static repository boundary in `src/data/repositories` keeps UI code decoupled from the backing data source
- GitHub Pages deployment is configured through `.github/workflows/deploy.yml`
- Current dataset size: `323` foods from USDA Foundation Foods transformed into the app schema
- Dataset metadata is surfaced in the footer at runtime

## Expanding The Dataset With USDA FoodData Central

The project now includes a small maintenance workflow for curated USDA imports:

- `scripts/import-usda-foods.mjs` fetches USDA FoodData Central records by `fdcId`, maps nutrients into the app schema, merges them into `public/data/foods.json`, and refreshes metadata
- `scripts/import-usda-foundation.mjs` fetches the full USDA Foundation Foods catalog, maps it into the app schema, and replaces the runtime dataset
- `scripts/validate-foods.mjs` checks dataset structure, category values, macro fields, plot coordinates, and metadata count
- `npm run build` now runs dataset validation before the TypeScript and Vite build steps

Recommended workflow:

1. Create `scripts/usda-foods.json` using `scripts/usda-foods.example.json` as the starting shape
2. Add curated entries with:
   `fdcId`, `name`, `category`, optional `id`, optional `aliases`, and optional `overrides`
3. Set your USDA API key in the shell:
   PowerShell: `$env:USDA_API_KEY="your_key_here"`
4. Run:
   `npm run data:import:usda`
5. Validate and build:
   `npm run build`

Notes:

- Keeping `fdcId` in the manifest avoids ambiguous search matching
- The manifest owns your site-facing names, categories, and aliases so USDA source data does not dictate UI copy
- Imported entries are stored with `source.system: "usda-fdc"` and `source.sourceId` set to the USDA food ID
- If USDA returns a value you want to adjust for consistency, add an `overrides` object for the affected nutrient fields
- For bulk Foundation imports, you can optionally place `USDA_API_KEY=...` in a local `.env.local` file at the repo root; it is gitignored
- Cloning this repository does not create a GitHub Pages site automatically; to publish your own copy, push it to your own repository, enable Pages with GitHub Actions, and update the Vite `base` path if your repository name differs
