import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Award, MapPin } from 'lucide-react';

interface HeaderProps {
  totalCount?: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isRefreshing = false }) => {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = 'https://homeguard.up.gov.in/hmgContent/webportal/assets/images/hg_logo.png';

  return (
    <header id="main-header" className="bg-white/95 backdrop-blur-xs border-b border-slate-200 sticky top-0 z-30 shadow-2xs w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        {/* Desktop & Mobile Main Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left Side: UP Home Guard Logo & Header Content */}
          <div className="flex items-center gap-3 sm:gap-3.5 w-full sm:w-auto">
            {/* Big Logo on Mobile (Left side, height equal to heading + refresh button) */}
            <div className="relative shrink-0 flex items-center justify-center w-[74px] h-[74px] sm:w-13 sm:h-13 bg-slate-50 rounded-2xl sm:rounded-xl p-1.5 sm:p-1 border border-slate-200 shadow-xs">
              {!logoError ? (
                <img
                  id="up-homeguard-logo"
                  src={logoUrl}
                  alt="UP Home Guard Official Emblem"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full bg-blue-900 text-amber-400 rounded-xl sm:rounded-lg flex flex-col items-center justify-center font-bold text-xs sm:text-[10px] leading-tight text-center p-0.5">
                  <ShieldCheck className="w-7 h-7 sm:w-5 sm:h-5 text-amber-300 mb-0.5" />
                  <span>UP HG</span>
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center" title="Live Portal Active">
                <span className="w-1.5 h-1.5 sm:w-1 sm:h-1 bg-white rounded-full"></span>
              </span>
            </div>

            {/* Header Content: Centered on Mobile, Left-aligned on Desktop */}
            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left justify-center min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 tracking-wider uppercase flex items-center gap-1 justify-center sm:justify-start">
                <MapPin className="w-3 h-3 text-orange-600 shrink-0" /> शाहजहांपुर (UP)
              </span>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                <span className="text-blue-950">UP HomeGaurd</span>{' '}
                <span className="text-orange-600">Shahjahanpur</span>
              </h1>

              {/* Mobile Refresh Button: Centered under heading, matching logo height */}
              <div className="flex sm:hidden mt-1 justify-center">
                <button
                  id="btn-header-refresh-mobile"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs active:scale-95 disabled:opacity-60 transition cursor-pointer"
                  title="Refresh live data"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
                  <span>रीफ्रेश (Refresh Live)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center Title for Desktop */}
          <div className="hidden sm:flex flex-col items-center text-center flex-1 px-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/60 mb-0.5">
              <Award className="w-3.5 h-3.5 text-blue-700" />
              <span>उत्तर प्रदेश होमगार्ड भर्ती परीक्षा • मेरिट कटऑफ समीक्षा</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              अभ्यर्थी प्राप्तांक एवं कटऑफ अंतर लाइव विश्लेषण (Live Cutoff Analysis)
            </p>
          </div>

          {/* Desktop Right Side: Refresh Button */}
          <div className="hidden sm:flex items-center justify-end">
            <button
              id="btn-header-refresh"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs hover:border-slate-400 transition active:scale-95 disabled:opacity-60 cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
              <span>रीफ्रेश / Refresh</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
