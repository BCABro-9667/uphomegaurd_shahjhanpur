import React from 'react';
import { CandidateSubmission } from '../types';
import { Users, TrendingUp, CheckCircle2, Award } from 'lucide-react';

interface StatsCardsProps {
  candidates: CandidateSubmission[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ candidates }) => {
  const total = candidates.length;

  if (total === 0) {
    return null;
  }

  const aboveCutoff = candidates.filter((c) => c.extra >= 0).length;
  const belowCutoff = total - aboveCutoff;
  const abovePercentage = total > 0 ? ((aboveCutoff / total) * 100).toFixed(1) : '0';

  const sumMarks = candidates.reduce((acc, c) => acc + c.marks, 0);
  const avgMarks = (sumMarks / total).toFixed(2);

  const highestScore = Math.max(...candidates.map((c) => c.marks));
  const highestCandidate = candidates.find((c) => c.marks === highestScore);

  return (
    <div id="stats-summary-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-full min-w-0">
      {/* 1. Total Submissions */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 shadow-2xs flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide truncate">कुल अभ्यर्थी (Total)</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg sm:text-2xl font-black text-slate-900">{total}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Verified</span>
          </div>
        </div>
      </div>

      {/* 2. Qualifying (Above Cutoff) */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 shadow-2xs flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide truncate">कटऑफ पार (Above)</p>
          <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
            <span className="text-lg sm:text-2xl font-black text-emerald-700">{aboveCutoff}</span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
              {abovePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Average Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 shadow-2xs flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide truncate">औसत अंक (Average)</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-2xl font-black text-slate-900 font-mono">{avgMarks}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">/ 100</span>
          </div>
        </div>
      </div>

      {/* 4. Top Marks */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 shadow-2xs flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide truncate">सर्वोच्च प्राप्तांक (Top)</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-2xl font-black text-purple-700 font-mono">{highestScore.toFixed(2)}</span>
            {highestCandidate && (
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate max-w-[60px]" title={highestCandidate.name}>
                ({highestCandidate.category})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
