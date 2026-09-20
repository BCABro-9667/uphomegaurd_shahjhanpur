import { CategoryType, CutoffEntry, GenderType } from '../types';

export const OFFICIAL_CUTOFFS: CutoffEntry[] = [
  { sNo: 1, category: 'UR', maleCutoff: 61.28427, femaleCutoff: 55.10147 },
  { sNo: 2, category: 'EWS', maleCutoff: 55.28262, femaleCutoff: 48.75054 },
  { sNo: 3, category: 'OBC', maleCutoff: 55.98458, femaleCutoff: 49.8979 },
  { sNo: 4, category: 'SC', maleCutoff: 52.22163, femaleCutoff: 46.81292 },
  { sNo: 5, category: 'ST', maleCutoff: 25.21985, femaleCutoff: 25.21985 }, // Image shows '-' for female ST, defaulted to category cutoff
];

export function getCutoffFor(category: CategoryType, gender: GenderType): number {
  const item = OFFICIAL_CUTOFFS.find((c) => c.category === category);
  if (!item) return 50.0;
  if (gender === 'Female') {
    return item.femaleCutoff !== null ? item.femaleCutoff : item.maleCutoff;
  }
  return item.maleCutoff;
}

export function calculateExtra(marks: number, category: CategoryType, gender: GenderType): number {
  const cutoff = getCutoffFor(category, gender);
  const diff = marks - cutoff;
  // Format to 5 decimal places precision like the official cutoffs
  return Number(diff.toFixed(5));
}
