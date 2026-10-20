import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserPosition, UserRole } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  Settings,
  ShieldCheck,
  Building,
  School,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle2,
  Lock,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  UserCheck,
  Users,
  Check,
  Save,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

export const SettingsSystemModule: React.FC = () => {
  const {
    currentUser,
    systemUsers,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
    toggleUserStatus,
    resetUserPassword,
    classes,
    subjects,
    auditLogs,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetAllData,
    showToast,
    schoolName,
    schoolAddress,
    schoolPhone,
    updateSchoolInfo,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'accounts_management' | 'permissions' | 'audit_logs' | 'backup_restore'>('profile');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // School name edit state
  const [editingSchoolName, setEditingSchoolName] = useState(schoolName);
  const [schoolAddressState, setSchoolAddressState] = useState(schoolAddress);
  const [schoolPhoneState, setSchoolPhoneState] = useState(schoolPhone);
  const [academicYearText, setAcademicYearText] = useState('Năm học 2025 - 2026');

  useEffect(() => {
    setEditingSchoolName(schoolName);
    setSchoolAddressState(schoolAddress);
    setSchoolPhoneState(schoolPhone);
  }, [schoolName, schoolAddress, schoolPhone]);

  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchoolName.trim()) {
      showToast('Vui lòng không để trống tên trường / đơn vị công tác!', 'error');
      return;
    }
    updateSchoolInfo(editingSchoolName.trim(), schoolAddressState, schoolPhoneState);
  };

  // User Account Creation Modal
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPasswordInit, setNewPasswordInit] = useState('123456');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPosition, setNewPosition] = useState<UserPosition>('Giáo viên');
  const [newGrade, setNewGrade] = useState<number>(3);
  const [newClassName, setNewClassName] = useState('Lớp 3A1');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Tiếng Anh']);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('123456');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPosition, setEditPosition] = useState<UserPosition>('Giáo viên');
  const [editGrade, setEditGrade] = useState<number>(3);
  const [editClassName, setEditClassName] = useState('');
  const [editSelectedSubjects, setEditSelectedSubjects] = useState<string[]>([]);

  // Reset Password Modal
  const [resetPassTargetUser, setResetPassTargetUser] = useState<User | null>(null);
  const [targetNewPassword, setTargetNewPassword] = useState('123456');

  // Delete User Confirm
  const [deleteTargetUserId, setDeleteTargetUserId] = useState<string | null>(null);

  // Password change simulation for current user
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isAdmin =
    currentUser.role === 'admin' ||
    currentUser.position === 'Quản trị viên' ||
    currentUser.position === 'Quản trị viên hệ thống' ||
    currentUser.position === 'Hiệu trưởng' ||
    currentUser.role === 'principal' ||
    currentUser.username === 'admin';

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Mật khẩu phải có tối thiểu 6 ký tự!', 'error');
      return;
    }
    updateUserAccount(currentUser.id, { password: newPassword.trim() });
    showToast('Đã đổi mật khẩu cá nhân thành công!', 'success');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Map Position to System Role
  const mapPositionToRole = (position: UserPosition): UserRole => {
    switch (position) {
      case 'Hiệu trưởng':
      case 'Hiệu phó':
        return 'principal';
      case 'Giáo viên bộ môn':
        return 'subject_teacher';
      case 'Giáo viên':
        return 'homeroom_teacher';
      case 'Quản trị viên':
        return 'admin';
      case 'Phụ huynh':
        return 'parent_student';
      default:
        return 'homeroom_teacher';
    }
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPasswordInit.trim() || !newName.trim()) {
      showToast('Vui lòng điền đầy đủ tên đăng nhập, mật khẩu và họ tên!', 'error');
      return;
    }

    const exists = systemUsers.some(
      (u) => u.username.toLowerCase() === newUsername.trim().toLowerCase()
    );
    if (exists) {
      showToast('Tên đăng nhập đã tồn tại trong hệ thống! Vui lòng chọn tên khác.', 'error');
      return;
    }

    const assignedRole = mapPositionToRole(newPosition);

    createUserAccount({
      username: newUsername.trim(),
      password: newPasswordInit.trim(),
      name: newName.trim(),
      email: newEmail.trim() || `${newUsername.trim()}@lequydon.edu.vn`,
      phone: newPhone.trim() || '0900000000',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: assignedRole,
      position: newPosition,
      school: schoolName,
      grade: newPosition === 'Giáo viên' || newPosition === 'Phụ huynh' ? newGrade : undefined,
      homeroomClassName: newPosition === 'Giáo viên' || newPosition === 'Phụ huynh' ? newClassName : undefined,
      homeroomClassId: newPosition === 'Giáo viên' ? `class-${newClassName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : undefined,
      subjects: newPosition === 'Giáo viên bộ môn' ? selectedSubjects : undefined,
      isActive: true,
    });

    setIsCreateAccountOpen(false);
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewPasswordInit('123456');
    setNewPosition('Giáo viên');
    setSelectedSubjects(['Tiếng Anh']);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword(user.password || '123456');
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditPosition((user.position as UserPosition) || (user.role === 'subject_teacher' ? 'Giáo viên bộ môn' : user.role === 'principal' ? 'Hiệu trưởng' : 'Giáo viên'));
    setEditGrade(user.grade || 3);
    setEditClassName(user.homeroomClassName || 'Lớp 3A1');
    setEditSelectedSubjects(user.subjects || ['Tiếng Anh']);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim() || !editUsername.trim()) {
      showToast('Tên đăng nhập và họ tên không được để trống!', 'error');
      return;
    }

    const updatedRole = mapPositionToRole(editPosition);
    const cleanClassName = editClassName ? editClassName.replace(/^Lớp\s*/i, '').trim() : '';
    const computedClassId = cleanClassName ? `class-${cleanClassName.toLowerCase()}` : undefined;

    updateUserAccount(editingUser.id, {
      username: editUsername.trim(),
      password: editPassword.trim() || '123456',
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      position: editPosition,
      role: updatedRole,
      grade: editPosition === 'Giáo viên' || editPosition === 'Phụ huynh' ? editGrade : undefined,
      homeroomClassName: editPosition === 'Giáo viên' || editPosition === 'Phụ huynh' ? (cleanClassName ? `Lớp ${cleanClassName}` : editClassName) : undefined,
      homeroomClassId: editPosition === 'Giáo viên' ? computedClassId : undefined,
      subjects: editPosition === 'Giáo viên bộ môn' ? editSelectedSubjects : undefined,
    });

    showToast(`Đã lưu và đồng bộ tài khoản @${editUsername.trim()} thành công!`, 'success');
    setEditingUser(null);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassTargetUser || !targetNewPassword.trim()) return;
    resetUserPassword(resetPassTargetUser.id, targetNewPassword.trim());
    setResetPassTargetUser(null);
  };

  // Export JSON file
  const handleExportBackup = () => {
    const dataStr = exportDatabaseJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_trogiang_tieuhoc_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống tệp sao lưu dữ liệu toàn hệ thống!', 'success');
  };

  // Import JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        importDatabaseJSON(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const availableSubjectsList = [
    'Tiếng Anh',
    'Tin học',
    'Mỹ thuật',
    'Âm nhạc',
    'Giáo dục thể chất',
    'Khoa học',
    'Lịch sử và Địa lý',
    'Công nghệ',
    'Đạo đức',
    'Toán',
    'Tiếng Việt'
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              Tài khoản & Quản trị Hệ thống
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đổi tên đơn vị công tác (Trường học), phân quyền chức vụ (Hiệu trưởng, Hiệu phó, Giáo viên bộ môn, Giáo viên), cấp tài khoản & mật khẩu bảo mật.
          </p>
        </div>

        {/* Tab navigation pills */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            Đơn vị công tác & Cá nhân
          </button>
          <button
            onClick={() => setActiveTab('accounts_management')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'accounts_management' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>Cấp tài khoản & Chức vụ ({systemUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'permissions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            Ma trận phân quyền
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit_logs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            Nhật ký ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('backup_restore')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'backup_restore' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            Sao lưu dữ liệu
          </button>
        </div>
      </div>

      {/* Tab 1: Profile & School Name Customization */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* School Name & Unit Settings Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Thông tin Đơn vị Công tác (Trường học)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tên trường được cập nhật và hiển thị mặc định ở màn hình đăng nhập, thanh điều hướng và báo cáo
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Hiệu lực toàn hệ thống
              </span>
            </div>

            <form onSubmit={handleSaveSchoolInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên trường / Đơn vị công tác (Hiển thị trên màn hình đăng nhập và tiêu đề) *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editingSchoolName}
                    onChange={(e) => setEditingSchoolName(e.target.value)}
                    placeholder="Ví dụ: Trường Tiểu học Vân Nham..."
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sau khi lưu, tên này lập tức trở thành tên mặc định hiển thị ở trang đăng nhập của tất cả giáo viên và phụ huynh.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa chỉ cơ sở trường
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={schoolAddressState}
                      onChange={(e) => setSchoolAddressState(e.target.value)}
                      placeholder="Địa chỉ trường học..."
                      className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-700 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại liên hệ nhà trường
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={schoolPhoneState}
                      onChange={(e) => setSchoolPhoneState(e.target.value)}
                      placeholder="Số điện thoại..."
                      className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-700 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Niên khóa & Năm học
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={academicYearText}
                    onChange={(e) => setAcademicYearText(e.target.value)}
                    placeholder="Ví dụ: Năm học 2025 - 2026"
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-700 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/20 btn-tactile flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi Tên đơn vị công tác</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current User Profile Card (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-slate-800 pb-3 border-b border-slate-100">
              Tài khoản Đang Đăng Nhập
            </h3>

            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-3xl object-cover ring-4 ring-sky-100 shadow-md"
              />
              <div>
                <h4 className="text-base font-extrabold text-slate-800">{currentUser.name}</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tên đăng nhập: <strong className="font-mono text-sky-700">@{currentUser.username}</strong>
                </p>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    Chức vụ: {currentUser.position}
                    {currentUser.position === 'Giáo viên bộ môn' && currentUser.subjects && ` (${currentUser.subjects.join(', ')})`}
                    {currentUser.position === 'Giáo viên' && currentUser.homeroomClassName && ` (${currentUser.homeroomClassName})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-400">Đơn vị công tác:</span>
                <span className="font-bold text-slate-800 text-right">{schoolName}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-400">Email:</span>
                <span className="font-bold text-slate-800">{currentUser.email}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-bold text-slate-800">{currentUser.phone}</span>
              </div>
            </div>

            {/* Change password section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Đổi mật khẩu tài khoản
                </h4>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <input
                  type="password"
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                />
                <input
                  type="password"
                  placeholder="Xác nhận lại mật khẩu mới..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all btn-tactile"
                >
                  Cập nhật mật khẩu cá nhân
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Account Provisioning & Position Management (Admin Only Feature as requested!) */}
      {activeTab === 'accounts_management' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Quản lý Cấp Tài khoản Mới, Chức vụ & Mật khẩu
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chức vụ bao gồm: <strong>Hiệu trưởng, Hiệu phó, Giáo viên bộ môn (kèm Môn gì), Giáo viên (kèm Khối nào, Lớp nào)</strong>.
              </p>
            </div>

            {isAdmin ? (
              <button
                onClick={() => setIsCreateAccountOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all btn-tactile"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cấp tài khoản & Chức vụ mới</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                Chỉ Quản trị viên mới có quyền cấp và chỉnh sửa tài khoản
              </span>
            )}
          </div>

          {/* User accounts list table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3.5 px-3">Tên đăng nhập</th>
                  <th className="py-3.5 px-3">Họ và tên</th>
                  <th className="py-3.5 px-3">Chức vụ & Nhiệm vụ phân công</th>
                  <th className="py-3.5 px-3">Đơn vị công tác</th>
                  <th className="py-3.5 px-3">Liên hệ</th>
                  <th className="py-3.5 px-3 text-center">Trạng thái</th>
                  <th className="py-3.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {systemUsers.map((user) => {
                  const pos = user.position || (
                    user.role === 'admin' ? 'Quản trị viên' :
                    user.role === 'principal' ? 'Hiệu trưởng' :
                    user.role === 'homeroom_teacher' ? 'Giáo viên' :
                    user.role === 'subject_teacher' ? 'Giáo viên bộ môn' : 'Phụ huynh'
                  );

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-sky-700">
                        @{user.username}
                        {user.username === 'admin' && (
                          <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">
                            Gốc
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-7 h-7 rounded-xl object-cover"
                          />
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        {pos === 'Hiệu trưởng' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Building className="w-3 h-3 text-amber-600" />
                            Hiệu trưởng
                          </span>
                        )}
                        {pos === 'Hiệu phó' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Building className="w-3 h-3 text-amber-600" />
                            Hiệu phó
                          </span>
                        )}
                        {pos === 'Giáo viên bộ môn' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <BookOpen className="w-3 h-3 text-emerald-600" />
                              Giáo viên bộ môn
                            </span>
                            <div className="text-[11px] text-slate-500 font-semibold pl-1">
                              Môn: <strong className="text-emerald-700">{user.subjects?.join(', ') || 'Chưa chọn'}</strong>
                            </div>
                          </div>
                        )}
                        {pos === 'Giáo viên' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              <UserCheck className="w-3 h-3 text-sky-600" />
                              Giáo viên
                            </span>
                            <div className="text-[11px] text-slate-500 font-semibold pl-1">
                              Khối: <strong className="text-sky-700">{user.grade || '3'}</strong> • Lớp: <strong className="text-sky-700">{user.homeroomClassName || '3A1'}</strong>
                            </div>
                          </div>
                        )}
                        {pos === 'Quản trị viên' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <ShieldCheck className="w-3 h-3 text-rose-600" />
                            Quản trị viên hệ thống
                          </span>
                        )}
                        {pos === 'Phụ huynh' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <Users className="w-3 h-3 text-indigo-600" />
                              Phụ huynh
                            </span>
                            <div className="text-[11px] text-slate-500 font-semibold pl-1">
                              Học sinh: {user.homeroomClassName || 'Lớp 3A1'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        {schoolName}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        <p className="font-semibold text-slate-700">{user.phone}</p>
                        <p className="text-slate-400">{user.email}</p>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                              title="Chỉnh sửa thông tin & Chức vụ tài khoản"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => {
                                setResetPassTargetUser(user);
                                setTargetNewPassword('123456');
                              }}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Đặt lại mật khẩu cho tài khoản này"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {user.username !== 'admin' && (
                              <>
                                <button
                                  onClick={() => toggleUserStatus(user.id)}
                                  className={`p-1.5 rounded-xl transition-colors ${
                                    user.isActive
                                      ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={user.isActive ? 'Tạm khóa tài khoản' : 'Kích hoạt lại tài khoản'}
                                >
                                  <Lock className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setDeleteTargetUserId(user.id)}
                                  className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Thu hồi tài khoản này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Ma trận Phân quyền theo Chức vụ
              </h3>
              <p className="text-xs text-slate-400">
                Tuân thủ quy định bảo vệ dữ liệu giáo dục và kiểm soát phân quyền chặt chẽ theo chức năng
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-3">Phân hệ / Chức năng</th>
                  <th className="py-3 px-3 text-center">Quản trị viên</th>
                  <th className="py-3 px-3 text-center">Hiệu trưởng / Hiệu phó</th>
                  <th className="py-3 px-3 text-center">Giáo viên</th>
                  <th className="py-3 px-3 text-center">Giáo viên bộ môn</th>
                  <th className="py-3 px-3 text-center">Phụ huynh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Đổi tên đơn vị công tác, Cấp tài khoản mới & Đặt lại mật khẩu', admin: true, bgh: false, gv: false, gvbm: false, ph: false },
                  { feature: 'Phê duyệt Kế hoạch giảng dạy & Xem báo cáo toàn trường', admin: true, bgh: true, gv: false, gvbm: false, ph: false },
                  { feature: 'Quản lý Hồ sơ học sinh lớp & Điểm danh chuyên cần', admin: true, bgh: true, gv: true, gvbm: false, ph: false },
                  { feature: 'Soạn Kế hoạch bài dạy (KHBD), Bài giảng & Trò chơi', admin: true, bgh: true, gv: true, gvbm: true, ph: false },
                  { feature: 'Nhập điểm, viết nhận xét TT 27 & Gửi sổ Zalo', admin: true, bgh: true, gv: true, gvbm: true, ph: false },
                  { feature: 'Xem kết quả học tập & chuyên cần của con mình', admin: true, bgh: true, gv: true, gvbm: false, ph: true },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 font-bold text-slate-800">{row.feature}</td>
                    <td className="py-3.5 px-3 text-center">{row.admin ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                    <td className="py-3.5 px-3 text-center">{row.bgh ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                    <td className="py-3.5 px-3 text-center">{row.gv ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                    <td className="py-3.5 px-3 text-center">{row.gvbm ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                    <td className="py-3.5 px-3 text-center">{row.ph ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Nhật ký Kiểm toán Hoạt động Hệ thống (Audit Logs)
              </h3>
              <p className="text-xs text-slate-400">
                Theo dõi minh bạch mọi thay đổi tài khoản, kế hoạch, điểm danh và đánh giá
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase sticky top-0">
                <tr>
                  <th className="py-3 px-3">Thời gian</th>
                  <th className="py-3 px-3">Người thực hiện</th>
                  <th className="py-3 px-3">Hành động</th>
                  <th className="py-3 px-3">Phân hệ</th>
                  <th className="py-3 px-3">Chi tiết nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {log.userName}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">({log.role})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{log.module}</td>
                    <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Backup & Restore */}
      {activeTab === 'backup_restore' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-800">
              Sao lưu Dữ liệu & Thiết lập Hệ thống
            </h3>
            <p className="text-xs text-slate-400">
              Xuất tệp JSON lưu trữ an toàn hoặc nạp lại tệp dữ liệu đã sao lưu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4 text-sky-600" />
                Sao lưu dữ liệu toàn bộ (Export JSON)
              </h4>
              <p className="text-xs text-slate-500">
                Lưu trữ toàn bộ danh sách lớp, học sinh, bài giảng, tài khoản và lịch sử đánh giá về máy tính.
              </p>
              <button
                onClick={handleExportBackup}
                className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all btn-tactile shadow-md"
              >
                Tải xuống tệp sao lưu (.json)
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Khôi phục từ tệp sao lưu (Import JSON)
              </h4>
              <p className="text-xs text-slate-500">
                Tải tệp JSON dữ liệu đã sao lưu trước đó lên hệ thống để khôi phục.
              </p>
              <label className="inline-block px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all btn-tactile shadow-md cursor-pointer">
                Chọn tệp .json để khôi phục
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
                  Thiết lập lại dữ liệu mẫu ban đầu
                </h4>
                <p className="text-xs text-rose-600 mt-0.5">
                  Làm mới toàn bộ danh sách tài khoản, học sinh và bài dạy về trạng thái chuẩn khởi tạo.
                </p>
              </div>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all btn-tactile flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại dữ liệu gốc</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create User Account with Specific Job Position */}
      {isCreateAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-base font-extrabold text-slate-800">
                Cấp Tài khoản Mới & Phân công Chức vụ
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Các tài khoản khác muốn vào hệ thống phải được Quản trị viên phân quyền cấp tài khoản mới và mật khẩu.
              </p>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="vd: gv_lan, bgh_nam..."
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mật khẩu khởi tạo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPasswordInit}
                    onChange={(e) => setNewPasswordInit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-rose-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên người dùng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thầy Trần Quốc Toản"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@lequydon.edu.vn"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Position Selection (Hiệu trưởng, Hiệu phó, Giáo viên bộ môn, Giáo viên) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chức vụ phân quyền *
                </label>
                <select
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value as UserPosition)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl outline-none font-bold text-slate-800"
                >
                  <option value="Hiệu trưởng">Hiệu trưởng</option>
                  <option value="Hiệu phó">Hiệu phó</option>
                  <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                  <option value="Giáo viên">Giáo viên</option>
                  <option value="Quản trị viên">Quản trị viên hệ thống</option>
                  <option value="Phụ huynh">Phụ huynh học sinh</option>
                </select>
              </div>

              {/* Conditional fields: If Giáo viên bộ môn -> Môn gì */}
              {newPosition === 'Giáo viên bộ môn' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <label className="block font-bold text-emerald-900">
                    Môn giảng dạy (Môn gì) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSubjectsList.map((subj) => {
                      const isChecked = selectedSubjects.includes(subj);
                      return (
                        <label
                          key={subj}
                          className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubjects([...selectedSubjects, subj]);
                              } else {
                                setSelectedSubjects(selectedSubjects.filter((s) => s !== subj));
                              }
                            }}
                            className="hidden"
                          />
                          <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                          <span>{subj}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conditional fields: If Giáo viên -> Khối nào, Lớp nào */}
              {newPosition === 'Giáo viên' && (
                <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3">
                  <p className="font-bold text-sky-900">
                    Phân công Giảng dạy / Lớp chủ nhiệm
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Khối nào *
                      </label>
                      <select
                        value={newGrade}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewGrade(val);
                          setNewClassName(`Lớp ${val}A1`);
                        }}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold text-slate-800"
                      >
                        <option value={1}>Khối 1</option>
                        <option value={2}>Khối 2</option>
                        <option value={3}>Khối 3</option>
                        <option value={4}>Khối 4</option>
                        <option value={5}>Khối 5</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Lớp nào *
                      </label>
                      <select
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold text-slate-800"
                      >
                        {classes
                          .filter((c) => c.grade === newGrade)
                          .map((c) => (
                            <option key={c.id} value={`Lớp ${c.name}`}>
                              Lớp {c.name}
                            </option>
                          ))}
                        <option value={`Lớp ${newGrade}A1`}>Lớp {newGrade}A1</option>
                        <option value={`Lớp ${newGrade}A2`}>Lớp {newGrade}A2</option>
                        <option value={`Lớp ${newGrade}A3`}>Lớp {newGrade}A3</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional fields: If Phụ huynh -> Khối, Lớp của học sinh */}
              {newPosition === 'Phụ huynh' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                  <label className="block font-bold text-indigo-900">
                    Lớp của con *
                  </label>
                  <select
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold text-slate-800"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={`Lớp ${c.name}`}>
                        Lớp {c.name} (Khối {c.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 btn-tactile shadow-md"
                >
                  Cấp tài khoản ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing User Account */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-base font-extrabold text-slate-800">
                Chỉnh sửa Thông tin & Chức vụ Tài khoản
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tài khoản: <strong className="font-mono text-slate-700">@{editingUser.username}</strong>
              </p>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-mono font-bold text-sky-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mật khẩu *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên người dùng *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Position Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chức vụ phân quyền *
                </label>
                <select
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value as UserPosition)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl outline-none font-bold text-slate-800"
                >
                  <option value="Hiệu trưởng">Hiệu trưởng</option>
                  <option value="Hiệu phó">Hiệu phó</option>
                  <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                  <option value="Giáo viên">Giáo viên</option>
                  <option value="Quản trị viên">Quản trị viên hệ thống</option>
                  <option value="Phụ huynh">Phụ huynh học sinh</option>
                </select>
              </div>

              {/* Conditional fields: If Giáo viên bộ môn -> Môn gì */}
              {editPosition === 'Giáo viên bộ môn' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <label className="block font-bold text-emerald-900">
                    Môn giảng dạy (Môn gì) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSubjectsList.map((subj) => {
                      const isChecked = editSelectedSubjects.includes(subj);
                      return (
                        <label
                          key={subj}
                          className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditSelectedSubjects([...editSelectedSubjects, subj]);
                              } else {
                                setEditSelectedSubjects(editSelectedSubjects.filter((s) => s !== subj));
                              }
                            }}
                            className="hidden"
                          />
                          <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                          <span>{subj}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conditional fields: If Giáo viên -> Khối nào, Lớp nào */}
              {editPosition === 'Giáo viên' && (
                <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3">
                  <p className="font-bold text-sky-900">
                    Phân công Giảng dạy / Lớp chủ nhiệm
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Khối nào *
                      </label>
                      <select
                        value={editGrade}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditGrade(val);
                          setEditClassName(`Lớp ${val}A1`);
                        }}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold text-slate-800"
                      >
                        <option value={1}>Khối 1</option>
                        <option value={2}>Khối 2</option>
                        <option value={3}>Khối 3</option>
                        <option value={4}>Khối 4</option>
                        <option value={5}>Khối 5</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Lớp nào *
                      </label>
                      <select
                        value={editClassName}
                        onChange={(e) => setEditClassName(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold text-slate-800"
                      >
                        {classes
                          .filter((c) => c.grade === editGrade)
                          .map((c) => (
                            <option key={c.id} value={`Lớp ${c.name}`}>
                              Lớp {c.name}
                            </option>
                          ))}
                        <option value={`Lớp ${editGrade}A1`}>Lớp {editGrade}A1</option>
                        <option value={`Lớp ${editGrade}A2`}>Lớp {editGrade}A2</option>
                        <option value={`Lớp ${editGrade}A3`}>Lớp {editGrade}A3</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 btn-tactile shadow-md"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password by Admin */}
      {resetPassTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Đặt lại mật khẩu người dùng
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tài khoản: <strong className="text-slate-700">{resetPassTargetUser.name}</strong> (@{resetPassTargetUser.username})
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu mới *
                </label>
                <input
                  type="text"
                  required
                  value={targetNewPassword}
                  onChange={(e) => setTargetNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassTargetUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 btn-tactile shadow-md"
                >
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete User */}
      <ConfirmationModal
        isOpen={deleteTargetUserId !== null}
        title="Thu hồi tài khoản người dùng"
        message="Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống? Người dùng này sẽ không thể đăng nhập vào ứng dụng nữa."
        onConfirm={() => {
          if (deleteTargetUserId) {
            deleteUserAccount(deleteTargetUserId);
            setDeleteTargetUserId(null);
          }
        }}
        onCancel={() => setDeleteTargetUserId(null)}
      />

      {/* Reset System Confirmation */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Xác nhận thiết lập lại dữ liệu"
        message="Hệ thống sẽ tải lại toàn bộ danh sách tài khoản, học sinh, bài giảng, kế hoạch mẫu ban đầu. Các thay đổi tạm thời sẽ được làm mới."
        confirmLabel="Đồng ý đặt lại"
        onConfirm={() => {
          resetAllData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
