import {
  foodsPath,
  getUsdaApiKey,
  metadataPath,
  readLocalEnvFile,
  readJson,
  repoRoot,
  roundToTenth,
  slugify,
  sortFoods,
  todayIsoDate,
  validateFoods,
  writeJson,
} from './data-utils.mjs';

const nutrientMatchers = {
  caloriesPer100g: ['208', '1008', 'Energy', 'Energy (Atwater General Factors)', 'Energy (Atwater Specific Factors)'],
  proteinPer100g: ['203', '1003', 'Protein'],
  carbsPer100g: ['205', '1005', '205.2', 'Carbohydrate, by difference', 'Carbohydrate, by summation'],
  fatPer100g: ['204', '1004', 'Total lipid (fat)'],
  fiberPer100g: ['291', '1079', 'Fiber, total dietary'],
  sugarPer100g: ['269', '2000', 'Total Sugars', 'Sugars, Total'],
  sodiumMgPer100g: ['307', '1093', 'Sodium, Na'],
};

function parseArguments(argv) {
  const options = {
    version: null,
    pageSize: 200,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--version') {
      options.version = argv[index + 1] ?? null;
      index += 1;
    } else if (current === '--page-size') {
      options.pageSize = Number(argv[index + 1] ?? options.pageSize);
      index += 1;
    }
  }

  return options;
}

function getNutrientValue(food, matchers) {
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];

  for (const nutrient of nutrients) {
    const number = String(nutrient.nutrientNumber ?? nutrient.nutrient?.number ?? nutrient.number ?? '').trim();
    const name = String(nutrient.nutrientName ?? nutrient.nutrient?.name ?? nutrient.name ?? '').trim();
    const value = nutrient.value ?? nutrient.amount;

    if (typeof value !== 'number' || Number.isNaN(value)) {
      continue;
    }

    if (matchers.includes(number) || matchers.includes(name)) {
      return value;
    }
  }

  return null;
}

function normalizeDescription(description) {
  return description.replace(/\s+/g, ' ').trim();
}

function parseAliases(commonNames) {
  if (!commonNames || typeof commonNames !== 'string') {
    return [];
  }

  return commonNames
    .split(/[;,|]/)
    .map((alias) => alias.trim())
    .filter(Boolean);
}

function looksLikeDairy(description) {
  return /milk|cheese|yogurt|yoghurt|kefir|cream|whey|casein|curd|buttermilk/.test(description);
}

function looksLikeEgg(description) {
  return /\begg\b|albumen|egg white|egg yolk/.test(description);
}

function normalizeMacroValue(field, value) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  if (value < 0) {
    if (field === 'carbsPer100g' && value > -0.5) {
      return 0;
    }

    return null;
  }

  return roundToTenth(value);
}

function inferCategory(food) {
  const category = String(food.foodCategory ?? '').toLowerCase();
  const description = normalizeDescription(String(food.description ?? '')).toLowerCase();

  if (/oil|butter|ghee|lard|tallow/.test(description)) {
    return 'FatsOils';
  }

  if (looksLikeEgg(description)) {
    return 'Eggs';
  }

  if (looksLikeDairy(description) || category.includes('dairy')) {
    return 'Dairy';
  }

  if (
    category.includes('beef')
    || category.includes('poultry')
    || category.includes('pork')
    || category.includes('lamb')
    || category.includes('veal')
    || category.includes('game')
    || category.includes('sausage')
    || category.includes('luncheon')
  ) {
    return 'Meat';
  }

  if (category.includes('finfish') || category.includes('shellfish')) {
    return 'Fish';
  }

  if (category.includes('legume')) {
    return 'Legumes';
  }

  if (category.includes('grain') || category.includes('pasta') || category.includes('baked')) {
    return 'Grains';
  }

  if (category.includes('fruit')) {
    return 'Fruit';
  }

  if (category.includes('vegetable')) {
    return 'Vegetables';
  }

  if (category.includes('nut') || category.includes('seed')) {
    return 'NutsSeeds';
  }

  if (category.includes('beverage')) {
    return 'Beverages';
  }

  return 'Other';
}

