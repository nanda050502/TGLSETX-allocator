import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import BatchRibbon from '../../components/BatchRibbon';
import {
  Users,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  Sheet,
  ArrowRight,
  Activity,
  RotateCcw,
  AlertTriangle,
  Clock,
  Lock,
  Unlock,
  X,
  Info,
  ChevronDown,
  Star,
  Search,
  SlidersHorizontal
} from 'lucide-react';

export default function LiveMonitoring({ onSwitchToRoom, onOpenGoogleSheetModal }) {
  const [examsList, setExamsList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLateModal, setShowLateModal] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const fetchExamsList = () => {
    try {
      const activeExam = appStorage.getActiveExam();
      const list = appStorage.getExams();
      setExamsList(list);
      if (list.length > 0) {
        if (!selectedExamId) {
          const active = activeExam || list.find(e => e.status === 'ACTIVE') || list[0];
          setSelectedExamId(active.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOverview = (silent = false) => {
    if (!selectedExamId) return;
    if (!silent) setLoading(true);
    try {
      const overview = appStorage.getLiveOverview(selectedExamId);
      setData(overview);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsList();

    const handleLifecycleChange = (e) => {
      fetchExamsList();
      const newActive = e.detail?.activeExam;
      if (newActive) {
        setSelectedExamId(newActive.id);
      }
      if (selectedExamId) {
        fetchOverview(true);
      }
    };

    window.addEventListener('examset_batch_lifecycle_change', handleLifecycleChange);

    const interval = setInterval(() => {
      fetchExamsList();
      if (selectedExamId) {
        fetchOverview(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('examset_batch_lifecycle_change', handleLifecycleChange);
      clearInterval(interval);
    };
  }, [selectedExamId]);

  useEffect(() => {
    if (selectedExamId) {
      fetchOverview();
    }
  }, [selectedExamId]);

  const handleResetData = () => {
    if (window.confirm('Reset local storage database back to default sample data?')) {
      appStorage.resetToDefaults();
      fetchExamsList();
      fetchOverview();
    }
  };

  const handleReopenRoom = (roomNumber) => {
    if (window.confirm(`Re-open Room ${roomNumber} attendance for changes?`)) {
      const res = appStorage.reopenRoomAttendance({ room_number: roomNumber, exam_id: selectedExamId });
      if (res.success) {
        fetchOverview(true);
      }
    }
  };

  const handleToggleGate = () => {
    const isClosed = Boolean(data?.exam?.gate_closed);
    const actionText = isClosed ? 're-open gate for on-time attendance' : 'stop on-time marking and flag new entries as Late Gate Arrivals';
    if (window.confirm(`Are you sure you want to ${actionText}?`)) {
      const res = appStorage.toggleExamGate(selectedExamId);
      if (res.success) {
        fetchOverview(true);
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-slate-400 font-sans">
        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#00a86b]" />
        <p className="font-semibold text-xs text-slate-600">Loading Live Dashboard...</p>
      </div>
    );
  }

  if (!data || !data.exam) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-sans space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
          <Activity size={28} className="text-[#00a86b]" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">No Active Examination Sessions</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Upload your master spreadsheet in Data Ingestion or click below to restore default sample exams.
        </p>
        <button
          onClick={handleResetData}
          className="touch-target px-4 py-2 bg-[#00a86b] hover:bg-[#00925d] active:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition shadow-sm inline-flex items-center gap-2"
        >
          <RotateCcw size={14} />
          <span>Reset Sample Data</span>
        </button>
      </div>
    );
  }

  const overall = data.overall || { total: 0, present: 0, absent: 0, lateCount: 0, lateStudents: [], setCounts: {} };
  const percentPresent = overall.total > 0 ? Math.round((overall.present / overall.total) * 100) : 0;
  const percentAbsent = overall.total > 0 ? Math.round((overall.absent / overall.total) * 100) : 0;
  const percentLate = overall.total > 0 ? Math.round(((overall.lateCount || 0) / overall.total) * 100) : 0;
  const isGateClosed = Boolean(data?.exam?.gate_closed);

  // Filtered rooms for directory table
  const filteredRooms = (data?.rooms || []).filter(r =>
    r.room_number.toLowerCase().includes(tableSearch.toLowerCase()) ||
    (r.faculty_name && r.faculty_name.toLowerCase().includes(tableSearch.toLowerCase()))
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-5 font-sans min-w-0 max-w-full">
      {/* Batch Ribbon Strip */}
      {examsList.length > 0 && (
        <BatchRibbon
          batches={examsList}
          selectedBatchId={selectedExamId}
          onSelectBatch={setSelectedExamId}
        />
      )}

      {/* Top Session Overview Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isGateClosed ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                  ⛔ Gate Closed at {data?.exam?.gate_closed_at}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#00a86b] font-bold text-[11px] border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a86b] animate-pulse"></span>
                  🟢 Gate Open (On-Time Period)
                </span>
              )}

              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {data?.exam?.subject_code}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {data?.exam?.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap pt-0.5">
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/70 font-mono text-[11px] text-slate-700">
                📅 {data?.exam?.exam_date}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/70 font-mono text-[11px] text-slate-700">
                🕒 {data?.exam?.session_time}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isGateClosed ? (
              <button
                onClick={handleToggleGate}
                className="touch-target px-4 py-2.5 rounded-2xl text-xs font-bold transition bg-[#00a86b] hover:bg-[#00925d] text-white shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                title="Re-open Gate for On-Time Marking"
              >
                <Unlock size={14} />
                <span>Re-Open Gate</span>
              </button>
            ) : (
              <button
                onClick={handleToggleGate}
                className="touch-target px-4 py-2.5 rounded-2xl text-xs font-bold transition bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                title="Stop On-Time Attendance and Close Gate"
              >
                <Lock size={14} />
                <span>Close Gate</span>
              </button>
            )}

            <button
              onClick={() => fetchOverview()}
              className="touch-target px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={13} className="text-slate-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleResetData}
              className="touch-target px-3 py-2.5 rounded-2xl text-xs font-semibold transition border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 flex items-center justify-center gap-1.5"
              title="Reset sample state"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            <button
              onClick={onOpenGoogleSheetModal}
              className="touch-target px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Sheet size={14} className="text-emerald-400" />
              <span>Sheets Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Stat Cards (Exact match to sample UI top row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Candidates */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              Total Candidates <Info size={12} className="text-slate-400" />
            </span>
            <button
              onClick={() => {}}
              className="text-[11px] font-semibold border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-600 hover:bg-slate-50 transition"
            >
              See Details
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {String(overall.total).padStart(2, '0')}
              </div>
            </div>
            <span className="bg-[#00a86b] text-white rounded-full text-[10px] font-bold px-2 py-0.5 flex items-center gap-0.5 shadow-sm">
              ↗ 100%
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
            <svg className="w-16 h-6 text-teal-400 shrink-0" viewBox="0 0 70 24" fill="none">
              <path d="M2 20C12 20 16 12 26 12C36 12 40 4 50 4C60 4 64 16 68 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              Candidate count across {data?.rooms?.length || 0} examination halls
            </p>
          </div>
        </div>

        {/* Card 2: Today Presents */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              Today Presents <Info size={12} className="text-slate-400" />
            </span>
            <button
              onClick={() => {}}
              className="text-[11px] font-semibold border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-600 hover:bg-slate-50 transition"
            >
              See Details
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00a86b] flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {String(overall.present).padStart(2, '0')}
              </div>
            </div>
            <span className="bg-[#00a86b] text-white rounded-full text-[10px] font-bold px-2 py-0.5 flex items-center gap-0.5 shadow-sm">
              ↗ {percentPresent}%
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2.5">
            <div className="flex items-end gap-1 h-6 shrink-0">
              <span className="w-1.5 h-3 bg-emerald-200 rounded-full"></span>
              <span className="w-1.5 h-6 bg-[#00a86b] rounded-full"></span>
              <span className="w-1.5 h-4 bg-emerald-300 rounded-full"></span>
              <span className="w-1.5 h-2 bg-emerald-100 rounded-full"></span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              {percentPresent}% of candidates are present today ({overall.present} of {overall.total})
            </p>
          </div>
        </div>

        {/* Card 3: Today Absents */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              Today Absents <Info size={12} className="text-slate-400" />
            </span>
            <button
              onClick={() => {}}
              className="text-[11px] font-semibold border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-600 hover:bg-slate-50 transition"
            >
              See Details
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <XCircle size={18} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {String(overall.absent).padStart(2, '0')}
              </div>
            </div>
            <span className="bg-amber-400 text-white rounded-full text-[10px] font-bold px-2 py-0.5 flex items-center gap-0.5 shadow-sm">
              ↗ {percentAbsent}%
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2.5">
            <div className="flex items-end gap-0.5 h-6 shrink-0">
              <span className="w-1 h-5 bg-amber-400 rounded-full"></span>
              <span className="w-1 h-3 bg-amber-300 rounded-full"></span>
              <span className="w-1 h-6 bg-amber-400 rounded-full"></span>
              <span className="w-1 h-4 bg-amber-300 rounded-full"></span>
              <span className="w-1 h-2 bg-amber-200 rounded-full"></span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              {percentAbsent}% absent rate, leaving {overall.absent} candidates unverified
            </p>
          </div>
        </div>

        {/* Card 4: Late Arrivals / Gate Check */}
        <div
          onClick={() => setShowLateModal(true)}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              Late Arrivals <Info size={12} className="text-slate-400" />
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowLateModal(true); }}
              className="text-[11px] font-semibold border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-600 hover:bg-slate-50 transition"
            >
              See Details
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {String(overall.lateCount || 0).padStart(2, '0')}
              </div>
            </div>
            <span className="bg-rose-500 text-white rounded-full text-[10px] font-bold px-2 py-0.5 flex items-center gap-0.5 shadow-sm">
              ✔ {overall.lateCount || 0}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2.5">
            <div className="flex items-center gap-1 shrink-0">
              <span className="w-10 h-2.5 bg-rose-500 rounded-full"></span>
              <span className="w-5 h-2.5 bg-rose-200 rounded-full"></span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              Gate Arrivals flagged after {data?.exam?.grace_period_minutes || 15}m window
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Live Room Feed (Exact layout match to Daily Attendance Statistic + Leave Application) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Daily Attendance Statistic Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Daily Attendance Statistic
                </h3>
                <Info size={14} className="text-slate-400" />
              </div>

              <div className="flex items-center gap-4 flex-wrap text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00a86b]"></span>
                  <span>Present {percentPresent}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>Absent {percentAbsent}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Late {percentLate}%</span>
                </div>

                <div className="border border-slate-200 rounded-full px-3 py-1 text-slate-600 text-xs font-semibold flex items-center gap-1 bg-slate-50">
                  <span>Daily</span>
                  <ChevronDown size={12} />
                </div>
              </div>
            </div>

            {/* Vertical Bar Chart matching the exact visual pillars in the image */}
            <div className="relative pt-4 pb-2">
              {/* Y-Axis Labels & Horizontal Grid Lines */}
              <div className="h-52 w-full flex flex-col justify-between relative text-[10px] font-mono font-semibold text-slate-400">
                <div className="flex items-center w-full">
                  <span className="w-8 shrink-0">120%</span>
                  <div className="w-full border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center w-full">
                  <span className="w-8 shrink-0">100%</span>
                  <div className="w-full border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center w-full">
                  <span className="w-8 shrink-0">75%</span>
                  <div className="w-full border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center w-full">
                  <span className="w-8 shrink-0">50%</span>
                  <div className="w-full border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center w-full">
                  <span className="w-8 shrink-0">25%</span>
                  <div className="w-full border-b border-dashed border-slate-100"></div>
                </div>
                <div className="flex items-center w-full">
                  <span className="w-8 shrink-0">0%</span>
                  <div className="w-full border-b border-slate-200"></div>
                </div>

                {/* Overlaid Columns / Pillars */}
                <div className="absolute inset-x-8 bottom-0 top-3 flex items-end justify-around px-2">
                  {(data?.rooms || []).map((r, i) => {
                    const roomPercent = r.total_students > 0 ? Math.round((r.present_count / r.total_students) * 100) : 0;
                    // Determine pillar colors matching sample image
                    const isEmerald = roomPercent >= 70;
                    const isYellow = roomPercent < 70 && roomPercent > 0;
                    const isCoral = roomPercent === 0;

                    return (
                      <div key={r.room_number} className="flex flex-col items-center gap-2 group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg font-mono transition shadow-lg z-20 whitespace-nowrap">
                          Room {r.room_number}: {r.present_count}/{r.total_students} ({roomPercent}%)
                        </div>

                        {/* Pillar Bar */}
                        <div
                          className={`w-7 sm:w-10 rounded-t-xl transition-all duration-500 ${
                            isEmerald
                              ? 'bg-[#00a86b] shadow-sm shadow-emerald-500/20'
                              : isYellow
                              ? 'bg-amber-400 shadow-sm shadow-amber-500/20'
                              : isCoral
                              ? 'bg-rose-500 shadow-sm shadow-rose-500/20'
                              : 'bg-slate-200'
                          }`}
                          style={{
                            height: `${Math.max((roomPercent / 120) * 180, 16)}px`
                          }}
                        ></div>

                        {/* Hall Label on X-Axis */}
                        <span className="text-[11px] font-semibold text-slate-500 mt-1 truncate max-w-[50px]">
                          {r.room_number}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Hall Activity (Matching Leave Application in sample UI) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Live Hall Activity
                </h3>
                <Info size={14} className="text-slate-400" />
              </div>
            </div>

            <div className="space-y-3.5">
              {(data?.rooms || []).slice(0, 5).map((r, i) => {
                const roomPercent = r.total_students > 0 ? Math.round((r.present_count / r.total_students) * 100) : 0;
                return (
                  <div
                    key={r.room_number}
                    onClick={() => onSwitchToRoom(r.room_number)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                        {r.room_number.slice(0, 3)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                          {r.faculty_name || `Hall Invigilator (${r.room_number})`}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Hall {r.room_number} &bull; PIN: {r.room_pin}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          roomPercent === 100
                            ? 'bg-emerald-50 text-[#00a86b] border-emerald-200'
                            : roomPercent > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {roomPercent}%
                      </span>
                      <ArrowRight size={13} className="text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Question Paper Set Distribution Row */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Award size={16} className="text-[#00a86b]" />
            <span>Question Paper Allocation Distribution</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(overall.setCounts || {}).map(([setName, count]) => (
            <div
              key={setName}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-extrabold text-slate-900">{setName}</div>
                <div className="text-[10px] text-slate-400 font-medium">Distributed</div>
              </div>
              <div className="text-2xl font-black font-mono text-[#00a86b]">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Notice & Examination Hall Directory (Exact layout match to Notice + Employee Award List) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 1 Col: Notice Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Notice
              </h3>
              <button
                onClick={() => {}}
                className="text-[11px] font-semibold border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-600 hover:bg-slate-50 transition"
              >
                See Details
              </button>
            </div>

            <div className="space-y-4">
              {/* Notice Item 1 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Examination Session Active
                  </h4>
                  <Star size={14} className="text-[#00a86b] fill-[#00a86b] shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="bg-emerald-100 text-[#00a86b] px-2 py-0.5 rounded-md font-bold">
                    Active Session
                  </span>
                  <span>📅 {data?.exam?.exam_date || '22-Aug-26'}</span>
                </div>
              </div>

              {/* Notice Item 2 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Gate Policy & Late Check-in Rules
                  </h4>
                  <Star size={14} className="text-slate-400 shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                    Gate Rule
                  </span>
                  <span>🕒 {data?.exam?.grace_period_minutes || 15}m Grace Window</span>
                </div>
              </div>

              {/* Notice Item 3 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Google Sheets Auto-Sync Realtime
                  </h4>
                  <Star size={14} className="text-slate-400 shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                    Cloud Sync
                  </span>
                  <span>Instant Headcount</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Examination Hall Directory (Matching Employee Award List in sample UI) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Examination Hall & Invigilator Directory
                </h3>
                <Info size={14} className="text-slate-400" />
              </div>

              {/* Table Search Pill & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search Hall / Invigilator..."
                    className="bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#00a86b] w-48 font-medium transition"
                  />
                </div>
                <button className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition">
                  <SlidersHorizontal size={13} />
                </button>
              </div>
            </div>

            {/* Clean Table List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">SL.</th>
                    <th className="pb-3">Hall / PIN</th>
                    <th className="pb-3">Invigilator</th>
                    <th className="pb-3">Candidates</th>
                    <th className="pb-3">Turnout</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRooms.map((r, index) => {
                    const roomPercent = r.total_students > 0 ? Math.round((r.present_count / r.total_students) * 100) : 0;
                    return (
                      <tr key={r.room_number} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 pl-2 text-slate-400 font-mono text-[11px]">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">Hall {r.room_number}</span>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {r.room_pin}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-700">
                          {r.faculty_name || 'Assigned via PIN'}
                        </td>
                        <td className="py-3 font-mono text-slate-600">
                          <span className="text-[#00a86b] font-bold">{r.present_count}</span> / {r.total_students}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#00a86b] h-full rounded-full"
                                style={{ width: `${roomPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">{roomPercent}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSwitchToRoom(r.room_number)}
                              className="px-3 py-1.5 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white font-bold text-[11px] transition shadow-sm inline-flex items-center gap-1 active:scale-95"
                            >
                              <span>Console</span>
                              <ArrowRight size={11} />
                            </button>
                            {r.room_finalized && (
                              <button
                                onClick={() => handleReopenRoom(r.room_number)}
                                className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition"
                                title="Unlock Room"
                              >
                                <Unlock size={11} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Late Presentees Modal */}
      {showLateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Late Gate Arrivals ({overall.lateCount || 0})</h3>
                  <p className="text-xs text-slate-500 font-medium">Students marked present after the grace period</p>
                </div>
              </div>
              <button
                onClick={() => setShowLateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {(overall.lateStudents || []).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-[#00a86b]" />
                  <p className="text-sm font-bold text-slate-800">No Late Gate Arrivals</p>
                  <p className="text-xs text-slate-500 mt-0.5">All candidates checked in on time.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {overall.lateStudents.map((st) => (
                    <div
                      key={st.roll_number}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{st.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {st.roll_number} &bull; Room {st.room_number} &bull; Check-in: {st.checkin_time}
                        </div>
                      </div>
                      <span className="text-amber-800 font-bold text-[10px] bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        +{st.late_minutes}m Late
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
