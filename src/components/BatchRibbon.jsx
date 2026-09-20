import React from 'react';
import { getBatchSessionStatus } from '../services/appStorage';
import { CheckCircle2, Clock } from 'lucide-react';

export default function BatchRibbon({ batches = [], selectedBatchId, onSelectBatch, label = "Batches:" }) {
  if (!batches || batches.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 max-w-full scrollbar-thin">
      {label && (
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-0.5">
          {label}
        </span>
      )}

      {batches.map((b) => {
        const isSelected = String(selectedBatchId) === String(b.id);
        const sessionState = b.status === 'ACTIVE'
          ? 'ACTIVE'
          : (b.status === 'COMPLETED'
              ? 'COMPLETED'
              : getBatchSessionStatus(b.exam_date, b.session_time, b.status === 'MANUAL_ACTIVE'));

        let containerClass = "";
        let badgeElement = null;

        if (sessionState === 'ACTIVE') {
          // ACTIVE SESSION - Vibrant Green Badge/Box!
          containerClass = isSelected
            ? "bg-emerald-950 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/40"
            : "bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 border-emerald-400 font-bold shadow-xs";

          badgeElement = (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 shadow-xs ${
                isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          );
        } else if (sessionState === 'COMPLETED') {
          // COMPLETED SESSION - Grey Box
          containerClass = isSelected
            ? "bg-slate-800 text-slate-200 border-slate-700 shadow-subtle"
            : "bg-slate-100/90 hover:bg-slate-200/70 text-slate-500 border-slate-200/90";

          badgeElement = (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                isSelected
                  ? 'bg-slate-700 text-slate-300 border-slate-600'
                  : 'bg-slate-200/80 text-slate-600 border-slate-300/60'
              }`}
            >
              <CheckCircle2 size={10} />
              Completed
            </span>
          );
        } else {
          // PENDING SESSION - Slate/Amber Tinted Neutral Box
          containerClass = isSelected
            ? "bg-slate-900 text-white border-slate-900 shadow-subtle"
            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90";

          badgeElement = (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                isSelected
                  ? 'bg-slate-800 text-amber-300 border-slate-700'
                  : 'bg-amber-50/80 text-amber-700 border-amber-200/80'
              }`}
            >
              Pending
            </span>
          );
        }

        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelectBatch && onSelectBatch(b.id)}
            className={`touch-target px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all duration-150 flex items-center gap-2 border cursor-pointer focus-ring ${containerClass}`}
          >
            <div className="flex items-center gap-1.5">
              {b.subject_code && (
                <span className={`font-mono font-bold text-[11px] ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {b.subject_code}
                </span>
              )}
              <span>{b.name}</span>
            </div>

            {b.session_time && (
              <span
                className={`text-[10px] font-mono ${
                  sessionState === 'ACTIVE'
                    ? (isSelected ? 'text-emerald-200' : 'text-emerald-800 font-medium')
                    : (isSelected ? 'text-slate-400' : 'text-slate-500')
                }`}
              >
                ({b.session_time})
              </span>
            )}

            {badgeElement}
          </button>
        );
      })}
    </div>
  );
}
