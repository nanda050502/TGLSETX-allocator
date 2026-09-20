import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider, useAuth } from './context/AuthContext';
import { appStorage } from './services/appStorage';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import LiveMonitoring from './pages/admin/LiveMonitoring';
import AttendanceCalendar from './pages/admin/AttendanceCalendar';
import StudentDirectory from './pages/admin/StudentDirectory';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import DataIngestion from './pages/admin/DataIngestion';
import ExamManager from './pages/admin/ExamManager';
import FacultyManager from './pages/admin/FacultyManager';
import AuditLogs from './pages/admin/AuditLogs';
import GoogleSheetSetupModal from './components/GoogleSheetSetupModal';
import { RefreshCw, LogOut, ArrowLeft } from 'lucide-react';

function MainApp() {
  const { user, token, loading, isAdmin, isFaculty, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('live-monitor');
  const [activeExam, setActiveExam] = useState(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('901');
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);

  const loadActiveExam = () => {
    try {
      const active = appStorage.getActiveExam();
      setActiveExam(active);
    } catch (err) {
      console.error('Failed to load active exam', err);
    }
  };

  useEffect(() => {
    if (token && user) {
      loadActiveExam();
      if (isFaculty) {
        setActiveTab('faculty-view');
        if (user?.room_number) {
          setSelectedRoomNumber(user.room_number);
        }
      } else if (isAdmin) {
        setActiveTab('live-monitor');
      }
    }
  }, [token, isFaculty, isAdmin, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <RefreshCw size={36} className="animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-bold text-slate-300">Loading ExamSet Pro SPA...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSwitchToRoom = (roomNo) => {
    setSelectedRoomNumber(roomNo);
    setActiveTab('faculty-view');
  };

  if (isFaculty) {
    const roomNo = user.room_number || selectedRoomNumber;
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start font-sans antialiased sm:py-6 sm:px-4">
        {/* Android Device Container Shell (Full screen on mobile, phone frame on desktop) */}
        <div className="w-full max-w-md min-h-screen sm:min-h-[850px] sm:max-h-[920px] bg-slate-900 text-slate-100 sm:rounded-[40px] shadow-2xl border border-slate-800 flex flex-col overflow-hidden relative">

          {/* Simulated Android System Status Bar */}
          <div className="bg-slate-950 px-5 pt-3 pb-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none border-b border-slate-800/80">
            <span className="font-bold text-slate-200">09:41 AM</span>
            <div className="w-16 h-4 bg-slate-900 rounded-full mx-auto hidden sm:block border border-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                5G • 🟢 Sync
              </span>
              <span className="text-slate-300 font-bold text-[10px]">98%</span>
            </div>
          </div>

          {/* Android App Bar */}
          <header className="bg-slate-900/95 backdrop-blur-md px-4 py-3 sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center font-black text-base text-white shadow-card">
                Q
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-sm text-white leading-tight">
                    Invigilator Pro
                  </h1>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ANDROID APP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {user.name} &bull; <b className="text-emerald-400 font-mono">Room {roomNo}</b>
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-rose-900/40 text-slate-300 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700 touch-target"
              title="Logout App"
            >
              <LogOut size={14} />
              <span className="text-[11px]">Exit</span>
            </button>
          </header>

          {/* Main App Content View */}
          <main className="flex-1 overflow-y-auto bg-slate-950 pb-6">
            <FacultyAttendance defaultRoomNumber={roomNo} isAndroidShell={true} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      examInfo={activeExam}
      onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
    >
      {activeTab === 'live-monitor' && (
        <LiveMonitoring
          onSwitchToRoom={handleSwitchToRoom}
          onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
        />
      )}

      {activeTab === 'calendar' && (
        <AttendanceCalendar
          onOpenRoomCheckin={handleSwitchToRoom}
          onExamActivated={() => {
            loadActiveExam();
          }}
        />
      )}

      {activeTab === 'students' && (
        <StudentDirectory />
      )}

      {activeTab === 'faculty-view' && (
        <div className="p-2 sm:p-4">
          <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('live-monitor')}
              className="hidden sm:flex text-xs font-bold text-blue-600 hover:text-blue-800 items-center gap-1 focus-ring rounded-lg px-2 py-1"
            >
              <ArrowLeft size={14} /> Back to Live Dashboard
            </button>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Admin Previewing Invigilator UI
            </span>
          </div>
          <FacultyAttendance defaultRoomNumber={selectedRoomNumber} />
        </div>
      )}

      {activeTab === 'ingestion' && (
        <DataIngestion
          onIngestionSuccess={() => {
            loadActiveExam();
            setActiveTab('students');
          }}
        />
      )}

      {activeTab === 'exam-config' && (
        <ExamManager
          onExamUpdated={() => {
            loadActiveExam();
            setActiveTab('live-monitor');
          }}
        />
      )}

      {activeTab === 'faculty-manage' && (
        <FacultyManager />
      )}

      {activeTab === 'audit-logs' && (
        <AuditLogs />
      )}

      {isGoogleSheetModalOpen && (
        <GoogleSheetSetupModal
          exam={activeExam}
          onClose={() => setIsGoogleSheetModalOpen(false)}
          onUpdated={loadActiveExam}
        />
      )}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <Analytics />
      <SpeedInsights />
    </AuthProvider>
  );
}
