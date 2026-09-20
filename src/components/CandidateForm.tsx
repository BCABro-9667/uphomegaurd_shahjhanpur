import React, { useState, useEffect } from 'react';
import { CategoryType, GenderType, ShiftType, SHIFT_OPTIONS, CandidateSubmission } from '../types';
import { getCutoffFor, calculateExtra } from '../data/cutoffs';
import { UserPlus, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface CandidateFormProps {
  onSuccess: (candidate: CandidateSubmission) => void;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderType>('Male');
  const [category, setCategory] = useState<CategoryType>('UR');
  const [shift, setShift] = useState<ShiftType>('1st – 25 April');
  const [marks, setMarks] = useState('');
  const [extra, setExtra] = useState('');
  const [isExtraManuallyEdited, setIsExtraManuallyEdited] = useState(false);
  const [normalization, setNormalization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Current benchmark cutoff based on active category + gender
  const currentCutoff = getCutoffFor(category, gender);

  // Auto-calculate "extra" [Marks - Cutoff] whenever marks, gender, or category changes
  useEffect(() => {
    if (!isExtraManuallyEdited) {
      const parsed = parseFloat(marks);
      if (!isNaN(parsed) && parsed > 0) {
        const computed = calculateExtra(parsed, category, gender);
        setExtra(computed.toString());
      } else {
        setExtra('');
      }
    }
  }, [marks, category, gender, isExtraManuallyEdited]);

  const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMarks(e.target.value);
    // If user changes marks, allow recalculation of extra
    setIsExtraManuallyEdited(false);
  };

  const handleExtraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExtra(e.target.value);
    setIsExtraManuallyEdited(true);
  };

  const handleResetExtraToAuto = () => {
    setIsExtraManuallyEdited(false);
    const parsed = parseFloat(marks);
    if (!isNaN(parsed) && parsed > 0) {
      const computed = calculateExtra(parsed, category, gender);
      setExtra(computed.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim()) {
      setFormError('कृपया अभ्यर्थी का नाम दर्ज करें (Please enter candidate name)');
      return;
    }

    const parsedMarks = parseFloat(marks);
    if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
      setFormError('कृपया मान्य प्राप्तांक (0-100) दर्ज करें (Please enter marks between 0-100)');
      return;
    }

    // Parse normalization if entered
    let formattedNorm = '0.00';
    if (normalization.trim() !== '') {
      const parsedNorm = parseFloat(normalization);
      if (isNaN(parsedNorm)) {
        setFormError('Normalization केवल संख्यात्मक (numeric) होना चाहिए');
        return;
      }
      formattedNorm = parsedNorm.toFixed(2);
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        gender,
        category,
        shift,
        marks: parsedMarks,
        extra: extra !== '' ? parseFloat(extra) : calculateExtra(parsedMarks, category, gender),
        normalization: formattedNorm,
      };

      let candidateResult: CandidateSubmission | null = null;

      try {
        const res = await fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.candidate) {
            candidateResult = data.candidate;
          }
        }
      } catch (networkErr) {
        console.warn('Backend API unavailable, using offline client storage:', networkErr);
      }

      // Offline / Static fallback for Netlify and direct deployments
      if (!candidateResult) {
        const cutoffVal = getCutoffFor(category, gender);
        const extraVal = extra !== '' ? parseFloat(extra) : calculateExtra(parsedMarks, category, gender);
        candidateResult = {
          id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: name.trim(),
          gender,
          category,
          shift,
          marks: parsedMarks,
          cutoff: cutoffVal,
          extra: extraVal,
          normalization: formattedNorm,
          createdAt: new Date().toISOString(),
        };
      }

      onSuccess(candidateResult);
      setFormSuccess(`अभ्यर्थी ${name.trim()} का डेटा सफलतापूर्वक दर्ज हुआ!`);

      // Reset form
      setName('');
      setMarks('');
      setExtra('');
      setIsExtraManuallyEdited(false);
      setNormalization('');

      setTimeout(() => {
        setFormSuccess(null);
      }, 4000);
    } catch (err: any) {
      setFormError(err.message || 'Submitting failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericExtra = parseFloat(extra);
  const isPositiveExtra = !isNaN(numericExtra) && numericExtra >= 0;

  return (
    <div id="candidate-entry-card" className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-800 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </span>
            <span>नया अभ्यर्थी डेटा प्रविष्टि (Candidate Score Entry)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            सभी विवरण दर्ज करें • कटऑफ से अतिरिक्त अंतर स्वचालित परिकलित होता है
          </p>
        </div>
      </div>

      {formError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Horizontal Form Layout */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          
          {/* 1. Name (Full width on mobile, 1 col on lg) */}
          <div className="col-span-2 lg:col-span-1 flex flex-col">
            <label htmlFor="field-name" className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Name (नाम)</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              id="field-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. राहुल कुमार"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* 2. Gender (Row 1 on mobile, left) */}
          <div className="col-span-1 lg:col-span-1 flex flex-col">
            <label htmlFor="field-gender" className="text-xs font-bold text-slate-700 mb-1">
              Gender (लिंग)
            </label>
            <select
              id="field-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as GenderType)}
              className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            >
              <option value="Male">Male (पुरुष)</option>
              <option value="Female">Female (महिला)</option>
            </select>
          </div>

          {/* 3. Category (Row 1 on mobile, right) */}
          <div className="col-span-1 lg:col-span-1 flex flex-col">
            <label htmlFor="field-category" className="text-xs font-bold text-slate-700 mb-1">
              Category (श्रेणी)
            </label>
            <select
              id="field-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-800"
            >
              <option value="UR">UR (सामान्य)</option>
              <option value="EWS">EWS</option>
              <option value="OBC">OBC (अन्य)</option>
              <option value="SC">SC (अ.जा.)</option>
              <option value="ST">ST (अ.जन.)</option>
            </select>
          </div>

          {/* 4. Marks (Row 2 on mobile, left) */}
          <div className="col-span-1 lg:col-span-1 flex flex-col">
            <label htmlFor="field-marks" className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Marks (प्राप्तांक)</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              id="field-marks"
              type="number"
              step="any"
              min="0"
              max="100"
              required
              value={marks}
              onChange={handleMarksChange}
              placeholder="e.g. 62.50"
              className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono font-bold text-blue-900"
            />
          </div>

          {/* 5. Extra Marks (Row 2 on mobile, right) */}
          <div className="col-span-1 lg:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-extra" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Extra (अतिरिक्त)</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </label>
              {isExtraManuallyEdited && (
                <button
                  type="button"
                  onClick={handleResetExtraToAuto}
                  className="text-[10px] text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5"
                  title="Reset to automatic calculation"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Auto
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="field-extra"
                type="number"
                step="any"
                value={extra}
                onChange={handleExtraChange}
                placeholder="Marks - Cutoff"
                className={`w-full px-2.5 py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono font-bold transition-all ${
                  extra !== ''
                    ? isPositiveExtra
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 focus:ring-emerald-500 focus:border-emerald-500'
                      : 'bg-rose-50/70 border-rose-300 text-rose-800 focus:ring-rose-500 focus:border-rose-500'
                    : 'bg-slate-50/70 border-slate-300 text-slate-700 focus:ring-blue-500'
                }`}
                title="Autofilled from (Marks - Cutoff). You can also click to edit manually."
              />
              {extra !== '' && (
                <span className={`absolute right-1.5 top-2.5 text-[8px] font-extrabold uppercase px-1 py-0.2 rounded pointer-events-none ${
                  isPositiveExtra ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200/80 text-rose-900'
                }`}>
                  {isPositiveExtra ? '+QUAL' : '-BELOW'}
                </span>
              )}
            </div>
          </div>

          {/* 6. Shift Selection (Row 3 on mobile, left) */}
          <div className="col-span-1 lg:col-span-1 flex flex-col">
            <label htmlFor="field-shift" className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Shift (शिफ्ट)</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              id="field-shift"
              value={shift}
              onChange={(e) => setShift(e.target.value as ShiftType)}
              className="w-full px-2 py-2 text-xs sm:text-sm bg-blue-50/50 border border-blue-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-blue-900"
            >
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 7. Normalization (Row 3 on mobile, right) - Strictly numeric */}
          <div className="col-span-1 lg:col-span-1 flex flex-col">
            <label htmlFor="field-normalization" className="text-xs font-bold text-slate-700 mb-1">
              Normalization
            </label>
            <input
              id="field-normalization"
              type="number"
              step="any"
              value={normalization}
              onChange={(e) => setNormalization(e.target.value)}
              placeholder="0.00"
              className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono font-medium text-slate-800"
            />
          </div>

        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>अंक दर्ज करते ही Cutoff से अंतर Extra कॉलम में स्वतः आ जाएगा • उपयोगकर्ता पुनः भी बदल सकते हैं</span>
          </div>

          <button
            id="btn-submit-candidate"
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>सुरक्षित किया जा रहा है...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>डेटा दर्ज करें (Submit Score)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

