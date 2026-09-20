export type CategoryType = 'UR' | 'EWS' | 'OBC' | 'SC' | 'ST';

export type GenderType = 'Male' | 'Female';

export type ShiftType =
  | '1st – 25 April'
  | '2nd – 25 April'
  | '1st – 26 April'
  | '2nd – 26 April'
  | '1st – 27 April'
  | '2nd – 27 April';

export const SHIFT_OPTIONS: ShiftType[] = [
  '1st – 25 April',
  '2nd – 25 April',
  '1st – 26 April',
  '2nd – 26 April',
  '1st – 27 April',
  '2nd – 27 April',
];

export interface CutoffEntry {
  sNo: number;
  category: CategoryType;
  maleCutoff: number;
  femaleCutoff: number | null;
}

export interface CandidateSubmission {
  id: string;
  name: string;
  gender: GenderType;
  category: CategoryType;
  shift: ShiftType | string;
  marks: number;
  cutoff: number;
  extra: number;
  normalization: string;
  createdAt: string;
}

export interface StatsResponse {
  total: number;
  avgMarks: number;
  maxMarks: number;
  minMarks: number;
  aboveCutoffCount: number;
  belowCutoffCount: number;
  categoryCounts: Record<CategoryType, number>;
  genderCounts: Record<GenderType, number>;
}
