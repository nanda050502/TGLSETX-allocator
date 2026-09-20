import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import { Clock, RefreshCw, CheckCircle2, RotateCcw, Search, ShieldCheck } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    try {
      const active = appStorage.getActiveExam();
      if (active) {
        const overview = appStorage.getLiveOverview(active.id);
        setLogs(overview.recentLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueRooms = Array.from(new Set(logs.map(l => l.room_number).filter(Boolean))).sort();

  const filteredLogs = logs.filter(l => {
    const matchesRoom = roomFilter === 'ALL' || String(l.room_number) === String(roomFilter);
    const matchesSearch =
      l.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      (l.assigned_set && l.assigned_set.toLowerCase().includes(search.toLowerCase()));
    return matchesRoom && matchesSearch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans min-w-0 max-w-full">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2 border border-slate-200">
            <ShieldCheck size={14} className="text-slate-900" />
            <span>Immutable Event Stream</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Attendance Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time chronological trace of every check-in, set allocation, and faculty undo action.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="touch-target px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl flex items-center gap-2 transition self-start sm:self-auto border border-slate-200 focus-ring"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Feed</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-subtle flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by student name or roll..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white focus-ring transition"
          />
        </div>

        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="touch-target px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-slate-900 focus:bg-white focus-ring transition cursor-pointer"
        >
          <option value="ALL">All Rooms ({uniqueRooms.length})</option>
          {uniqueRooms.map((r) => (
            <option key={r} value={r}>Room {r}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6">
        {loading ? (
          <div className="py-14 text-center text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2.5 text-slate-900" />
            <p className="text-xs font-semibold">Fetching event ledger...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-14 text-center text-slate-400">
            <Clock size={36} className="mx-auto mb-2.5 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No attendance events recorded yet.</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Events appear here as faculty mark students in exam halls.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogs.map((log) => {
              const isPresent = log.action === 'MARK_PRESENT';
              return (
                <div
                  key={log.id}
                  className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 text-xs transition duration-150 ${
                    isPresent
                      ? 'bg-slate-50/80 border-slate-200/90 hover:border-emerald-300'
                      : 'bg-amber-50/50 border-amber-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-xs ${
                        isPresent ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                      }`}
                    >
                      {isPresent ? <CheckCircle2 size={18} /> : <RotateCcw size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {log.roll_number}
                        </span>
                        <span className="font-bold text-slate-900">{log.student_name}</span>
                        <span className="text-slate-500 font-semibold">in Room {log.room_number}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {isPresent ? (
                          <span className="text-emerald-700 font-semibold">
                            Marked Present &bull; Allocated <span className="font-mono font-bold text-slate-900">{log.assigned_set}</span>
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold">Reverted to Absent</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-slate-800">{log.timestamp}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Verified</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
