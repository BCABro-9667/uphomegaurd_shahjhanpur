import React, { useState } from 'react';
import { OFFICIAL_CUTOFFS } from '../data/cutoffs';
import { Award, ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';

export const CutoffReferenceCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div id="official-cutoff-card" className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      <div 
        className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50/40 flex items-center justify-between cursor-pointer border-b border-slate-200/60"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-blue-100/80 text-blue-700 rounded-lg">
            <Award className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>आधिकारिक कटऑफ तालिका (Official Cutoff Benchmark)</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                District Shahjahanpur
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              User-Verified Official Cutoff Scores from Official UP HG Notification
            </p>
          </div>
        </div>

        <button 
          id="btn-toggle-cutoff"
          type="button" 
          className="text-xs font-semibold text-blue-700 flex items-center gap-1 hover:text-blue-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
        >
          <span>{isExpanded ? 'Hide Table' : 'View Cutoff'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Cutoff Table */}
      <div className={`${isExpanded ? 'block' : 'hidden sm:block'} overflow-x-auto`}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3.5 w-14 text-center">S.No.</th>
              <th className="py-2.5 px-4 font-bold text-slate-900">Category (वर्ग)</th>
              <th className="py-2.5 px-4 text-blue-900 font-bold">Male Cutoff (पुरुष)</th>
              <th className="py-2.5 px-4 text-rose-900 font-bold">Female Cutoff (महिला)</th>
              <th className="py-2.5 px-4 text-slate-600 hidden md:table-cell">Eligibility Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {OFFICIAL_CUTOFFS.map((item) => (
              <tr key={item.category} className="hover:bg-blue-50/30 transition-colors">
                <td className="py-2.5 px-3.5 text-center font-bold text-slate-400">{item.sNo}</td>
                <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    item.category === 'UR' ? 'bg-indigo-500' :
                    item.category === 'EWS' ? 'bg-amber-500' :
                    item.category === 'OBC' ? 'bg-blue-500' :
                    item.category === 'SC' ? 'bg-emerald-500' : 'bg-purple-500'
                  }`} />
                  <span>{item.category}</span>
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                  {item.maleCutoff.toFixed(5)}
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-rose-700">
                  {item.femaleCutoff !== null ? item.femaleCutoff.toFixed(5) : '-'}
                </td>
                <td className="py-2.5 px-4 text-slate-500 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    <CheckCircle2 className="w-3 h-3" /> Baseline Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
