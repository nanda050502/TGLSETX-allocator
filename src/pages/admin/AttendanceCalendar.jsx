import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Check,
  Search,
  X,
  Smartphone,
  ArrowLeft,
  Download
} from 'lucide-react';

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AttendanceCalendar({ onOpenRoomCheckin, onExamActivated }) {
  const todayStr = getLocalDateStr();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarSummary, setCalendarSummary] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Full-Screen Day Drilldown State
  const [activeDate, setActiveDate] = useState(null);
  const [dateData, setDateData] = useState(null);
  const [dateLoading, setDateLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Full-Screen Room Roster Modal
  const [roomModal, setRoomModal] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalFilter, setModalFilter] = useState('ALL');

  useEffect(() => {
    fetchCalendarSummary();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (roomModal) {
          setRoomModal(null);
        } else if (activeDate) {
          setActiveDate(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDate, roomModal]);

  const fetchCalendarSummary = () => {
    setLoadingSummary(true);
    try {
      const dates = appStorage.getCalendarSummary();
      const map = {};
      (dates || []).forEach((d) => {
        map[d.exam_date] = d;
      });
      setCalendarSummary(map);

      if (dates && dates.length > 0) {
        const latestDate = dates[0].exam_date;
        if (latestDate) {
          const [y, m] = latestDate.split('-').map(Number);
          if (y && m) {
            setCurrentMonth(new Date(y, m - 1, 1));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchDateBatches = (date) => {
    setDateLoading(true);
    try {
      const data = appStorage.getExamsByDate(date);
      setDateData(data);
      if (data.batches && data.batches.length > 0) {
        setSelectedBatchId(data.batches[0].id);
      } else {
        setSelectedBatchId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDateLoading(false);
    }
  };

  const handleOpenDay = (dateKey) => {
    setActiveDate(dateKey);
    fetchDateBatches(dateKey);
  };

  const handleOpenRoomModal = (batch, room) => {
    setModalSearch('');
    setModalFilter('ALL');
    
    const roomData = appStorage.getRoomAttendance(room.room_number, batch.id);
    setRoomModal({
      roomNo: room.room_number,
      roomInfo: room,
      batchInfo: batch,
      students: roomData.students || [],
      stats: roomData.stats || { total: room.total_students, present: room.present_count, absent: room.absent_count }
    });
  };

  const handleSetActiveBatch = (examId) => {
    appStorage.switchActiveExam(examId);
    if (activeDate) fetchDateBatches(activeDate);
    fetchCalendarSummary();
    if (onExamActivated) onExamActivated();
  };

  const handleToggleStudent = (student) => {
    if (student.status === 'ABSENT') {
      appStorage.markAttendance({ student_id: student.id, room_number: roomModal.roomNo });
    } else {
      appStorage.undoAttendance({ student_id: student.id });
    }
    handleOpenRoomModal(roomModal.batchInfo, roomModal.roomInfo);
    if (activeDate) fetchDateBatches(activeDate);
    fetchCalendarSummary();
  };

  // Calendar Math
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const handleTodayMonth = () => setCurrentMonth(new Date());

  const activeBatch =
    (dateData?.batches || []).find((b) => b.id === selectedBatchId) ||
    dateData?.batches?.[0];

  const modalSortedStudents = (roomModal?.students || [])
    .slice()
    .sort((a, b) => {
      if (a.status === 'PRESENT' && b.status === 'ABSENT') return -1;
      if (a.status === 'ABSENT' && b.status === 'PRESENT') return 1;
      return a.roll_number.localeCompare(b.roll_number);
    })
    .filter((st) => {
      const matchesSearch =
        st.roll_number.toLowerCase().includes(modalSearch.toLowerCase()) ||
        st.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
        (st.email && st.email.toLowerCase().includes(modalSearch.toLowerCase()));

      if (!matchesSearch) return false;
      if (modalFilter === 'PRESENT') return st.status === 'PRESENT';
      if (modalFilter === 'ABSENT') return st.status === 'ABSENT';
      return true;
    });

  const presentCount = (roomModal?.students || []).filter((s) => s.status === 'PRESENT').length;
  const absentCount = (roomModal?.students || []).filter((s) => s.status === 'ABSENT').length;

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-4.5rem)] font-sans flex flex-col p-3 sm:p-6 space-y-4 min-w-0 max-w-full">
      {/* Calendar View */}
      {!activeDate ? (
        <div className="w-full flex-1 flex flex-col space-y-4 animate-fade-in">
          {/* Action Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-subtle">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Examination Attendance Schedule
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Select any date to inspect session rosters & paper set distributions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={handlePrevMonth}
                  className="touch-target p-1.5 rounded-lg hover:bg-white text-slate-700 transition focus-ring"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleTodayMonth}
                  className="touch-target px-3 py-1 text-xs font-bold text-slate-800 hover:bg-white rounded-lg transition focus-ring"
                >
                  Current Month
                </button>
                <button
                  onClick={handleNextMonth}
                  className="touch-target p-1.5 rounded-lg hover:bg-white text-slate-700 transition focus-ring"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <button
                onClick={fetchCalendarSummary}
                className="touch-target px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-200 focus-ring"
              >
                <RefreshCw size={14} className={loadingSummary ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Calendar Matrix Card */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-3 sm:p-6 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {monthNames[month]} <span className="font-mono text-slate-400 font-normal">{year}</span>
              </h2>

              <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="text-slate-700">Exam Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                  <span className="text-slate-700">Today</span>
                </div>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-3 pb-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div
                  key={i}
                  className={`text-xs font-bold uppercase tracking-wider py-1 font-mono ${
                    i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-700'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 flex-1 pt-1">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[85px] sm:min-h-[110px] rounded-xl bg-slate-50/40 border border-slate-100/50"
                />
              ))}

              {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const summary = calendarSummary[dateKey];
                const isToday = dateKey === todayStr;
                const hasData = Boolean(summary);

                const presentP =
                  summary && summary.total_students > 0
                    ? Math.round((summary.present_count / summary.total_students) * 100)
                    : 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleOpenDay(dateKey)}
                    className={`group min-h-[85px] sm:min-h-[110px] rounded-xl p-2 sm:p-3 text-left transition duration-150 relative flex flex-col justify-between border cursor-pointer focus-ring ${
                      isToday
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : hasData
                        ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-subtle hover:border-slate-300'
                        : 'bg-slate-50/60 hover:bg-white text-slate-800 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
                          isToday ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {isToday && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">
                          TODAY
                        </span>
                      )}
                    </div>

                    {hasData ? (
                      <div className="space-y-1 my-1">
                        <div
                          className={`text-[10px] sm:text-xs font-semibold truncate rounded-md px-1.5 py-0.5 border ${
                            isToday
                              ? 'bg-white/10 text-white border-white/20'
                              : 'bg-slate-100 text-slate-900 border-slate-200'
                          }`}
                        >
                          <span className="font-mono tabular-nums">{summary.batch_count || 1}</span>{' '}
                          {summary.batch_count === 1 ? 'Batch' : 'Batches'}
                        </div>

                        {summary.total_students > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-mono tabular-nums mb-0.5">
                              <span className={isToday ? 'text-slate-300' : 'text-slate-500'}>
                                {summary.present_count}/{summary.total_students}
                              </span>
                              <span
                                className={`font-bold ${
                                  isToday ? 'text-emerald-300' : 'text-emerald-700'
                                }`}
                              >
                                {presentP}%
                              </span>
                            </div>
                            <div
                              className={`w-full h-1.5 rounded-full overflow-hidden ${
                                isToday ? 'bg-white/20' : 'bg-slate-200'
                              }`}
                            >
                              <div
                                className={`h-full ${
                                  isToday ? 'bg-emerald-400' : 'bg-emerald-600'
                                }`}
                                style={{ width: `${presentP}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-medium">
                        &nbsp;
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 group-hover:text-slate-700 transition">
                      <span>Inspect</span>
                      <ArrowRight size={11} className={isToday ? 'text-white' : 'text-slate-900'} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Full Screen Day View */
        <div className="w-full flex-1 flex flex-col space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveDate(null)}
                className="touch-target p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5 text-xs font-bold border border-slate-200 focus-ring"
              >
                <ArrowLeft size={15} />
                <span>Calendar Matrix</span>
              </button>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white">
                    {new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                onClick={() => {
                  appStorage.downloadDayWorkbook(activeDate);
                }}
                className="touch-target px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-subtle focus-ring"
                title="Download Excel workbook with separate sheets for each batch and executive summary"
              >
                <Download size={14} />
                <span>Export Multi-Batch (.xlsx)</span>
              </button>

              <button
                onClick={() => fetchDateBatches(activeDate)}
                className="touch-target px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-200 focus-ring"
              >
                <RefreshCw size={14} className={dateLoading ? 'animate-spin' : ''} />
                <span>Refresh Day</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-4 sm:p-6 space-y-6">
            {dateLoading ? (
              <div className="py-24 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-900" />
                <p className="text-xs font-semibold text-slate-600">Loading session rosters...</p>
              </div>
            ) : (dateData?.batches || []).length === 0 ? (
              <div className="py-24 text-center bg-slate-50 rounded-2xl border border-slate-200/80 p-6">
                <CalendarIcon size={36} className="mx-auto text-slate-300 mb-2" />
                <h3 className="text-base font-bold text-slate-900">No Exams Scheduled on this Date</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Please return to the calendar matrix to select a highlighted date.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    Exam Sessions
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {dateData.batches.map((b) => {
                      const isSelected = selectedBatchId === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBatchId(b.id)}
                          className={`touch-target px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-2 border focus-ring ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-subtle'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-mono">{b.subject_code}</span>
                          <span>{b.name}</span>
                          {b.status === 'ACTIVE' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeBatch && (
                  <div className="space-y-5">
                    <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white text-slate-900 border border-slate-200">
                            {activeBatch.subject_code}
                          </span>
                          <span className="text-xs text-slate-600 font-semibold flex items-center gap-1 font-mono">
                            <Clock size={13} /> {activeBatch.session_time}
                          </span>
                          {activeBatch.status === 'ACTIVE' ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Active Live Exam
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
                              {activeBatch.status}
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mt-1">{activeBatch.name}</h2>
                      </div>

                      {activeBatch.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleSetActiveBatch(activeBatch.id)}
                          className="touch-target px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs transition shadow-subtle self-start flex items-center gap-1.5 focus-ring"
                        >
                          <Check size={14} strokeWidth={2.5} />
                          <span>Set Active Session</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Assigned Examination Halls ({activeBatch.rooms?.length || 0} Rooms)
                        </h3>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          Click any hall to view full student roster
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {(activeBatch.rooms || []).map((room) => {
                          const roomPercent =
                            room.total_students > 0
                              ? Math.round((room.present_count / room.total_students) * 100)
                              : 0;
                          return (
                            <div
                              key={room.room_number}
                              onClick={() => handleOpenRoomModal(activeBatch, room)}
                              tabIndex={0}
                              role="button"
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenRoomModal(activeBatch, room); }}
                              className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 cursor-pointer transition shadow-subtle hover:border-slate-300 group focus-ring"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-bold text-base text-slate-900 group-hover:text-slate-950 transition">
                                    Room {room.room_number}
                                  </h4>
                                  <p className="text-xs text-slate-500 truncate max-w-[150px] mt-0.5 font-medium">
                                    Invigilator: {room.faculty_name || 'Assigned PIN'}
                                  </p>
                                </div>

                                <span
                                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border tabular-nums ${
                                    roomPercent === 100
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : roomPercent > 0
                                      ? 'bg-slate-100 text-slate-900 border-slate-200'
                                      : 'bg-white text-slate-400 border-slate-200'
                                  }`}
                                >
                                  {roomPercent}%
                                </span>
                              </div>

                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                                <div
                                  className="bg-slate-900 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${roomPercent}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-medium">
                                <span className="text-slate-600">
                                  <b className="text-emerald-700 font-mono tabular-nums">{room.present_count}</b> / {room.total_students} Present
                                </span>
                                <span className="text-slate-800 font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                                  Roster <ChevronRight size={14} />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Room Roster Modal */}
      {roomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-elevated w-full max-w-3xl h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-ios-sheet">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 shrink-0 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Room {roomModal.roomNo} Roster</h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    PIN: {roomModal.roomInfo?.room_pin}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Invigilator: {roomModal.roomInfo?.faculty_name || 'Unassigned'} &bull; {roomModal.batchInfo?.name}
                </p>
              </div>

              <button
                onClick={() => setRoomModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition focus-ring"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 px-5 py-2.5 shrink-0 flex items-center justify-between flex-wrap gap-2 text-xs font-medium border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-slate-600">
                  Total: <b className="text-slate-900 font-mono tabular-nums">{roomModal.stats?.total ?? 0}</b>
                </span>
                <span className="text-emerald-700 font-bold">
                  Present: <b className="font-mono tabular-nums">{presentCount}</b>
                </span>
                <span className="text-rose-600 font-bold">
                  Absent: <b className="font-mono tabular-nums">{absentCount}</b>
                </span>
              </div>

              {onOpenRoomCheckin && (
                <button
                  type="button"
                  onClick={() => {
                    const rNo = roomModal.roomNo;
                    setRoomModal(null);
                    onOpenRoomCheckin(rNo);
                  }}
                  className="touch-target px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-subtle transition focus-ring"
                >
                  <Smartphone size={13} />
                  <span>Open Check-in Console</span>
                </button>
              )}
            </div>

            <div className="p-4 bg-white border-b border-slate-100 space-y-2.5 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search student in this room by name or roll..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none text-xs font-semibold text-slate-900 transition"
                />
              </div>

              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setModalFilter('ALL')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    modalFilter === 'ALL' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500'
                  }`}
                >
                  All ({roomModal.students?.length || 0})
                </button>
                <button
                  onClick={() => setModalFilter('PRESENT')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    modalFilter === 'PRESENT' ? 'bg-white text-emerald-700 shadow-subtle' : 'text-slate-500'
                  }`}
                >
                  Present ({presentCount})
                </button>
                <button
                  onClick={() => setModalFilter('ABSENT')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    modalFilter === 'ABSENT' ? 'bg-white text-rose-600 shadow-subtle' : 'text-slate-500'
                  }`}
                >
                  Absent ({absentCount})
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
              {modalSortedStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No matching candidates found.
                </div>
              ) : (
                modalSortedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="pt-2.5 first:pt-0 flex items-center justify-between text-xs gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{student.roll_number}</span>
                        <span className="font-bold text-slate-800">{student.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        {student.email || 'No email provided'} &bull; {student.department || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {student.status === 'PRESENT' ? (
                        <>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-200">
                            {student.assigned_set}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 font-medium">{student.checkin_time}</span>
                          <button
                            onClick={() => handleToggleStudent(student)}
                            className="touch-target px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] border border-rose-200 transition focus-ring"
                          >
                            Mark Absent
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleToggleStudent(student)}
                          className="touch-target px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-subtle focus-ring"
                        >
                          Mark Present
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