function buildFoundationFood(food) {
  const macros = {};

  for (const [field, matchers] of Object.entries(nutrientMatchers)) {
    const value = getNutrientValue(food, matchers);
    const normalized = normalizeMacroValue(field, value);
    if (normalized != null) {
      macros[field] = normalized;
    }
  }

  if (!Number.isFinite(macros.carbsPer100g)) {
    macros.carbsPer100g = 0;
  }

  for (const requiredField of ['caloriesPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g']) {
    if (!Number.isFinite(macros[requiredField])) {
      return null;
    }
  }

  const name = normalizeDescription(String(food.description ?? ''));
  const aliases = parseAliases(food.commonNames);

  return {
    id: `fdc-${food.fdcId}-${slugify(name)}`,
    name,
    category: inferCategory(food),
    caloriesPer100g: macros.caloriesPer100g,
    proteinPer100g: macros.proteinPer100g,
    carbsPer100g: macros.carbsPer100g,
    fatPer100g: macros.fatPer100g,
    ...(typeof macros.fiberPer100g === 'number' ? { fiberPer100g: macros.fiberPer100g } : {}),
    ...(typeof macros.sugarPer100g === 'number' ? { sugarPer100g: macros.sugarPer100g } : {}),
    ...(typeof macros.sodiumMgPer100g === 'number' ? { sodiumMgPer100g: macros.sodiumMgPer100g } : {}),
    ...(aliases.length > 0 ? { aliases } : {}),
    source: {
      system: 'usda-foundation',
      sourceId: String(food.fdcId),
      sourceName: 'USDA FoodData Central Foundation Foods',
    },
    plot: {
      x: macros.caloriesPer100g,
      y: macros.proteinPer100g,
    },
  };
}

async function fetchFoundationPage({ apiKey, pageNumber, pageSize }) {
  const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dataType: ['Foundation'],
      pageNumber,
      pageSize,
    }),
  });

  if (!response.ok) {
    throw new Error(`USDA Foundation request failed for page ${pageNumber}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  const { version, pageSize } = parseArguments(process.argv.slice(2));
  const localEnv = await readLocalEnvFile();
  const apiKey = getUsdaApiKey(localEnv);

  if (apiKey === 'DEMO_KEY') {
    console.log('USDA_API_KEY not found in environment or .env.local. Falling back to DEMO_KEY.');
  }

  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    throw new Error(`Invalid page size: ${pageSize}`);
  }

  const firstPage = await fetchFoundationPage({ apiKey, pageNumber: 1, pageSize });
  const totalHits = Number(firstPage.totalHits ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalHits / pageSize));
  const foods = [...(firstPage.foods ?? [])];

  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    const page = await fetchFoundationPage({ apiKey, pageNumber, pageSize });
    foods.push(...(page.foods ?? []));
  }

  const transformed = foods.map(buildFoundationFood);
  const skippedFoods = transformed.length - transformed.filter(Boolean).length;
  const transformedFoods = sortFoods(transformed.filter(Boolean));

  const currentMetadata = await readJson(metadataPath);
  const nextMetadata = {
    ...currentMetadata,
    datasetName: 'Ashby Nutrition USDA Foundation Foods Dataset',
    ...(version ? { version } : {}),
    buildDate: todayIsoDate(),
    foodCount: transformedFoods.length,
    notes: `Static USDA Foundation Foods snapshot transformed into the Ashby Nutrition website schema from ${totalHits} Foundation records.`,
    sourceSystem: 'usda-foundation',
  };

  const errors = validateFoods(transformedFoods, nextMetadata);
  if (errors.length > 0) {
    throw new Error(`Foundation dataset failed validation:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  await writeJson(foodsPath, transformedFoods);
  await writeJson(metadataPath, nextMetadata);

  const categorySummary = transformedFoods.reduce((accumulator, food) => {
    accumulator[food.category] = (accumulator[food.category] ?? 0) + 1;
    return accumulator;
  }, {});

  console.log(
    JSON.stringify(
      {
        totalHits,
        importedFoods: transformedFoods.length,
        skippedFoods,
        totalPages,
        pageSize,
        categorySummary,
        output: {
          foodsPath,
          metadataPath,
          repoRoot,
        },
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
