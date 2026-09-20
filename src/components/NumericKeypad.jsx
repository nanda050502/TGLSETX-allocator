import React from 'react';
import { Delete, X } from 'lucide-react';

export default function NumericKeypad({ onKeyPress, onBackspace, onClear, onClose }) {
  const dialpad = [
    [{ num: '1', sub: '' }, { num: '2', sub: 'ABC' }, { num: '3', sub: 'DEF' }],
    [{ num: '4', sub: 'GHI' }, { num: '5', sub: 'JKL' }, { num: '6', sub: 'MNO' }],
    [{ num: '7', sub: 'PQRS' }, { num: '8', sub: 'TUV' }, { num: '9', sub: 'WXYZ' }],
    [{ num: 'C', sub: 'CLEAR', isAction: true }, { num: '0', sub: '+' }, { num: 'DEL', sub: '', isDelete: true }]
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-elevated max-w-xs mx-auto font-sans">
      {/* Top grabber & close */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-900"></span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Quick Dialpad
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus-ring"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Circular Keypad Grid */}
      <div className="space-y-3">
        {dialpad.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-3 gap-3 justify-items-center">
            {row.map((btn) => {
              if (btn.isDelete) {
                return (
                  <button
                    key="del"
                    type="button"
                    onClick={onBackspace}
                    className="w-14 h-14 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 transition border border-slate-200 shadow-subtle focus-ring"
                  >
                    <Delete size={20} />
                  </button>
                );
              }
              if (btn.isAction) {
                return (
                  <button
                    key="clear"
                    type="button"
                    onClick={onClear}
                    className="w-14 h-14 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 text-xs font-bold transition uppercase tracking-wider border border-slate-200 shadow-subtle focus-ring"
                  >
                    Clear
                  </button>
                );
              }
              return (
                <button
                  key={btn.num}
                  type="button"
                  onClick={() => onKeyPress(btn.num)}
                  className="w-14 h-14 rounded-full bg-slate-50 hover:bg-slate-100 hover:border-slate-300 active:scale-95 active:bg-slate-900 active:text-white flex flex-col items-center justify-center text-slate-900 transition border border-slate-200 shadow-subtle group focus-ring"
                >
                  <span className="text-xl font-bold leading-tight">{btn.num}</span>
                  {btn.sub && (
                    <span className="text-[8px] font-bold tracking-widest text-slate-400 group-active:text-slate-300">
                      {btn.sub}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

