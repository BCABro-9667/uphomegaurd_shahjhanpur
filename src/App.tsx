import React, { useState, useEffect, useCallback } from 'react';
import { CandidateSubmission } from './types';
import { Header } from './components/Header';
import { CandidateForm } from './components/CandidateForm';
import { StatsCards } from './components/StatsCards';
import { CandidateTable } from './components/CandidateTable';
import { WhatsAppButton } from './components/WhatsAppButton';

export default function App() {
  // Only real candidate records from the database - initialized empty
  const [candidates, setCandidates] = useState<CandidateSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Clear any legacy temporary/sample candidates stored in browser
  useEffect(() => {
    try {
      localStorage.removeItem('up_homeguard_candidates_data');
    } catch {
      // ignore
    }
  }, []);

  // Fetch candidates directly from the MongoDB database
  const fetchCandidates = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const res = await fetch('/api/candidates');
      if (!res.ok) throw new Error('Database API response error');
      const data = await res.json();
      if (data.success && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.warn('Notice: Fetching candidates from database:', err);
    } finally {
      setLoading(false);
      if (showRefreshingSpinner) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Initial fetch and continuous live polling (every 5 seconds) to ensure real-time synchronization
  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(() => {
      fetchCandidates(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  // Handle new candidate added via CandidateForm - immediately refresh from database
  const handleCandidateAdded = (newCandidate: CandidateSubmission) => {
    setCandidates((prev) => {
      // Avoid duplicate if already received from DB
      const exists = prev.some((c) => c.id === newCandidate.id);
      return exists ? prev : [newCandidate, ...prev];
    });
    // Trigger background sync
    fetchCandidates(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans w-full max-w-full overflow-x-hidden min-w-0">
      {/* Official-styled Header with Refresh Button */}
      <Header
        totalCount={candidates.length}
        onRefresh={() => fetchCandidates(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 min-w-0 max-w-full">
        {/* 1. Summary Stats Cards (Displayed immediately after Header) */}
        <StatsCards candidates={candidates} />

        {/* 2. Candidate Entry Form (Saves directly to MongoDB database) */}
        <CandidateForm onSuccess={handleCandidateAdded} />

        {/* 3. Candidate Data Table with Search, Multi-sort, Shift, Filters & PDF/CSV Export */}
        <CandidateTable candidates={candidates} />

        {/* 4. WhatsApp Community Access */}
        <WhatsAppButton />
      </main>

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 w-full max-w-full overflow-x-hidden min-w-0">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            उत्तर प्रदेश होमगार्ड भर्ती परीक्षा • शाहजहांपुर (UP Home Guard Shahjahanpur)
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            सुरक्षित एवं वास्तविक डेटाबेस प्रणाली • कटऑफ विश्लेषण एवं मेरिट समीक्षा
          </p>
        </div>
      </footer>
    </div>
  );
}
