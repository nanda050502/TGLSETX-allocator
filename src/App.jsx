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
import UserManagement from './pages/admin/UserManagement';
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
      <div className="bg-[#03050a] text-slate-100 flex justify-center items-center h-screen w-screen overflow-hidden p-0 m-0 font-sans antialiased">
        <FacultyAttendance defaultRoomNumber={roomNo} isAndroidShell={true} onLogout={logout} />
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
          <div className="max-w-md mx-auto mb-3 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('live-monitor')}
              className="flex text-xs font-bold text-blue-600 hover:text-blue-800 items-center gap-1 focus-ring rounded-lg px-2 py-1"
            >
              <ArrowLeft size={14} /> Back to Live Dashboard
            </button>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Admin Previewing Invigilator UI
            </span>
          </div>
          <div className="flex justify-center items-center h-[880px] max-h-[85vh]">
            <FacultyAttendance defaultRoomNumber={selectedRoomNumber} />
          </div>
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

      {activeTab === 'users-manage' && (
        <UserManagement />
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
