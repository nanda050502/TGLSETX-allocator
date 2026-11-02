import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  Smartphone,
  UploadCloud,
  Sliders,
  UserCheck,
  Clock,
  Sheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Search,
  Bell,
  MessageSquare,
  Video
} from 'lucide-react';

export default function AdminLayout({ activeTab, setActiveTab, examInfo, onOpenGoogleSheetModal, children }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core navigation items categorized by section
  const navSections = [
    {
      title: 'Home',
      items: [
        { id: 'live-monitor', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calendar', label: 'Attendance Calendar', icon: CalendarIcon },
        { id: 'students', label: 'Student Roster', icon: Users },
        { id: 'faculty-view', label: 'Faculty Check-In', icon: Smartphone, highlight: true }
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'ingestion', label: 'Data Ingestion', icon: UploadCloud },
        { id: 'users-manage', label: 'User Management', icon: ShieldCheck },
        { id: 'exam-config', label: 'Sets & Config', icon: Sliders },
        { id: 'faculty-manage', label: 'Faculty Allocations', icon: UserCheck },
        { id: 'audit-logs', label: 'Audit Timeline', icon: Clock }
      ]
    }
  ];

  // Mobile Bottom Tab Bar (5 Key Navigation Points)
  const mobileTabBar = [
    { id: 'live-monitor', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'students', label: 'Roster', icon: Users },
    { id: 'faculty-view', label: 'Check-In', icon: Smartphone },
    { id: 'more', label: 'Menu', icon: Menu }
  ];

  const handleTabSelect = (tabId) => {
    if (tabId === 'more') {
      setMobileMenuOpen(true);
    } else {
      setActiveTab(tabId);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#eaeff2] text-slate-900 flex flex-col md:flex-row font-sans antialiased relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00a86b] flex items-center justify-center font-black text-sm text-white shadow-sm">
            Q
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 leading-tight tracking-tight">ExamSet Pro</h1>
            <p className="text-[11px] text-slate-500 truncate max-w-[150px] font-medium">{examInfo?.name || 'Administrator'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGoogleSheetModal}
            className="p-2 rounded-full bg-emerald-50 text-[#00a86b] hover:bg-emerald-100 text-xs font-semibold transition"
            title="Google Sheet Sync"
          >
            <Sheet size={16} />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm animate-fade-in flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00a86b] text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                  Q
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">All Modules & Settings</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ExamSet Pro Control Center</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {navSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-[#00a86b] text-white shadow-md font-bold'
                            : item.highlight
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </div>
                        {isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        ) : (
                          <ChevronRight size={14} className="text-slate-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-bold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-500 font-medium">Chief Superintendent</div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition flex items-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Floating Pure White Card Container) */}
      <aside
        className={`hidden md:flex flex-col justify-between p-3.5 h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-24' : 'w-64'
        }`}
      >
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-full overflow-hidden p-3.5">
          <div>
            {/* Brand Header */}
            <div className="pb-3.5 mb-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[#00a86b] flex items-center justify-center font-black text-sm text-white shrink-0 shadow-sm shadow-emerald-500/20">
                  Q
                </div>
                {!collapsed && (
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900 tracking-tight">ExamSet Pro</span>
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-50 text-[#00a86b] border border-emerald-200">
                        v2.0
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-medium">
                      {examInfo?.subject_code || 'Exam Controller'}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-6 h-6 rounded-full bg-[#00a86b] hover:bg-[#00925d] text-white flex items-center justify-center transition shrink-0 shadow-sm shadow-emerald-600/30 active:scale-95"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>

            {/* Navigation Sections */}
            <nav className="space-y-4 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
              {navSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  {!collapsed && (
                    <div className="text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-1">
                      {sec.title}
                    </div>
                  )}
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-[#00a86b] text-white shadow-sm font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={17} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!collapsed && !isActive && (
                          <ChevronRight size={13} className="text-slate-400 shrink-0 opacity-70" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer Widget (Exact match to sample UI bottom card) */}
          <div className="pt-2 space-y-2">
            {!collapsed ? (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-200 text-[#00a86b] text-[9px] font-bold flex items-center justify-center">E1</span>
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-200 text-blue-700 text-[9px] font-bold flex items-center justify-center">E2</span>
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-200 text-amber-700 text-[9px] font-bold flex items-center justify-center">E3</span>
                  </div>
                  <button
                    onClick={onOpenGoogleSheetModal}
                    className="w-7 h-7 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition"
                    title="Live Google Sheet Sync"
                  >
                    <Sheet size={13} />
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Live Session</h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {examInfo?.name || 'Session In Progress'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="truncate pr-1">
                    <div className="text-[11px] font-bold text-slate-900 truncate">{user?.name}</div>
                    <div className="text-[9px] text-slate-400 truncate font-medium">Controller</div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Sign out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onOpenGoogleSheetModal}
                  className="p-2.5 rounded-2xl bg-emerald-50 text-[#00a86b] hover:bg-emerald-100 transition shadow-sm"
                  title="Google Sheets Sync"
                >
                  <Sheet size={16} />
                </button>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shadow-sm"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 max-w-full flex flex-col min-h-screen pb-20 md:pb-0 overflow-y-auto overflow-x-hidden">
        {/* Top Header Bar (Matching sample template search + utility icons) */}
        <header className="px-4 sm:px-6 lg:px-8 pt-4 pb-1 flex items-center justify-between gap-4">
          {/* Search Pill Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anything Here..."
              className="w-full bg-white border border-slate-200/80 rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#00a86b] shadow-sm transition font-medium"
            />
          </div>

          {/* Top-Right Circular Utility Buttons & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('live-monitor')}
              className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition shadow-sm relative active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2.5 right-2.5 ring-2 ring-white"></span>
            </button>

            {/* Live Sheets Sync / Messages */}
            <button
              onClick={onOpenGoogleSheetModal}
              className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#00a86b] hover:border-emerald-300 transition shadow-sm active:scale-95"
              title="Google Sheets Sync"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200 bg-emerald-50 flex items-center justify-center text-[#00a86b] font-extrabold text-sm">
                <span>{user?.name?.[0] || 'A'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Children */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {mobileTabBar.map((item) => {
          const Icon = item.icon;
          const isActive = item.id !== 'more' && activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-[#00a86b] font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
