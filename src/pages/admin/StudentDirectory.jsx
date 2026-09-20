import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import { Search, Download, RefreshCw, Users, Check } from 'lucide-react';

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedRoom, setSelectedRoom] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSet, setSelectedSet] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    try {
      const data = appStorage.getMasterDirectory();
      setStudents(data.students || []);
      setBatches(data.batches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = (student) => {
    if (student.status === 'ABSENT') {
      appStorage.markAttendance({ student_id: student.id, room_number: student.room_number });
    } else {
      appStorage.undoAttendance({ student_id: student.id });
    }
    fetchData();
  };

  const handleExportCSV = () => {
    const headers = ['Date,Batch,Assessment Time,Room Number,Reg Number,Student Name,Email,Status,Is Late,Late Minutes,Assigned Set,Check-in Time'];
    const rows = filteredStudents.map(s =>
      `"${s.exam_date || ''}","${s.batch_name || ''}","${s.assessment_time || ''}","${s.room_number}","${s.roll_number}","${s.name}","${s.email || ''}","${s.status}","${s.is_late ? 'YES' : 'NO'}","${s.late_minutes || 0}","${s.assigned_set || ''}","${s.checkin_time || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueRooms = Array.from(new Set(students.map(s => s.room_number))).sort();
  const sets = ['Set A', 'Set B', 'Set C', 'Set D'];
  const uniqueBatchNames = Array.from(new Set(students.map(s => s.batch_name))).filter(Boolean);

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBatch = selectedBatch === 'ALL' || s.batch_name === selectedBatch;
    const matchesRoom = selectedRoom === 'ALL' || String(s.room_number) === String(selectedRoom);
    
    let matchesStatus = true;
    if (selectedStatus === 'PRESENT') matchesStatus = s.status === 'PRESENT';
    else if (selectedStatus === 'ABSENT') matchesStatus = s.status === 'ABSENT';
    else if (selectedStatus === 'LATE_PRESENT') matchesStatus = s.status === 'PRESENT' && s.is_late;

    const matchesSet = selectedSet === 'ALL' || s.assigned_set === selectedSet;

    return matchesSearch && matchesBatch && matchesRoom && matchesStatus && matchesSet;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans min-w-0 max-w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Roster</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            <span className="font-mono font-bold text-slate-900">{students.length}</span> students enrolled across {uniqueRooms.length} examination halls
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchData}
            className="touch-target p-2 px-3.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200/80 focus-ring"
            title="Refresh Table"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="touch-target px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shadow-subtle focus-ring"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-subtle flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student by roll, name, dept..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none text-xs font-medium text-slate-900 transition focus-ring"
          />
        </div>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="touch-target px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-slate-900 focus-ring"
        >
          <option value="ALL">All Batches ({uniqueBatchNames.length})</option>
          {uniqueBatchNames.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="touch-target px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-slate-900 focus-ring"
        >
          <option value="ALL">All Rooms ({uniqueRooms.length})</option>
          {uniqueRooms.map(r => (
            <option key={r} value={r}>Room {r}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="touch-target px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-slate-900 focus-ring"
        >
          <option value="ALL">All Status</option>
          <option value="PRESENT">Present Only</option>
          <option value="LATE_PRESENT">Late Gate Arrivals Only</option>
          <option value="ABSENT">Absent Only</option>
        </select>

        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
          className="touch-target px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-slate-900 focus-ring"
        >
          <option value="ALL">All Sets</option>
          {sets.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Responsive Mobile Cards Fallback (< md) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-slate-900" />
            <span className="text-xs font-semibold">Loading directory...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
            <Users size={28} className="mx-auto mb-2 text-slate-300" />
            <span className="text-xs font-semibold text-slate-700">No students match the selected filter</span>
          </div>
        ) : (
          filteredStudents.map((s) => {
            const isPresent = s.status === 'PRESENT';
            return (
              <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 block">{s.roll_number}</span>
                    <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                    {s.email && <p className="text-[11px] text-slate-400 font-medium">{s.email}</p>}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200">
                    Room {s.room_number}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {isPresent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check size={12} strokeWidth={2.5} /> Present
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        Absent
                      </span>
                    )}

                    {isPresent && s.assigned_set && (
                      <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded-md shadow-xs font-mono">
                        {s.assigned_set}
                      </span>
                    )}

                    {s.is_late && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        ⏱️ Late (+{s.late_minutes}m)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAttendance(s)}
                    className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-semibold transition focus-ring ${
                      isPresent
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-subtle'
                    }`}
                  >
                    {isPresent ? 'Undo' : 'Mark'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3.5 px-4">Reg Number</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Batch & Time</th>
                <th className="py-3.5 px-4 text-center">Room</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Assigned Set</th>
                <th className="py-3.5 px-4 text-center">Check-in Time</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-1 text-slate-900" />
                    <span>Loading directory...</span>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users size={28} className="mx-auto mb-1 text-slate-300" />
                    <span>No students match the selected filter</span>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isPresent = s.status === 'PRESENT';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {s.roll_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{s.email || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px]">
                            {s.batch_name || 'Batch 1'}
                          </span>
                          {s.assessment_time && (
                            <span className="text-slate-500 font-mono text-[10px]">
                              {s.assessment_time}
                            </span>
                          )}
                        </div>
                        {s.exam_date && (
                          <div className="text-[9px] text-slate-400 mt-0.5 font-mono">{s.exam_date}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200">
                          {s.room_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isPresent ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check size={11} strokeWidth={2.5} /> Present
                            </span>
                            {s.is_late && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                ⏱️ Late (+{s.late_minutes}m)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {s.assigned_set ? (
                          <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded-md shadow-xs">
                            {s.assigned_set}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                        {s.checkin_time || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(s)}
                          className={`touch-target px-3.5 py-1 rounded-xl text-[11px] font-semibold transition focus-ring ${
                            isPresent
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-subtle'
                          }`}
                        >
                          {isPresent ? 'Undo' : 'Mark'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
