import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Trash2, FolderOpen, AlertCircle, Loader2,
  Search, Calendar, Users, FileText, Clock, RefreshCw
} from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface SavedAttendanceRecord {
  id: string;
  name_mr: string;
  designation_mr: string;
  status: string;
  remark: string;
}

interface SavedReport {
  monthKey: string;
  fromDate: string;
  toDate: string;
  reportDate: string;
  refYear: string;
  records: SavedAttendanceRecord[];
  savedAt: Timestamp | null;
  type: 'doctors' | 'residents';
}

interface AttendanceHistoryPageProps {
  onBack: () => void;
  onOpenReport: (report: SavedReport) => void;
}

type TabType = 'doctors' | 'residents' | 'clerks';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatMonthKey(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[parseInt(month)] || month} ${year}`;
}

function formatSavedAt(ts: Timestamp | null): string {
  if (!ts) return '—';
  const d = ts.toDate();
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function countByStatus(records: SavedAttendanceRecord[]) {
  const present = records.filter(r => r.status === 'उपस्थित').length;
  const absent = records.length - present;
  return { present, absent };
}

export const AttendanceHistoryPage: React.FC<AttendanceHistoryPageProps> = ({ onBack, onOpenReport }) => {
  const [activeTab, setActiveTab] = useState<TabType>('doctors');
  const [doctorReports, setDoctorReports] = useState<SavedReport[]>([]);
  const [residentReports, setResidentReports] = useState<SavedReport[]>([]);
  const [clerkReports, setClerkReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const docSnap = await getDocs(collection(db, 'attendance_reports', 'doctors', 'months'));
      const docs: SavedReport[] = docSnap.docs.map(d => ({
        monthKey: d.id,
        ...(d.data() as any),
        type: 'doctors' as const,
      }));
      docs.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      setDoctorReports(docs);

      const resSnap = await getDocs(collection(db, 'attendance_reports', 'residents', 'months'));
      const res: SavedReport[] = resSnap.docs.map(d => ({
        monthKey: d.id,
        ...(d.data() as any),
        type: 'residents' as const,
      }));
      res.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      setResidentReports(res);

      // Fetch clerks
      const clerkSnap = await getDocs(collection(db, 'attendance_reports', 'clerks', 'months'));
      const clerks: any[] = clerkSnap.docs.map(d => ({
        monthKey: d.id,
        ...(d.data() as any),
        type: 'clerks',
      }));
      clerks.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      setClerkReports(clerks);
    } catch (e: any) {
      setError(e?.message || 'Failed to load history.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (type: 'doctors' | 'residents' | 'clerks', monthKey: string) => {
    if (!window.confirm(`Delete the ${formatMonthKey(monthKey)} report? This cannot be undone.`)) return;
    setDeletingKey(monthKey);
    try {
      await deleteDoc(doc(db, 'attendance_reports', type, 'months', monthKey));
      if (type === 'doctors') setDoctorReports(prev => prev.filter(r => r.monthKey !== monthKey));
      else if (type === 'residents') setResidentReports(prev => prev.filter(r => r.monthKey !== monthKey));
      else setClerkReports(prev => prev.filter((r: any) => r.monthKey !== monthKey));
    } catch (e) {
      console.error(e);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingKey(null);
    }
  };

  const currentReports = activeTab === 'doctors' ? doctorReports : activeTab === 'residents' ? residentReports : clerkReports;
  const filteredReports = currentReports.filter((r: any) =>
    formatMonthKey(r.monthKey).toLowerCase().includes(search.toLowerCase()) ||
    r.monthKey.includes(search)
  );

  const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
    { id: 'doctors', label: 'Doctors', icon: '👨‍⚕️', count: doctorReports.length },
    { id: 'residents', label: 'Residents (Jr/Sr)', icon: '🩺', count: residentReports.length },
    { id: 'clerks', label: 'Clerks', icon: '📋', count: clerkReports.length },
  ];

  const accentColor = activeTab === 'doctors' ? 'amber' : activeTab === 'residents' ? 'emerald' : 'blue';

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 font-sans text-slate-100">

      {/* ── Top Header ── */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div>
            <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Attendance History
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Browse and reopen saved monthly attendance reports</p>
          </div>
        </div>

        {/* Search + Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search month..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 w-48"
            />
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="shrink-0 flex bg-slate-900/60 border-b border-slate-800 px-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === tab.id
                ? tab.id === 'doctors'
                  ? 'border-amber-400 text-amber-400'
                  : tab.id === 'residents'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab.id === 'doctors'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Clerks — table same as Doctors/Residents but simpler */}
        {activeTab === 'clerks' && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                <p className="text-sm text-slate-500">Loading saved reports...</p>
              </div>
            ) : clerkReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-slate-700" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-500">No saved clerk reports yet</p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs">
                    Open the Clerks workspace and click <span className="text-amber-400 font-semibold">"Save Report"</span> to store a monthly report here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-xs text-slate-500 font-medium mb-4">{clerkReports.length} report{clerkReports.length !== 1 ? 's' : ''} found</p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80">
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</th>
                        <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employees</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saved On</th>
                        <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {clerkReports.map((report: any, idx: number) => (
                        <tr key={report.monthKey} className={`group hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-900/40'}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{formatMonthKey(report.monthKey)}</p>
                                <p className="text-[10px] text-slate-600 font-mono">{report.monthKey}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs text-slate-400">{report.config?.deptNameMr || report.config?.deptNameEn || '—'}</p>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-300 font-semibold">
                              <Users className="w-3 h-3 text-slate-500" />
                              {report.employees?.length ?? 0}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs text-slate-500">{formatSavedAt(report.savedAt)}</p>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onOpenReport(report)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                              >
                                <FolderOpen className="w-3.5 h-3.5" /> Open
                              </button>
                              <button
                                onClick={() => handleDelete('clerks', report.monthKey)}
                                disabled={deletingKey === report.monthKey}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 border border-transparent hover:border-rose-800/30 transition-all disabled:opacity-40"
                                title="Delete"
                              >
                                {deletingKey === report.monthKey
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />
                                }
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Doctors / Residents */}
        {activeTab !== 'clerks' && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                <p className="text-sm text-slate-500">Loading saved reports...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-rose-400">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm">{error}</p>
                <button onClick={fetchAll} className="text-xs px-4 py-2 bg-rose-900/30 border border-rose-800 rounded-lg hover:bg-rose-900/50 transition-colors">
                  Try Again
                </button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-slate-700" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-500">
                    {search ? 'No results found' : 'No saved reports yet'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs">
                    {search
                      ? `No reports match "${search}"`
                      : `Open the ${activeTab === 'doctors' ? 'Doctors' : 'Residents'} workspace and click "Save Report" to store a monthly report here.`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Summary bar */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-500 font-medium">
                    {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
                    {search && <span className="ml-1">for "<span className="text-white">{search}</span>"</span>}
                  </p>
                </div>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80">
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Range</th>
                        <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Records</th>
                        <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Present</th>
                        <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absent</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saved On</th>
                        <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredReports.map((report, idx) => {
                        const { present, absent } = countByStatus(report.records || []);
                        const isDeleting = deletingKey === report.monthKey;
                        return (
                          <tr
                            key={report.monthKey}
                            className={`group hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-900/40'}`}
                          >
                            {/* Month */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  activeTab === 'doctors' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                                }`}>
                                  <Calendar className={`w-4 h-4 ${activeTab === 'doctors' ? 'text-amber-400' : 'text-emerald-400'}`} />
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm">{formatMonthKey(report.monthKey)}</p>
                                  <p className="text-[10px] text-slate-600 font-mono">{report.monthKey}</p>
                                </div>
                              </div>
                            </td>

                            {/* Date Range */}
                            <td className="px-5 py-3.5">
                              <p className="text-xs text-slate-400 font-mono">
                                {report.fromDate || '—'} → {report.toDate || '—'}
                              </p>
                            </td>

                            {/* Record count */}
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center gap-1 text-xs text-slate-300 font-semibold">
                                <Users className="w-3 h-3 text-slate-500" />
                                {report.records?.length ?? 0}
                              </span>
                            </td>

                            {/* Present */}
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-md">
                                {present}
                              </span>
                            </td>

                            {/* Absent */}
                            <td className="px-4 py-3.5 text-center">
                              {absent > 0 ? (
                                <span className="inline-block text-xs font-bold text-rose-400 bg-rose-900/30 px-2 py-0.5 rounded-md">
                                  {absent}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-600">—</span>
                              )}
                            </td>

                            {/* Saved on */}
                            <td className="px-5 py-3.5">
                              <p className="text-xs text-slate-500">{formatSavedAt(report.savedAt)}</p>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => onOpenReport(report)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    activeTab === 'doctors'
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  <FolderOpen className="w-3.5 h-3.5" /> Open
                                </button>
                                <button
                                  onClick={() => handleDelete(report.type, report.monthKey)}
                                  disabled={isDeleting}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 border border-transparent hover:border-rose-800/30 transition-all disabled:opacity-40"
                                  title="Delete"
                                >
                                  {isDeleting
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Trash2 className="w-3.5 h-3.5" />
                                  }
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
