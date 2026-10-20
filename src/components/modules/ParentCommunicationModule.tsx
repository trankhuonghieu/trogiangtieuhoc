import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ParentNotification } from '../../types';
import {
  MessageCircle,
  Send,
  Plus,
  Users,
  Eye,
  CheckCheck,
  Calendar,
  AlertCircle,
  Trash2,
  X,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  Heart,
  Shield,
  Star,
  CheckCircle2,
  FileText,
  UserCheck,
  Phone,
  Clock,
  Search
} from 'lucide-react';

export const ParentCommunicationModule: React.FC = () => {
  const {
    notifications,
    students,
    classes,
    subjects,
    attendance,
    assessmentResults,
    examHistory,
    currentUser,
    addNotification,
    deleteNotification,
    showToast,
  } = useApp();

  // Main Tabs: 1. Thông báo chung; 2. Kết quả học tập của học sinh
  const [activeTab, setActiveTab] = useState<'broadcast' | 'student_results'>('broadcast');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Notification form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'class'>('class');
  const [targetClassId, setTargetClassId] = useState('class-3a1');
  const [category, setCategory] = useState<'hoc_tap' | 'hoat_dong' | 'hoc_phi' | 'suc_khoe' | 'khac'>('hoc_tap');
  const [isUrgent, setIsUrgent] = useState(false);

  // Check if current user is parent
  const isParent = currentUser.role === 'parent_student';

  // Filter notifications for Parent view if logged in as parent
  const displayedNotifications = isParent
    ? notifications.filter((n) => n.targetType === 'all' || n.targetClassId === currentUser.homeroomClassId)
    : notifications;

  // Check permissions: Admin/Principal can switch classes; GVCN is strictly locked to own class
  const canSwitchClasses =
    currentUser.role === 'admin' ||
    currentUser.role === 'principal' ||
    currentUser.position === 'Quản trị viên' ||
    currentUser.position === 'Quản trị viên hệ thống' ||
    currentUser.position === 'Hiệu trưởng' ||
    currentUser.position === 'Hiệu phó' ||
    currentUser.username === 'admin';

  // Determine user's designated homeroom class
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

  // ==========================================
  // KẾT QUẢ HỌC TẬP CỦA HỌC SINH (PHỤ HUYNH CHỈ XEM ĐƯỢC CON MÌNH)
  // ==========================================
  // If parent: strictly determine their own child
  const parentLinkedStudentId = currentUser.linkedStudentId || 'std-01';

  // For teachers/admins: allow selecting class and student
  const [selectedClassId, setSelectedClassId] = useState<string>(
    canSwitchClasses ? 'class-3a1' : userHomeroomClass.id
  );

  // Auto sync class selection whenever userHomeroomClass changes
  React.useEffect(() => {
    if (!canSwitchClasses && userHomeroomClass?.id) {
      setSelectedClassId(userHomeroomClass.id);
      setTargetClassId(userHomeroomClass.id);
    }
  }, [canSwitchClasses, userHomeroomClass]);

  const effectiveClassId = canSwitchClasses ? selectedClassId : userHomeroomClass.id;

  // Students in selected class (for teachers)
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === effectiveClassId && (s.status === 'active' || !s.status));
  }, [students, effectiveClassId]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    isParent ? parentLinkedStudentId : (classStudents[0]?.id || 'std-01')
  );

  // Effective student ID
  const effectiveStudentId = isParent ? parentLinkedStudentId : (selectedStudentId || classStudents[0]?.id || 'std-01');

  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === effectiveStudentId) || classStudents[0] || students[0];
  }, [students, effectiveStudentId, classStudents]);

  const currentClass = useMemo(() => {
    const found = classes.find((c) => c.id === currentStudent?.classId || c.name === currentStudent?.className);
    if (found?.id === 'class-1a1' && (!found.homeroomTeacherName || found.homeroomTeacherName.includes('Hoa'))) {
      return {
        ...found,
        homeroomTeacherName: 'Cô Lưu Thị Hiền',
      };
    }
    return found || userHomeroomClass;
  }, [classes, currentStudent, userHomeroomClass]);

  // Attendance stats for student
  const studentAttendance = useMemo(() => {
    if (!currentStudent) return { present: 0, excused: 0, unexcused: 0, total: 0 };
    const records = attendance.filter((a) => a.studentId === currentStudent.id);
    const present = records.filter((a) => a.status === 'present').length;
    const excused = records.filter((a) => a.status === 'excused').length;
    const unexcused = records.filter((a) => a.status === 'unexcused').length;
    return {
      present: present || 18,
      excused: excused || 1,
      unexcused: unexcused || 0,
      total: (present + excused + unexcused) || 19,
    };
  }, [attendance, currentStudent]);

  // Exam attempts history of this student
  const studentExamAttempts = useMemo(() => {
    if (!currentStudent) return [];
    return examHistory.filter(
      (e) =>
        e.studentId === currentStudent.id ||
        e.studentName.toLowerCase() === currentStudent.fullName.toLowerCase() ||
        e.studentCode === currentStudent.studentCode
    );
  }, [examHistory, currentStudent]);

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!', 'error');
      return;
    }

    const cls = classes.find((c) => c.id === targetClassId);
    const targetClassName = cls ? `Lớp ${cls.name}` : 'Toàn trường';

    addNotification({
      title,
      targetType,
      targetClassId: targetType === 'class' ? targetClassId : undefined,
      targetClassName: targetType === 'class' ? targetClassName : 'Toàn trường',
      senderName: currentUser.name,
      senderRole: currentUser.role === 'homeroom_teacher' ? `GVCN Lớp ${cls?.name || '3A1'}` : 'Ban giám hiệu',
      content,
      totalRecipients: targetType === 'class' ? (cls?.studentCount || 28) : 150,
      isUrgent,
      category,
    });

    setIsCreateModalOpen(false);
    setTitle('');
    setContent('');
    showToast('Đã phát hành thông báo mới tới phụ huynh!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-cyan-50 text-cyan-600">
              <MessageCircle className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              Giao tiếp với Phụ huynh
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gửi thông báo lớp học, xem kết quả học tập định kỳ và trao đổi hai chiều giữa Nhà trường và Gia đình theo Thông tư 27.
          </p>
        </div>

        {!isParent && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md transition-all btn-tactile"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo thông báo mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-100 shadow-xs w-fit">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'broadcast'
              ? 'bg-cyan-50 text-cyan-900 border border-cyan-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-cyan-600" />
          <span>Thông báo chung ({displayedNotifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('student_results')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'student_results'
              ? 'bg-cyan-50 text-cyan-900 border border-cyan-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-cyan-600" />
          <span>
            {isParent ? 'Kết quả học tập của con' : 'Kết quả học tập của học sinh'}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: THÔNG BÁO CHUNG */}
      {/* ============================================================== */}
      {activeTab === 'broadcast' && (
        <div className="space-y-4">
          {displayedNotifications.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3 card-hover"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      n.category === 'hoc_tap'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : n.category === 'suc_khoe'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : n.category === 'hoat_dong'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {n.category === 'hoc_tap'
                      ? 'Học tập & Kiểm tra'
                      : n.category === 'suc_khoe'
                      ? 'Y tế & Sức khỏe'
                      : n.category === 'hoat_dong'
                      ? 'Hoạt động ngoại khóa'
                      : 'Thông báo chung'}
                  </span>

                  {n.isUrgent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                      Quan trọng
                    </span>
                  )}

                  <span className="text-xs text-slate-400">
                    Gửi tới: <strong className="text-slate-700">{n.targetClassName || 'Toàn trường'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{n.createdAt}</span>
                  {!isParent && (
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 ml-2"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-extrabold text-slate-800">{n.title}</h3>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                {n.content}
              </p>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-500">
                  Người gửi: <span className="text-slate-800">{n.senderName}</span> ({n.senderRole})
                </span>

                <div className="flex items-center gap-1.5 text-cyan-600 font-bold">
                  <CheckCheck className="w-4 h-4" />
                  <span>{n.readCount} / {n.totalRecipients} phụ huynh đã nhận</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: KẾT QUẢ HỌC TẬP CỦA HỌC SINH */}
      {/* ============================================================== */}
      {activeTab === 'student_results' && (
        <div className="space-y-6">
          {/* Header Banner */}
          {isParent ? (
            <div className="bg-gradient-to-r from-cyan-600 to-sky-700 rounded-3xl p-6 text-white shadow-lg space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white font-black text-xs uppercase tracking-wide">
                    Hồ sơ học tập của con
                  </span>
                  <h3 className="text-xl font-black">
                    Em: {currentStudent?.fullName} - Lớp {currentStudent?.className}
                  </h3>
                  <p className="text-xs text-cyan-100">
                    Phụ huynh chỉ có quyền xem chi tiết kết quả đánh giá học tập của con mình theo quy định bảo mật.
                  </p>
                </div>
                <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-xs text-xs space-y-1 border border-white/20">
                  <div>Mã học sinh: <strong>{currentStudent?.studentCode}</strong></div>
                  <div>GVCN: <strong>{currentClass.homeroomTeacherName}</strong></div>
                  <div>Năm học: <strong>2025 - 2026</strong></div>
                </div>
              </div>
            </div>
          ) : (
            /* Teacher / Admin Selector */
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {canSwitchClasses ? (
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500">Lớp học:</span>
                    <select
                      value={selectedClassId}
                      onChange={(e) => {
                        setSelectedClassId(e.target.value);
                        const inCls = students.filter((s) => s.classId === e.target.value);
                        if (inCls.length > 0) setSelectedStudentId(inCls[0].id);
                      }}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Lớp {cls.name} ({cls.homeroomTeacherName})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold">
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    <span>Lớp chủ nhiệm: Lớp {userHomeroomClass.name} (GVCN: {userHomeroomClass.homeroomTeacherName})</span>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500">Học sinh:</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    {classStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.studentCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Chế độ xem trước giao diện kết quả của Phụ huynh học sinh: <strong className="text-cyan-700">{currentStudent?.fullName}</strong>
              </div>
            </div>
          )}

          {/* Student Overview Metrics */}
          {currentStudent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 font-black text-lg">
                  {currentStudent.fullName.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Học sinh</span>
                  <h4 className="text-sm font-black text-slate-800">{currentStudent.fullName}</h4>
                  <span className="text-[11px] text-slate-500">{currentStudent.studentCode} • {currentStudent.gender}</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Chuyên cần</span>
                  <h4 className="text-sm font-black text-slate-800">
                    {studentAttendance.present} / {studentAttendance.total} ngày
                  </h4>
                  <span className="text-[11px] text-emerald-600 font-bold">
                    Tỷ lệ đi học {Math.round((studentAttendance.present / (studentAttendance.total || 1)) * 100)}%
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Đánh giá chung TT27</span>
                  <h4 className="text-sm font-black text-rose-600">Hoàn thành Tốt</h4>
                  <span className="text-[11px] text-slate-500">Khen thưởng: Xuất sắc</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Bài thi trực tuyến</span>
                  <h4 className="text-sm font-black text-slate-800">{studentExamAttempts.length} bài thi</h4>
                  <span className="text-[11px] text-purple-600 font-bold">Tự giác ôn luyện</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Subject Grades and Comments (TT27) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-800">
                  1. Kết quả Chấm điểm và Nhận xét các Môn học (Theo Thông tư 27)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Đánh giá định kỳ Giữa Học kỳ I
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Môn học</th>
                    <th className="py-3 px-4 text-center">Điểm số (1-10)</th>
                    <th className="py-3 px-4 text-center">Mức đạt</th>
                    <th className="py-3 px-4">Lời nhận xét của Giáo viên bộ môn / GVCN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {subjects.map((subj, idx) => {
                    const isPeriodicScored = ['subj-toan', 'subj-tv', 'subj-ta', 'subj-tin', 'subj-lsdl', 'subj-kh'].includes(subj.id);
                    const mockScore = isPeriodicScored ? 9.5 : null;
                    const mockLevel = 'T';
                    const mockComments: Record<string, string> = {
                      'subj-toan': 'Tính toán nhanh, tư duy logic rất tốt; nắm chắc bảng nhân chia và tích cực phát biểu.',
                      'subj-tv': 'Đọc to, rõ ràng, diễn cảm; chữ viết nắn nót, đúng độ cao; viết đoạn văn giàu cảm xúc.',
                      'subj-ta': 'Phát âm chuẩn, tự tin giao tiếp tiếng Anh qua các bài hát và trò chơi tương tác.',
                      'subj-tnxh': 'Chăm chú quan sát, yêu thích khám phá thế giới tự nhiên xung quanh và làm việc nhóm tích cực.',
                      'subj-dd': 'Lễ phép với thầy cô, hòa đồng, hay giúp đỡ bạn bè trong lớp.',
                      'subj-tin': 'Thực hành thao tác chuột và bàn phím thành thạo, có tính sáng tạo.',
                      'subj-mt': 'Vẽ tranh phối màu hài hòa, giàu trí tưởng tượng.',
                      'subj-an': 'Hát đúng giai điệu, tích cực tham gia các tiết mục văn nghệ.',
                      'subj-gdtc': 'Nhanh nhẹn, có thể lực tốt, tham gia đầy đủ các bài tập rèn luyện.',
                      'subj-hdtn': 'Nhiệt tình tham gia hoạt động trải nghiệm, có ý thức giữ gìn vệ sinh lớp học.',
                    };

                    return (
                      <tr key={subj.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{subj.name}</td>
                        <td className="py-3 px-4 text-center">
                          {mockScore !== null ? (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-black">
                              {mockScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Đánh giá bằng nhận xét</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {mockLevel === 'T' ? 'T - Tốt' : mockLevel === 'H' ? 'H - Hoàn thành' : 'C - Cần cố gắng'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 leading-relaxed font-medium">
                          {mockComments[subj.id] || 'Hoàn thành tốt các mục tiêu bài học; có tinh thần học tập tích cực.'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Competencies and Qualities Assessment (TT27) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Competencies */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-extrabold text-slate-800">
                    2. Đánh giá Năng lực (TT27)
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  Tổng hợp: Tốt
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-extrabold text-slate-700 block mb-2 text-[11px] uppercase tracking-wide">
                    A. NĂNG LỰC CHUNG:
                  </span>
                  <div className="space-y-2">
                    {[
                      { name: 'Tự chủ và tự học', level: 'Tốt', desc: 'Tự giác hoàn thành bài tập, chuẩn bị đồ dùng chu đáo' },
                      { name: 'Giao tiếp và hợp tác', level: 'Tốt', desc: 'Biết lắng nghe, chia sẻ và tương tác tích cực với bạn' },
                      { name: 'Giải quyết vấn đề và sáng tạo', level: 'Tốt', desc: 'Có nhiều ý tưởng mới trong các hoạt động nhóm' },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                          {item.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="font-extrabold text-slate-700 block mb-2 text-[11px] uppercase tracking-wide">
                    B. NĂNG LỰC ĐẶC THÙ:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    {['Ngôn ngữ', 'Tính toán', 'Khoa học', 'Thẩm mĩ', 'Thể chất'].map((n, idx) => (
                      <div key={idx} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-700">{n}</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-black text-[10px]">
                          Tốt
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Qualities */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h3 className="text-sm font-extrabold text-slate-800">
                    3. Đánh giá 5 Phẩm chất chủ yếu (TT27)
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  Tổng hợp: Tốt
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: '1. Yêu nước', desc: 'Kính trọng cờ Tổ quốc, thuộc các bài hát về quê hương đất nước', level: 'Tốt' },
                  { name: '2. Nhân ái', desc: 'Yêu quý bạn bè, biết nhường nhịn và sẻ chia đồ dùng', level: 'Tốt' },
                  { name: '3. Chăm chỉ', desc: 'Đi học đúng giờ, chịu khó luyện chữ, đọc sách', level: 'Tốt' },
                  { name: '4. Trung thực', desc: 'Thật thà trong học tập và sinh hoạt, không giấu lỗi', level: 'Tốt' },
                  { name: '5. Trách nhiệm', desc: 'Có ý thức giữ gìn vệ sinh lớp học, hoàn thành việc được giao', level: 'Tốt' },
                ].map((q, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{q.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{q.desc}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                      {q.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Online Exam Attempts History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-800">
                  4. Lịch sử Bài kiểm tra & Khảo sát Trực tuyến của con
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Lưu trữ các bài thi thử và thi chính thức
              </span>
            </div>

            {studentExamAttempts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400">
                Chưa có dữ liệu bài thi trực tuyến được ghi nhận cho học sinh này.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studentExamAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-mono font-black text-xs">
                          {attempt.examCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            attempt.mode === 'practice'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {attempt.mode === 'practice' ? 'Thi thử' : 'Chính thức'}
                        </span>
                      </div>
                      <span className="text-sm font-black text-rose-600">
                        {attempt.score} / 10 điểm
                      </span>
                    </div>

                    <div className="font-bold text-slate-800 text-xs">
                      {attempt.title} - Môn: {attempt.subjectName}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Đúng: {attempt.correctCount}/{attempt.totalQuestions} câu</span>
                      <span>Ngày nộp: {attempt.submittedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">Tạo thông báo mới gửi Phụ huynh</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề thông báo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thông báo Lịch họp phụ huynh định kỳ đầu năm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đối tượng nhận
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  >
                    <option value="class">Theo lớp học</option>
                    <option value="all">Toàn trường</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  >
                    <option value="hoc_tap">Học tập & Kiểm tra</option>
                    <option value="hoat_dong">Hoạt động ngoại khóa</option>
                    <option value="suc_khoe">Y tế & Sức khỏe</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chi tiết *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập nội dung đầy đủ, lịch trình, nhắc nhở phụ huynh..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded text-cyan-600"
                />
                <label htmlFor="urgentCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Đánh dấu thông báo khẩn cấp (Ưu tiên hiển thị đầu trang)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 btn-tactile shadow-md"
                >
                  Phát hành thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
