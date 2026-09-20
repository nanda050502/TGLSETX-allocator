import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import BatchRibbon from '../../components/BatchRibbon';
import { Users, CheckCircle2, XCircle, Award, RefreshCw, Sheet, ArrowRight, Activity, RotateCcw, AlertTriangle, Clock, Lock, Unlock, X } from 'lucide-react';

export default function LiveMonitoring({ onSwitchToRoom, onOpenGoogleSheetModal }) {
  const [examsList, setExamsList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLateModal, setShowLateModal] = useState(false);

  const fetchExamsList = () => {
    try {
      const list = appStorage.getExams();
      setExamsList(list);
      if (list.length > 0 && !selectedExamId) {
        const active = list.find(e => e.status === 'ACTIVE') || list[0];
        setSelectedExamId(active.id);
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
  }, []);

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
        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-900" />
        <p className="font-medium text-xs">Loading Live Dashboard...</p>
      </div>
    );
  }

  if (!data || !data.exam) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-sans space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
          <Activity size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Examination Sessions</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Upload your master spreadsheet in Data Ingestion or click below to restore default sample exams.
        </p>
        <button
          onClick={handleResetData}
          className="touch-target px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow-subtle inline-flex items-center gap-2 focus-ring"
        >
          <RotateCcw size={14} />
          <span>Reset Sample Data</span>
        </button>
      </div>
    );
  }

  const overall = data.overall || { total: 0, present: 0, absent: 0, lateCount: 0, lateStudents: [], setCounts: {} };
  const percentPresent = overall.total > 0 ? Math.round((overall.present / overall.total) * 100) : 0;
  const isGateClosed = Boolean(data?.exam?.gate_closed);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans min-w-0 max-w-full">
      {/* Batch Selector Tab Strip */}
      {examsList.length > 0 && (
        <BatchRibbon
          batches={examsList}
          selectedBatchId={selectedExamId}
          onSelectBatch={setSelectedExamId}
        />
      )}

      {/* Overview Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle space-y-4">
        {/* Session Meta Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {isGateClosed ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                  ⛔ Gate Closed at {data?.exam?.gate_closed_at}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  🟢 Gate Open (On-Time Period)
                </span>
              )}

              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                {data?.exam?.subject_code}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {data?.exam?.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium flex-wrap pt-0.5">
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 font-mono text-[11px] text-slate-700">
                📅 {data?.exam?.exam_date}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 font-mono text-[11px] text-slate-700">
                🕒 {data?.exam?.session_time}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Primary Gate Control */}
          <div className="flex-1 min-w-[200px]">
            {isGateClosed ? (
              <button
                onClick={handleToggleGate}
                className="touch-target w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-subtle flex items-center justify-center gap-1.5 focus-ring"
                title="Re-open Gate for On-Time Marking"
              >
                <Unlock size={15} />
                <span>Re-Open Gate</span>
              </button>
            ) : (
              <button
                onClick={handleToggleGate}
                className="touch-target w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-subtle flex items-center justify-center gap-1.5 focus-ring"
                title="Stop On-Time Attendance and Close Gate"
              >
                <Lock size={15} />
                <span>Close Gate / Stop Marking</span>
              </button>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => fetchOverview()}
              className="touch-target px-3 py-2.5 rounded-xl text-xs font-semibold transition border bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center gap-1.5 focus-ring"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleResetData}
              className="touch-target px-3 py-2.5 rounded-xl text-xs font-semibold transition border bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 active:bg-amber-200 flex items-center justify-center gap-1.5 focus-ring"
              title="Reset sample state"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            <button
              onClick={onOpenGoogleSheetModal}
              className="touch-target px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold rounded-xl transition shadow-subtle flex items-center justify-center gap-1.5 focus-ring"
            >
              <Sheet size={15} className="text-emerald-400" />
              <span className="truncate">Sheets Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Enrolled Students</span>
            <Users size={18} className="text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{overall.total}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Across {data?.rooms?.length || 0} examination halls</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Present</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700 font-mono tracking-tight">{overall.present}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">{percentPresent}% Turnout rate</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Absent</span>
            <XCircle size={18} className="text-rose-500" />
          </div>
          <div className="text-3xl font-bold text-rose-600 font-mono tracking-tight">{overall.absent}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Pending invigilator check-in</div>
        </div>

        {/* Late Presentees Card */}
        <div
          onClick={() => setShowLateModal(true)}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowLateModal(true); }}
          className={`p-5 rounded-2xl border transition cursor-pointer shadow-card focus-ring ${
            (overall.lateCount || 0) > 0
              ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Late Presentees</span>
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-900 font-mono tracking-tight">{overall.lateCount || 0}</div>
          <div className="text-[11px] text-amber-800 font-bold mt-1 flex items-center justify-between">
            <span>Gate Arrivals ({'>'}{data?.exam?.grace_period_minutes || 15}m)</span>
            <span className="text-[10px] underline">Details &rarr;</span>
          </div>
        </div>
      </div>

      {/* Set Distribution Row */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3.5 flex items-center gap-1.5">
          <Award size={16} className="text-slate-900" />
          Question Paper Allocation Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(overall.setCounts || {}).map(([setName, count]) => (
            <div
              key={setName}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{setName}</div>
                <div className="text-[10px] text-slate-500 font-medium">Distributed</div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Room-by-Room Monitoring ({data?.rooms?.length || 0} Halls)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.rooms || []).map((r) => {
            const roomPercent = r.total_students > 0 ? Math.round((r.present_count / r.total_students) * 100) : 0;
            return (
              <div
                key={r.room_number}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">Room {r.room_number}</h3>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          PIN: {r.room_pin}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Faculty: <span className="font-semibold text-slate-800">{r.faculty_name || 'Assigned PIN'}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                          roomPercent === 100
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : roomPercent > 0
                            ? 'bg-slate-100 text-slate-800 border-slate-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {roomPercent}%
                      </span>

                      {/* Room Finalization Lock Status Badge */}
                      {r.room_finalized ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                          <Lock size={10} /> Locked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 flex items-center gap-1 border border-amber-200">
                          <Clock size={10} /> Draft Marking
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3.5 p-0.5 border border-slate-200/50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        roomPercent === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : roomPercent > 0
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${Math.max(roomPercent, 4)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100 font-medium">
                    <span className="text-slate-500">
                      Total: <b className="text-slate-900 font-mono">{r.total_students}</b>
                    </span>
                    <span className="text-emerald-700">Present: <b className="font-mono">{r.present_count}</b></span>
                    <span className="text-rose-600">Absent: <b className="font-mono">{r.absent_count}</b></span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => onSwitchToRoom(r.room_number)}
                    className="touch-target flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-subtle focus-ring"
                  >
                    <span>Room {r.room_number} Console</span>
                    <ArrowRight size={14} />
                  </button>

                  {r.room_finalized && (
                    <button
                      onClick={() => handleReopenRoom(r.room_number)}
                      className="touch-target px-3 py-2.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1 focus-ring"
                      title="Admin Re-open Room for Attendance Changes"
                    >
                      <Unlock size={14} />
                      <span className="hidden sm:inline">Unlock</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Late Presentees Modal */}
      {showLateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl shadow-elevated max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Late Gate Arrivals ({overall.lateCount || 0})</h3>
                  <p className="text-xs text-slate-500 font-medium">Students marked present after the {data?.exam?.grace_period_minutes || 15}-minute time window</p>
                </div>
              </div>
              <button
                onClick={() => setShowLateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition focus-ring"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {(overall.lateStudents || []).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-bold text-slate-800">No Late Gate Arrivals</p>
                  <p className="text-xs text-slate-500 mt-0.5">All candidates checked in on time within the allowed window.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {overall.lateStudents.map((st) => (
                    <div key={st.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{st.name}</span>
                          <span className="font-mono text-slate-700 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold border border-slate-200">
                            {st.roll_number}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                          Room <b className="text-slate-900">{st.room_number}</b> &bull; {st.department || 'Undergraduate'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 border border-amber-200">
                          <Clock size={12} />
                          +{st.late_minutes} min late
                        </span>

                        <span className="font-mono text-slate-500 text-[11px] font-medium">
                          At {st.checkin_time}
                        </span>

                        <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono font-bold text-[11px]">
                          {st.assigned_set || 'Set Reserved'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setShowLateModal(false)}
                className="touch-target px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition focus-ring"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 sm:p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
          <Activity size={16} className="text-slate-900" />
          Real-Time Audit Stream
        </h3>
        <div className="divide-y divide-slate-100">
          {(data?.recentLogs || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center font-medium">No attendance events recorded yet.</p>
          ) : (
            data.recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] border border-slate-200">
                    {log.roll_number}
                  </span>
                  <span className="font-bold text-slate-900">{log.student_name}</span>
                  <span className="text-slate-500 font-medium">Room {log.room_number}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-[11px] border border-slate-200">
                    {log.assigned_set}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px] font-medium">{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
