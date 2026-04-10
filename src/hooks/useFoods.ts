import { useEffect, useMemo, useState } from 'react';
import type { Food } from '../domain/models/Food';
import { StaticFoodRepository } from '../data/repositories/StaticFoodRepository';
import { validateFood } from '../domain/validators/foodValidators';

const repository = new StaticFoodRepository();

export function useFoods() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFoods() {
      try {
        setIsLoading(true);
        const loadedFoods = await repository.getFoods();
        const validationError = loadedFoods.flatMap(validateFood)[0] ?? null;

        if (!cancelled) {
          if (validationError) {
            setError(`Dataset validation failed: ${validationError}`);
            setFoods([]);
          } else {
            setFoods(loadedFoods);
            setError(null);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error');
          setFoods([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFoods();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({ foods, isLoading, error, repository }),
    [error, foods, isLoading],
  );
}
