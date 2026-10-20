import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Bell,
  Sun,
  Moon,
  Menu,
  Sparkles,
  LogOut,
  ShieldCheck,
  Building,
  UserCheck,
  BookOpen,
  Users
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { currentUser, logout, notifications, darkMode, setDarkMode, schoolName } = useApp();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Format job title with domain specifics
  const renderPositionDetails = () => {
    const pos = currentUser.position || (
      currentUser.role === 'admin' ? 'Quản trị viên' :
      currentUser.role === 'principal' ? 'Hiệu trưởng' :
      currentUser.role === 'homeroom_teacher' ? 'Giáo viên' :
      currentUser.role === 'subject_teacher' ? 'Giáo viên bộ môn' : 'Phụ huynh'
    );

    if (pos === 'Hiệu trưởng') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Building className="w-3 h-3 text-amber-600" />
          Hiệu trưởng
        </span>
      );
    }

    if (pos === 'Hiệu phó') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Building className="w-3 h-3 text-amber-600" />
          Hiệu phó
        </span>
      );
    }

    if (pos === 'Giáo viên bộ môn') {
      const subjectStr = currentUser.subjects && currentUser.subjects.length > 0
        ? currentUser.subjects.join(', ')
        : 'Chuyên môn';
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200" title={`Môn giảng dạy: ${subjectStr}`}>
          <BookOpen className="w-3 h-3 text-emerald-600" />
          GV Bộ môn: <span className="font-extrabold text-emerald-900">{subjectStr}</span>
        </span>
      );
    }

    if (pos === 'Giáo viên' || currentUser.role === 'homeroom_teacher') {
      const classStr = currentUser.homeroomClassName || (currentUser.grade ? `Lớp ${currentUser.grade}A1` : 'Chủ nhiệm');
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
          <UserCheck className="w-3 h-3 text-sky-600" />
          Giáo viên: <span className="font-extrabold text-sky-900">{classStr}</span>
        </span>
      );
    }

    if (pos === 'Quản trị viên' || currentUser.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <ShieldCheck className="w-3 h-3 text-rose-600" />
          Quản trị viên
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
        <Users className="w-3 h-3 text-indigo-600" />
        Phụ huynh: {currentUser.homeroomClassName || 'Học sinh'}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xs transition-colors">
      {/* Left: Brand & Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-500 to-emerald-400 p-0.5 shadow-md shadow-sky-500/20">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base md:text-lg bg-gradient-to-r from-sky-700 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
                TRỢ GIẢNG TIỂU HỌC
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <Sparkles className="w-3 h-3 text-emerald-500" /> GDPT 2018
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              {schoolName || 'Trường Tiểu học Lê Quý Đôn'} • Năm học 2025 - 2026
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Job Position Badge */}
        <div className="hidden sm:block">
          {renderPositionDetails()}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-tactile"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 animate-scale-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Thông báo nhà trường ({notifications.length})
                </h4>
                <span className="text-[11px] text-sky-600 font-semibold cursor-pointer hover:underline">
                  Đánh dấu đã đọc
                </span>
              </div>
              <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                {notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{n.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{n.content}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                      <span>{n.senderName}</span>
                      <span>{n.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-tactile"
          title={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Current User Profile Display (Read-only for active session, no arbitrary switching) */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-2xl object-cover ring-2 ring-sky-200 shadow-xs"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-extrabold text-slate-800 leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              @{currentUser.username} • {currentUser.phone}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all btn-tactile border border-rose-200 ml-1"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};
