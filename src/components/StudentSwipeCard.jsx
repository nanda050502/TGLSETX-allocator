import React, { useState, useRef } from 'react';
import { Check, Undo2, ChevronRight, Mail } from 'lucide-react';

export default function StudentSwipeCard({ student, onMarkPresent, onUndoAttendance, loading, hideSetInfo = false }) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalScrollRef = useRef(null);
  const currentOffsetRef = useRef(0);
  const cardRef = useRef(null);

  const THRESHOLD = 75;

  // Touch Handlers with Directional Locking
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

    // Detect primary scroll direction if not determined yet
    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 6) {
        isHorizontalScrollRef.current = false; // Vertical page scroll
        setIsDragging(false);
        return;
      } else if (Math.abs(deltaX) > 8) {
        isHorizontalScrollRef.current = true; // Horizontal card swipe
      }
    }

    if (isHorizontalScrollRef.current !== true) return;

    if (student.status === 'ABSENT' && deltaX > 0) {
      const dampened = Math.min(deltaX, 120);
      setDragOffset(dampened);
      currentOffsetRef.current = dampened;
    } else if (student.status === 'PRESENT' && deltaX < 0) {
      const dampened = Math.max(deltaX, -120);
      setDragOffset(dampened);
      currentOffsetRef.current = dampened;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || loading) return;
    setIsDragging(false);

    if (student.status === 'ABSENT' && currentOffsetRef.current >= THRESHOLD) {
      try { navigator.vibrate?.(25); } catch (_) {}
      onMarkPresent(student);
    } else if (student.status === 'PRESENT' && currentOffsetRef.current <= -THRESHOLD) {
      try { navigator.vibrate?.(20); } catch (_) {}
      onUndoAttendance(student);
    }

    setDragOffset(0);
    currentOffsetRef.current = 0;
    isHorizontalScrollRef.current = null;
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e) => {
    if (loading) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    currentOffsetRef.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || loading) return;
    const deltaX = e.clientX - startXRef.current;
    if (student.status === 'ABSENT' && deltaX > 0) {
      const dampened = Math.min(deltaX, 120);
      setDragOffset(dampened);
      currentOffsetRef.current = dampened;
    } else if (student.status === 'PRESENT' && deltaX < 0) {
      const dampened = Math.max(deltaX, -120);
      setDragOffset(dampened);
      currentOffsetRef.current = dampened;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || loading) return;
    setIsDragging(false);

    if (student.status === 'ABSENT' && currentOffsetRef.current >= THRESHOLD) {
      onMarkPresent(student);
    } else if (student.status === 'PRESENT' && currentOffsetRef.current <= -THRESHOLD) {
      onUndoAttendance(student);
    }

    setDragOffset(0);
    currentOffsetRef.current = 0;
  };

  const isPresent = student.status === 'PRESENT';

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl mb-2.5 shadow-card select-none touch-pan-y font-sans"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Swipe Right Background (Emerald 600) */}
      <div
        className={`absolute inset-0 flex items-center justify-start px-6 bg-emerald-600 text-white font-semibold transition-opacity duration-150 rounded-2xl ${
          dragOffset > 15 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Check size={18} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold">Mark Present</span>
        </div>
      </div>

      {/* Swipe Left Background (Amber 500 Undo) */}
      <div
        className={`absolute inset-0 flex items-center justify-end px-6 bg-amber-500 text-white font-semibold transition-opacity duration-150 rounded-2xl ${
          dragOffset < -15 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">Mark Absent</span>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Undo2 size={16} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Foreground Inset Cell */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className={`relative z-10 p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl transition-colors ${
          isPresent ? 'border-l-4 border-l-emerald-500' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Student Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-200 tracking-tight">
                {student.roll_number}
              </span>

              {student.batch_name && (
                <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {student.batch_name}
                </span>
              )}

              {/* Set Display - Hidden for faculty if hideSetInfo is true */}
              {isPresent && (
                !hideSetInfo && student.assigned_set ? (
                  <span className="font-bold font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-white">
                    {student.assigned_set}
                  </span>
                ) : (
                  <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Set Reserved
                  </span>
                )
              )}

              {/* Late Arrival Badge */}
              {isPresent && student.is_late && (
                <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                  ⏱️ Gate Late (+{student.late_minutes}m)
                </span>
              )}

              {isPresent ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Present
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  Absent
                </span>
              )}
            </div>

            {/* Student Name */}
            <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
              {student.name}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate font-medium">
              {student.assessment_time && (
                <span className="font-mono text-[11px] text-slate-600">
                  ⏰ {student.assessment_time}
                </span>
              )}
              {student.email && (
                <span className="truncate text-slate-400">
                  &bull; {student.email}
                </span>
              )}
            </div>
          </div>

          {/* Right Section: Check-in Timestamp & Quick Action */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {isPresent ? (
              <div className="text-right">
                <div className="text-[11px] font-mono text-slate-500 font-bold">
                  🕒 {student.checkin_time}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <span className="hidden xs:inline text-[11px]">Swipe</span>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 mt-1">
              {isPresent ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUndoAttendance(student);
                  }}
                  className="touch-target text-[11px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition border border-slate-200 active:scale-[0.98] focus-ring"
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
                  className="touch-target text-[11px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold transition active:scale-[0.98] shadow-subtle focus-ring"
                >
                  Mark
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

