import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, AttendanceRecord } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  FileDown,
  FileUp,
  Eye,
  Edit2,
  Trash2,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  X,
  Phone,
  MapPin,
  Heart,
  ShieldAlert,
  Send,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  Download
} from 'lucide-react';

export const ClassStudentManagement: React.FC = () => {
  const {
    students,
    classes,
    attendance,
    currentUser,
    systemUsers,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudentsCSV,
    saveAttendance,
    sendZaloNotification,
    createUserAccount,
    updateUserAccount,
    showToast,
    schoolName,
  } = useApp();

  // Role check: Only Quản trị viên, Hiệu trưởng, and Hiệu phó can view all school students
  const canViewAllSchool =
    currentUser.role === 'admin' ||
    currentUser.position === 'Quản trị viên' ||
    currentUser.position === 'Quản trị viên hệ thống' ||
    currentUser.position === 'Hiệu trưởng' ||
    currentUser.position === 'Hiệu phó' ||
    currentUser.role === 'principal' ||
    currentUser.username === 'admin';

  // Determine user's designated homeroom class
  const userHomeroomClass = useMemo(() => {
    if (currentUser.homeroomClassId) {
      const byId = classes.find((c) => c.id === currentUser.homeroomClassId);
      if (byId) return byId;
    }
    if (currentUser.homeroomClassName) {
      const cleanTargetName = currentUser.homeroomClassName.replace(/^Lớp\s*/i, '').trim().toLowerCase();
      const byClassName = classes.find((c) => c.name.toLowerCase() === cleanTargetName || `lớp ${c.name.toLowerCase()}` === currentUser.homeroomClassName?.toLowerCase());
      if (byClassName) return byClassName;
    }
    if (currentUser.grade) {
      const byGrade = classes.find((c) => c.grade === currentUser.grade);
      if (byGrade) return byGrade;
    }
    return classes.find((c) => c.homeroomTeacherId === currentUser.id) || classes[0];
  }, [classes, currentUser]);

  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'attendance'>('roster');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    canViewAllSchool ? 'all' : (userHomeroomClass?.id || 'all')
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto sync selectedClassId whenever user's assigned homeroom class changes
  useEffect(() => {
    if (!canViewAllSchool && userHomeroomClass?.id) {
      setSelectedClassId(userHomeroomClass.id);
    }
  }, [canViewAllSchool, userHomeroomClass]);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [transferTargetStudent, setTransferTargetStudent] = useState<Student | null>(null);
  const [transferNewClassId, setTransferNewClassId] = useState<string>('');

  // Attendance Date State: User can pick ANY date in the week or month
  const getTodayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(getTodayISO());

  // Effective class ID enforcement
  const effectiveClassId = canViewAllSchool ? selectedClassId : userHomeroomClass.id;

  // Filtered students according to permission and search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = effectiveClassId === 'all' || s.classId === effectiveClassId;
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, effectiveClassId, searchQuery]);

  // Attendance local form state for the selected date
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: 'present' | 'excused' | 'unexcused'; note: string }>
  >({});

  // Populate attendance records when date, attendance, or filtered students change
  useEffect(() => {
    const map: Record<string, { status: 'present' | 'excused' | 'unexcused'; note: string }> = {};
    const existingForDate = attendance.filter((att) => att.date === selectedAttendanceDate);

    filteredStudents.forEach((s) => {
      const found = existingForDate.find((att) => att.studentId === s.id);
      if (found) {
        map[s.id] = { status: found.status, note: found.note || '' };
      } else {
        map[s.id] = { status: 'present', note: '' };
      }
    });

    setAttendanceRecords(map);
  }, [selectedAttendanceDate, attendance, filteredStudents]);

  // Distinct attendance dates recorded in system
  const recordedDates = useMemo(() => {
    const dates = Array.from(new Set(attendance.map((a) => a.date)));
    return dates.sort().reverse();
  }, [attendance]);

  // Quick attendance statistics
  const attendanceStats = useMemo(() => {
    const total = filteredStudents.length;
    let present = 0;
    let excused = 0;
    let unexcused = 0;

    filteredStudents.forEach((s) => {
      const record = attendanceRecords[s.id];
      if (record?.status === 'present') present++;
      else if (record?.status === 'excused') excused++;
      else if (record?.status === 'unexcused') unexcused++;
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, excused, unexcused, rate };
  }, [filteredStudents, attendanceRecords]);

  // Student form inputs
  const [formData, setFormData] = useState({
    studentCode: '',
    fullName: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '2016-01-01',
    classId: userHomeroomClass.id,
    parentName: '',
    parentPhone: '',
    parentZalo: '',
    address: '',
    healthNote: '',
    username: '',
    password: '123456',
  });

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    const nextCode = `HS2503${String(students.length + 1).padStart(2, '0')}`;
    setFormData({
      studentCode: nextCode,
      fullName: '',
      gender: 'Nam',
      dob: '2016-05-15',
      classId: effectiveClassId !== 'all' ? effectiveClassId : userHomeroomClass.id,
      parentName: '',
      parentPhone: '',
      parentZalo: '',
      address: '',
      healthNote: '',
      username: `phu_huynh_${nextCode.toLowerCase()}`,
      password: '123456',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    const associatedUser = systemUsers.find((u) => u.linkedStudentId === student.id);
    setFormData({
      studentCode: student.studentCode,
      fullName: student.fullName,
      gender: student.gender,
      dob: student.dob,
      classId: student.classId,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentZalo: student.parentZalo,
      address: student.address,
      healthNote: student.healthNote || '',
      username: associatedUser ? associatedUser.username : `phu_huynh_${student.studentCode.toLowerCase()}`,
      password: associatedUser ? (associatedUser.password || '123456') : '123456',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.studentCode.trim()) {
      showToast('Vui lòng nhập họ tên và mã học sinh!', 'error');
      return;
    }

    const selectedCls = classes.find((c) => c.id === formData.classId);
    const className = selectedCls ? selectedCls.name : '3A1';

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        studentCode: formData.studentCode,
        fullName: formData.fullName,
        gender: formData.gender,
        dob: formData.dob,
        classId: formData.classId,
        className,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentZalo: formData.parentZalo,
        address: formData.address,
        healthNote: formData.healthNote,
      });

      const existingUser = systemUsers.find((u) => u.linkedStudentId === editingStudent.id);
      if (existingUser) {
        updateUserAccount(existingUser.id, {
          username: formData.username.trim() || existingUser.username,
          password: formData.password.trim() || existingUser.password,
          name: formData.parentName.trim() || formData.fullName,
          phone: formData.parentPhone,
          grade: selectedCls?.grade,
          homeroomClassName: `Lớp ${className}`,
        });
      } else {
        createUserAccount({
          username: formData.username.trim() || `phu_huynh_${formData.studentCode.toLowerCase()}`,
          password: formData.password.trim() || '123456',
          name: formData.parentName.trim() || formData.fullName,
          email: `${formData.username.trim() || formData.studentCode.toLowerCase()}@lequydon.edu.vn`,
          phone: formData.parentPhone || '0900000000',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'parent_student',
          position: 'Phụ huynh',
          school: schoolName,
          grade: selectedCls?.grade,
          homeroomClassName: `Lớp ${className}`,
          linkedStudentId: editingStudent.id,
          linkedStudentName: formData.fullName,
          isActive: true,
        });
      }
      showToast('Đã cập nhật thông tin học sinh và tài khoản hệ thống!', 'success');
    } else {
      const newStudentId = 'std-' + Date.now();
      addStudent({
        id: newStudentId,
        studentCode: formData.studentCode,
        fullName: formData.fullName,
        gender: formData.gender,
        dob: formData.dob,
        classId: formData.classId,
        className,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentZalo: formData.parentZalo,
        address: formData.address,
        healthNote: formData.healthNote,
        status: 'active',
      });

      createUserAccount({
        username: formData.username.trim() || `phu_huynh_${formData.studentCode.toLowerCase()}`,
        password: formData.password.trim() || '123456',
        name: formData.parentName.trim() || formData.fullName,
        email: `${formData.username.trim() || formData.studentCode.toLowerCase()}@lequydon.edu.vn`,
        phone: formData.parentPhone || '0900000000',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'parent_student',
        position: 'Phụ huynh',
        school: schoolName,
        grade: selectedCls?.grade,
        homeroomClassName: `Lớp ${className}`,
        linkedStudentId: newStudentId,
        linkedStudentName: formData.fullName,
        isActive: true,
      });
      showToast('Đã thêm học sinh mới và cấp tài khoản thành công vào Module Tài khoản & Hệ thống!', 'success');
    }
    setIsAddEditModalOpen(false);
  };

  // Requirement: Export Excel with Table layout, Font Times New Roman, Size 13, Bold titles and Student Information Headers
  const handleExportExcel = () => {
    const currentClassName = effectiveClassId === 'all'
      ? 'TOÀN TRƯỜNG'
      : classes.find((c) => c.id === effectiveClassId)?.name || '3A1';

    const tableRows = filteredStudents
      .map(
        (s, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${idx + 1}</td>
          <td style="text-align: center; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.studentCode}</td>
          <td style="text-align: left; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.fullName}</td>
          <td style="text-align: center; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.gender}</td>
          <td style="text-align: center; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.dob ? s.dob.split('-').reverse().join('/') : ''}</td>
          <td style="text-align: center; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.className}</td>
          <td style="text-align: left; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.parentName}</td>
          <td style="text-align: center; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.parentPhone}</td>
          <td style="text-align: left; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.address}</td>
          <td style="text-align: center; border: 1px solid #000000; padding: 6px; font-size: 13pt;">${s.status === 'active' ? 'Đang học' : 'Chuyển trường'}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>DanhSachHocSinh</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body, table, th, td {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            color: #000000;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          .title-main {
            font-family: 'Times New Roman', Times, serif;
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
          }
          .title-sub {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            text-align: center;
            font-style: italic;
          }
          .header-school {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            font-weight: bold;
            text-align: left;
          }
          th {
            background-color: #d9e1f2;
            font-weight: bold;
            border: 1px solid #000000;
            padding: 8px 6px;
            font-size: 13pt;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="4" class="header-school">${schoolName.toUpperCase()}</td>
            <td colspan="6" style="text-align: center; font-size: 13pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 13pt; font-style: italic;">Năm học: 2025 - 2026</td>
            <td colspan="6" style="text-align: center; font-size: 13pt; font-style: italic;">Độc lập - Tự do - Hạnh phúc</td>
          </tr>
          <tr><td colspan="10" style="height: 15px;"></td></tr>
          <tr>
            <td colspan="10" class="title-main">DANH SÁCH HỌC SINH - LỚP ${currentClassName}</td>
          </tr>
          <tr>
            <td colspan="10" class="title-sub">(Tổng số học sinh: ${filteredStudents.length} • Ngày xuất: ${new Date().toLocaleDateString('vi-VN')})</td>
          </tr>
          <tr><td colspan="10" style="height: 15px;"></td></tr>
          <thead>
            <tr>
              <th style="width: 50px;">STT</th>
              <th style="width: 100px;">Mã học sinh</th>
              <th style="width: 220px;">Họ và tên</th>
              <th style="width: 80px;">Giới tính</th>
              <th style="width: 110px;">Ngày sinh</th>
              <th style="width: 80px;">Lớp</th>
              <th style="width: 180px;">Họ tên phụ huynh</th>
              <th style="width: 120px;">Số điện thoại</th>
              <th style="width: 260px;">Địa chỉ</th>
              <th style="width: 100px;">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tr><td colspan="10" style="height: 20px;"></td></tr>
          <tr>
            <td colspan="5" style="text-align: center; font-size: 13pt; font-style: italic;">
              ... ngày ... tháng ... năm 2026<br>
              <strong>Người lập bảng</strong><br><br><br><br>
              <strong>${currentUser.name}</strong>
            </td>
            <td colspan="5" style="text-align: center; font-size: 13pt; font-style: italic;">
              ... ngày ... tháng ... năm 2026<br>
              <strong>HIỆU TRƯỞNG</strong><br><br><br><br>
              <strong>(Ký và đóng dấu)</strong>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + htmlContent], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_sach_hoc_sinh_${currentClassName}_${selectedAttendanceDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file Excel chuẩn bảng, cỡ chữ 13, Times New Roman thành công!', 'success');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          showToast('Tệp không đúng định dạng hoặc không có dữ liệu', 'error');
          return;
        }

        const newParsed: Omit<Student, 'id'>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.replace(/"/g, '').trim());
          if (parts.length >= 3) {
            newParsed.push({
              studentCode: parts[1] || `HS2503${Date.now().toString().slice(-4)}`,
              fullName: parts[2] || 'Học sinh mới',
              gender: parts[3] === 'Nữ' ? 'Nữ' : 'Nam',
              dob: parts[4] || '2016-01-01',
              classId: effectiveClassId !== 'all' ? effectiveClassId : userHomeroomClass.id,
              className: classes.find((c) => c.id === effectiveClassId)?.name || userHomeroomClass.name,
              parentName: parts[6] || 'Phụ huynh',
              parentPhone: parts[7] || '0900000000',
              parentZalo: parts[7] || '0900000000',
              address: parts[8] || 'Địa phương',
              status: 'active',
            });
          }
        }
        if (newParsed.length > 0) {
          importStudentsCSV(newParsed);
        } else {
          showToast('Không đọc được dữ liệu hợp lệ từ tệp', 'error');
        }
      } catch (err) {
        showToast('Có lỗi khi đọc tệp CSV', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Attendance batch save
  const handleSetAllAttendance = (status: 'present' | 'excused' | 'unexcused') => {
    const next = { ...attendanceRecords };
    filteredStudents.forEach((s) => {
      next[s.id] = { status, note: '' };
    });
    setAttendanceRecords(next);
  };

  const handleSaveAttendanceSheet = () => {
    const recordsToSave: AttendanceRecord[] = filteredStudents.map((s) => ({
      id: `att-${s.id}-${selectedAttendanceDate}`,
      date: selectedAttendanceDate,
      classId: s.classId,
      studentId: s.id,
      studentName: s.fullName,
      status: attendanceRecords[s.id]?.status || 'present',
      note: attendanceRecords[s.id]?.note || '',
    }));
    saveAttendance(recordsToSave);
  };

  // Class transfer action
  const handleExecuteTransfer = () => {
    if (!transferTargetStudent || !transferNewClassId) return;
    const targetClass = classes.find((c) => c.id === transferNewClassId);
    if (targetClass) {
      updateStudent(transferTargetStudent.id, {
        classId: targetClass.id,
        className: targetClass.name,
      });
      showToast(`Đã chuyển học sinh ${transferTargetStudent.fullName} sang lớp ${targetClass.name}!`);
      setTransferTargetStudent(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              Quản lý Lớp học & Học sinh
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canViewAllSchool ? (
              <span className="text-emerald-700 font-semibold">
                🛡️ Quyền Quản trị viên / Ban giám hiệu: Toàn quyền xem và quản lý học sinh toàn trường.
              </span>
            ) : (
              <span className="text-sky-700 font-semibold">
                🔒 Phạm vi giáo viên: Xem và quản lý danh sách học sinh theo lớp chủ nhiệm ({userHomeroomClass.name}).
              </span>
            )}
          </p>
        </div>

        {/* Tab Toggle: Danh sách HS vs Điểm danh */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'roster'
                ? 'bg-white text-sky-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hồ sơ học sinh ({filteredStudents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'attendance'
                ? 'bg-white text-sky-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Điểm danh & Lịch sử ngày</span>
          </button>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Class Selector & Search */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Class Selector based on Permission */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200/80">
            <Filter className="w-4 h-4 text-slate-400" />
            {canViewAllSchool ? (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Tất cả các lớp (Toàn trường)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Lớp {cls.name} (Khối {cls.grade} • {cls.homeroomTeacherName})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-sky-900">
                <Lock className="w-3 h-3 text-sky-600" />
                <span>Lớp chủ nhiệm: {userHomeroomClass.name}</span>
              </div>
            )}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên hoặc mã học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 pl-9 pr-4 py-2 rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'roster' ? (
            <>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all btn-tactile">
                <FileUp className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Nhập CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>

              {/* Requirement: Xuất Excel bảng chuẩn Times New Roman cỡ 13 */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all btn-tactile shadow-xs"
                title="Xuất file Excel chuẩn bảng, cỡ chữ 13, font Times New Roman, tiêu đề in đậm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất file Excel (chuẩn bảng)</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all btn-tactile"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm học sinh</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetAllAttendance('present')}
                className="px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold hover:bg-emerald-100 transition-all"
              >
                Tất cả có mặt (1-Click)
              </button>
              <button
                onClick={handleSaveAttendanceSheet}
                className="px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-all btn-tactile"
              >
                Lưu điểm danh ngày này
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab 1: Student Roster Table */}
      {activeSubTab === 'roster' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">STT</th>
                  <th className="py-3.5 px-4">Mã HS</th>
                  <th className="py-3.5 px-4">Họ và tên</th>
                  <th className="py-3.5 px-4">Giới tính</th>
                  <th className="py-3.5 px-4">Ngày sinh</th>
                  <th className="py-3.5 px-4">Lớp</th>
                  <th className="py-3.5 px-4">Phụ huynh & SĐT</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                        {student.studentCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">
                            {student.fullName}
                          </p>
                          {student.healthNote && (
                            <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                              <Heart className="w-3 h-3" />
                              {student.healthNote}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            student.gender === 'Nữ'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {student.dob ? student.dob.split('-').reverse().join('/') : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-slate-700 text-[11px]">
                          Lớp {student.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{student.parentName}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {student.parentPhone}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang học
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Xem chi tiết hồ sơ học sinh"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Chỉnh sửa thông tin học sinh"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTransferTargetStudent(student);
                              setTransferNewClassId(classes[0]?.id || '');
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Chuyển lớp cho học sinh"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(student.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa học sinh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Không tìm thấy học sinh nào phù hợp với bộ lọc và phân quyền hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Tab 2: Attendance Management with Any Date History in Week/Month */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          {/* Date Picker Bar & Attendance History Selector */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-sky-50 px-3.5 py-2 rounded-2xl border border-sky-200">
                <Calendar className="w-4 h-4 text-sky-700" />
                <span className="text-xs font-bold text-sky-900">Chọn ngày điểm danh:</span>
                <input
                  type="date"
                  value={selectedAttendanceDate}
                  onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                  className="bg-white border border-sky-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Quick Jump Buttons */}
              <button
                onClick={() => setSelectedAttendanceDate(getTodayISO())}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedAttendanceDate === getTodayISO()
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Hôm nay
              </button>

              {/* Recorded Dates Dropdown */}
              {recordedDates.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium">Lịch sử ngày đã lưu:</span>
                  <select
                    value={selectedAttendanceDate}
                    onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                  >
                    {recordedDates.map((d) => (
                      <option key={d} value={d}>
                        Ngày {d.split('-').reverse().join('/')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                Có mặt: {attendanceStats.present}/{attendanceStats.total}
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                Phép: {attendanceStats.excused}
              </span>
              <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs border border-rose-200">
                Không phép: {attendanceStats.unexcused}
              </span>
              <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-800 font-extrabold text-xs border border-sky-200">
                Tỷ lệ: {attendanceStats.rate}%
              </span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-12">STT</th>
                    <th className="py-3.5 px-4">Mã HS</th>
                    <th className="py-3.5 px-4">Họ và tên</th>
                    <th className="py-3.5 px-4">Lớp</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái điểm danh ngày {selectedAttendanceDate.split('-').reverse().join('/')}</th>
                    <th className="py-3.5 px-4">Ghi chú chuyên cần / Lý do</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const currentStatus = attendanceRecords[student.id]?.status || 'present';
                    const currentNote = attendanceRecords[student.id]?.note || '';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                          {student.studentCode}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {student.fullName}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          {student.className}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAttendanceRecords({
                                  ...attendanceRecords,
                                  [student.id]: { ...attendanceRecords[student.id], status: 'present' },
                                });
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Có mặt</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAttendanceRecords({
                                  ...attendanceRecords,
                                  [student.id]: { ...attendanceRecords[student.id], status: 'excused' },
                                });
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                currentStatus === 'excused'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Có phép</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAttendanceRecords({
                                  ...attendanceRecords,
                                  [student.id]: { ...attendanceRecords[student.id], status: 'unexcused' },
                                });
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                currentStatus === 'unexcused'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Không phép</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            placeholder="Ghi chú (sốt, gia đình bận, đi muộn...)"
                            value={currentNote}
                            onChange={(e) => {
                              setAttendanceRecords({
                                ...attendanceRecords,
                                [student.id]: {
                                  status: currentStatus,
                                  note: e.target.value,
                                },
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-800 outline-none focus:border-sky-500 transition-colors"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Student Profile */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  HS
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Hồ sơ Học sinh Chi tiết
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mã số: <strong className="font-mono text-sky-700">{viewingStudent.studentCode}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <img
                  src={viewingStudent.avatar || 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80'}
                  alt={viewingStudent.fullName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-sky-200"
                />
                <div>
                  <h4 className="text-base font-black text-slate-800">{viewingStudent.fullName}</h4>
                  <p className="text-slate-500 font-semibold mt-0.5">
                    Lớp {viewingStudent.className} • Giới tính: {viewingStudent.gender}
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    Ngày sinh: {viewingStudent.dob ? viewingStudent.dob.split('-').reverse().join('/') : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-slate-400">Phụ huynh:</p>
                  <p className="font-bold text-slate-800 mt-1">{viewingStudent.parentName}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-slate-400">Số điện thoại:</p>
                  <p className="font-bold text-sky-600 mt-1">{viewingStudent.parentPhone}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400">Địa chỉ thường trú:</p>
                <p className="font-bold text-slate-800 mt-1">{viewingStudent.address}</p>
              </div>

              {viewingStudent.healthNote && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                  <p className="font-bold flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-amber-600" /> Lưu ý sức khỏe học sinh:
                  </p>
                  <p className="mt-1 leading-relaxed">{viewingStudent.healthNote}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs btn-tactile"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Student */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingStudent ? 'Chỉnh sửa hồ sơ học sinh' : 'Thêm học sinh mới'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã học sinh *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên học sinh *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lớp phân công
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ tên phụ huynh
                  </label>
                  <input
                    type="text"
                    placeholder="Bố/Mẹ học sinh..."
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại phụ huynh
                  </label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value, parentZalo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <div>
                  <label className="block font-bold text-emerald-900 mb-1">
                    Tên đăng nhập (Tài khoản) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="phu_huynh_hs..."
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-900 mb-1">
                    Mật khẩu đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Địa chỉ thường trú
                </label>
                <input
                  type="text"
                  placeholder="Địa chỉ học sinh..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú sức khỏe / đặc điểm học tập
                </label>
                <input
                  type="text"
                  placeholder="Dị ứng, thị lực, năng khiếu..."
                  value={formData.healthNote}
                  onChange={(e) => setFormData({ ...formData, healthNote: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 btn-tactile shadow-md"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Class */}
      {transferTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Chuyển lớp học sinh
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Bạn đang chuyển học sinh <strong className="text-slate-800">{transferTargetStudent.fullName}</strong> từ lớp <strong className="text-sky-600">{transferTargetStudent.className}</strong> sang lớp mới:
            </p>

            <select
              value={transferNewClassId}
              onChange={(e) => setTransferNewClassId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none mb-5"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} (Khối {c.grade} • GVCN {c.homeroomTeacherName})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTransferTargetStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 btn-tactile shadow-md"
              >
                Xác nhận chuyển lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Student */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="Xóa học sinh khỏi danh sách"
        message="Bạn có chắc chắn muốn xóa học sinh này khỏi hệ thống? Dữ liệu điểm số và chuyên cần liên quan sẽ không thể phục hồi."
        onConfirm={() => {
          if (deleteTargetId) {
            deleteStudent(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
