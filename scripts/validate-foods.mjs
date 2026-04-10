import { foodsPath, metadataPath, readJson, validateFoods } from './data-utils.mjs';

async function main() {
  const foods = await readJson(foodsPath);
  const metadata = await readJson(metadataPath);
  const errors = validateFoods(foods, metadata);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${foods.length} foods against the static dataset schema.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
