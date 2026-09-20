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
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ activeTab, setActiveTab, examInfo, onOpenGoogleSheetModal, children }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core navigation items categorized by section
  const navSections = [
    {
      title: 'Monitoring & Attendance',
      items: [
        { id: 'live-monitor', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calendar', label: 'Attendance Calendar', icon: CalendarIcon },
        { id: 'students', label: 'Student Roster', icon: Users },
        { id: 'faculty-view', label: 'Faculty Check-In', icon: Smartphone, highlight: true }
      ]
    },
    {
      title: 'Administration & Setup',
      items: [
        { id: 'ingestion', label: 'Data Ingestion', icon: UploadCloud },
        { id: 'users-manage', label: 'User Management', icon: ShieldCheck },
        { id: 'exam-config', label: 'Sets & Config', icon: Sliders },
        { id: 'faculty-manage', label: 'Faculty Allocations', icon: UserCheck },
        { id: 'audit-logs', label: 'Audit Timeline', icon: Clock }
      ]
    }
  ];

  const allNavItems = navSections.flatMap(s => s.items);

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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans antialiased relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-sm text-white shadow-subtle">
            Q
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 leading-tight tracking-tight">ExamSet Pro</h1>
            <p className="text-[11px] text-slate-500 truncate max-w-[150px] font-medium">{examInfo?.name || 'Administrator'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGoogleSheetModal}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition focus-ring"
            title="Google Sheet Sync"
          >
            <Sheet size={16} />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition focus-ring"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm animate-fade-in flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-elevated animate-ios-sheet">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                  Q
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">All Modules & Settings</h3>
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-subtle'
                            : item.highlight
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-bold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">Chief Superintendent</div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition flex items-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-white border-r border-slate-200/80 transition-all duration-200 ease-out sticky top-0 h-screen shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center font-extrabold text-base text-white shrink-0 shadow-subtle">
                Q
              </div>
              {!collapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 tracking-tight">ExamSet Pro</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      v2.0
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono">
                    {examInfo?.subject_code || 'Exam Controller'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 focus-ring"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition focus-ring ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-subtle'
                          : item.highlight
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={17} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {!collapsed ? (
            <>
              <button
                onClick={onOpenGoogleSheetModal}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-700 text-xs font-semibold flex items-center justify-between transition focus-ring"
              >
                <div className="flex items-center gap-2">
                  <Sheet size={15} className="text-emerald-600" />
                  <span>Google Sheets Sync</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <div className="font-bold text-slate-900 truncate">{user?.name}</div>
                  <div className="text-[11px] text-slate-500">Chief Superintendent</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition focus-ring"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenGoogleSheetModal}
                className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition focus-ring"
                title="Google Sheets Sync"
              >
                <Sheet size={16} />
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition focus-ring"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 max-w-full flex flex-col min-h-screen pb-20 md:pb-0 overflow-y-auto overflow-x-hidden">
        {children}
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-elevated">
        {mobileTabBar.map((item) => {
          const Icon = item.icon;
          const isActive = item.id !== 'more' && activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
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
