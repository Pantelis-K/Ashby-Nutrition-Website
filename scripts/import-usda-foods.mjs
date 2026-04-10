import path from 'node:path';
import {
  foodsPath,
  foodCategories,
  metadataPath,
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
  caloriesPer100g: ['208', '1008', 'Energy'],
  proteinPer100g: ['203', '1003', 'Protein'],
  carbsPer100g: ['205', '1005', 'Carbohydrate, by difference'],
  fatPer100g: ['204', '1004', 'Total lipid (fat)'],
  fiberPer100g: ['291', '1079', 'Fiber, total dietary'],
  sugarPer100g: ['269', '2000', 'Sugars, total including NLEA'],
  sodiumMgPer100g: ['307', '1093', 'Sodium, Na'],
};

function parseArguments(argv) {
  const options = {
    input: path.join(repoRoot, 'scripts', 'usda-foods.json'),
    version: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--input') {
      options.input = path.resolve(repoRoot, argv[index + 1] ?? '');
      index += 1;
    } else if (current === '--version') {
      options.version = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return options;
}

function getNutrientValue(foodDetails, matchers) {
  const nutrients = Array.isArray(foodDetails.foodNutrients) ? foodDetails.foodNutrients : [];

  for (const nutrient of nutrients) {
    const number = String(nutrient.nutrient?.number ?? nutrient.number ?? '').trim();
    const name = String(nutrient.nutrient?.name ?? nutrient.name ?? '').trim();
    const amount = nutrient.amount;

    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      continue;
    }

    if (matchers.includes(number) || matchers.includes(name)) {
      return amount;
    }
  }

  return null;
}

function buildFoodRecord(entry, foodDetails) {
  const macros = {};

  for (const [field, matchers] of Object.entries(nutrientMatchers)) {
    const nutrientValue = getNutrientValue(foodDetails, matchers);
    const overrideValue = entry.overrides?.[field];
    const resolvedValue = overrideValue ?? nutrientValue;

    if (resolvedValue != null) {
      macros[field] = roundToTenth(resolvedValue);
    }
  }

  for (const requiredField of ['caloriesPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g']) {
    if (!Number.isFinite(macros[requiredField])) {
      throw new Error(`Missing required nutrient "${requiredField}" for USDA food ${entry.fdcId}.`);
    }
  }

  const id = entry.id ?? slugify(entry.name);
  const sourceName = entry.sourceName ?? `USDA FoodData Central (${foodDetails.dataType ?? 'food'})`;

  return {
    id,
    name: entry.name,
    category: entry.category,
    caloriesPer100g: macros.caloriesPer100g,
    proteinPer100g: macros.proteinPer100g,
    carbsPer100g: macros.carbsPer100g,
    fatPer100g: macros.fatPer100g,
    ...(typeof macros.fiberPer100g === 'number' ? { fiberPer100g: macros.fiberPer100g } : {}),
    ...(typeof macros.sugarPer100g === 'number' ? { sugarPer100g: macros.sugarPer100g } : {}),
    ...(typeof macros.sodiumMgPer100g === 'number' ? { sodiumMgPer100g: macros.sodiumMgPer100g } : {}),
    ...(Array.isArray(entry.aliases) && entry.aliases.length > 0 ? { aliases: entry.aliases } : {}),
    source: {
      system: 'usda-fdc',
      sourceId: String(entry.fdcId),
      sourceName,
    },
    plot: {
      x: macros.caloriesPer100g,
      y: macros.proteinPer100g,
    },
  };
}

async function fetchFoodDetails(fdcId, apiKey) {
  const url = `https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(fdcId)}?api_key=${encodeURIComponent(apiKey)}`;
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error
      ? ` Cause: ${error.cause.message}`
      : '';
    throw new Error(
      `Network request to USDA failed for food ${fdcId}. Check your internet connection, firewall/proxy settings, and whether https://api.nal.usda.gov is reachable from this machine.${cause}`,
    );
  }

  if (!response.ok) {
    throw new Error(`USDA request failed for ${fdcId}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  const { input, version } = parseArguments(process.argv.slice(2));
  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    throw new Error('Set USDA_API_KEY before running the USDA import script.');
  }

  const importEntries = await readJson(input);
  if (!Array.isArray(importEntries) || importEntries.length === 0) {
    throw new Error(`Import manifest must be a non-empty array: ${input}`);
  }

  for (const [index, entry] of importEntries.entries()) {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Import manifest entry ${index} must be an object.`);
    }

    if (!entry.fdcId) {
      throw new Error(`Import manifest entry ${index} is missing fdcId.`);
    }

    if (!entry.name || typeof entry.name !== 'string') {
      throw new Error(`Import manifest entry ${index} is missing name.`);
    }

    if (!foodCategories.includes(entry.category)) {
      throw new Error(`Import manifest entry ${index} uses invalid category "${entry.category}".`);
    }
  }

  const currentFoods = await readJson(foodsPath);
  const metadata = await readJson(metadataPath);
  const importedFoods = [];

  for (const entry of importEntries) {
    const foodDetails = await fetchFoodDetails(entry.fdcId, apiKey);
    importedFoods.push(buildFoodRecord(entry, foodDetails));
  }

  const merged = new Map(currentFoods.map((food) => [food.id, food]));
  for (const food of importedFoods) {
    merged.set(food.id, food);
  }

  const nextFoods = sortFoods([...merged.values()]);
  const nextMetadata = {
    ...metadata,
    ...(version ? { version } : {}),
    buildDate: todayIsoDate(),
    foodCount: nextFoods.length,
  };

  const errors = validateFoods(nextFoods, nextMetadata);
  if (errors.length > 0) {
    throw new Error(`Merged dataset failed validation:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  await writeJson(foodsPath, nextFoods);
  await writeJson(metadataPath, nextMetadata);

  console.log(`Imported ${importedFoods.length} USDA foods. Dataset now contains ${nextFoods.length} foods.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
