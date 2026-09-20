import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appStorage } from '../services/appStorage';
import { ShieldCheck, KeyRound, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const { loginAdminOrFaculty, loginWithRoomPin } = useAuth();
  const [loginMode, setLoginMode] = useState('ROOM_PIN');

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');

  const adminAccounts = [
    { u: 'admin', p: 'password', label: 'admin' },
    { u: 'mayank', p: 'mayank@tgl2026', label: 'mayank' },
    { u: 'yahya', p: 'yahya@tgl2026', label: 'yahya' },
    { u: 'nanda', p: 'nanda@tgl2026', label: 'nanda' },
    { u: 'subramanian', p: 'CEO@tgl2026', label: 'subramanian' }
  ];

  const [roomNumber, setRoomNumber] = useState('');
  const [roomPin, setRoomPin] = useState('');
  const [staffName, setStaffName] = useState('');

  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const rooms = appStorage.getAvailableRooms();
      if (rooms && rooms.length > 0) {
        setAvailableRooms(rooms);
        setRoomNumber(rooms[0].room_number);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginAdminOrFaculty(username, password);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomPinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithRoomPin(roomNumber, roomPin, staffName);
    } catch (err) {
      setError(err.message || 'Room PIN verification failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = (type) => {
    setError(null);
    if (type === 'ADMIN') {
      setLoginMode('ACCOUNT');
      setUsername('admin');
      setPassword('password');
    } else if (type === 'ROOM_901') {
      setLoginMode('ROOM_PIN');
      setRoomNumber('901');
      setRoomPin('1234');
    } else {
      setLoginMode('ROOM_PIN');
      setRoomNumber('902');
      setRoomPin('1234');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl mb-4">
          Q
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          ExamSet Pro
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium max-w-sm mx-auto">
          Exam Attendance Verification & Chronological Paper Set Allocator
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-md py-6 px-5 sm:px-8 rounded-2xl shadow-toast border border-slate-800">
          {/* Segmented Control */}
          <div className="flex p-1 bg-slate-950/80 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setLoginMode('ROOM_PIN');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 touch-target ${
                loginMode === 'ROOM_PIN'
                  ? 'bg-emerald-600 text-white shadow-card'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound size={15} /> Room PIN Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('ACCOUNT');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target ${
                loginMode === 'ACCOUNT'
                  ? 'bg-blue-600 text-white shadow-card'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={15} /> Admin Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-slide-up">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Room PIN Form */}
          {loginMode === 'ROOM_PIN' ? (
            <form onSubmit={handleRoomPinSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    1. Examination Room / Hall Number
                  </label>
                  {availableRooms.length > 0 && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {availableRooms.length} hall{availableRooms.length > 1 ? 's' : ''} available
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    list="rooms-list"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 901, 902, 101"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold text-white text-sm transition outline-none"
                  />
                  <datalist id="rooms-list">
                    {availableRooms.map((r, idx) => (
                      <option key={idx} value={r.room_number}>
                        Room {r.room_number} ({r.faculty_name})
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Room Number Suggestion Pills */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Room Suggestions (Tap to Select):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                    {(availableRooms.length > 0
                      ? availableRooms.map(r => r.room_number)
                      : ['901', '902', '903', '904', '101', '102']
                    ).map((rNo) => (
                      <button
                        key={rNo}
                        type="button"
                        onClick={() => setRoomNumber(rNo)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border touch-target ${
                          roomNumber === rNo
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-card'
                            : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        Room {rNo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  2. Room Access PIN (Default: 1234)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={roomPin}
                  onChange={(e) => setRoomPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono font-black text-emerald-400 text-lg tracking-widest text-center transition outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  3. Your Name / Invigilator (Optional)
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Prof. Alex"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white font-medium text-xs transition outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-card flex items-center justify-center gap-1.5 active:scale-[0.99] touch-target focus:outline-none focus:ring-2 focus:ring-emerald-400 mt-2"
              >
                <span>{loading ? 'Verifying PIN...' : 'Access Room Attendance'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Admin Account
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {adminAccounts.map((acc) => (
                    <button
                      key={acc.u}
                      type="button"
                      onClick={() => {
                        setUsername(acc.u);
                        setPassword(acc.p);
                        setError(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border touch-target ${
                        username === acc.u
                          ? 'bg-blue-600 text-white border-blue-500 shadow-card'
                          : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white text-xs font-bold transition outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white text-xs font-bold transition outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-card flex items-center justify-center gap-1.5 active:scale-[0.99] touch-target focus:outline-none focus:ring-2 focus:ring-blue-400 mt-2"
              >
                <span>{loading ? 'Signing in...' : 'Sign In as Administrator'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* Chief Superintendent Admin Hint */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Available Admins: <b className="text-slate-200">admin</b>, <b className="text-slate-200">mayank</b>, <b className="text-slate-200">yahya</b>, <b className="text-slate-200">nanda</b>, <b className="text-slate-200">subramanian</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
