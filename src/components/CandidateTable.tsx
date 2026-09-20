import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CandidateSubmission, CategoryType, GenderType, ShiftType, SHIFT_OPTIONS } from '../types';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Copy,
  Check,
  ListFilter,
  FileText,
  Tag,
  Clock,
  Users,
  Award,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface CandidateTableProps {
  candidates: CandidateSubmission[];
}

type SortField = 'marks' | 'extra' | 'name' | 'category' | 'gender' | 'shift' | 'normalization' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const CandidateTable: React.FC<CandidateTableProps> = ({ candidates }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL | ABOVE | BELOW

  const [sortField, setSortField] = useState<SortField>('marks');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [copied, setCopied] = useState(false);
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setGenderFilter('ALL');
    setShiftFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Filtered and Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      // 1. Search filter
      const query = search.toLowerCase().trim();
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesShift = (item.shift || '').toLowerCase().includes(query);
        const matchesNorm = (item.normalization || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesShift && !matchesNorm) {
          return false;
        }
      }

      // 2. Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // 3. Gender filter
      if (genderFilter !== 'ALL' && item.gender !== genderFilter) {
        return false;
      }

      // 4. Shift filter
      if (shiftFilter !== 'ALL' && (item.shift || '') !== shiftFilter) {
        return false;
      }

      // 5. Status filter
      if (statusFilter === 'ABOVE' && item.extra < 0) return false;
      if (statusFilter === 'BELOW' && item.extra >= 0) return false;

      return true;
    });
  }, [candidates, search, categoryFilter, genderFilter, shiftFilter, statusFilter]);

  // Multi-sorted list
  const sortedCandidates = useMemo(() => {
    const list = [...filteredCandidates];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredCandidates, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedCandidates.length / pageSize) || 1;
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCandidates.slice(start, start + pageSize);
  }, [sortedCandidates, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (sortedCandidates.length === 0) return;
    const headers = ['S.No', 'Name', 'Gender', 'Category', 'Shift', 'Marks', 'Cutoff', 'Extra Marks', 'Normalization', 'Timestamp'];
    const rows = sortedCandidates.map((c, idx) => [
      idx + 1,
      `"${c.name.replace(/"/g, '""')}"`,
      c.gender,
      c.category,
      `"${c.shift || '1st – 25 April'}"`,
      c.marks,
      c.cutoff,
      c.extra,
      `"${(c.normalization || '').replace(/"/g, '""')}"`,
      `"${c.createdAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UP_HomeGuard_Shahjahanpur_Scores_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (sortedCandidates.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape' });

    // Document Title
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text('UP HomeGaurd Shahjahanpur - Student Score & Merit Cutoff Analysis', 14, 14);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `Date: ${new Date().toLocaleString()} | Total: ${sortedCandidates.length} | Category: ${categoryFilter} | Shift: ${shiftFilter}`,
      14,
      20
    );

    const head = [
      ['#', 'Candidate Name', 'Gender', 'Category', 'Shift', 'Marks', 'Cutoff', 'Extra Marks', 'Normalization', 'Status']
    ];

    const body = sortedCandidates.map((c, idx) => [
      idx + 1,
      c.name,
      c.gender,
      c.category,
      c.shift || '1st – 25 April',
      Number(c.marks).toFixed(2),
      Number(c.cutoff).toFixed(5),
      (c.extra >= 0 ? '+' : '') + Number(c.extra).toFixed(4),
      c.normalization || '0.00',
      c.extra >= 0 ? 'Qualified' : 'Below Cutoff',
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 24,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`UP_HomeGuard_Shahjahanpur_${Date.now()}.pdf`);
  };

  // Copy Data
  const handleCopyTable = () => {
    const textData = sortedCandidates
      .map(
        (c, idx) =>
          `#${idx + 1} | ${c.name} | ${c.gender} | ${c.category} | Shift: ${c.shift || '1st – 25 April'} | Marks: ${c.marks} | Cutoff: ${c.cutoff} | Extra: ${c.extra >= 0 ? '+' : ''}${c.extra} | Norm: ${c.normalization}`
      )
      .join('\n');

    navigator.clipboard.writeText(textData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline ml-1" />
    );
  };

  return (
    <div id="candidate-analysis-section" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-full min-w-0">
      {/* Table Toolbar: Search, Sort, Filters, and Exports */}
      <div className="p-2.5 sm:p-3 bg-slate-50/90 border-b border-slate-200 w-full max-w-full min-w-0">
        
        {/* MOBILE LAYOUT: Row 1 Search, Row 2 Sort & Filter with ONLY icons */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Mobile Row 1: Search Button/Input in one row */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              id="search-input-mobile"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="खोजें: नाम, श्रेणी, शिफ्ट, प्राप्तांक..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400 shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mobile Row 2: Sort and Filter in one row with ONLY icon */}
          <div className="flex items-center justify-between gap-1 w-full overflow-x-auto py-0.5">
            {/* Category Filter Icon Button */}
            <div className="relative shrink-0" title="Category Filter (वर्ग)">
              <div className={`relative p-2 rounded-lg border flex items-center justify-center transition ${
                categoryFilter !== 'ALL' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-slate-300 text-slate-700'
              }`}>
                <Tag className="w-4 h-4" />
                {categoryFilter !== 'ALL' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border border-white"></span>
                )}
              </div>
              <select
                id="filter-category-mobile"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="वर्ग फ़िल्टर (Category)"
              >
                <option value="ALL">सभी वर्ग (All Categories)</option>
                <option value="UR">UR (सामान्य)</option>
                <option value="EWS">EWS</option>
                <option value="OBC">OBC (अन्य पिछड़ा)</option>
                <option value="SC">SC (अनुसूचित जाति)</option>
                <option value="ST">ST (जनजाति)</option>
              </select>
            </div>

            {/* Gender Filter Icon Button */}
            <div className="relative shrink-0" title="Gender Filter (लिंग)">
              <div className={`relative p-2 rounded-lg border flex items-center justify-center transition ${
                genderFilter !== 'ALL' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-slate-300 text-slate-700'
              }`}>
                <Users className="w-4 h-4" />
                {genderFilter !== 'ALL' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border border-white"></span>
                )}
              </div>
              <select
                id="filter-gender-mobile"
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="लिंग फ़िल्टर (Gender)"
              >
                <option value="ALL">सभी लिंग (All Genders)</option>
                <option value="Male">Male (पुरुष)</option>
                <option value="Female">Female (महिला)</option>
              </select>
            </div>

            {/* Shift Filter Icon Button */}
            <div className="relative shrink-0" title="Shift Filter (शिफ्ट)">
              <div className={`relative p-2 rounded-lg border flex items-center justify-center transition ${
                shiftFilter !== 'ALL' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-slate-300 text-slate-700'
              }`}>
                <Clock className="w-4 h-4" />
                {shiftFilter !== 'ALL' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border border-white"></span>
                )}
              </div>
              <select
                id="filter-shift-mobile"
                value={shiftFilter}
                onChange={(e) => {
                  setShiftFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="शिफ्ट फ़िल्टर (Shift)"
              >
                <option value="ALL">सभी शिफ्ट (All Shifts)</option>
                {SHIFT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Icon Button */}
            <div className="relative shrink-0" title="Cutoff Status Filter (स्थिति)">
              <div className={`relative p-2 rounded-lg border flex items-center justify-center transition ${
                statusFilter !== 'ALL' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-slate-300 text-slate-700'
              }`}>
                <Award className="w-4 h-4" />
                {statusFilter !== 'ALL' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border border-white"></span>
                )}
              </div>
              <select
                id="filter-status-mobile"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="कटऑफ स्थिति (Status)"
              >
                <option value="ALL">सभी स्थिति (All Status)</option>
                <option value="ABOVE">कटऑफ पार (Above Cutoff)</option>
                <option value="BELOW">कटऑफ से कम (Below Cutoff)</option>
              </select>
            </div>

            {/* Sort Field Icon Button */}
            <div className="relative shrink-0" title="Sort By Field (क्रमबद्ध करें)">
              <div className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <select
                id="sort-by-select-mobile"
                value={sortField}
                onChange={(e) => {
                  setSortField(e.target.value as SortField);
                  setCurrentPage(1);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Sort By Field"
              >
                <option value="marks">Marks (प्राप्तांक)</option>
                <option value="extra">Extra Marks</option>
                <option value="name">Name (नाम)</option>
                <option value="shift">Shift (शिफ्ट)</option>
                <option value="category">Category</option>
                <option value="createdAt">Date (तारीख)</option>
              </select>
            </div>

            {/* Sort Order Toggle Icon Button */}
            <button
              id="btn-toggle-sort-mobile"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg bg-white border border-slate-300 text-blue-600 hover:bg-slate-50 transition shrink-0"
              title={`Toggle Sort Order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </button>

            {/* Reset Filters Icon Button (Visible if filtered) */}
            {(categoryFilter !== 'ALL' || genderFilter !== 'ALL' || shiftFilter !== 'ALL' || statusFilter !== 'ALL' || search) && (
              <button
                id="btn-reset-filters-mobile"
                onClick={resetAllFilters}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <div className="h-4 w-px bg-slate-300 shrink-0 mx-0.5"></div>

            {/* Copy Icon Button */}
            <button
              id="btn-copy-mobile"
              onClick={handleCopyTable}
              className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shrink-0"
              title="Copy table to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* CSV Icon Button */}
            <button
              id="btn-csv-mobile"
              onClick={handleExportCSV}
              className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition shrink-0"
              title="Export CSV"
            >
              <Download className="w-4 h-4 text-emerald-700" />
            </button>

            {/* PDF Icon Button */}
            <button
              id="btn-pdf-mobile"
              onClick={handleExportPDF}
              className="p-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 transition shrink-0"
              title="Export PDF"
            >
              <FileText className="w-4 h-4 text-rose-700" />
            </button>
          </div>
        </div>

        {/* DESKTOP LAYOUT: All in one clean minimalist row */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          
          {/* 1. Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search / खोजें: नाम, श्रेणी, शिफ्ट..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Category Filter */}
          <div className="flex items-center">
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 shadow-2xs"
              title="वर्ग फ़िल्टर (Category)"
            >
              <option value="ALL">सभी वर्ग (All Cat)</option>
              <option value="UR">UR (सामान्य)</option>
              <option value="EWS">EWS</option>
              <option value="OBC">OBC (अन्य पिछड़ा)</option>
              <option value="SC">SC (अनुसूचित जाति)</option>
              <option value="ST">ST (जनजाति)</option>
            </select>
          </div>

          {/* 3. Gender Filter */}
          <div className="flex items-center">
            <select
              id="filter-gender"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 shadow-2xs"
              title="लिंग फ़िल्टर (Gender)"
            >
              <option value="ALL">सभी लिंग (All Gender)</option>
              <option value="Male">Male (पुरुष)</option>
              <option value="Female">Female (महिला)</option>
            </select>
          </div>

          {/* 4. Shift Filter */}
          <div className="flex items-center">
            <select
              id="filter-shift"
              value={shiftFilter}
              onChange={(e) => {
                setShiftFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-blue-300 text-blue-900 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold shadow-2xs"
              title="शिफ्ट फ़िल्टर (Shift)"
            >
              <option value="ALL">सभी शिफ्ट (All Shifts)</option>
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Cutoff Status Filter */}
          <div className="flex items-center">
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 shadow-2xs"
              title="कटऑफ स्थिति (Status)"
            >
              <option value="ALL">सभी स्थिति (Status)</option>
              <option value="ABOVE">कटऑफ पार (Above)</option>
              <option value="BELOW">कटऑफ से कम (Below)</option>
            </select>
          </div>

          {/* 6. Sort By Dropdown & Order Toggle */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-0.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Sort:</span>
            <select
              id="sort-by-select"
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value as SortField);
                setCurrentPage(1);
              }}
              className="py-1 text-xs bg-transparent border-0 focus:outline-none font-bold text-slate-800"
              title="क्रमबद्ध करें (Sort By)"
            >
              <option value="marks">Marks (प्राप्तांक)</option>
              <option value="extra">Extra Marks</option>
              <option value="name">Name (नाम)</option>
              <option value="shift">Shift (शिफ्ट)</option>
              <option value="category">Category</option>
              <option value="createdAt">Date (तारीख)</option>
            </select>
            <button
              id="btn-toggle-sort-order"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
              title={`Toggle Order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />}
            </button>
          </div>

          {/* 7. Action Buttons: Copy, Export CSV, Export PDF */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              id="btn-copy-table"
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
              title="Copy table records to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
              title="Export filtered data to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>CSV</span>
            </button>

            <button
              id="btn-export-pdf"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100/90 border border-rose-200 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
              title="Export filtered data to PDF document"
            >
              <FileText className="w-3.5 h-3.5 text-rose-700" />
              <span>PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Horizontal Scroll Helper Banner */}
      <div className="sm:hidden px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium select-none">
        <span className="flex items-center gap-1 text-slate-700">
          <span>⇄</span> केवल तालिका को बाएं-दाएं स्क्रॉल करें
        </span>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
          Table Scroll Only
        </span>
      </div>

      {/* Main Candidate Table - Horizontally scrolls ONLY inside this container */}
      <div className="w-full max-w-full overflow-x-auto min-w-0 scrollbar-thin overscroll-x-contain">
        <table id="candidate-table" className="w-full min-w-[760px] text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 text-center w-12">#</th>
              
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition select-none group"
              >
                <span>नाम (Name)</span>
                {getSortIcon('name')}
              </th>

              <th
                onClick={() => handleSort('gender')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/70 transition select-none group"
              >
                <span>लिंग (Gender)</span>
                {getSortIcon('gender')}
              </th>

              <th
                onClick={() => handleSort('category')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/70 transition select-none group"
              >
                <span>श्रेणी (Cat)</span>
                {getSortIcon('category')}
              </th>

              <th
                onClick={() => handleSort('shift')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/70 transition select-none group"
              >
                <span>शिफ्ट (Shift)</span>
                {getSortIcon('shift')}
              </th>

              <th
                onClick={() => handleSort('marks')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition select-none group text-right"
              >
                <span>प्राप्तांक (Marks)</span>
                {getSortIcon('marks')}
              </th>

              <th className="py-3 px-3 text-right">
                <span>कटऑफ (Cutoff)</span>
              </th>

              <th
                onClick={() => handleSort('extra')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition select-none group text-right"
              >
                <span>अतिरिक्त (Extra)</span>
                {getSortIcon('extra')}
              </th>

              <th
                onClick={() => handleSort('normalization')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/70 transition select-none group"
              >
                <span>नॉर्मलाइजेशन</span>
                {getSortIcon('normalization')}
              </th>

              <th className="py-3 px-3 text-center">
                <span>स्थिति (Status)</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {paginatedCandidates.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ListFilter className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">कोई अभ्यर्थी डेटा नहीं मिला</p>
                    <p className="text-xs text-slate-400">कृपया फ़िल्टर रीसेट करें या ऊपर दिए गए फॉर्म से नया स्कोर दर्ज करें</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCandidates.map((c, index) => {
                const rank = (currentPage - 1) * pageSize + index + 1;
                const isAboveCutoff = c.extra >= 0;

                return (
                  <tr
                    key={c.id}
                    id={`candidate-row-${c.id}`}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {rank}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span>{c.name}</span>
                    </td>

                    {/* Gender */}
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.gender === 'Male' ? 'bg-sky-50 text-sky-800' : 'bg-pink-50 text-pink-800'
                      }`}>
                        {c.gender === 'Male' ? 'Male' : 'Female'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.category === 'UR'
                          ? 'bg-slate-100 text-slate-800'
                          : c.category === 'EWS'
                          ? 'bg-amber-100 text-amber-900'
                          : c.category === 'OBC'
                          ? 'bg-blue-100 text-blue-900'
                          : c.category === 'SC'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-purple-100 text-purple-900'
                      }`}>
                        {c.category}
                      </span>
                    </td>

                    {/* Shift */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50/90 text-blue-900 border border-blue-200/70 whitespace-nowrap">
                        {c.shift || '1st – 25 April'}
                      </span>
                    </td>

                    {/* Marks */}
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      {Number(c.marks).toFixed(2)}
                    </td>

                    {/* Official Benchmark Cutoff */}
                    <td className="py-3 px-3 text-right font-mono text-xs text-slate-500">
                      {Number(c.cutoff).toFixed(5)}
                    </td>

                    {/* Extra Marks (Over/Under cutoff) */}
                    <td className="py-3 px-4 text-right font-mono font-black">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        isAboveCutoff
                          ? 'bg-emerald-100/80 text-emerald-900 font-bold'
                          : 'bg-rose-100/80 text-rose-900 font-bold'
                      }`}>
                        {isAboveCutoff ? `+${Number(c.extra).toFixed(5)}` : Number(c.extra).toFixed(5)}
                      </span>
                    </td>

                    {/* Normalization Shift - Strictly numeric, NO emoji */}
                    <td className="py-3 px-3 text-slate-700 font-mono text-xs">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 font-medium">
                        {(() => {
                          const val = String(c.normalization || '0.00').trim();
                          const num = parseFloat(val);
                          if (isNaN(num)) return '0.00';
                          return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
                        })()}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                        isAboveCutoff
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}>
                        {isAboveCutoff ? 'Qualified' : 'Below Cutoff'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
        <div>
          <span>कुल रिकॉर्ड: <strong>{filteredCandidates.length}</strong> (पृष्ठ {currentPage} / {totalPages})</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-40 font-semibold"
          >
            पिछला (Prev)
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-md font-bold ${
                  currentPage === pageNum
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-40 font-semibold"
          >
            अगला (Next)
          </button>
        </div>
      </div>
    </div>
  );
};
