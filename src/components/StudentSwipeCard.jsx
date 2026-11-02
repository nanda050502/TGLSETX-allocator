import React, { useState, useRef } from 'react';
import { Check, X, ChevronRight, Clock, Mail } from 'lucide-react';

export default function StudentSwipeCard({
  student,
  onMarkPresent,
  onUndoAttendance,
  loading = false,
  hideSetInfo = false
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalScrollRef = useRef(null);
  const currentOffsetRef = useRef(0);

  const THRESHOLD = 70;
  const isPresent = student.status === 'PRESENT';

  // Touch Handlers for horizontal swipe
  const handleTouchStart = (e) => {
    if (loading) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalScrollRef.current = null;
    currentOffsetRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isDragging || loading) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 6) {
        isHorizontalScrollRef.current = false;
        setIsDragging(false);
        return;
      } else if (Math.abs(deltaX) > 8) {
        isHorizontalScrollRef.current = true;
      }
    }

    if (isHorizontalScrollRef.current !== true) return;

    if (!isPresent && deltaX > 0) {
      const dampened = Math.min(deltaX, 110);
      setDragOffset(dampened);
      currentOffsetRef.current = dampened;
    } else if (isPresent && deltaX < 0) {
      const dampened = Math.max(deltaX, -110);
      setDragOffset(dampened);
      currentOffsetRef.current = dampened;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || loading) return;
    setIsDragging(false);

    if (!isPresent && currentOffsetRef.current >= THRESHOLD) {
      onMarkPresent(student);
    } else if (isPresent && currentOffsetRef.current <= -THRESHOLD) {
      onUndoAttendance(student);
    }

    setDragOffset(0);
    currentOffsetRef.current = 0;
    isHorizontalScrollRef.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl select-none">
      {/* Swipe reveal background indicator */}
      {isDragging && (
        <div
          className={`absolute inset-0 flex items-center px-4 rounded-2xl ${
            dragOffset > 0 ? 'bg-emerald-600 justify-start' : 'bg-rose-600 justify-end'
          }`}
        >
          {dragOffset > 0 ? (
            <div className="flex items-center gap-1.5 text-white font-bold text-xs">
              <Check className="w-4 h-4" />
              <span>Mark Present</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-white font-bold text-xs">
              <X className="w-4 h-4" />
              <span>Mark Absent</span>
            </div>
          )}
        </div>
      )}

      {/* Main Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className={`bg-cardBg border-l-4 ${
          isPresent ? 'border-l-emerald-500' : 'border-l-rose-500'
        } border-t border-r border-b border-slate-800/90 rounded-2xl p-4 transition-all relative overflow-hidden shadow-lg ${
          isPresent
            ? 'bg-gradient-to-r from-emerald-950/20 via-cardBg to-cardBg shadow-emerald-950/20'
            : 'bg-gradient-to-r from-rose-950/20 via-cardBg to-cardBg shadow-rose-950/10'
        }`}
      >
        {/* Top Badges Row */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="bg-slate-900 text-slate-100 border border-slate-700 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold tracking-wide shadow-sm">
              {student.roll_number}
            </span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700/70 text-[10px] font-semibold px-2 py-0.5 rounded-md">
              {student.batch_name || 'Batch 1'}
            </span>
            {isPresent && student.assigned_set && !hideSetInfo && (
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                {student.assigned_set}
              </span>
            )}
            {student.is_late && (
              <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                ⏱️ Late (+{student.late_minutes}m)
              </span>
            )}
          </div>

          <div
            onClick={() => (isPresent ? onUndoAttendance(student) : onMarkPresent(student))}
            className="flex items-center text-[11px] text-slate-400 space-x-1 cursor-pointer hover:text-white transition group/swipe"
          >
            <span className="font-medium">Swipe</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/swipe:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Candidate Name & Info */}
        <div className="mt-2.5">
          <h3 className="font-extrabold text-sm text-white tracking-tight truncate">
            {student.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-300 font-medium">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-teal-400 shrink-0" />
              <span>{student.assessment_time || '11:00 AM - 01:30 PM'}</span>
            </span>
            {student.email && (
              <span className="flex items-center space-x-1 text-slate-400 truncate max-w-[180px]">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{student.email}</span>
              </span>
            )}
            {isPresent && student.checkin_time && (
              <span className="font-mono text-emerald-400 text-[10px] font-bold">
                🕒 {student.checkin_time}
              </span>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPresent ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
              }`}
            ></span>
            <span className={isPresent ? 'text-emerald-400' : 'text-rose-400'}>
              {isPresent ? 'Present' : 'Absent'}
            </span>
          </div>

          {isPresent ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUndoAttendance(student);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 active:scale-95 shadow-md bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-700/80 shadow-rose-950/30 touch-target"
            >
              Undo
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkPresent(student);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 active:scale-95 shadow-md bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white border border-emerald-400/40 shadow-emerald-950/40 touch-target"
            >
              Mark
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
