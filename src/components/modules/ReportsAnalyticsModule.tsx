import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Download,
  Award,
  CalendarCheck,
  GraduationCap,
  Users,
  Filter,
  UserCheck,
  ListOrdered,
  Sparkles
} from 'lucide-react';

export const ReportsAnalyticsModule: React.FC = () => {
  const {
    students,
    classes,
    subjects,
    attendance,
    assessmentResults,
    assessments,
    questions,
    examHistory,
    currentUser,
    showToast,
  } = useApp();

  const isAdminOrPrincipal =
    currentUser.role === 'admin' ||
    currentUser.role === 'principal' ||
    currentUser.position === 'Quản trị viên' ||
    currentUser.position === 'Quản trị viên hệ thống' ||
    currentUser.position === 'Hiệu trưởng' ||
    currentUser.position === 'Hiệu phó' ||
    currentUser.username === 'admin';

  const isTeacher = !isAdminOrPrincipal && (currentUser.role === 'homeroom_teacher' || currentUser.role === 'subject_teacher');
  const teacherClassId = currentUser.homeroomClassId || 'class-3a1';
  const teacherClassName = currentUser.homeroomClassName || '3A1';

  // Filter state
  const [filterClassId, setFilterClassId] = useState<string>(isTeacher ? teacherClassId : 'all');
  const [activeReportTab, setActiveReportTab] = useState<'tt27_assessment' | 'class_summary'>('tt27_assessment');

  // Auto sync filterClassId whenever teacher's assigned class changes
  React.useEffect(() => {
    if (isTeacher && teacherClassId) {
      setFilterClassId(teacherClassId);
    }
  }, [isTeacher, teacherClassId]);

  // ==========================================
  // REALTIME SYNCHRONIZED STRICT CALCULATIONS
  // ==========================================

  // Map assessment ID to subject ID for quick lookup
  const assessmentSubjectMap = useMemo(() => {
    const map = new Map<string, string>();
    assessments.forEach((a) => map.set(a.id, a.subjectId));
    return map;
  }, [assessments]);

  // 1. Sĩ số Học sinh & Số Lớp (Strictly calculated from students state)
  const filteredStudents = useMemo(() => {
    if (filterClassId === 'all') return students;
    return students.filter(
      (s) =>
        s.classId === filterClassId ||
        s.className === filterClassId ||
        `Lớp ${s.className}` === filterClassId ||
        (filterClassId === 'class-1a1' && (s.classId === 'class-1a1' || s.className === '1A1'))
    );
  }, [students, filterClassId]);

  const filteredStudentIds = useMemo(() => new Set(filteredStudents.map((s) => s.id)), [filteredStudents]);

  // Total student count strictly equals filteredStudents length
  const totalStudentsCount = filteredStudents.length;

  const maleCount = useMemo(() => {
    return filteredStudents.filter((s) => s.gender === 'Nam').length;
  }, [filteredStudents]);

  const femaleCount = useMemo(() => {
    return filteredStudents.filter((s) => s.gender === 'Nữ').length;
  }, [filteredStudents]);

  const totalClassesCount = filterClassId === 'all' ? classes.length : 1;

  // 2. Chuyên cần thời gian thực (Realtime Attendance Metrics)
  const filteredAttendance = useMemo(() => {
    if (filterClassId === 'all') return attendance;
    return attendance.filter((a) => filteredStudentIds.has(a.studentId) || a.classId === filterClassId);
  }, [attendance, filteredStudentIds, filterClassId]);

  const totalAttendanceRecords = filteredAttendance.length;
  const presentRecords = useMemo(() => filteredAttendance.filter((a) => a.status === 'present').length, [filteredAttendance]);
  const excusedRecords = useMemo(() => filteredAttendance.filter((a) => a.status === 'excused').length, [filteredAttendance]);
  const unexcusedRecords = useMemo(() => filteredAttendance.filter((a) => a.status === 'unexcused').length, [filteredAttendance]);

  const attendanceRate = useMemo(() => {
    if (totalAttendanceRecords > 0) {
      return Math.round((presentRecords / totalAttendanceRecords) * 100);
    }
    return totalStudentsCount > 0 ? 100 : 0;
  }, [totalAttendanceRecords, presentRecords, totalStudentsCount]);

  // 3. Đánh giá Định kỳ theo Thông tư 27 (Circular 27 Evaluation Metrics)
  const filteredResults = useMemo(() => {
    if (filterClassId === 'all') return assessmentResults;
    return assessmentResults.filter((r) => filteredStudentIds.has(r.studentId) || r.classId === filterClassId);
  }, [assessmentResults, filteredStudentIds, filterClassId]);

  const totalResCount = filteredResults.length;
  const countT = useMemo(() => filteredResults.filter((r) => r.performanceLevel === 'T').length, [filteredResults]);
  const countH = useMemo(() => filteredResults.filter((r) => r.performanceLevel === 'H').length, [filteredResults]);
  const countC = useMemo(() => filteredResults.filter((r) => r.performanceLevel === 'C').length, [filteredResults]);

  const pctT = totalResCount > 0 ? Math.round((countT / totalResCount) * 100) : 0;
  const pctH = totalResCount > 0 ? Math.round((countH / totalResCount) * 100) : 0;
  const pctC = totalResCount > 0 ? Math.round((countC / totalResCount) * 100) : 0;

  const avgScore = useMemo(() => {
    const scores = filteredResults.map((r) => r.score || 0).filter((s) => s > 0);
    if (scores.length > 0) {
      return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    }
    return '0.0';
  }, [filteredResults]);

  // Subject Breakdown Matrix for TT27 (Strict calculation per subject)
  const subjectAssessmentStats = useMemo(() => {
    return subjects.map((subj) => {
      const subjResults = filteredResults.filter((r) => {
        const mappedSubjId = assessmentSubjectMap.get(r.assessmentId);
        return mappedSubjId === subj.id || mappedSubjId === subj.code;
      });
      const t = subjResults.filter((r) => r.performanceLevel === 'T').length;
      const h = subjResults.filter((r) => r.performanceLevel === 'H').length;
      const c = subjResults.filter((r) => r.performanceLevel === 'C').length;
      const total = subjResults.length;

      const scores = subjResults.map((r) => r.score || 0).filter((s) => s > 0);
      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';

      return {
        id: subj.id,
        name: subj.name,
        code: subj.code,
        color: subj.color,
        total,
        tCount: t,
        hCount: h,
        cCount: c,
        avgScore: avg,
      };
    });
  }, [subjects, filteredResults, assessmentSubjectMap]);

  // 4. Thi trực tuyến & Phổ điểm Thi cử (Strict calculation per exam history)
  const filteredExamHistory = useMemo(() => {
    if (filterClassId === 'all') return examHistory;
    return examHistory.filter(
      (e) =>
        filteredStudentIds.has(e.studentId) ||
        filteredStudents.some((s) => s.fullName.toLowerCase() === e.studentName.toLowerCase())
    );
  }, [examHistory, filteredStudentIds, filteredStudents, filterClassId]);

  const totalExamAttempts = filteredExamHistory.length;
  const practiceAttempts = useMemo(() => filteredExamHistory.filter((e) => e.mode === 'practice').length, [filteredExamHistory]);
  const officialAttempts = useMemo(() => filteredExamHistory.filter((e) => e.mode === 'official').length, [filteredExamHistory]);

  const avgExamScore = useMemo(() => {
    if (filteredExamHistory.length > 0) {
      return (filteredExamHistory.reduce((acc, curr) => acc + curr.score, 0) / filteredExamHistory.length).toFixed(1);
    }
    return '0.0';
  }, [filteredExamHistory]);

  const examScoreDistribution = useMemo(() => {
    const total = filteredExamHistory.length;
    if (total === 0) {
      return {
        xuatSac: { count: 0, pct: 0 },
        gioi: { count: 0, pct: 0 },
        kha: { count: 0, pct: 0 },
        trungBinh: { count: 0, pct: 0 },
        yeu: { count: 0, pct: 0 },
      };
    }
    const xuatSac = filteredExamHistory.filter((e) => e.score >= 9.0).length;
    const gioi = filteredExamHistory.filter((e) => e.score >= 8.0 && e.score < 9.0).length;
    const kha = filteredExamHistory.filter((e) => e.score >= 6.5 && e.score < 8.0).length;
    const trungBinh = filteredExamHistory.filter((e) => e.score >= 5.0 && e.score < 6.5).length;
    const yeu = filteredExamHistory.filter((e) => e.score < 5.0).length;

    return {
      xuatSac: { count: xuatSac, pct: Math.round((xuatSac / total) * 100) },
      gioi: { count: gioi, pct: Math.round((gioi / total) * 100) },
      kha: { count: kha, pct: Math.round((kha / total) * 100) },
      trungBinh: { count: trungBinh, pct: Math.round((trungBinh / total) * 100) },
      yeu: { count: yeu, pct: Math.round((yeu / total) * 100) },
    };
  }, [filteredExamHistory]);

  const totalQuestions = questions.length;

  // Class Breakdown Summary for All Classes Table
  const classBreakdownStats = useMemo(() => {
    return classes.map((cls) => {
      const clsStudents = students.filter(
        (s) =>
          s.classId === cls.id ||
          s.className === cls.name ||
          `Lớp ${s.className}` === cls.name ||
          (cls.id === 'class-1a1' && (s.classId === 'class-1a1' || s.className === '1A1'))
      );
      const clsStudentIds = new Set(clsStudents.map((s) => s.id));

      const clsAtt = attendance.filter((a) => clsStudentIds.has(a.studentId) || a.classId === cls.id);
      const clsPresent = clsAtt.filter((a) => a.status === 'present').length;
      const attRate = clsAtt.length > 0 ? Math.round((clsPresent / clsAtt.length) * 100) : 100;

      const clsResults = assessmentResults.filter((r) => clsStudentIds.has(r.studentId) || r.classId === cls.id);
      const studentTotal = clsStudents.length;
      const tCount = clsResults.filter((r) => r.performanceLevel === 'T').length;
      const hCount = clsResults.filter((r) => r.performanceLevel === 'H').length;
      const cCount = clsResults.filter((r) => r.performanceLevel === 'C').length;

      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        teacherName: cls.homeroomTeacherName,
        studentCount: studentTotal,
        attendanceRate: attRate,
        tCount,
        hCount,
        cCount,
      };
    });
  }, [classes, students, attendance, assessmentResults]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Khối Lớp',
      'Tên Lớp',
      'Giáo viên Chủ nhiệm',
      'Sĩ số Học sinh (Thực tế)',
      'Tỷ lệ Chuyên cần (%)',
      'Hoàn thành Tốt (T)',
      'Hoàn thành (H)',
      'Cần cố gắng (C)',
    ];

    const rows = classBreakdownStats.map((item) => [
      `Khối ${item.grade}`,
      `Lớp ${item.name}`,
      `"${item.teacherName}"`,
      item.studentCount,
      `${item.attendanceRate}%`,
      item.tCount,
      item.hCount,
      item.cCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Thong_Ke_Chuyen_Mon_Toan_Truong_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất thành công file Báo cáo Thống kê Chuyên môn CSV!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header with Filter & CSV Export */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              Báo cáo & Thống kê Chuyên môn
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? `Thống kê số liệu thực tế Lớp ${teacherClassName}: sĩ số, chuyên cần và đánh giá TT27.`
              : 'Thống kê chính xác sĩ số, chuyên cần, đánh giá Thông tư 27 và kết quả thi cử thời gian thực.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Filter Dropdown */}
          {isTeacher ? (
            <div className="bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Lớp chủ nhiệm: Lớp {teacherClassName} ({totalStudentsCount} học sinh)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">Toàn trường ({classes.length} Lớp • {students.length} Học sinh)</option>
                {classes.map((cls) => {
                  const actualCount = students.filter(
                    (s) =>
                      s.classId === cls.id ||
                      s.className === cls.name ||
                      `Lớp ${s.className}` === cls.name ||
                      (cls.id === 'class-1a1' && (s.classId === 'class-1a1' || s.className === '1A1'))
                  ).length;
                  return (
                    <option key={cls.id} value={cls.id}>
                      Lớp {cls.name} ({actualCount} học sinh - {cls.homeroomTeacherName})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all btn-tactile"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo cáo CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 Essential KPI Cards - Strictly Live Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sĩ số Học sinh Thực tế */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Sĩ số học sinh thực tế
            </span>
            <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800">{totalStudentsCount}</span>
            <span className="text-xs text-slate-400 font-semibold">học sinh ({totalClassesCount} lớp)</span>
          </div>
          <p className="text-xs text-sky-700 font-bold mt-1.5">
            Nam: {maleCount} • Nữ: {femaleCount}
          </p>
        </div>

        {/* Card 2: Tỷ lệ Chuyên cần */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Tỷ lệ Chuyên cần
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600">{attendanceRate}%</span>
            <span className="text-xs text-slate-400 font-semibold">thời gian thực</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            Có phép: {excusedRecords} • Không phép: {unexcusedRecords}
          </p>
        </div>

        {/* Card 3: Đánh giá TT 27 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              3. Đánh giá Định kỳ TT27
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-600">{pctT}%</span>
            <span className="text-xs text-slate-400 font-semibold">Mức Tốt ({countT}/{totalResCount})</span>
          </div>
          <p className="text-xs text-purple-700 font-bold mt-1.5">
            TB Điểm: <strong className="text-purple-900">{avgScore}/10</strong>
          </p>
        </div>

        {/* Card 4: Thi trực tuyến & Lượt thi */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              4. Thi trực tuyến
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800">{totalExamAttempts}</span>
            <span className="text-xs text-slate-400 font-semibold">lượt làm bài</span>
          </div>
          <p className="text-xs text-rose-600 font-bold mt-1.5">
            Đề: {totalQuestions} câu • Điểm TB: {avgExamScore}
          </p>
        </div>
      </div>

      {/* Main Tab Navigation - Cleaned 2 Tabs */}
      <div className="flex items-center p-1.5 bg-white rounded-2xl border border-slate-100 shadow-xs w-fit overflow-x-auto gap-1">
        <button
          onClick={() => setActiveReportTab('tt27_assessment')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeReportTab === 'tt27_assessment'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>1. Báo cáo Đánh giá TT27 & Thi trực tuyến</span>
        </button>

        <button
          onClick={() => setActiveReportTab('class_summary')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeReportTab === 'class_summary'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>2. Bảng Thống kê Báo cáo Chuyên môn Tổng hợp từng Lớp</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BÁO CÁO ĐÁNH GIÁ TT27 & THI TRỰC TUYẾN */}
      {/* ============================================================== */}
      {activeReportTab === 'tt27_assessment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Overall Circular 27 Performance Distribution */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    Phân bổ Đánh giá Định kỳ (Thông tư 27)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đồng bộ trực tiếp từ Module Kiểm tra & Đánh giá định kỳ
                  </p>
                </div>
                <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl">
                  {totalResCount} đánh giá
                </span>
              </div>

              {totalResCount > 0 ? (
                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-purple-700">Hoàn thành Tốt (T)</span>
                      <span className="text-slate-800">{countT} học sinh ({pctT}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${pctT}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-blue-700">Hoàn thành (H)</span>
                      <span className="text-slate-800">{countH} học sinh ({pctH}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${pctH}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-rose-700">Chưa hoàn thành (C)</span>
                      <span className="text-slate-800">{countC} học sinh ({pctC}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctC}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  Chưa có dữ liệu đánh giá định kỳ cho phạm vi lọc được chọn.
                </div>
              )}

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 leading-relaxed">
                ⭐ <strong>Kết luận chuyên môn:</strong> Tỷ lệ học sinh đạt mức Hoàn thành Tốt (T) đạt <strong>{pctT}%</strong>, điểm trung bình đạt <strong>{avgScore}/10</strong>.
              </div>
            </div>

            {/* Right: Online Exam Score Breakdown (Phổ điểm Thi cử) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-rose-600" />
                    Phổ điểm Thi Trực tuyến & Lượt thi
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đồng bộ từ Module Thi thử & Thi chính thức
                  </p>
                </div>
                <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl">
                  {totalExamAttempts} lượt thi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] font-bold block">Chế độ Ôn thi thử:</span>
                  <strong className="text-sky-700 text-sm font-black">{practiceAttempts} lượt</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] font-bold block">Chế độ Thi chính thức:</span>
                  <strong className="text-rose-700 text-sm font-black">{officialAttempts} lượt</strong>
                </div>
              </div>

              {/* Score Range Distribution */}
              {totalExamAttempts > 0 ? (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50/80 border border-emerald-100">
                    <span className="font-bold text-emerald-900">Xuất sắc (9.0 – 10 điểm):</span>
                    <span className="font-extrabold text-emerald-700">{examScoreDistribution.xuatSac.count} lượt ({examScoreDistribution.xuatSac.pct}%)</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-blue-50/80 border border-blue-100">
                    <span className="font-bold text-blue-900">Giỏi (8.0 – 8.9 điểm):</span>
                    <span className="font-extrabold text-blue-700">{examScoreDistribution.gioi.count} lượt ({examScoreDistribution.gioi.pct}%)</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-amber-50/80 border border-amber-100">
                    <span className="font-bold text-amber-900">Khá (6.5 – 7.9 điểm):</span>
                    <span className="font-extrabold text-amber-700">{examScoreDistribution.kha.count} lượt ({examScoreDistribution.kha.pct}%)</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-rose-50/80 border border-rose-100">
                    <span className="font-bold text-rose-900">Cần cố gắng (&lt; 6.5 điểm):</span>
                    <span className="font-extrabold text-rose-700">{examScoreDistribution.trungBinh.count + examScoreDistribution.yeu.count} lượt</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  Chưa có lượt thi trực tuyến nào cho phạm vi lọc được chọn.
                </div>
              )}
            </div>
          </div>

          {/* Subject Breakdown Table for Circular 27 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Bảng Thống kê Đánh giá Thông tư 27 Chi tiết theo từng Môn học
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân bổ mức Hoàn thành Tốt (T), Hoàn thành (H), Chưa hoàn thành (C) và Điểm trung bình từng môn
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Môn học</th>
                    <th className="py-3 px-4 text-center">Tổng Đánh giá</th>
                    <th className="py-3 px-4 text-center text-purple-700">Mức Tốt (T)</th>
                    <th className="py-3 px-4 text-center text-blue-700">Mức Hoàn thành (H)</th>
                    <th className="py-3 px-4 text-center text-rose-700">Cần cố gắng (C)</th>
                    <th className="py-3 px-4 text-center font-bold">Điểm TB môn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectAssessmentStats.map((subj) => (
                    <tr key={subj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subj.color }} />
                        <span>{subj.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-600">{subj.total}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-purple-700 bg-purple-50/30">
                        {subj.tCount} ({subj.total > 0 ? Math.round((subj.tCount / subj.total) * 100) : 0}%)
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-700 bg-blue-50/30">
                        {subj.hCount} ({subj.total > 0 ? Math.round((subj.hCount / subj.total) * 100) : 0}%)
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-rose-700 bg-rose-50/30">
                        {subj.cCount} ({subj.total > 0 ? Math.round((subj.cCount / subj.total) * 100) : 0}%)
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-emerald-700 text-sm">
                        {subj.avgScore} / 10
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BẢNG TỔNG HỢP CHUYÊN MÔN TỪNG LỚP */}
      {/* ============================================================== */}
      {activeReportTab === 'class_summary' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-600" />
                Bảng Thống kê Báo cáo Chuyên môn Tổng hợp theo từng Lớp
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hiển thị chính xác sĩ số thực tế, tỷ lệ chuyên cần và mức đánh giá Thông tư 27 từng lớp
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel/CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Lớp học</th>
                  <th className="py-3 px-4">Giáo viên Chủ nhiệm</th>
                  <th className="py-3 px-4 text-center">Sĩ số thực tế</th>
                  <th className="py-3 px-4 text-center text-emerald-700">% Chuyên cần</th>
                  <th className="py-3 px-4 text-center text-purple-700">Mức Tốt (T)</th>
                  <th className="py-3 px-4 text-center text-blue-700">Hoàn thành (H)</th>
                  <th className="py-3 px-4 text-center text-rose-700">Cần cố gắng (C)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classBreakdownStats.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      Lớp {cls.name} <span className="text-[10px] text-slate-400 font-normal">(Khối {cls.grade})</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{cls.teacherName}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 bg-slate-50/50">
                      {cls.studentCount} học sinh
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">
                      {cls.attendanceRate}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-purple-700 bg-purple-50/30">
                      {cls.tCount} học sinh
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-700 bg-blue-50/30">
                      {cls.hCount} học sinh
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-rose-700 bg-rose-50/30">
                      {cls.cCount} học sinh
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
