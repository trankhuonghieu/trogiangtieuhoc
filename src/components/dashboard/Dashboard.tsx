import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FilePlus,
  HelpCircle,
  MessageCircle,
  GraduationCap,
  PlayCircle,
  Bell,
  Award
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    classes,
    students,
    attendance,
    teachingPlans,
    lessonPlans,
    timetable,
    assessmentResults,
    notifications,
    schoolName,
  } = useApp();

  const isTeacher = currentUser.role === 'homeroom_teacher' || currentUser.role === 'subject_teacher';
  const isParent = currentUser.role === 'parent_student';
  const userHomeroomClass = useMemo(() => {
    return (
      classes.find(
        (c) =>
          c.id === currentUser.homeroomClassId ||
          `Lớp ${c.name}` === currentUser.homeroomClassName ||
          c.name === currentUser.homeroomClassName ||
          c.homeroomTeacherName === currentUser.name ||
          (currentUser.grade && c.grade === currentUser.grade)
      ) || classes.find((c) => c.id === 'class-1a1') || classes[0]
    );
  }, [classes, currentUser]);

  const targetClassId = userHomeroomClass.id;
  const targetClassName = userHomeroomClass.name;

  // Real-time Live Clock updating every second
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time dates and day names in Vietnamese
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const currentDayOfWeekIdx = currentTime.getDay();
  const currentDayOfWeekName = dayNames[currentDayOfWeekIdx];

  const getAcademicWeek = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 8, 5);
    const diffTime = Math.abs(date.getTime() - startOfYear.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(35, Math.ceil(diffDays / 7)));
  };
  const currentWeek = getAcademicWeek(currentTime);

  const dateFormattedStr = `${currentDayOfWeekName}, ngày ${String(currentTime.getDate()).padStart(2, '0')} tháng ${String(currentTime.getMonth() + 1).padStart(2, '0')} năm ${currentTime.getFullYear()}`;
  const timeFormattedStr = currentTime.toLocaleTimeString('vi-VN', { hour12: false });
  const todayISODate = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;

  // Filter students by class if teacher
  const relevantStudents = useMemo(() => {
    if (isTeacher) {
      return students.filter(
        (s) => (s.classId === targetClassId || s.className === targetClassName || s.className === `Lớp ${targetClassName}`) && (s.status === 'active' || !s.status)
      );
    }
    return students.filter((s) => s.status === 'active' || !s.status);
  }, [students, isTeacher, targetClassId, targetClassName]);

  const relevantStudentIds = useMemo(() => new Set(relevantStudents.map((s) => s.id)), [relevantStudents]);

  const totalStudents = relevantStudents.length;
  const totalClasses = isTeacher ? 1 : classes.length;
  const totalLessons = lessonPlans.length;

  // Real-time attendance rate for relevant students
  const relevantAttendance = useMemo(() => {
    if (isTeacher) {
      return attendance.filter((a) => relevantStudentIds.has(a.studentId) || a.classId === targetClassId);
    }
    return attendance;
  }, [attendance, relevantStudentIds, isTeacher, targetClassId]);

  const presentCount = relevantAttendance.filter((a) => a.status === 'present').length;
  const attendanceRate = relevantAttendance.length > 0
    ? Math.round((presentCount / relevantAttendance.length) * 100)
    : 100;

  // Assessments rated as 'T' (Hoàn thành Tốt) for relevant students
  const relevantResults = useMemo(() => {
    if (isTeacher) {
      return assessmentResults.filter((r) => relevantStudentIds.has(r.studentId) || r.classId === targetClassId);
    }
    return assessmentResults;
  }, [assessmentResults, relevantStudentIds, isTeacher, targetClassId]);

  const completedGood = relevantResults.filter((r) => r.performanceLevel === 'T').length;
  const goodPct = relevantResults.length > 0
    ? Math.round((completedGood / relevantResults.length) * 100)
    : 85;

  // Real-time timetable schedule mapping
  const targetDayOfWeek = currentDayOfWeekIdx === 0 ? 2 : currentDayOfWeekIdx + 1;
  const todaysSchedule = useMemo(() => {
    return timetable.filter(
      (t) => (t.classId === targetClassId || t.teacherName === currentUser.name) && t.dayOfWeek === targetDayOfWeek
    );
  }, [timetable, targetClassId, currentUser.name, targetDayOfWeek]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Welcome Hero Banner with Real-Time Clock */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-emerald-600 p-6 md:p-8 text-white shadow-xl shadow-sky-900/10">
        <div className="relative z-10 max-w-3xl">
          {/* Live Clock and Date Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-sky-100 text-xs font-semibold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{schoolName} • Tuần {currentWeek}</span>
            </div>

            {/* Live Clock Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/30 backdrop-blur-md text-amber-200 text-xs font-mono font-bold border border-amber-300/30 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{dateFormattedStr}</span>
              <span className="text-white bg-white/20 px-1.5 py-0.5 rounded-md tracking-wider">
                {timeFormattedStr}
              </span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Xin chào, {currentUser.name}! 👋
          </h1>
          <p className="mt-2 text-sm md:text-base text-sky-100 leading-relaxed max-w-2xl">
            {isTeacher
              ? `Hôm nay lớp chủ nhiệm ${targetClassName} có ${todaysSchedule.length} tiết học. Sĩ số lớp: ${totalStudents} học sinh. Tỷ lệ chuyên cần hiện tại đạt ${attendanceRate}%.`
              : currentUser.role === 'principal'
              ? `Toàn trường ${schoolName} có ${totalClasses} lớp học và ${totalStudents} học sinh đang hoạt động theo đúng tiến độ kế hoạch giáo dục GDPT 2018.`
              : 'Chào mừng quý thầy cô đến với Cổng thông tin trợ giảng và số hóa giảng dạy chuyên nghiệp.'}
          </p>

          {/* Quick Action Badges */}
          {!isParent && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                onClick={() => setActiveTab('lesson_design')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-sky-800 text-xs font-bold shadow-md hover:bg-sky-50 transition-all btn-tactile"
              >
                <FilePlus className="w-4 h-4 text-sky-600" />
                Soạn bài dạy mới
              </button>
              <button
                onClick={() => setActiveTab('classes_students')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-bold hover:bg-white/30 transition-all btn-tactile"
              >
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                Điểm danh học sinh
              </button>
              <button
                onClick={() => setActiveTab('interactive_activities')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-bold hover:bg-white/30 transition-all btn-tactile"
              >
                <PlayCircle className="w-4 h-4 text-amber-300" />
                Trình chiếu trò chơi
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all btn-tactile"
              >
                <TrendingUp className="w-4 h-4 text-amber-300" />
                Xem Báo cáo thống kê
              </button>
            </div>
          )}
        </div>

        {/* Top Right Prominent Softly Rounded School Logo in Overview Module */}
        <div className="absolute right-6 top-6 z-10 hidden sm:flex items-center justify-center p-3 sm:p-4 bg-white/25 backdrop-blur-md rounded-full border-2 border-white/40 shadow-2xl hover:scale-105 transition-all duration-300 group">
          <img
            src={`${import.meta.env.BASE_URL}assets/aistudio/image_d2555e7a.png`}
            alt="Logo Trường Tiểu học Vân Nham Bo Tròn Mềm Mại"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain rounded-full filter drop-shadow-lg brightness-110"
          />
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Metric Cards - Synchronized with class/school */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Học sinh */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isTeacher ? `Sĩ số lớp ${targetClassName}` : 'Tổng số học sinh'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalStudents}</span>
            <span className="text-xs text-slate-400">em học sinh</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Đồng bộ từ Module Sĩ số</span>
          </div>
        </div>

        {/* Card 2: Chuyên cần */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tỷ lệ chuyên cần
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{attendanceRate}%</span>
            <span className="text-xs text-slate-400">({presentCount}/{relevantAttendance.length} em)</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Thời gian thực: {timeFormattedStr}</span>
          </div>
        </div>

        {/* Card 3: Bài dạy */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kế hoạch bài dạy (KHBD)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalLessons}</span>
            <span className="text-xs text-slate-400">bài đã số hóa</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Chuẩn 4 bước GDPT 2018</span>
          </div>
        </div>

        {/* Card 4: Đánh giá TT 27 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đạt mức T (Tốt)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600">{goodPct}%</span>
            <span className="text-xs text-slate-400">học sinh đạt chuẩn</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đồng bộ từ Module Đánh giá</span>
          </div>
        </div>
      </div>
    </div>
  );
};
