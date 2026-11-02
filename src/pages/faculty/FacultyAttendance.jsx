import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appStorage } from '../../services/appStorage';
import StudentSwipeCard from '../../components/StudentSwipeCard';
import NumericKeypad from '../../components/NumericKeypad';
import {
  ShieldCheck,
  LogOut,
  Key,
  Clock,
  RotateCw,
  Search,
  SlidersHorizontal,
  Hash,
  CheckCircle2,
  Lock,
  AlertTriangle,
  UserX,
  Check,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

export default function FacultyAttendance({ defaultRoomNumber, isAndroidShell = false, onLogout }) {
  const { user, isAdmin, logout } = useAuth();
  const [roomNumber, setRoomNumber] = useState(
    defaultRoomNumber || user?.room_number || ''
  );
  const [availableRooms, setAvailableRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('all'); // 'all' | 'absent' | 'present'
  const [showKeypad, setShowKeypad] = useState(false);
  const [toast, setToast] = useState(null);
  const [globalMatch, setGlobalMatch] = useState(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const searchInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    try {
      const rooms = appStorage.getAvailableRooms();
      setAvailableRooms(rooms || []);
      if (rooms && rooms.length > 0 && !roomNumber) {
        setRoomNumber(rooms[0].room_number);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (roomNumber) {
      fetchRoomData(roomNumber);

      const handleLifecycleChange = () => {
        const rooms = appStorage.getAvailableRooms();
        setAvailableRooms(rooms || []);
        fetchRoomData(roomNumber, true);
      };

      window.addEventListener('examset_batch_lifecycle_change', handleLifecycleChange);

      const interval = setInterval(() => {
        const rooms = appStorage.getAvailableRooms();
        setAvailableRooms(rooms || []);
        fetchRoomData(roomNumber, true);
      }, 2500);

      return () => {
        window.removeEventListener('examset_batch_lifecycle_change', handleLifecycleChange);
        clearInterval(interval);
      };
    } else {
      setLoading(false);
    }
  }, [roomNumber]);

  const fetchRoomData = (room, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const roomData = appStorage.getRoomAttendance(room);
      setData(roomData);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshHallData = () => {
    setRefreshing(true);
    fetchRoomData(roomNumber, true);
    showToast('Hall data successfully synced!', 'success');
  };

  // Cross-room search alert
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const isLocal = data?.students.some(
        s => s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
             s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (!isLocal) {
        const matches = appStorage.searchGlobalStudents(searchQuery);
        if (matches && matches.length > 0) {
          setGlobalMatch(matches[0]);
        } else {
          setGlobalMatch(null);
        }
      } else {
        setGlobalMatch(null);
      }
    } else {
      setGlobalMatch(null);
    }
  }, [searchQuery, data]);

  // Mark Attendance
  const handleMarkPresent = async (student) => {
    const res = appStorage.markAttendance({
      student_id: student.id,
      room_number: roomNumber,
      marked_by_user_id: user?.id
    });

    if (res.success) {
      showToast(`Marked ${student.name} as Present`, 'success');
      fetchRoomData(roomNumber, true);
      setSearchQuery('');
    } else {
      showToast(res.message || res.error || 'Failed to mark attendance', 'warning');
    }
  };

  // Undo Attendance
  const handleUndoAttendance = async (student) => {
    const res = appStorage.undoAttendance({
      student_id: student.id,
      marked_by_user_id: user?.id
    });

    if (res.success) {
      showToast(`Marked ${student.name} as Absent`, 'warning');
      fetchRoomData(roomNumber, true);
    } else {
      showToast(res.error || 'Failed to undo attendance', 'warning');
    }
  };

  // Finalize & Lock
  const verifyAndLockRoom = () => {
    setShowFinalizeModal(true);
  };

  const confirmLockRoom = () => {
    const res = appStorage.finalizeRoomAttendance({
      room_number: roomNumber,
      marked_by_user_id: user?.id
    });

    if (res.success) {
      showToast(`Room successfully locked with ${presentCount} verified candidates!`, 'success');
      fetchRoomData(roomNumber, true);
    } else {
      showToast(res.error || 'Failed to finalize attendance', 'warning');
    }
    setShowFinalizeModal(false);
  };

  const toggleFilterOptions = () => {
    setShowKeypad(prev => !prev);
    showToast(showKeypad ? 'Switched to standard list view' : 'Dialpad opened for fast roll entry', 'info');
  };

  const handleExit = () => {
    if (onLogout) {
      onLogout();
    } else if (logout) {
      logout();
    }
    showToast('Session exited safely', 'info');
  };

  // Filter students based on active tab and search query
  const filteredStudents = (data?.students || []).filter(student => {
    const isStudentPresent = student.status === 'PRESENT';
    const matchesTab =
      currentTab === 'all' ||
      (currentTab === 'present' && isStudentPresent) ||
      (currentTab === 'absent' && !isStudentPresent);

    const matchesSearch =
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const isFinalized = Boolean(data?.room?.room_finalized);
  const totalCount = data?.stats?.total ?? 0;
  const presentCount = data?.stats?.present ?? 0;
  const absentCount = data?.stats?.absent ?? 0;
  const verifiedPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const currentRoomPin = data?.room?.room_pin || '1234';
  const batchName = data?.students?.[0]?.batch_name || 'Batch 1';
  const assessmentTime = data?.students?.[0]?.assessment_time || '11:00 AM - 01:30 PM';

  return (
    <div className="w-full h-full max-w-md bg-darkBg sm:rounded-[36px] sm:border-[8px] sm:border-[#1e293b] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative text-slate-100 font-sans select-none">
      {/* Header */}
      <header className="px-4 py-3 bg-darkBg border-b border-slate-800/90 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-white font-bold ring-2 ring-emerald-400/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-sm tracking-tight text-white">Invigilator Pro</h1>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/60 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                LIVE PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Room {roomNumber} •{' '}
              <span className="text-emerald-400 font-semibold">Active Session</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <select
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs font-bold px-2 py-1.5 rounded-xl border border-slate-700 outline-none"
            >
              {availableRooms.map((r) => (
                <option key={r.room_number} value={r.room_number}>
                  Room {r.room_number}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleExit}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-700/80 active:scale-95 shadow-sm touch-target"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 flex flex-col">
        {/* Hall Summary Card (High Visibility Color-Coded) */}
        <div className="bg-cardBg border border-slate-800/90 rounded-2xl p-4 shadow-2xl relative overflow-hidden shrink-0">
          {/* Background ambient glow */}
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-white tracking-tight">Hall {roomNumber}</h2>
                <span className="bg-indigo-950 text-indigo-400 border border-indigo-700/50 text-[11px] font-bold px-2 py-0.5 rounded-md">
                  {batchName}
                </span>
              </div>
              <div className="flex items-center space-x-2.5 mt-2 text-xs">
                <div className="flex items-center space-x-1.5 bg-amber-500/15 text-amberPin border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] shadow-sm">
                  <Key className="w-3.5 h-3.5 text-amberPin" />
                  <span>PIN: {currentRoomPin}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-300 text-[11px] font-medium bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>{assessmentTime}</span>
                </div>
              </div>
            </div>
            <button
              onClick={refreshHallData}
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700/80 active:rotate-180 duration-300 shadow touch-target"
              title="Refresh Hall"
            >
              <RotateCw className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Verification Progress Stats */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-slate-300">
                Verified: <span className="text-emerald-400 font-extrabold text-sm">{presentCount}</span> / {totalCount} candidates
              </span>
              <span className="text-emerald-400 font-mono font-bold">{verifiedPercent}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${verifiedPercent}%` }}
              ></div>
            </div>
          </div>

          {/* High-Contrast Color-Coded Counters Grid */}
          <div className="grid grid-cols-3 gap-2.5 mt-3.5 text-center">
            <div className="bg-slate-900/80 border border-blue-950/60 rounded-xl p-2.5 shadow-sm">
              <div className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Enrolled</div>
              <div className="text-base font-extrabold text-blue-100 mt-0.5">{totalCount}</div>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-2.5 shadow-sm">
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Present</div>
              <div className="text-base font-extrabold text-emerald-400 mt-0.5">{presentCount}</div>
            </div>
            <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-2.5 shadow-sm">
              <div className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Absent</div>
              <div className="text-base font-extrabold text-rose-400 mt-0.5">{absentCount}</div>
            </div>
          </div>

          {/* Prominent Action Button */}
          {isFinalized ? (
            <div className="mt-3.5 w-full bg-emerald-950/60 text-emerald-400 font-bold py-3 px-4 rounded-xl border border-emerald-700/60 flex items-center justify-center space-x-2 text-xs">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Headcount Verified ({presentCount} Present) & Room Locked</span>
            </div>
          ) : (
            <button
              onClick={verifyAndLockRoom}
              className="mt-3.5 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 transition active:scale-[0.98] border border-emerald-400/30 text-xs tracking-wide touch-target"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Head Count ({presentCount} Present) & Lock Room</span>
            </button>
          )}
        </div>

        {/* Cross-Room Detection Alert */}
        {globalMatch && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-300 shadow-card">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Student in Room {globalMatch.room_number}</span>
            </div>
            <p className="mt-1 text-amber-200 text-[11px]">
              <b>{globalMatch.name}</b> ({globalMatch.roll_number}) is enrolled in Hall {globalMatch.room_number}.
            </p>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by roll number or name..."
              className="w-full bg-cardBg border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-100 placeholder-slate-400 outline-none transition shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold hover:bg-slate-700"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={toggleFilterOptions}
            className={`p-3 bg-cardBg hover:bg-cardHover border rounded-xl transition flex items-center justify-center active:scale-95 shadow touch-target ${
              showKeypad ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' : 'border-slate-800 text-emerald-400'
            }`}
            title="Dialpad / Quick Roll Entry"
          >
            {showKeypad ? <Hash className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          </button>
        </div>

        {/* Numeric Keypad Drawer (Quick Attendance Dialpad) */}
        {showKeypad && (
          <div className="bg-cardBg border border-slate-800 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Dialpad: Type last 2–4 digits of Roll
              </span>
              <button
                onClick={() => setShowKeypad(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <NumericKeypad
              onInput={(digit) => {
                setSearchQuery(prev => prev + digit);
              }}
              onBackspace={() => {
                setSearchQuery(prev => prev.slice(0, -1));
              }}
              onClear={() => setSearchQuery('')}
            />
          </div>
        )}

        {/* Segmented Tabs */}
        <div className="grid grid-cols-3 bg-cardBg p-1.5 rounded-xl border border-slate-800 gap-1 text-xs font-semibold shrink-0 shadow-inner">
          <button
            onClick={() => setCurrentTab('all')}
            className={`py-2.5 rounded-lg transition shadow flex items-center justify-center space-x-1.5 touch-target ${
              currentTab === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 font-semibold'
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded text-[10px]">
              {totalCount}
            </span>
          </button>
          <button
            onClick={() => setCurrentTab('absent')}
            className={`py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 touch-target ${
              currentTab === 'absent'
                ? 'bg-slate-800 text-rose-300 font-bold border border-rose-900/60 shadow-card'
                : 'text-slate-400 hover:text-rose-300 font-semibold'
            }`}
          >
            <span>Absent</span>
            <span className="px-1.5 py-0.5 bg-rose-950/80 text-rose-400 border border-rose-900/50 rounded text-[10px]">
              {absentCount}
            </span>
          </button>
          <button
            onClick={() => setCurrentTab('present')}
            className={`py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 touch-target ${
              currentTab === 'present'
                ? 'bg-slate-800 text-emerald-300 font-bold border border-emerald-900/60 shadow-card'
                : 'text-slate-400 hover:text-emerald-300 font-semibold'
            }`}
          >
            <span>Present</span>
            <span className="px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-900/50 rounded text-[10px]">
              {presentCount}
            </span>
          </button>
        </div>

        {/* Candidates List Container */}
        <div className="space-y-3 pb-6 flex-1">
          {loading ? (
            <div className="text-center py-12 bg-cardBg border border-slate-800 rounded-2xl shadow-lg">
              <RotateCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
              <p className="text-slate-300 text-xs font-semibold">Loading candidates...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 bg-cardBg border border-slate-800 rounded-2xl shadow-lg">
              <UserX className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-300 text-xs font-semibold">No candidates found matching criteria.</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <StudentSwipeCard
                key={student.id}
                student={student}
                onMarkPresent={handleMarkPresent}
                onUndoAttendance={handleUndoAttendance}
                hideSetInfo={!isAdmin}
              />
            ))
          )}
        </div>
      </main>

      {/* Finalize Room Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Lock Examination Hall?</h3>
                <p className="text-xs text-slate-400">Hall {roomNumber} Attendance Headcount</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to lock Room {roomNumber} with{' '}
              <b className="text-emerald-400 font-mono">{presentCount} Present</b> out of{' '}
              <b className="font-mono">{totalCount} Enrolled</b> candidates.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLockRoom}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-card"
              >
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast Modal / Box */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-50 transition-all duration-300 max-w-sm text-xs font-medium animate-slide-up">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'warning' || toast.type === 'error'
                ? 'bg-rose-500/20 text-rose-400'
                : toast.type === 'info'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {toast.type === 'warning' || toast.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : toast.type === 'info' ? (
              <Info className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="leading-relaxed">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
