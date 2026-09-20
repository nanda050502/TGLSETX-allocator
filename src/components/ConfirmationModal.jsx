import React, { useEffect } from 'react';
import { Check, X, Undo2, AlertCircle } from 'lucide-react';

export default function ConfirmationModal({ notification, onClose }) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const isError = notification.type === 'ERROR';
  const isUndo = notification.type === 'UNDO';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-ios-island pointer-events-auto max-w-sm w-[92%] sm:w-auto font-sans">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-full pl-3.5 pr-2.5 py-2 shadow-toast border border-slate-700/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
              isError
                ? 'bg-rose-500 text-white'
                : isUndo
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {isError ? (
              <AlertCircle size={13} strokeWidth={2.5} />
            ) : isUndo ? (
              <Undo2 size={12} strokeWidth={2.5} />
            ) : (
              <Check size={13} strokeWidth={3} />
            )}
          </div>

          <div className="text-xs font-bold text-white truncate">
            {notification.message}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-white transition shrink-0 focus-ring"
          title="Close Toast"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

