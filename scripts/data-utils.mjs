import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const repoRoot = path.resolve(import.meta.dirname, '..');
export const foodsPath = path.join(repoRoot, 'public', 'data', 'foods.json');
export const metadataPath = path.join(repoRoot, 'public', 'data', 'metadata.json');

export const foodCategories = [
  'Dairy',
  'Meat',
  'Fish',
  'Eggs',
  'Legumes',
  'Grains',
  'Fruit',
  'Vegetables',
  'NutsSeeds',
  'FatsOils',
  'SnacksDesserts',
  'Beverages',
  'Other',
];

const categoryOrder = new Map(foodCategories.map((category, index) => [category, index]));

export async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function readTextIfExists(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function roundToTenth(value) {
  return Math.round(value * 10) / 10;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function readLocalEnvFile(fileName = '.env.local') {
  const filePath = path.join(repoRoot, fileName);
  const raw = await readTextIfExists(filePath);
  if (!raw) {
    return {};
  }

  const entries = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      entries[key] = value;
    }
  }

  return entries;
}

export function getUsdaApiKey(localEnv = {}) {
  return process.env.USDA_API_KEY || localEnv.USDA_API_KEY || 'DEMO_KEY';
}

export function sortFoods(foods) {
  return [...foods].sort((left, right) => {
    const leftCategory = categoryOrder.get(left.category) ?? Number.MAX_SAFE_INTEGER;
    const rightCategory = categoryOrder.get(right.category) ?? Number.MAX_SAFE_INTEGER;

    if (leftCategory !== rightCategory) {
      return leftCategory - rightCategory;
    }

    return left.name.localeCompare(right.name);
  });
}

export function validateFoods(foods, metadata) {
  const errors = [];
  const seenIds = new Set();

  if (!Array.isArray(foods)) {
    errors.push('Dataset root must be an array.');
    return errors;
  }

  foods.forEach((food, index) => {
    const label = `foods[${index}]`;

    if (!food || typeof food !== 'object') {
      errors.push(`${label} must be an object.`);
      return;
    }

    if (!food.id || typeof food.id !== 'string') {
      errors.push(`${label} is missing a string id.`);
    } else if (seenIds.has(food.id)) {
      errors.push(`${label} uses duplicate id "${food.id}".`);
    } else {
      seenIds.add(food.id);
    }

    if (!food.name || typeof food.name !== 'string') {
      errors.push(`${label} is missing a string name.`);
    }

    if (!foodCategories.includes(food.category)) {
      errors.push(`${label} uses invalid category "${food.category}".`);
    }

    for (const field of ['caloriesPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g']) {
      const value = food[field];
      if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
        errors.push(`${label}.${field} must be a non-negative number.`);
      }
    }

    for (const field of ['fiberPer100g', 'sugarPer100g', 'sodiumMgPer100g']) {
      if (field in food) {
        const value = food[field];
        if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
          errors.push(`${label}.${field} must be a non-negative number when present.`);
        }
      }
    }

    if (food.aliases && (!Array.isArray(food.aliases) || food.aliases.some((alias) => typeof alias !== 'string'))) {
      errors.push(`${label}.aliases must be an array of strings when present.`);
    }

    if (!food.source || typeof food.source !== 'object' || typeof food.source.system !== 'string') {
      errors.push(`${label}.source.system is required.`);
    }

    if (!food.plot || typeof food.plot !== 'object') {
      errors.push(`${label}.plot is required.`);
    } else {
      if (food.plot.x !== food.caloriesPer100g) {
        errors.push(`${label}.plot.x must match caloriesPer100g.`);
      }

      if (food.plot.y !== food.proteinPer100g) {
        errors.push(`${label}.plot.y must match proteinPer100g.`);
      }
    }
  });

  if (metadata) {
    if (typeof metadata.foodCount === 'number' && metadata.foodCount !== foods.length) {
      errors.push(`metadata.foodCount (${metadata.foodCount}) does not match foods length (${foods.length}).`);
    }

    if (metadata.unitBasis && metadata.unitBasis !== 'per 100 g') {
      errors.push(`metadata.unitBasis must stay "per 100 g".`);
    }
  }

  return errors;
}
