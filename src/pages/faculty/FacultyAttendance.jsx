import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appStorage } from '../../services/appStorage';
import StudentSwipeCard from '../../components/StudentSwipeCard';
import NumericKeypad from '../../components/NumericKeypad';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Search, Hash, RefreshCw, Users, AlertTriangle, KeyRound, Lock, CheckCircle2, Layers, Smartphone, Sparkles } from 'lucide-react';

export default function FacultyAttendance({ defaultRoomNumber, isAndroidShell = false }) {
  const { user, isAdmin } = useAuth();
  const [roomNumber, setRoomNumber] = useState(
    defaultRoomNumber || user?.room_number || ''
  );
  const [availableRooms, setAvailableRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showKeypad, setShowKeypad] = useState(false);
  const [notification, setNotification] = useState(null);
  const [globalMatch, setGlobalMatch] = useState(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState('ROSTER'); // 'ROSTER' | 'INFO' | 'STATS'

  const searchInputRef = useRef(null);

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
      const interval = setInterval(() => {
        const rooms = appStorage.getAvailableRooms();
        setAvailableRooms(rooms || []);
        fetchRoomData(roomNumber, true);
      }, 4000);
      return () => clearInterval(interval);
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

  // Cross-room search
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

  // Mark Attendance (Swipe Right)
  const handleMarkPresent = async (student) => {
    const res = appStorage.markAttendance({
      student_id: student.id,
      room_number: roomNumber,
      marked_by_user_id: user?.id
    });

    if (res.success) {
      setNotification({
        type: 'SUCCESS',
        message: `${student.name} marked present`
      });

      fetchRoomData(roomNumber, true);
      setSearchQuery('');
    } else {
      setNotification({
        type: 'ERROR',
        message: res.message || res.error || 'Failed to mark attendance'
      });
    }
  };

  // Undo Attendance (Swipe Left)
  const handleUndoAttendance = async (student) => {
    const res = appStorage.undoAttendance({
      student_id: student.id,
      marked_by_user_id: user?.id
    });

    if (res.success) {
      setNotification({
        type: 'UNDO',
        message: `${student.name} marked absent`
      });

      fetchRoomData(roomNumber, true);
    }
  };

  // Finalize Room Attendance & Lock Sets
  const handleFinalizeRoom = () => {
    const res = appStorage.finalizeRoomAttendance({
      room_number: roomNumber,
      marked_by_user_id: user?.id
    });

    if (res.success) {
      setNotification({
        type: 'SUCCESS',
        message: `Room ${roomNumber} attendance finalized and locked!`
      });
      fetchRoomData(roomNumber, true);
    } else {
      setNotification({
        type: 'ERROR',
        message: res.error || 'Failed to finalize attendance'
      });
    }
    setShowFinalizeModal(false);
  };

  // Filter students
  const filteredStudents = (data?.students || []).filter(student => {
    const matchesSearch =
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'PRESENT') return student.status === 'PRESENT';
    if (filterStatus === 'ABSENT') return student.status === 'ABSENT';
    return true;
  });

  const isFinalized = Boolean(data?.room?.room_finalized);
  const totalCount = data?.stats?.total ?? 0;
  const presentCount = data?.stats?.present ?? 0;
  const absentCount = data?.stats?.absent ?? 0;
  const verifiedPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const currentRoomPin = data?.room?.room_pin || '1234';

  return (
    <div className={`max-w-2xl mx-auto px-3 sm:px-4 py-3 pb-32 font-sans select-none ${isAndroidShell ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Floating Notification */}
      <ConfirmationModal notification={notification} onClose={() => setNotification(null)} />

      {/* Android Room Summary & Headcount Bar */}
      <div className="pt-1 pb-3">
        <div className="bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Hall {roomNumber}
                </h1>
                {data?.students?.[0]?.batch_name && (
                  <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {data.students[0].batch_name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  <KeyRound size={12} /> PIN: {currentRoomPin}
                </span>
                {data?.students?.[0]?.assessment_time && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    ⏰ {data.students[0].assessment_time}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <select
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="bg-slate-950 text-slate-200 text-xs font-bold px-2 py-1.5 rounded-xl border border-slate-800 outline-none"
                >
                  {availableRooms.length === 0 ? (
                    <option value="">No Rooms</option>
                  ) : (
                    availableRooms.map((r) => (
                      <option key={r.room_number} value={r.room_number}>
                        Room {r.room_number}
                      </option>
                    ))
                  )}
                </select>
              )}

              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchRoomData(roomNumber, true);
                }}
                className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 active:scale-95"
                title="Sync Data"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
              </button>
            </div>
          </div>

          {/* Progress Bar & Stats */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">
                Verified: <b className="text-emerald-400 font-mono">{presentCount}</b> / {totalCount} candidates
              </span>
              <span className="text-slate-400 font-mono text-[11px]">{verifiedPercent}%</span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${verifiedPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-1">
              <span>Enrolled: <b className="text-slate-200 font-mono">{totalCount}</b></span>
              <span className="text-emerald-400 font-bold">Present: <b className="font-mono">{presentCount}</b></span>
              <span className="text-rose-400 font-bold">Absent: <b className="font-mono">{absentCount}</b></span>
            </div>
          </div>

          {/* Finalization Banner */}
          {isFinalized ? (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-emerald-400" /> Headcount Finalized ({presentCount} Confirmed)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">{data?.room?.finalized_at}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowFinalizeModal(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-card flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Verify Head Count ({presentCount} Present) & Lock Room</span>
            </button>
          )}
        </div>
      </div>

      {/* Cross-Room Alert */}
      {globalMatch && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 mb-3 text-xs text-amber-300 shadow-card">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span>Student in Room {globalMatch.room_number}</span>
          </div>
          <p className="mt-1 text-amber-200 text-[11px]">
            <b>{globalMatch.name}</b> ({globalMatch.roll_number}) is enrolled in Room {globalMatch.room_number}.
          </p>
        </div>
      )}

      {/* Search Bar & Filters */}
      <div className="sticky top-[60px] z-30 bg-slate-950/95 backdrop-blur-md pt-1 pb-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by roll or name..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs text-white font-semibold transition outline-none"
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
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`p-2.5 rounded-xl transition border shrink-0 touch-target ${
              showKeypad
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Dialpad"
          >
            <Hash size={18} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex p-1 bg-slate-900 rounded-xl mt-2 border border-slate-800">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'ALL'
                ? 'bg-slate-800 text-white shadow-card'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('ABSENT')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'ABSENT'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50 shadow-card'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Absent ({absentCount})
          </button>
          <button
            onClick={() => setFilterStatus('PRESENT')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'PRESENT'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 shadow-card'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Present ({presentCount})
          </button>
        </div>
      </div>

      {/* Student Swipe Roster */}
      <div className="mt-2 space-y-2.5">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-400">Loading student roster...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-card">
            <Users size={32} className="mx-auto text-slate-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-300">No candidates match</h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Try clearing your search query.</p>
          </div>
        ) : (
          filteredStudents.map(student => (
            <StudentSwipeCard
              key={student.id}
              student={student}
              onMarkPresent={handleMarkPresent}
              onUndoAttendance={handleUndoAttendance}
              loading={false}
              hideSetInfo={!isAdmin}
            />
          ))
        )}
      </div>

      {/* Custom Android Finalize Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-ios-sheet">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-extrabold text-white">Finalize Room {roomNumber}?</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                Confirm headcount of <b className="text-emerald-400 font-mono text-sm">{presentCount}</b> candidates present. Once locked, attendance record is saved.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeRoom}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-card"
              >
                Lock Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keypad Drawer */}
      {showKeypad && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-ios-sheet">
          <NumericKeypad
            onKeyPress={(d) => setSearchQuery(prev => prev + d)}
            onBackspace={() => setSearchQuery(prev => prev.slice(0, -1))}
            onClear={() => setSearchQuery('')}
            onClose={() => setShowKeypad(false)}
          />
        </div>
      )}
    </div>
  );
}
