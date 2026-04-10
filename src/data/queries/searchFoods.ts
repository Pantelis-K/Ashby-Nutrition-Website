import type { Food } from '../../domain/models/Food';

function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreCandidate(query: string, candidate: string, exactBoost: number, startsWithBoost: number, containsBoost: number): number {
  const normalizedCandidate = normalizeTerm(candidate);

  if (normalizedCandidate === query) {
    return exactBoost;
  }

  if (normalizedCandidate.startsWith(query)) {
    return startsWithBoost;
  }

  if (normalizedCandidate.includes(query)) {
    return containsBoost;
  }

  const queryTokens = query.split(' ');
  if (queryTokens.every((token) => normalizedCandidate.includes(token))) {
    return containsBoost - 5;
  }

  return -1;
}

export function searchFoods(foods: Food[], rawQuery: string): Food[] {
  const query = normalizeTerm(rawQuery);
  if (!query) {
    return [];
  }

  return foods
    .map((food) => {
      const nameScore = scoreCandidate(query, food.name, 100, 80, 60);
      const aliasScores = (food.aliases ?? []).map((alias) => scoreCandidate(query, alias, 95, 75, 55));
      const bestAliasScore = aliasScores.length > 0 ? Math.max(...aliasScores) : -1;
      const score = Math.max(nameScore, bestAliasScore);

      return { food, score };
    })
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.food.name.localeCompare(right.food.name);
    })
    .map((entry) => entry.food);
}
