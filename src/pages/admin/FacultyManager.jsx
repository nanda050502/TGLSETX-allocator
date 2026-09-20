import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import { Users, Key, Save, CheckCircle2, RefreshCw, Search, Check, AlertCircle } from 'lucide-react';

export default function FacultyManager() {
  const [examsList, setExamsList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examOverview, setExamOverview] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadOverview(selectedExamId);
    }
  }, [selectedExamId]);

  const loadData = () => {
    setLoading(true);
    try {
      const exams = appStorage.getExams();
      const facData = appStorage.getFacultyList();
      setExamsList(exams || []);
      setFacultyList(facData || []);

      if (exams && exams.length > 0) {
        const active = exams.find(e => e.status === 'ACTIVE') || exams[0];
        setSelectedExamId(active.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = (examId) => {
    try {
      const overview = appStorage.getLiveOverview(examId);
      setExamOverview(overview);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRoom = (roomNumber, facultyId, roomPin) => {
    setStatusMsg(null);
    try {
      const res = appStorage.assignRoomFaculty(roomNumber, facultyId, roomPin, selectedExamId);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `Room ${roomNumber} credentials & PIN updated successfully!` });
        loadOverview(selectedExamId);
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update room' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update room assignment' });
    }
  };

  const handleSetActiveBatch = () => {
    if (!selectedExamId) return;
    appStorage.switchActiveExam(selectedExamId);
    setStatusMsg({ type: 'success', text: `Batch marked as ACTIVE! Room logins are now enabled for this batch.` });
    loadData();
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-sans">
        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-900" />
        <p className="text-xs font-semibold">Loading Room PINs & Allocations...</p>
      </div>
    );
  }

  const activeExam = examOverview?.exam;
  const rooms = (examOverview?.rooms || []).filter(r =>
    String(r.room_number).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.faculty_name && r.faculty_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans min-w-0 max-w-full">
      {/* Batch Selector Strip */}
      {examsList.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-subtle space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Exam Batch:</span>
            {activeExam?.status !== 'ACTIVE' && (
              <button
                onClick={handleSetActiveBatch}
                className="touch-target px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-subtle flex items-center gap-1.5 focus-ring"
                title="Make this batch active so room logins verify against this batch"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>Set Batch as ACTIVE for Room Login</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {examsList.map((e) => {
              const isSelected = selectedExamId === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedExamId(e.id)}
                  className={`touch-target px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 border focus-ring ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-subtle'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{e.name}</span>
                  {e.status === 'ACTIVE' && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-white">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Allocation & PIN Lookup Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Room PIN Lookup & Credentials</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              View, lookup, or update 4-digit room access PINs and assigned invigilators for <b>{activeExam?.name || 'Selected Session'}</b>.
            </p>
          </div>

          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lookup room (e.g. 101, 901)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs font-semibold text-slate-900 transition outline-none"
            />
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                : 'bg-rose-50 text-rose-950 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Info Callout explaining Room PIN formula */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Key size={14} className="text-slate-700" />
            <span>Room PIN Login Rules:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            1. <b>Auto-generated PINs</b>: For imported rooms, default PIN is generated as <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-slate-800 border border-slate-200">RoomNo + "0"</code> (e.g., Room <b>101</b> &rarr; PIN <b>1010</b>, Room <b>901</b> &rarr; PIN <b>9010</b>).
            <br />
            2. <b>Active Batch Requirement</b>: The room's batch must be marked as <b>ACTIVE</b> for room PIN logins to succeed.
            <br />
            3. You can change any room's PIN below and click <b>Save</b> to set a custom PIN.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {rooms.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No examination rooms found for this batch query.
            </div>
          ) : (
            rooms.map((r) => (
              <RoomRow
                key={r.room_number}
                room={r}
                facultyList={facultyList}
                onSave={(facId, pin) => handleUpdateRoom(r.room_number, facId, pin)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RoomRow({ room, facultyList, onSave }) {
  const [selectedFaculty, setSelectedFaculty] = useState(room.faculty_id || '');
  const [pin, setPin] = useState(room.room_pin || '1234');
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    setPin(room.room_pin || '1234');
  }, [room.room_pin]);

  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-mono font-bold shadow-subtle shrink-0">
          <span className="text-[8px] uppercase tracking-wider text-slate-400">Room</span>
          <span className="text-xs font-bold">{room.room_number}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">Room {room.room_number}</h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              PIN: {room.room_pin}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Invigilator: <span className="font-semibold text-slate-800">{room.faculty_name || 'Unassigned'}</span>
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
          <option value="">-- Assign Invigilator --</option>
          {facultyList.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.username})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200/80">
          <Key size={14} className="text-slate-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">PIN:</span>
          <input
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setChanged(true);
            }}
            placeholder="PIN"
            maxLength={6}
            className="w-16 bg-white px-2 py-0.5 rounded border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
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
