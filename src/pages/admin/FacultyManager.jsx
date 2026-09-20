import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import { Users, Key, Save, CheckCircle2, RefreshCw } from 'lucide-react';

export default function FacultyManager() {
  const [exam, setExam] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const active = appStorage.getActiveExam();
      const facData = appStorage.getFacultyList();
      setExam(active);
      setFacultyList(facData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = (roomNumber, facultyId, roomPin) => {
    setStatusMsg(null);
    try {
      const res = appStorage.assignRoomFaculty(roomNumber, facultyId, roomPin);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `Room ${roomNumber} updated successfully!` });
        loadData();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update room assignment' });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-sans">
        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-900" />
        <p className="text-xs font-semibold">Loading Faculty & Room Allocations...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans min-w-0 max-w-full">
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-subtle">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Faculty & Hall Allocations</h2>
        <p className="text-xs text-slate-500 mb-6 font-medium">
          Assign faculty invigilators and set 4-digit access PINs for each examination room.
        </p>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                : 'bg-rose-50 text-rose-950 border border-rose-200'
            }`}
          >
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {(exam?.rooms || []).map((r) => {
            return (
              <RoomRow
                key={r.id}
                room={r}
                facultyList={facultyList}
                onSave={(facId, pin) => handleUpdateRoom(r.room_number, facId, pin)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoomRow({ room, facultyList, onSave }) {
  const [selectedFaculty, setSelectedFaculty] = useState(room.faculty_id || '');
  const [pin, setPin] = useState(room.room_pin || '1234');
  const [changed, setChanged] = useState(false);

  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-mono font-bold shadow-subtle shrink-0">
          <span className="text-[8px] uppercase tracking-wider text-slate-400">Room</span>
          <span className="text-xs font-bold">{room.room_number}</span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">Room {room.room_number}</h4>
          <p className="text-xs text-slate-500 font-medium">
            Currently Assigned: <span className="font-semibold text-slate-800">{room.faculty_name || 'None (Open PIN)'}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <select
          value={selectedFaculty}
          onChange={(e) => {
            setSelectedFaculty(e.target.value);
            setChanged(true);
          }}
          className="touch-target px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 focus-ring"
        >
          <option value="">-- Assign Faculty --</option>
          {facultyList.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.username})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200/80">
          <Key size={14} className="text-slate-400" />
          <input
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setChanged(true);
            }}
            placeholder="PIN"
            maxLength={6}
            className="w-16 bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            onSave(selectedFaculty, pin);
            setChanged(false);
          }}
          disabled={!changed}
          className={`touch-target px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-ring ${
            changed
              ? 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-subtle'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'
          }`}
        >
          <Save size={14} />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
