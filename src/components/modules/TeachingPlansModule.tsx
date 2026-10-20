import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TeachingPlan, TimetableSlot } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import html2pdf from 'html2pdf.js';
import {
  CalendarDays,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  Printer,
  Edit2,
  Trash2,
  Copy,
  BookOpen,
  X,
  Sparkles,
  FileText,
  Lock,
  Download,
  Calendar,
  Check,
  Eye,
  Pencil,
  Save
} from 'lucide-react';

export const TeachingPlansModule: React.FC = () => {
  const {
    teachingPlans,
    timetable,
    subjects,
    classes,
    students,
    currentUser,
    addTeachingPlan,
    updateTeachingPlan,
    deleteTeachingPlan,
    saveTimetableSlot,
    deleteTimetableSlot,
    showToast,
    schoolName,
  } = useApp();

  const isParent = currentUser.role === 'parent_student';
  const linkedStudent = isParent ? students.find((s) => s.id === currentUser.linkedStudentId) : null;
  const parentClassId = linkedStudent ? linkedStudent.classId : classes[0].id;

  const [activeTab, setActiveTab] = useState<'plans' | 'timetable'>(isParent ? 'timetable' : 'plans');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Role permissions: Only Quản trị viên, Hiệu trưởng, and Hiệu phó can view all classes' timetable
  const canViewAllTimetable =
    currentUser.role === 'admin' ||
    currentUser.position === 'Quản trị viên' ||
    currentUser.position === 'Quản trị viên hệ thống' ||
    currentUser.position === 'Hiệu trưởng' ||
    currentUser.position === 'Hiệu phó' ||
    currentUser.role === 'principal' ||
    currentUser.username === 'admin';

  // Determine user's designated homeroom class
  const userHomeroomClass = useMemo(() => {
    return (
      classes.find(
        (c) =>
          c.id === currentUser.homeroomClassId ||
          `Lớp ${c.name}` === currentUser.homeroomClassName ||
          c.name === currentUser.homeroomClassName ||
          (currentUser.grade && c.grade === currentUser.grade)
      ) || classes.find((c) => c.id === 'class-3a1') || classes[0]
    );
  }, [classes, currentUser]);

  // Selected class for Timetable view
  const [timetableClassId, setTimetableClassId] = useState<string>(
    isParent ? parentClassId : (canViewAllTimetable ? 'class-3a1' : userHomeroomClass.id)
  );

  // Auto sync timetableClassId and teacher name whenever assigned class or currentUser changes
  React.useEffect(() => {
    if (!canViewAllTimetable && userHomeroomClass?.id) {
      setTimetableClassId(userHomeroomClass.id);
    }
    if (currentUser.name) {
      setSlotTeacherName(currentUser.name);
    }
  }, [canViewAllTimetable, userHomeroomClass, currentUser.name]);

  const effectiveTimetableClassId = isParent ? parentClassId : (canViewAllTimetable ? timetableClassId : userHomeroomClass.id);
  const currentTimetableClass = useMemo(() => {
    return classes.find((c) => c.id === effectiveTimetableClassId) || userHomeroomClass;
  }, [classes, effectiveTimetableClassId, userHomeroomClass]);

  // Modals for Plans
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TeachingPlan | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [printingPlan, setPrintingPlan] = useState<TeachingPlan | null>(null);

  // Timetable Slot Modal state
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotDay, setSlotDay] = useState<number>(2);
  const [slotPeriod, setSlotPeriod] = useState<number>(1);
  const [slotSubjectId, setSlotSubjectId] = useState<string>('subj-toan');
  const [slotTeacherName, setSlotTeacherName] = useState<string>(currentUser.name);
  const [slotRoom, setSlotRoom] = useState<string>('Phòng 201');
  const [deleteTargetSlotId, setDeleteTargetSlotId] = useState<string | null>(null);

  // Filtered plans
  const filteredPlans = teachingPlans.filter((p) => {
    const matchType = filterType === 'all' || p.type === filterType;
    const matchSubj = filterSubject === 'all' || p.subjectId === filterSubject;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchType && matchSubj && matchStatus;
  });

  // Timetable helpers - stateful to allow adding/deleting columns and rows
  // Requirement: Default to view-only mode; allow "ngòi bút" edit and save after editing
  const [isEditingTimetable, setIsEditingTimetable] = useState<boolean>(false);
  const [daysOfWeek, setDaysOfWeek] = useState([
    { day: 2, label: 'Thứ Hai' },
    { day: 3, label: 'Thứ Ba' },
    { day: 4, label: 'Thứ Tư' },
    { day: 5, label: 'Thứ Năm' },
    { day: 6, label: 'Thứ Sáu' },
  ]);
  const [periodsList, setPeriodsList] = useState<number[]>([1, 2, 3, 4, 5]);

  const handleAddDay = () => {
    const nextNum = daysOfWeek.length + 2;
    const label = nextNum <= 7 ? `Thứ ${nextNum}` : nextNum === 8 ? 'Chủ Nhật' : `Tiết bổ sung ${nextNum - 8}`;
    setDaysOfWeek((prev) => [...prev, { day: nextNum, label }]);
    showToast(`Đã thêm cột ${label} vào Thời khóa biểu!`, 'success');
  };

  const handleDeleteDay = (dayNum: number) => {
    if (daysOfWeek.length <= 1) {
      showToast('Thời khóa biểu cần duy trì tối thiểu 1 cột ngày học!', 'warning');
      return;
    }
    const target = daysOfWeek.find((d) => d.day === dayNum);
    setDaysOfWeek((prev) => prev.filter((d) => d.day !== dayNum));
    showToast(`Đã xóa cột ${target?.label || ''} khỏi Thời khóa biểu!`, 'info');
  };

  const handleAddPeriod = () => {
    const nextP = periodsList.length > 0 ? Math.max(...periodsList) + 1 : 1;
    setPeriodsList((prev) => [...prev, nextP]);
    showToast(`Đã thêm hàng Tiết ${nextP} (tiết phát sinh) vào Thời khóa biểu!`, 'success');
  };

  const handleDeletePeriod = (periodNum: number) => {
    if (periodsList.length <= 1) {
      showToast('Thời khóa biểu cần duy trì tối thiểu 1 hàng tiết học!', 'warning');
      return;
    }
    setPeriodsList((prev) => prev.filter((p) => p !== periodNum));
    showToast(`Đã xóa hàng Tiết ${periodNum} khỏi Thời khóa biểu!`, 'info');
  };

  const handleSaveTimetableEdit = () => {
    setIsEditingTimetable(false);
    showToast('Đã lưu lại toàn bộ thay đổi thời khóa biểu thành công!', 'success');
  };

  // Plan form inputs
  const [formData, setFormData] = useState({
    title: '',
    type: 'week' as 'year' | 'semester' | 'month' | 'week',
    grade: 3,
    subjectId: 'subj-toan',
    classId: 'class-3a1',
    startDate: '2026-10-19',
    endDate: '2026-10-24',
    status: 'in_progress' as 'draft' | 'approved' | 'in_progress' | 'completed',
    progressPct: 0,
    summary: '',
    lessonsCount: 4,
    authorName: currentUser.name,
  });

  const handleOpenAddModal = () => {
    setEditingPlan(null);
    setFormData({
      title: '',
      type: 'week',
      grade: 3,
      subjectId: 'subj-toan',
      classId: effectiveTimetableClassId,
      startDate: '2026-10-19',
      endDate: '2026-10-24',
      status: 'in_progress',
      progressPct: 20,
      summary: '',
      lessonsCount: 4,
      authorName: currentUser.name,
    });
    setIsAddPlanModalOpen(true);
  };

  const handleOpenEditModal = (plan: TeachingPlan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      type: plan.type,
      grade: plan.grade,
      subjectId: plan.subjectId,
      classId: plan.classId || effectiveTimetableClassId,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      progressPct: plan.progressPct,
      summary: plan.summary,
      lessonsCount: plan.lessonsCount,
      authorName: plan.authorName,
    });
    setIsAddPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tên kế hoạch!', 'error');
      return;
    }

    const selectedSubj = subjects.find((s) => s.id === formData.subjectId);
    const subjectName = selectedSubj ? selectedSubj.name : 'Toán học';
    const selectedCls = classes.find((c) => c.id === formData.classId);
    const className = selectedCls ? selectedCls.name : '3A1';

    if (editingPlan) {
      updateTeachingPlan(editingPlan.id, {
        ...formData,
        subjectName,
        className,
      });
    } else {
      addTeachingPlan({
        ...formData,
        subjectName,
        className,
      });
    }
    setIsAddPlanModalOpen(false);
  };

  const handleDuplicatePlan = (plan: TeachingPlan) => {
    addTeachingPlan({
      ...plan,
      title: `${plan.title} (Bản sao)`,
      status: 'draft',
      progressPct: 0,
    });
    showToast('Đã nhân bản kế hoạch giảng dạy!', 'success');
  };

  // Timetable Slot Edit Handlers
  const handleOpenSlotModal = (day: number, period: number, existingSlot?: TimetableSlot) => {
    setSlotDay(day);
    setSlotPeriod(period);
    if (existingSlot) {
      setSlotSubjectId(existingSlot.subjectId);
      setSlotTeacherName(existingSlot.teacherName);
      setSlotRoom(existingSlot.room);
    } else {
      setSlotSubjectId('subj-toan');
      setSlotTeacherName(currentUser.name);
      setSlotRoom(currentTimetableClass.roomNumber || 'Phòng 201');
    }
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === slotSubjectId) || subjects[0];
    saveTimetableSlot(effectiveTimetableClassId, slotDay, slotPeriod, {
      subjectId: subj.id,
      subjectName: subj.name,
      teacherName: slotTeacherName.trim() || currentUser.name,
      room: slotRoom.trim() || 'Phòng học',
      className: currentTimetableClass.name,
    });
    setIsSlotModalOpen(false);
  };

  // Requirement: Thay chức năng "In thời khóa biểu" thành "Xuất File Word"
  // Xuất file Word dạng bảng chuẩn, kích thước phù hợp, font chữ Time new Roman, cỡ chữ 13, tiêu đề in đậm.
  const handleExportWord = () => {
    const classNameUpper = currentTimetableClass.name.toUpperCase();
    const roomStr = currentTimetableClass.roomNumber || 'Phòng 201';
    const teacherStr = currentTimetableClass.homeroomTeacherName || currentUser.name;

    // Generate table rows for Word
    const tableBodyRows = periodsList
      .map((period) => {
        const periodCells = daysOfWeek
          .map((d) => {
            const slot = timetable.find(
              (t) => t.classId === effectiveTimetableClassId && t.dayOfWeek === d.day && t.period === period
            );
            if (slot) {
              return `
                <td style="border: 1px solid #000000; padding: 7px; text-align: center; vertical-align: middle; font-size: 13pt;">
                  <strong style="font-size: 13pt; color: #002060;">${slot.subjectName}</strong><br>
                  <span style="font-size: 11pt; color: #333333;">${slot.teacherName}</span><br>
                  <span style="font-size: 10pt; color: #555555; font-style: italic;">(${slot.room})</span>
                </td>
              `;
            }
            return `
              <td style="border: 1px solid #000000; padding: 7px; text-align: center; vertical-align: middle; font-size: 13pt; color: #888888;">
                -
              </td>
            `;
          })
          .join('');

        return `
          <tr>
            <td style="border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; background-color: #f2f2f2; font-size: 13pt; width: 12%;">
              Tiết ${period}
            </td>
            ${periodCells}
          </tr>
        `;
      })
      .join('');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>THỜI KHÓA BIỂU LỚP ${classNameUpper}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 841.9pt 595.3pt; /* A4 Landscape */
            margin: 0.8in 0.8in 0.8in 0.8in;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body, table, p, div, span, td, th {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            color: #000000;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 15px;
          }
          .header-box {
            width: 100%;
            border: none;
            margin-bottom: 20px;
          }
          .header-box td {
            border: none;
            padding: 0;
            font-size: 13pt;
          }
          .title-main {
            font-size: 17pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            margin-top: 10px;
            color: #002060;
          }
          .title-sub {
            font-size: 13pt;
            font-style: italic;
            text-align: center;
            margin-bottom: 15px;
          }
          th {
            background-color: #d9e1f2;
            font-weight: bold;
            border: 1px solid #000000;
            padding: 8px;
            text-align: center;
            font-size: 13pt;
          }
        </style>
      </head>
      <body>
      <div class="Section1">
        <table class="header-box">
          <tr>
            <td style="text-align: left; width: 45%; vertical-align: top;">
              <strong>${schoolName.toUpperCase()}</strong><br>
              <strong>TỔ CHUYÊN MÔN TIỂU HỌC</strong><br>
              <span>Năm học: 2025 - 2026</span>
            </td>
            <td style="text-align: center; width: 55%; vertical-align: top;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
              <strong>Độc lập - Tự do - Hạnh phúc</strong><br>
              <em>------------------------</em>
            </td>
          </tr>
        </table>

        <div class="title-main">THỜI KHÓA BIỂU - LỚP ${classNameUpper}</div>
        <div class="title-sub">(Áp dụng từ Học kỳ I • Phòng học: ${roomStr} • GVCN: ${teacherStr})</div>

        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Tiết / Buổi</th>
              <th style="width: 17.6%;">Thứ Hai</th>
              <th style="width: 17.6%;">Thứ Ba</th>
              <th style="width: 17.6%;">Thứ Tư</th>
              <th style="width: 17.6%;">Thứ Năm</th>
              <th style="width: 17.6%;">Thứ Sáu</th>
            </tr>
          </thead>
          <tbody>
            ${tableBodyRows}
          </tbody>
        </table>

        <br>
        <table style="width: 100%; border: none; margin-top: 30px;">
          <tr>
            <td style="border: none; text-align: center; width: 33%; font-size: 13pt;">
              <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br>
              <em>(Ký và ghi rõ họ tên)</em><br><br><br><br>
              <strong>${teacherStr}</strong>
            </td>
            <td style="border: none; text-align: center; width: 33%; font-size: 13pt;">
              <strong>TỔ TRƯỞNG CHUYÊN MÔN</strong><br>
              <em>(Ký và ghi rõ họ tên)</em><br><br><br><br>
              <strong>ThS. Trần Thị Mai</strong>
            </td>
            <td style="border: none; text-align: center; width: 34%; font-size: 13pt;">
              <em>Ngày ... tháng ... năm 2026</em><br>
              <strong>HIỆU TRƯỞNG PHÊ DUYỆT</strong><br>
              <em>(Ký và đóng dấu)</em><br><br><br><br>
              <strong>BAN GIÁM HIỆU</strong>
            </td>
          </tr>
        </table>
      </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + wordHtml], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Thoi_khoa_bieu_Lop_${currentTimetableClass.name}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất file Word Thời khóa biểu lớp ${currentTimetableClass.name} chuẩn bảng, font Times New Roman, cỡ 13!`, 'success');
  };

  const handleExportPlanPDF = () => {
    const element = document.getElementById('printable-plan-content');
    if (!element) return;
    const opt = {
      margin:       10,
      filename:     `Ke_hoach_${printingPlan?.title || 'day_hoc'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().from(element).set(opt).save();
    showToast('Đã xuất file PDF kế hoạch (Times New Roman, cỡ 13) thành công!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              {isParent ? 'Thời khóa biểu Lớp học của con' : 'Kế hoạch Giảng dạy & Thời khóa biểu'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isParent
              ? 'Theo dõi lịch học, tiết học hàng ngày trong tuần của lớp con đang học.'
              : 'Xây dựng phân phối chương trình, theo dõi tiến độ và quản lý thời khóa biểu chính khóa các lớp.'}
          </p>
        </div>

        {!isParent && (
          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setActiveTab('plans')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'plans'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kế hoạch bài dạy ({filteredPlans.length})
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'timetable'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Thời khóa biểu</span>
              </button>
            </div>

            {activeTab === 'plans' && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all btn-tactile"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo kế hoạch mới</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!isParent && activeTab === 'plans' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Bộ lọc:</span>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">Tất cả chu kỳ (Năm / Kỳ / Tháng / Tuần)</option>
              <option value="semester">Theo học kỳ</option>
              <option value="month">Theo tháng</option>
              <option value="week">Theo tuần</option>
              <option value="year">Cả năm học</option>
            </select>

            {/* Subject Filter */}
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="approved">Đã phê duyệt</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm card-hover flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {plan.subjectName} • Khối {plan.grade}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          plan.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : plan.status === 'in_progress'
                            ? 'bg-sky-100 text-sky-800'
                            : plan.status === 'completed'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {plan.status === 'approved'
                          ? 'Đã duyệt'
                          : plan.status === 'in_progress'
                          ? 'Đang dạy'
                          : plan.status === 'completed'
                          ? 'Hoàn thành'
                          : 'Bản nháp'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {plan.summary}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Tiến độ thực hiện:</span>
                      <span className="font-bold text-slate-700">{plan.progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${plan.progressPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-400">
                        <span>{plan.authorName}</span> • <span>{plan.startDate}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPrintingPlan(plan)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Xem kế hoạch"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicatePlan(plan)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Nhân bản kế hoạch"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Chỉnh sửa kế hoạch"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(plan.id)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa kế hoạch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
                Không tìm thấy kế hoạch nào phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </div>
        </>
      ) : (
        /* Timetable Tab with Multi-Class Permission, Edit Slots, and Word Export */
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          {/* Top Bar with Class Picker & Word Export */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-extrabold text-xs">
                  LỚP {currentTimetableClass.name}
                </span>
                <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">
                  THỜI KHÓA BIỂU CHÍNH KHÓA - LỚP {currentTimetableClass.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {schoolName} • Áp dụng từ Học kỳ I • Phòng {currentTimetableClass.roomNumber || '201'} • GVCN {currentTimetableClass.homeroomTeacherName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Permission: Admin & Principals can choose ANY class; Teachers only their class */}
              {canViewAllTimetable ? (
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500">Xem lớp:</span>
                  <select
                    value={timetableClassId}
                    onChange={(e) => setTimetableClassId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-sky-900 outline-none cursor-pointer"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Lớp {cls.name} (Khối {cls.grade} • {cls.homeroomTeacherName})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Thời khóa biểu lớp tôi: Lớp {userHomeroomClass.name}</span>
                </div>
              )}

              {/* Requirement: Chế độ xem mặc định, ngòi bút chỉnh sửa & Lưu lại sau chỉnh sửa */}
              {!isParent && (!isEditingTimetable ? (
                <>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-100 text-slate-600 text-xs font-semibold">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Chế độ xem</span>
                  </span>

                  <button
                    onClick={() => setIsEditingTimetable(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all btn-tactile shadow-md shadow-amber-500/20"
                    title="Bật chế độ chỉnh sửa: cho phép thêm, xóa bất kỳ hàng (tiết) hoặc cột (ngày), chỉnh sửa tiết học"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Chỉnh sửa thời khóa biểu</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold animate-pulse">
                    <Pencil className="w-3.5 h-3.5 text-amber-600" />
                    <span>Đang chỉnh sửa</span>
                  </span>

                  <button
                    onClick={handleSaveTimetableEdit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all btn-tactile shadow-md shadow-emerald-600/20"
                    title="Lưu lại toàn bộ các sửa đổi trên thời khóa biểu và quay về chế độ xem"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu lại sau chỉnh sửa</span>
                  </button>

                  <button
                    onClick={() => setIsEditingTimetable(false)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all btn-tactile"
                    title="Hủy các thao tác chỉnh sửa"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Hủy</span>
                  </button>

                  <button
                    onClick={() => handleOpenSlotModal(2, 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all btn-tactile"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Thêm tiết học</span>
                  </button>
                </>
              ))}

              {/* Requirement: Thay chức năng "In thời khóa biểu" thành "Xuất File Word" */}
              <button
                onClick={handleExportWord}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-700 hover:from-blue-700 hover:to-sky-800 text-white text-xs font-bold transition-all btn-tactile shadow-md shadow-sky-600/20"
                title="Xuất file Word (.doc) dạng bảng chuẩn, font Times New Roman, cỡ 13, tiêu đề in đậm"
              >
                <FileText className="w-4 h-4" />
                <span>Xuất File Word</span>
              </button>
            </div>
          </div>

          {/* Interactive Timetable Grid with Add/Delete Any Row and Any Column */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3 w-20 border-r border-slate-200">Tiết</th>
                  {daysOfWeek.map((d) => (
                    <th key={d.day} className="py-3 px-3 border-r border-slate-200 group/col relative">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{d.label}</span>
                        {isEditingTimetable && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDay(d.day)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={`Xóa cột ${d.label} khỏi thời khóa biểu`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {/* Plus button to add extra column when in edit mode */}
                  {isEditingTimetable && (
                    <th className="py-2 px-2 w-16 bg-emerald-50/70 border-l border-emerald-200 text-center">
                      <button
                        type="button"
                        onClick={handleAddDay}
                        className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center justify-center transition-all btn-tactile"
                        title="Thêm cột mới (Thứ / Buổi học phát sinh)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {periodsList.map((period) => (
                  <tr key={period} className="hover:bg-slate-50/50">
                    <td className="py-4 px-3 font-bold bg-slate-50 text-slate-600 border-r border-slate-200">
                      <div className="flex items-center justify-between gap-1">
                        <span>Tiết {period}</span>
                        {isEditingTimetable && (
                          <button
                            type="button"
                            onClick={() => handleDeletePeriod(period)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={`Xóa hàng Tiết ${period}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    {daysOfWeek.map((d) => {
                      const slot = timetable.find(
                        (t) => t.classId === effectiveTimetableClassId && t.dayOfWeek === d.day && t.period === period
                      );

                      return (
                        <td
                          key={d.day}
                          className="py-3 px-3 border-r border-slate-200 align-top"
                        >
                          {slot ? (
                            <div className="group relative p-2.5 rounded-2xl bg-sky-50/80 border border-sky-100 text-left hover:bg-sky-100/80 transition-all shadow-xs">
                              <p className="font-extrabold text-sky-950 text-xs leading-tight">
                                {slot.subjectName}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {slot.teacherName}
                              </p>
                              <p className="text-[9px] text-sky-700 font-medium mt-0.5">
                                {slot.room}
                              </p>

                              {/* Hover Edit and Delete Actions - Only visible in Edit mode */}
                              {isEditingTimetable && (
                                <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-0.5 rounded-lg shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSlotModal(d.day, period, slot)}
                                    className="p-1 rounded-md text-slate-600 hover:text-sky-600 hover:bg-sky-50"
                                    title="Chỉnh sửa tiết học"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTargetSlotId(slot.id)}
                                    className="p-1 rounded-md text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                    title="Xóa tiết học"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : isEditingTimetable ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSlotModal(d.day, period)}
                              className="w-full py-3.5 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50/40 text-xs transition-colors flex items-center justify-center gap-1"
                              title="Nhấp để thêm tiết học vào ô này"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="text-[10px]">Trống</span>
                            </button>
                          ) : (
                            <div className="py-3.5 text-center text-slate-300 font-medium">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {isEditingTimetable && (
                      <td className="py-3 px-2 border-l border-slate-100 bg-slate-50/30 text-center"></td>
                    )}
                  </tr>
                ))}

                {/* Plus button row to add extra period / row - Only visible in Edit mode */}
                {isEditingTimetable && (
                  <tr className="bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors">
                    <td
                      colSpan={daysOfWeek.length + 2}
                      className="py-2.5 px-3 text-center border-t border-dashed border-emerald-300"
                    >
                      <button
                        type="button"
                        onClick={handleAddPeriod}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all btn-tactile"
                        title="Bổ sung thêm hàng tiết học phát sinh"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm hàng (Tiết học phát sinh: Tiết {periodsList.length + 1})</span>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* GVCN và Ban Giám Hiệu xác nhận ở cuối Thời khóa biểu */}
          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-slate-700">GIÁO VIÊN CHỦ NHIỆM</p>
              <p className="text-[11px] italic text-slate-400">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 flex items-end justify-center">
                <p className="text-sm font-extrabold text-sky-900">{currentTimetableClass.homeroomTeacherName}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-slate-700">TỔ TRƯỞNG CHUYÊN MÔN</p>
              <p className="text-[11px] italic text-slate-400">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 flex items-end justify-center">
                <p className="text-sm font-extrabold text-slate-800">ThS. Trần Thị Mai</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] italic text-slate-400">Ngày ... tháng ... năm 2026</p>
              <p className="text-xs font-bold uppercase text-slate-700">HIỆU TRƯỞNG PHÊ DUYỆT</p>
              <div className="h-16 flex items-end justify-center">
                <p className="text-sm font-extrabold text-slate-800">BAN GIÁM HIỆU</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Timetable Slot */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Điều chỉnh tiết học - Lớp {currentTimetableClass.name}
              </h3>
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Thứ trong tuần *
                  </label>
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold"
                  >
                    <option value={2}>Thứ Hai</option>
                    <option value={3}>Thứ Ba</option>
                    <option value={4}>Thứ Tư</option>
                    <option value={5}>Thứ Năm</option>
                    <option value={6}>Thứ Sáu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiết học *
                  </label>
                  <select
                    value={slotPeriod}
                    onChange={(e) => setSlotPeriod(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold"
                  >
                    <option value={1}>Tiết 1 (Sáng)</option>
                    <option value={2}>Tiết 2 (Sáng)</option>
                    <option value={3}>Tiết 3 (Sáng)</option>
                    <option value={4}>Tiết 4 (Sáng)</option>
                    <option value={5}>Tiết 5 (Chiều)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Môn học giảng dạy *
                </label>
                <select
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl outline-none font-bold text-slate-800"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Giáo viên phụ trách tiết dạy *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Họ tên giáo viên..."
                  value={slotTeacherName}
                  onChange={(e) => setSlotTeacherName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phòng học / Địa điểm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phòng 201, Phòng Lab, Sân trường..."
                  value={slotRoom}
                  onChange={(e) => setSlotRoom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 btn-tactile shadow-md"
                >
                  Lưu tiết học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Slot Confirmation */}
      <ConfirmationModal
        isOpen={deleteTargetSlotId !== null}
        title="Xóa tiết học khỏi thời khóa biểu"
        message="Bạn có chắc chắn muốn xóa tiết học này khỏi thời khóa biểu của lớp?"
        onConfirm={() => {
          if (deleteTargetSlotId) {
            deleteTimetableSlot(deleteTargetSlotId);
            setDeleteTargetSlotId(null);
          }
        }}
        onCancel={() => setDeleteTargetSlotId(null)}
      />

      {/* Modal: Add / Edit Teaching Plan */}
      {isAddPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                {editingPlan ? 'Chỉnh sửa kế hoạch giảng dạy' : 'Tạo kế hoạch giảng dạy mới'}
              </h3>
              <button
                onClick={() => setIsAddPlanModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên kế hoạch giáo dục *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kế hoạch dạy học môn Toán tuần 9 - Lớp 3A1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chu kỳ kế hoạch
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  >
                    <option value="week">Theo tuần học</option>
                    <option value="month">Theo tháng</option>
                    <option value="semester">Theo học kỳ</option>
                    <option value="year">Cả năm học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lớp áp dụng
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiến độ hoàn thành (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progressPct}
                    onChange={(e) => setFormData({ ...formData, progressPct: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="approved">Đã phê duyệt</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tóm tắt nội dung & Mục tiêu trọng tâm
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú kiến thức trọng tâm, phương pháp và thiết bị dạy học chuẩn bị..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 btn-tactile"
                >
                  {editingPlan ? 'Lưu thay đổi' : 'Tạo kế hoạch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Preview Modal for Teaching Plans */}
      {printingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                MẪU KẾ HOẠCH DẠY HỌC CHUẨN BGDĐT
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPlanPDF}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 btn-tactile flex items-center gap-1.5 shadow-sm"
                  title="Xuất file PDF chuẩn Times New Roman, cỡ 13"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất PDF
                </button>
                <button
                  onClick={() => setPrintingPlan(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-plan-content" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '13pt', color: '#000000', padding: '20px', background: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: 'none' }}>
                <tbody>
                  <tr style={{ border: 'none' }}>
                    <td style={{ border: 'none', width: '45%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt' }}>
                      <strong>ỦY BAN NHÂN DÂN XÃ VÂN NHAM</strong><br />
                      <strong>TRƯỜNG TIỂU HỌC VÂN NHAM</strong><br />
                      <span>TỔ CHUYÊN MÔN: KHỐI {printingPlan.grade}</span><br />
                      <span>---------------------</span>
                    </td>
                    <td style={{ border: 'none', width: '55%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt' }}>
                      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                      <strong>Độc lập - Tự do - Hạnh phúc</strong><br />
                      <span>---------------------</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                  KẾ HOẠCH DẠY HỌC - BÀI DẠY
                </h2>
                <h3 style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                  {printingPlan.title.toUpperCase()}
                </h3>
                <p style={{ fontSize: '12pt', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                  Thời gian thực hiện: Từ {printingPlan.startDate} đến {printingPlan.endDate}
                </p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '8px', width: '50%', fontSize: '13pt' }}>
                      <strong>Môn học:</strong> {printingPlan.subjectName}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '8px', width: '50%', fontSize: '13pt' }}>
                      <strong>Khối lớp:</strong> Khối {printingPlan.grade}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '13pt' }}>
                      <strong>Người phụ trách:</strong> {printingPlan.authorName}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '8px', fontSize: '13pt' }}>
                      <strong>Tổng số tiết dự kiến:</strong> {printingPlan.lessonsCount} tiết
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000000', padding: '8px', fontSize: '13pt' }}>
                      <strong>Nội dung tóm tắt & Yêu cầu cần đạt:</strong><br />
                      <p style={{ marginTop: '4px', lineHeight: '1.5' }}>{printingPlan.summary || 'Thực hiện giảng dạy theo chương trình chuẩn GDPT 2018 và hướng dẫn chuyên môn.'}</p>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000000', padding: '8px', fontSize: '13pt' }}>
                      <strong>Tiến độ hoàn thành:</strong> {printingPlan.progressPct}% • <strong>Trạng thái:</strong> {printingPlan.status === 'approved' ? 'Đã duyệt' : printingPlan.status === 'completed' ? 'Hoàn thành' : 'Đang thực hiện'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px', border: 'none' }}>
                <tbody>
                  <tr style={{ border: 'none' }}>
                    <td style={{ border: 'none', width: '50%', textAlign: 'center', fontSize: '13pt' }}>
                      <strong>TỔ TRƯỞNG CHUYÊN MÔN</strong><br />
                      <span style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký và ghi rõ họ tên)</span>
                      <div style={{ height: '70px' }}></div>
                      <strong>ThS. Trần Thị Mai</strong>
                    </td>
                    <td style={{ border: 'none', width: '50%', textAlign: 'center', fontSize: '13pt' }}>
                      <span style={{ fontStyle: 'italic', fontSize: '11pt' }}>Ngày ..... tháng ..... năm 2026</span><br />
                      <strong>GIÁO VIÊN XÂY DỰNG</strong><br />
                      <span style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký và ghi rõ họ tên)</span>
                      <div style={{ height: '70px' }}></div>
                      <strong>{printingPlan.authorName}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="Xác nhận xóa kế hoạch"
        message="Bạn có chắc chắn muốn xóa kế hoạch này? Các tiến độ ghi nhận sẽ bị xóa vĩnh viễn."
        onConfirm={() => {
          if (deleteTargetId) {
            deleteTeachingPlan(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
