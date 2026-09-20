import React, { useState, useEffect, useCallback } from 'react';
import { CandidateSubmission } from './types';
import { Header } from './components/Header';
import { CandidateForm } from './components/CandidateForm';
import { StatsCards } from './components/StatsCards';
import { CandidateTable } from './components/CandidateTable';
import { WhatsAppButton } from './components/WhatsAppButton';
import { CheckCircle } from 'lucide-react';

export default function App() {
  const [candidates, setCandidates] = useState<CandidateSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<string>('Connecting...');

  // Fetch candidates from backend (with in-memory cache speed)
  const fetchCandidates = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const res = await fetch('/api/candidates');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      if (data.success && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
        setDbStatus(data.dbConnected ? 'MongoDB Atlas Live' : 'High-Speed Memory Cache Active');
      }
    } catch (err) {
      console.warn('Network error fetching candidates:', err);
    } finally {
      setLoading(false);
      if (showRefreshingSpinner) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Initial fetch and continuous live polling (every 5 seconds) for real-time live data without reloading
  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(() => {
      fetchCandidates(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  // Handle new candidate added via CandidateForm
  const handleCandidateAdded = (newCandidate: CandidateSubmission) => {
    setCandidates((prev) => [newCandidate, ...prev]);
  };

  // Handle candidate deletion if needed
  const handleDeleteCandidate = async (id: string) => {
    if (!window.confirm('क्या आप इस प्रविष्टि को हटाना चाहते हैं?')) return;
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans w-full max-w-full overflow-x-hidden min-w-0">
      {/* Official-styled Header */}
      <Header
        totalCount={candidates.length}
        onRefresh={() => fetchCandidates(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area - constrained with min-w-0 and max-w-full to contain horizontal scroll strictly within table */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 min-w-0 max-w-full">
        {/* 1. Summary Stats Cards (Displayed immediately after Header) */}
        <StatsCards candidates={candidates} />

        {/* 2. Candidate Entry Form */}
        <CandidateForm onSuccess={handleCandidateAdded} />

        {/* 3. Candidate Data Table with Search, Multi-sort, Shift, Filters & PDF/CSV Export */}
        <CandidateTable candidates={candidates} />

        {/* Additional Student Guidance Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-600 shadow-2xs">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>डेटा विश्लेषण एवं सुरक्षा निर्देश (Guidelines)</span>
          </h4>
          <p className="leading-relaxed text-slate-500">
            1. <strong>Extra Marks परिकलन</strong>: अभ्यर्थी द्वारा प्राप्तांक (Marks) दर्ज करने पर श्रेणी व लिंग के आधिकारिक कटऑफ के अनुसार Extra अंक स्वतः परिकलित होते हैं। यदि चाहें तो इसे स्वयं भी संशोधित कर सकते हैं।
            <br />
            2. <strong>डेटा सुरक्षा</strong>: सभी आंकड़े हाई-परफॉर्मेंस मोंगोडीबी क्लस्टर और कैश मेमोरी में सुरक्षित संग्रहीत रहते हैं ताकि उच्च ट्रैफिक के दौरान भी पोर्टल तीव्र गति से कार्य करे।
            <br />
            3. किसी भी सहायता या चर्चा के लिए नीचे दाहिने दिए गए व्हाट्सएप बटन से सीधे शाहजहांपुर ग्रुप में जुड़ें।
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-8 py-6 text-center text-xs text-slate-500 w-full max-w-full min-w-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-600">
            © {new Date().getFullYear()} UP HomeGaurd Shahjahanpur • Student Analysis Portal
          </p>
          <p className="text-[11px] text-slate-400">
            Created by students for data analysis purposes only • Not affiliated with Govt of UP
          </p>
        </div>
      </footer>

      {/* 7. Sticky WhatsApp Group Join Button (Bottom Right) */}
      <WhatsAppButton />
    </div>
  );
}
