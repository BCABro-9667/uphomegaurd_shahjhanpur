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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* Desktop & Mobile Main Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Left Side: UP Home Guard Logo & Title on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0 flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 bg-slate-50 rounded-xl p-1 border border-slate-200 shadow-2xs">
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
                  <div className="w-full h-full bg-blue-900 text-amber-400 rounded-lg flex flex-col items-center justify-center font-bold text-[10px] leading-tight text-center p-0.5">
                    <ShieldCheck className="w-5 h-5 text-amber-300 mb-0.5" />
                    <span>UP HG</span>
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center" title="Live Portal Active">
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                </span>
              </div>

              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-blue-800 tracking-wider uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-600" /> शाहजहांपुर (UP)
                </span>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                  <span className="text-blue-950">UP HomeGaurd</span>{' '}
                  <span className="text-orange-600">Shahjahanpur</span>
                </h1>
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

          {/* Mobile Center: Refresh Button Centered in the Header */}
          <div className="flex sm:hidden items-center justify-center w-full pt-1">
            <button
              id="btn-header-refresh-mobile"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200 border border-slate-300 rounded-full shadow-2xs active:scale-95 disabled:opacity-60 transition cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
              <span>रीफ्रेश डेटा (Refresh Live)</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
