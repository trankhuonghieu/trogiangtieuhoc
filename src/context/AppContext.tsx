import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  UserRole,
  ClassRoom,
  Student,
  AttendanceRecord,
  Subject,
  TeachingPlan,
  TimetableSlot,
  LessonPlan,
  InteractiveGame,
  Question,
  Assessment,
  AssessmentResult,
  LearningMaterial,
  ParentNotification,
  AuditLog,
  MediaEvidence,
  ExamAttemptRecord
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_TEACHING_PLANS,
  INITIAL_TIMETABLE,
  INITIAL_LESSON_PLANS,
  INITIAL_INTERACTIVE_GAMES,
  INITIAL_QUESTIONS,
  INITIAL_ASSESSMENTS,
  INITIAL_ASSESSMENT_RESULTS,
  INITIAL_LEARNING_MATERIALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_MEDIA_EVIDENCE,
  INITIAL_EXAM_HISTORY
} from '../data/mockData';

export type ActiveTab = 
  | 'dashboard'
  | 'classes_students'
  | 'teaching_plans'
  | 'lesson_design'
  | 'interactive_activities'
  | 'assessment'
  | 'ai_assistant'
  | 'parent_communication'
  | 'reports'
  | 'learning_materials'
  | 'media_evidence'
  | 'settings';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  // Authentication & Current User
  isAuthenticated: boolean;
  currentUser: User;
  systemUsers: User[];
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  createUserAccount: (user: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateUserAccount: (id: string, updates: Partial<User>) => void;
  deleteUserAccount: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  resetUserPassword: (id: string, newPass: string) => void;

  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  updateSchoolInfo: (name: string, address: string, phone: string) => void;
  updateSchoolName: (name: string) => void;

  // Data Collections
  classes: ClassRoom[];
  subjects: Subject[];
  students: Student[];
  attendance: AttendanceRecord[];
  teachingPlans: TeachingPlan[];
  timetable: TimetableSlot[];
  lessonPlans: LessonPlan[];
  interactiveGames: InteractiveGame[];
  questions: Question[];
  assessments: Assessment[];
  assessmentResults: AssessmentResult[];
  learningMaterials: LearningMaterial[];
  mediaEvidence: MediaEvidence[];
  examHistory: ExamAttemptRecord[];
  isPracticeExamEnabled: boolean;
  setIsPracticeExamEnabled: (enabled: boolean) => void;
  isOfficialExamEnabled: boolean;
  setIsOfficialExamEnabled: (enabled: boolean) => void;
  notifications: ParentNotification[];
  auditLogs: AuditLog[];

  // CRUD Actions
  updateClass: (id: string, updates: Partial<ClassRoom>) => void;
  addStudent: (student: Omit<Student, 'id'> & { id?: string }) => string;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  importStudentsCSV: (parsedStudents: Omit<Student, 'id'>[]) => void;
  
  saveAttendance: (records: AttendanceRecord[]) => void;

  addTeachingPlan: (plan: Omit<TeachingPlan, 'id' | 'updatedAt'>) => void;
  updateTeachingPlan: (id: string, updates: Partial<TeachingPlan>) => void;
  deleteTeachingPlan: (id: string) => void;

  saveTimetableSlot: (classId: string, dayOfWeek: number, period: number, slotData: { subjectId: string; subjectName: string; teacherName: string; room: string; className: string }) => void;
  deleteTimetableSlot: (id: string) => void;

  addLessonPlan: (lesson: Omit<LessonPlan, 'id' | 'updatedAt'>) => void;
  updateLessonPlan: (id: string, updates: Partial<LessonPlan>) => void;
  deleteLessonPlan: (id: string) => void;
  duplicateLessonPlan: (id: string) => void;

  addInteractiveGame: (game: Omit<InteractiveGame, 'id'>) => void;
  updateInteractiveGame: (id: string, updates: Partial<InteractiveGame>) => void;
  deleteInteractiveGame: (id: string) => void;

  addQuestion: (question: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;

  addExamAttempt: (attempt: Omit<ExamAttemptRecord, 'id' | 'submittedAt'>) => void;

  addMediaEvidence: (item: Omit<MediaEvidence, 'id' | 'viewsCount'>) => void;
  updateMediaEvidence: (id: string, updates: Partial<MediaEvidence>) => void;
  deleteMediaEvidence: (id: string) => void;

  updateAssessmentResult: (id: string, updates: Partial<AssessmentResult>) => void;
  confirmAssessmentResult: (id: string) => void;
  sendZaloNotification: (studentId: string, customNote?: string) => void;

  addNotification: (notif: Omit<ParentNotification, 'id' | 'createdAt' | 'readCount'>) => void;
  deleteNotification: (id: string) => void;

  addLearningMaterial: (material: Omit<LearningMaterial, 'id' | 'uploadDate' | 'downloadsCount'>) => void;
  deleteLearningMaterial: (id: string) => void;

  // System & Logs
  logAction: (action: string, module: string, details: string) => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonData: string) => boolean;
  resetAllData: () => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'trogiang_tieuhoc_state_v3';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load saved state or use defaults
  const loadInitialState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
    return null;
  };

  const initial = loadInitialState();

  // Authentication: Default to true for smooth immediate preview, can logout to view login screen
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    initial?.isAuthenticated ?? true
  );
  const [systemUsers, setSystemUsers] = useState<User[]>(
    initial?.systemUsers || INITIAL_USERS
  );
  const [currentUser, setCurrentUser] = useState<User>(
    initial?.currentUser || INITIAL_USERS[0] // Default: Quản trị viên
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(initial?.darkMode || false);
  const [schoolName, setSchoolName] = useState<string>(
    initial?.schoolName || 'Trường Tiểu học Vân Nham'
  );
  const [schoolAddress, setSchoolAddress] = useState<string>(
    initial?.schoolAddress || 'Thôn Đập, Xã Vân Nham, Tỉnh Lạng Sơn'
  );
  const [schoolPhone, setSchoolPhone] = useState<string>(
    initial?.schoolPhone || '(025) 3828 809'
  );

  const updateSchoolInfo = (name: string, address: string, phone: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSchoolName(trimmed);
    setSchoolAddress(address.trim());
    setSchoolPhone(phone.trim());
    setCurrentUser((prev) => ({ ...prev, school: trimmed }));
    setSystemUsers((prev) => prev.map((u) => ({ ...u, school: trimmed })));
    logAction('CẬP NHẬT THÔNG TIN TRƯỜNG', 'Hệ thống & Cài đặt', `Đã cập nhật đơn vị: ${trimmed}, Đ/C: ${address}, SĐT: ${phone}`);
    showToast(`Đã lưu thành công thông tin đơn vị công tác, địa chỉ và số điện thoại!`, 'success');
  };

  const updateSchoolName = (newName: string) => {
    updateSchoolInfo(newName, schoolAddress, schoolPhone);
  };

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const raw: ClassRoom[] = initial?.classes || INITIAL_CLASSES;
    return raw.map((c) => {
      if (c.id === 'class-1a1' && (c.homeroomTeacherName === 'Cô Bùi Thị Hoa' || !c.homeroomTeacherName)) {
        return {
          ...c,
          homeroomTeacherName: 'Cô Lưu Thị Hiền',
          homeroomTeacherId: 'user-teacher-hien',
        };
      }
      return c;
    });
  });
  const [subjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [students, setStudents] = useState<Student[]>(initial?.students || INITIAL_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initial?.attendance || INITIAL_ATTENDANCE);
  const [teachingPlans, setTeachingPlans] = useState<TeachingPlan[]>(initial?.teachingPlans || INITIAL_TEACHING_PLANS);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(initial?.timetable || INITIAL_TIMETABLE);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(initial?.lessonPlans || INITIAL_LESSON_PLANS);
  const [interactiveGames, setInteractiveGames] = useState<InteractiveGame[]>(initial?.interactiveGames || INITIAL_INTERACTIVE_GAMES);
  const [questions, setQuestions] = useState<Question[]>(initial?.questions || INITIAL_QUESTIONS);
  const [assessments] = useState<Assessment[]>(initial?.assessments || INITIAL_ASSESSMENTS);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>(initial?.assessmentResults || INITIAL_ASSESSMENT_RESULTS);
  const [learningMaterials, setLearningMaterials] = useState<LearningMaterial[]>(initial?.learningMaterials || INITIAL_LEARNING_MATERIALS);
  const [notifications, setNotifications] = useState<ParentNotification[]>(initial?.notifications || INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initial?.auditLogs || INITIAL_AUDIT_LOGS);
  const [mediaEvidence, setMediaEvidence] = useState<MediaEvidence[]>(() => {
    if (Array.isArray(initial?.mediaEvidence) && initial.mediaEvidence.length > 0) {
      return initial.mediaEvidence;
    }
    return INITIAL_MEDIA_EVIDENCE;
  });
  const [examHistory, setExamHistory] = useState<ExamAttemptRecord[]>(() => {
    if (Array.isArray(initial?.examHistory) && initial.examHistory.length > 0) {
      return initial.examHistory;
    }
    return INITIAL_EXAM_HISTORY;
  });
  const [isPracticeExamEnabled, setIsPracticeExamEnabled] = useState<boolean>(initial?.isPracticeExamEnabled ?? true);
  const [isOfficialExamEnabled, setIsOfficialExamEnabled] = useState<boolean>(initial?.isOfficialExamEnabled ?? true);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      const stateToSave = {
        isAuthenticated,
        systemUsers,
        currentUser,
        darkMode,
        schoolName,
        schoolAddress,
        schoolPhone,
        classes,
        students,
        attendance,
        teachingPlans,
        timetable,
        lessonPlans,
        interactiveGames,
        questions,
        assessments,
        assessmentResults,
        learningMaterials,
        notifications,
        auditLogs,
        mediaEvidence,
        examHistory,
        isPracticeExamEnabled,
        isOfficialExamEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save to LocalStorage:', e);
    }
  }, [
    isAuthenticated,
    systemUsers,
    currentUser,
    darkMode,
    schoolName,
    schoolAddress,
    schoolPhone,
    classes,
    students,
    attendance,
    teachingPlans,
    timetable,
    lessonPlans,
    interactiveGames,
    questions,
    assessments,
    assessmentResults,
    learningMaterials,
    notifications,
    auditLogs,
    mediaEvidence,
    examHistory,
    isPracticeExamEnabled,
    isOfficialExamEnabled,
  ]);

  const logAction = (action: string, module: string, details: string) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Khách vãng lai',
      role: currentUser?.role === 'admin' ? 'Quản trị viên' :
            currentUser?.role === 'principal' ? 'Ban giám hiệu' :
            currentUser?.role === 'homeroom_teacher' ? 'GV Chủ nhiệm' :
            currentUser?.role === 'subject_teacher' ? 'GV Bộ môn' : 'Phụ huynh',
      action,
      module,
      details,
      timestamp: formattedDate,
      ip: '192.168.1.105',
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  // Login handler
  const login = (usernameInput: string, passwordInput: string): { success: boolean; message: string } => {
    const trimmedUser = usernameInput.trim().toLowerCase();
    const targetUser = systemUsers.find(
      (u) => u.username.toLowerCase() === trimmedUser || u.email.toLowerCase() === trimmedUser
    );

    if (!targetUser) {
      return {
        success: false,
        message: 'Tài khoản không tồn tại trên hệ thống. Để vào hệ thống, người dùng phải được Quản trị viên phân quyền cấp tài khoản mới và mật khẩu!',
      };
    }

    if (!targetUser.isActive) {
      return {
        success: false,
        message: 'Tài khoản này chưa được kích hoạt hoặc đã bị Quản trị viên tạm khóa. Vui lòng liên hệ Quản trị viên để được mở quyền truy cập!',
      };
    }

    const correctPassword = targetUser.password || '123456';
    if (passwordInput !== correctPassword) {
      return {
        success: false,
        message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.',
      };
    }

    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    logAction('ĐĂNG NHẬP HỆ THỐNG', 'Xác thực & Bảo mật', `Đăng nhập thành công với tài khoản: ${targetUser.username} (${targetUser.name})`);
    showToast(`Đăng nhập thành công! Chào mừng ${targetUser.name}`, 'success');
    return {
      success: true,
      message: 'Đăng nhập thành công',
    };
  };

  const logout = () => {
    logAction('ĐĂNG XUẤT', 'Xác thực & Bảo mật', `Người dùng ${currentUser.name} đã đăng xuất khỏi hệ thống`);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    showToast('Đã đăng xuất khỏi hệ thống an toàn', 'info');
  };

  // Switch role while in app
  const switchRole = (role: UserRole) => {
    const targetUser = systemUsers.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      logAction('CHUYỂN ĐỔI VAI TRÒ', 'Tài khoản & Phân quyền', `Đã chuyển sang vai trò: ${targetUser.role} (${targetUser.name})`);
      showToast(`Đã chuyển sang vai trò: ${targetUser.name}`, 'info');
    }
  };

  // Admin Account Provisioning CRUD
  const createUserAccount = (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => {
    const newId = 'user-' + Date.now();
    const newUser: User = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: currentUser.name,
      isActive: true,
    };
    setSystemUsers((prev) => [...prev, newUser]);
    logAction(
      'CẤP TÀI KHOẢN MỚI',
      'Quản lý Người dùng & Phân quyền',
      `Quản trị viên đã cấp tài khoản mới: ${newUser.username} cho ${newUser.name} (${newUser.role})`
    );
    showToast(`Đã cấp tài khoản ${newUser.username} cho ${newUser.name} thành công!`, 'success');
  };

  // Ensure currentUser always stays synchronized with systemUsers whenever admin updates user info
  useEffect(() => {
    if (currentUser?.id) {
      const match = systemUsers.find(
        (u) => u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase()
      );
      if (match) {
        if (
          match.name !== currentUser.name ||
          match.email !== currentUser.email ||
          match.phone !== currentUser.phone ||
          match.position !== currentUser.position ||
          match.role !== currentUser.role ||
          match.grade !== currentUser.grade ||
          match.homeroomClassName !== currentUser.homeroomClassName ||
          match.homeroomClassId !== currentUser.homeroomClassId ||
          match.password !== currentUser.password ||
          match.isActive !== currentUser.isActive ||
          match.avatar !== currentUser.avatar ||
          match.school !== currentUser.school ||
          JSON.stringify(match.subjects || []) !== JSON.stringify(currentUser.subjects || [])
        ) {
          setCurrentUser(match);
        }
      }
    }
  }, [systemUsers, currentUser]);

  const updateUserAccount = (id: string, updates: Partial<User>) => {
    // Standardize class name format if provided
    let cleanClassName = updates.homeroomClassName
      ? updates.homeroomClassName.replace(/^Lớp\s*/i, '').trim()
      : undefined;

    let computedClassId = updates.homeroomClassId;
    if (!computedClassId && cleanClassName) {
      computedClassId = `class-${cleanClassName.toLowerCase()}`;
    }

    const fullClassName = cleanClassName ? `Lớp ${cleanClassName}` : updates.homeroomClassName;

    const finalUpdates: Partial<User> = {
      ...updates,
      ...(fullClassName ? { homeroomClassName: fullClassName } : {}),
      ...(computedClassId ? { homeroomClassId: computedClassId } : {}),
    };

    const isNowHomeroomTeacher = (finalUpdates.role === 'homeroom_teacher') || (finalUpdates.position === 'Giáo viên') || !!finalUpdates.homeroomClassId;

    setSystemUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...finalUpdates } : u))
    );

    // Sync currentUser immediately if the target user is currently active
    if (currentUser.id === id || (updates.username && currentUser.username.toLowerCase() === updates.username.toLowerCase())) {
      setCurrentUser((prev) => ({ ...prev, ...finalUpdates }));
    }

    // Sync classes array homeroom teacher assignment & teacher name
    if (finalUpdates.name || finalUpdates.homeroomClassId || finalUpdates.homeroomClassName || !isNowHomeroomTeacher) {
      setClasses((prev) =>
        prev.map((cls) => {
          const isTargetClass =
            (finalUpdates.homeroomClassId && cls.id === finalUpdates.homeroomClassId) ||
            (cleanClassName && cls.name.toLowerCase() === cleanClassName.toLowerCase());

          if (isTargetClass) {
            return {
              ...cls,
              homeroomTeacherId: id,
              homeroomTeacherName: finalUpdates.name || cls.homeroomTeacherName,
            };
          }

          // Unassign from old class if teacher moved to another class OR is no longer a homeroom teacher
          if (cls.homeroomTeacherId === id && (!isNowHomeroomTeacher || (finalUpdates.homeroomClassId && cls.id !== finalUpdates.homeroomClassId))) {
            return {
              ...cls,
              homeroomTeacherId: '',
              homeroomTeacherName: 'Chưa phân công',
            };
          }

          return cls;
        })
      );
    }

    logAction('CẬP NHẬT TÀI KHOẢN', 'Quản trị Người dùng', `Quản trị viên đã cập nhật và đồng bộ lớp học cho tài khoản ID: ${id}`);
    showToast('Cập nhật và đồng bộ tên lớp/tài khoản thành công!', 'success');
  };

  const deleteUserAccount = (id: string) => {
    if (id === 'user-admin') {
      showToast('Không thể xóa tài khoản Quản trị viên hệ thống gốc!', 'error');
      return;
    }
    const target = systemUsers.find((u) => u.id === id);
    setSystemUsers((prev) => prev.filter((u) => u.id !== id));
    logAction('XÓA TÀI KHOẢN', 'Quản trị Người dùng', `Xóa tài khoản người dùng: ${target?.username}`);
    showToast(`Đã thu hồi tài khoản ${target?.username}`, 'warning');
  };

  const toggleUserStatus = (id: string) => {
    if (id === 'user-admin') {
      showToast('Không thể khóa tài khoản Quản trị viên gốc!', 'error');
      return;
    }
    setSystemUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = !u.isActive;
          logAction(
            nextStatus ? 'KÍCH HOẠT TÀI KHOẢN' : 'TẠM KHÓA TÀI KHOẢN',
            'Quản trị Người dùng',
            `Quản trị viên đã thay đổi trạng thái tài khoản ${u.username} thành ${nextStatus ? 'Đang hoạt động' : 'Đã khóa'}`
          );
          showToast(`Đã ${nextStatus ? 'kích hoạt' : 'khóa'} tài khoản ${u.username}`, nextStatus ? 'success' : 'warning');
          return { ...u, isActive: nextStatus };
        }
        return u;
      })
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, isActive: !prev.isActive }));
    }
  };

  const resetUserPassword = (id: string, newPass: string) => {
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, password: newPass } : u))
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, password: newPass }));
    }
    logAction('ĐẶT LẠI MẬT KHẨU', 'Quản trị Người dùng', `Quản trị viên đặt lại mật khẩu cho tài khoản ID: ${id}`);
    showToast('Đã đặt lại mật khẩu và đồng bộ tài khoản thành công!', 'success');
  };

  // Class Actions
  const updateClass = (id: string, updates: Partial<ClassRoom>) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id === id) {
          const updatedCls = { ...cls, ...updates };

          // Sync systemUsers and currentUser homeroomClassName/grade if class name or grade changed
          if (updates.name || updates.grade) {
            const cleanName = updatedCls.name.replace(/^Lớp\s*/i, '').trim();
            const formattedClassName = `Lớp ${cleanName}`;

            setSystemUsers((prevUsers) =>
              prevUsers.map((u) => {
                if (u.homeroomClassId === id || (cls.name && u.homeroomClassName && u.homeroomClassName.includes(cls.name))) {
                  return {
                    ...u,
                    homeroomClassName: formattedClassName,
                    grade: updatedCls.grade,
                  };
                }
                return u;
              })
            );

            if (currentUser.homeroomClassId === id || (cls.name && currentUser.homeroomClassName?.includes(cls.name))) {
              setCurrentUser((prevUser) => ({
                ...prevUser,
                homeroomClassName: formattedClassName,
                grade: updatedCls.grade,
              }));
            }

            // Sync students className
            setStudents((prevStudents) =>
              prevStudents.map((s) => {
                if (s.classId === id || (cls.name && s.className && s.className.includes(cls.name))) {
                  return {
                    ...s,
                    className: cleanName,
                  };
                }
                return s;
              })
            );
          }

          return updatedCls;
        }
        return cls;
      })
    );
    logAction('CẬP NHẬT LỚP HỌC', 'Quản lý Lớp & Học sinh', `Cập nhật thông tin lớp học ID: ${id}`);
    showToast('Cập nhật và đồng bộ thông tin lớp học thành công!', 'success');
  };

  // Student CRUD
  const addStudent = (studentData: Omit<Student, 'id'> & { id?: string }): string => {
    const newId = studentData.id || ('stu-' + Date.now());
    const newStudent: Student = { ...studentData, id: newId };
    setStudents((prev) => [newStudent, ...prev]);
    logAction('THÊM HỌC SINH', 'Quản lý Học sinh', `Đã thêm học sinh ${studentData.fullName} (${studentData.studentCode}) vào lớp ${studentData.className}`);
    showToast(`Thêm học sinh ${studentData.fullName} thành công!`);
    return newId;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    logAction('CẬP NHẬT HỌC SINH', 'Quản lý Học sinh', `Đã cập nhật thông tin học sinh ID: ${id}`);
    showToast('Cập nhật hồ sơ học sinh thành công!');
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    logAction('XÓA HỌC SINH', 'Quản lý Học sinh', `Đã xóa học sinh ${target?.fullName || id}`);
    showToast(`Đã xóa học sinh khỏi danh sách`, 'warning');
  };

  const importStudentsCSV = (parsedStudents: Omit<Student, 'id'>[]) => {
    const created: Student[] = parsedStudents.map((s, idx) => ({
      ...s,
      id: `stu-${Date.now()}-${idx}`,
    }));
    setStudents((prev) => [...created, ...prev]);
    logAction('NHẬP DỮ LIỆU EXCEL/CSV', 'Quản lý Học sinh', `Đã nhập thành công ${created.length} học sinh mới vào hệ thống`);
    showToast(`Đã nhập thành công ${created.length} học sinh!`);
  };

  // Attendance
  const saveAttendance = (records: AttendanceRecord[]) => {
    setAttendance((prev) => {
      const dates = new Set(records.map((r) => `${r.date}_${r.studentId}`));
      const filtered = prev.filter((p) => !dates.has(`${p.date}_${p.studentId}`));
      return [...records, ...filtered];
    });
    logAction('LƯU ĐIỂM DANH', 'Chuyên cần', `Đã lưu điểm danh cho ${records.length} học sinh`);
    showToast('Đã lưu dữ liệu điểm danh thành công!');
  };

  // Teaching Plans
  const addTeachingPlan = (planData: Omit<TeachingPlan, 'id' | 'updatedAt'>) => {
    const newPlan: TeachingPlan = {
      ...planData,
      id: 'tp-' + Date.now(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setTeachingPlans((prev) => [newPlan, ...prev]);
    logAction('THÊM KẾ HOẠCH', 'Kế hoạch Giảng dạy', `Tạo kế hoạch "${planData.title}"`);
    showToast('Tạo kế hoạch giảng dạy thành công!');
  };

  const updateTeachingPlan = (id: string, updates: Partial<TeachingPlan>) => {
    setTeachingPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    logAction('CẬP NHẬT KẾ HOẠCH', 'Kế hoạch Giảng dạy', `Chỉnh sửa kế hoạch ID: ${id}`);
    showToast('Cập nhật kế hoạch giảng dạy thành công!');
  };

  const deleteTeachingPlan = (id: string) => {
    setTeachingPlans((prev) => prev.filter((p) => p.id !== id));
    logAction('XÓA KẾ HOẠCH', 'Kế hoạch Giảng dạy', `Xóa kế hoạch giảng dạy ID: ${id}`);
    showToast('Đã xóa kế hoạch giảng dạy', 'warning');
  };

  // Timetable
  const saveTimetableSlot = (
    classId: string,
    dayOfWeek: number,
    period: number,
    slotData: { subjectId: string; subjectName: string; teacherName: string; room: string; className: string }
  ) => {
    setTimetable((prev) => {
      const existingIndex = prev.findIndex((t) => t.classId === classId && t.dayOfWeek === dayOfWeek && t.period === period);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          ...slotData,
        };
        return next;
      } else {
        const newSlot: TimetableSlot = {
          id: `tt-${classId}-${dayOfWeek}-${period}-${Date.now()}`,
          classId,
          dayOfWeek,
          period,
          ...slotData,
        };
        return [...prev, newSlot];
      }
    });
    logAction('CẬP NHẬT THỜI KHÓA BIỂU', 'Thời khóa biểu', `Cập nhật tiết ${period} Thứ ${dayOfWeek} lớp ${slotData.className}: ${slotData.subjectName}`);
    showToast(`Đã lưu tiết ${period} Thứ ${dayOfWeek} (${slotData.subjectName})!`, 'success');
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetable((prev) => prev.filter((t) => t.id !== id));
    logAction('XÓA TIẾT THỜI KHÓA BIỂU', 'Thời khóa biểu', `Đã xóa tiết học ID: ${id}`);
    showToast('Đã xóa tiết học khỏi thời khóa biểu', 'info');
  };

  // Lesson Plans
  const addLessonPlan = (lessonData: Omit<LessonPlan, 'id' | 'updatedAt'>) => {
    const newLesson: LessonPlan = {
      ...lessonData,
      id: 'lp-' + Date.now(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setLessonPlans((prev) => [newLesson, ...prev]);
    logAction('SOẠN BÀI DẠY MỚI', 'Thiết kế Bài giảng', `Đã tạo giáo án "${lessonData.title}"`);
    showToast('Đã lưu Kế hoạch bài dạy (Giáo án) vào thư viện!');
  };

  const updateLessonPlan = (id: string, updates: Partial<LessonPlan>) => {
    setLessonPlans((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : l
      )
    );
    logAction('CHỈNH SỬA BÀI DẠY', 'Thiết kế Bài giảng', `Cập nhật bài dạy ID: ${id}`);
    showToast('Cập nhật bài dạy thành công!');
  };

  const deleteLessonPlan = (id: string) => {
    setLessonPlans((prev) => prev.filter((l) => l.id !== id));
    logAction('XÓA BÀI DẠY', 'Thiết kế Bài giảng', `Xóa bài dạy ID: ${id}`);
    showToast('Đã xóa bài dạy khỏi kho lưu trữ', 'warning');
  };

  const duplicateLessonPlan = (id: string) => {
    const target = lessonPlans.find((l) => l.id === id);
    if (!target) return;
    const duplicated: LessonPlan = {
      ...target,
      id: 'lp-' + Date.now(),
      title: `${target.title} (Bản sao)`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setLessonPlans((prev) => [duplicated, ...prev]);
    logAction('SAO CHÉP BÀI DẠY', 'Thiết kế Bài giảng', `Nhân bản bài dạy "${target.title}"`);
    showToast('Đã nhân bản bài dạy thành công!');
  };

  // Games
  const addInteractiveGame = (gameData: Omit<InteractiveGame, 'id'>) => {
    const newGame: InteractiveGame = {
      ...gameData,
      id: 'game-' + Date.now(),
    };
    setInteractiveGames((prev) => [newGame, ...prev]);
    logAction('TẠO HOẠT ĐỘNG HỌC TẬP', 'Hoạt động & Trò chơi', `Tạo trò chơi "${gameData.title}"`);
    showToast('Tạo trò chơi học tập thành công!');
  };

  const updateInteractiveGame = (id: string, updates: Partial<InteractiveGame>) => {
    setInteractiveGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
    logAction('CẬP NHẬT TRÒ CHƠI', 'Hoạt động & Trò chơi', `Chỉnh sửa trò chơi ID: ${id}`);
    showToast('Cập nhật trò chơi thành công!');
  };

  const deleteInteractiveGame = (id: string) => {
    setInteractiveGames((prev) => prev.filter((g) => g.id !== id));
    logAction('XÓA TRÒ CHƠI', 'Hoạt động & Trò chơi', `Xóa trò chơi ID: ${id}`);
    showToast('Đã xóa hoạt động học tập', 'info');
  };

  // Questions
  const addQuestion = (qData: Omit<Question, 'id'>) => {
    const newQ: Question = {
      ...qData,
      id: 'ques-' + Date.now(),
    };
    setQuestions((prev) => [newQ, ...prev]);
    logAction('THÊM CÂU HỎI', 'Ngân hàng Câu hỏi', `Thêm câu hỏi mới mức độ: ${qData.level}`);
    showToast('Đã thêm câu hỏi vào ngân hàng đề!');
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
    showToast('Cập nhật câu hỏi thành công!');
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    logAction('XÓA CÂU HỎI', 'Ngân hàng Câu hỏi', `Xóa câu hỏi ID: ${id}`);
    showToast('Đã xóa câu hỏi khỏi ngân hàng', 'warning');
  };

  // Assessments & Results
  const updateAssessmentResult = (id: string, updates: Partial<AssessmentResult>) => {
    setAssessmentResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    showToast('Đã cập nhật nhận xét và đánh giá!');
  };

  const confirmAssessmentResult = (id: string) => {
    setAssessmentResults((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, teacherConfirmed: true } : r
      )
    );
    logAction('XÁC NHẬN ĐÁNH GIÁ TT27', 'Kiểm tra Đánh giá', `Giáo viên xác nhận nhận xét học sinh ID: ${id}`);
    showToast('Giáo viên đã xác nhận kết quả đánh giá theo Thông tư 27!');
  };

  const sendZaloNotification = (studentId: string, customNote?: string) => {
    const result = assessmentResults.find((r) => r.studentId === studentId);
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setAssessmentResults((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, zaloSent: true } : r))
    );

    const message = `[THÔNG BÁO TỪ GVCN CÔ HƯƠNG - LỚP 3A1]
Kính gửi PH em ${student.fullName},
Điểm số đánh giá: ${result?.score !== undefined ? `${result.score}/10` : 'Đạt'}
Mức hoàn thành: ${result?.performanceLevel === 'T' ? 'Hoàn thành tốt (T)' : result?.performanceLevel === 'H' ? 'Hoàn thành (H)' : 'Cần cố gắng (C)'}
Nhận xét của cô giáo: "${result?.teacherComment || 'Em học tập tích cực, chăm ngoan.'}"
${customNote ? `Lưu ý thêm: ${customNote}` : ''}
Trân trọng cảm ơn quý phụ huynh đồng hành!`;

    try {
      navigator.clipboard.writeText(message);
    } catch {
      // ignore
    }

    logAction('CHIA SẺ KẾT QUẢ QUA ZALO', 'Giao tiếp Phụ huynh', `Đã chuẩn bị nội dung gửi Zalo cho PH em ${student.fullName} (${student.parentPhone})`);
    showToast(`Đã sao chép nội dung gửi Zalo cho PH em ${student.fullName}!`, 'success');
  };

  // Notifications
  const addNotification = (notifData: Omit<ParentNotification, 'id' | 'createdAt' | 'readCount'>) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNotif: ParentNotification = {
      ...notifData,
      id: 'notif-' + Date.now(),
      createdAt: formatted,
      readCount: 1,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    logAction('GỬI THÔNG BÁO PHỤ HUYNH', 'Giao tiếp Phụ huynh', `Đã gửi thông báo: "${notifData.title}"`);
    showToast('Đã gửi thông báo đến phụ huynh học sinh!');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast('Đã xóa thông báo', 'info');
  };

  // Learning Materials
  const addLearningMaterial = (matData: Omit<LearningMaterial, 'id' | 'uploadDate' | 'downloadsCount'>) => {
    const newMat: LearningMaterial = {
      ...matData,
      id: 'mat-' + Date.now(),
      uploadDate: new Date().toISOString().split('T')[0],
      downloadsCount: 0,
    };
    setLearningMaterials((prev) => [newMat, ...prev]);
    logAction('TẢI LÊN HỌC LIỆU', 'Quản lý Học liệu', `Thêm tài liệu "${matData.title}"`);
    showToast('Đã thêm học liệu vào kho tài nguyên số!');
  };

  const deleteLearningMaterial = (id: string) => {
    setLearningMaterials((prev) => prev.filter((m) => m.id !== id));
    showToast('Đã xóa tài liệu', 'warning');
  };

  // Exam Attempt CRUD
  const addExamAttempt = (attemptData: Omit<ExamAttemptRecord, 'id' | 'submittedAt'>) => {
    const newAttempt: ExamAttemptRecord = {
      ...attemptData,
      id: 'attempt-' + Date.now(),
      submittedAt: new Date().toLocaleString('vi-VN'),
    };
    setExamHistory((prev) => [newAttempt, ...prev]);
    logAction(
      'NỘP BÀI THI TRỰC TUYẾN',
      'Đánh giá & Khảo sát',
      `Học sinh ${attemptData.studentName} đã nộp bài thi ${attemptData.examCode} (${attemptData.score}/10 điểm)`
    );
  };

  // Media Evidence CRUD
  const addMediaEvidence = (itemData: Omit<MediaEvidence, 'id' | 'viewsCount'>) => {
    const newItem: MediaEvidence = {
      ...itemData,
      id: 'media-' + Date.now(),
      viewsCount: 1,
    };
    setMediaEvidence((prev) => [newItem, ...prev]);
    logAction('THÊM MINH CHỨNG', 'Hình ảnh & Minh chứng', `Thêm mới tư liệu: ${itemData.title}`);
  };

  const updateMediaEvidence = (id: string, updates: Partial<MediaEvidence>) => {
    setMediaEvidence((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    logAction('CẬP NHẬT MINH CHỨNG', 'Hình ảnh & Minh chứng', `Cập nhật thông tin tư liệu ID: ${id}`);
  };

  const deleteMediaEvidence = (id: string) => {
    setMediaEvidence((prev) => prev.filter((item) => item.id !== id));
    logAction('XÓA MINH CHỨNG', 'Hình ảnh & Minh chứng', `Đã xóa tư liệu ID: ${id}`);
  };

  // Database Backup & Restore
  const exportDatabaseJSON = () => {
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      systemUsers,
      classes,
      students,
      attendance,
      teachingPlans,
      timetable,
      lessonPlans,
      interactiveGames,
      questions,
      assessments,
      assessmentResults,
      learningMaterials,
      notifications,
      auditLogs,
      mediaEvidence,
      examHistory,
      isPracticeExamEnabled,
      isOfficialExamEnabled,
    };
    return JSON.stringify(backupData, null, 2);
  };

  const importDatabaseJSON = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.classes && data.students) {
        if (data.systemUsers) setSystemUsers(data.systemUsers);
        if (data.classes) setClasses(data.classes);
        if (data.students) setStudents(data.students);
        if (data.attendance) setAttendance(data.attendance);
        if (data.teachingPlans) setTeachingPlans(data.teachingPlans);
        if (data.timetable) setTimetable(data.timetable);
        if (data.lessonPlans) setLessonPlans(data.lessonPlans);
        if (data.interactiveGames) setInteractiveGames(data.interactiveGames);
        if (data.questions) setQuestions(data.questions);
        if (data.assessmentResults) setAssessmentResults(data.assessmentResults);
        if (data.learningMaterials) setLearningMaterials(data.learningMaterials);
        if (data.notifications) setNotifications(data.notifications);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.mediaEvidence) setMediaEvidence(data.mediaEvidence);
        if (data.examHistory) setExamHistory(data.examHistory);
        if (data.isPracticeExamEnabled !== undefined) setIsPracticeExamEnabled(data.isPracticeExamEnabled);
        if (data.isOfficialExamEnabled !== undefined) setIsOfficialExamEnabled(data.isOfficialExamEnabled);
        
        logAction('KHÔI PHỤC DỮ LIỆU', 'Hệ thống & Cài đặt', 'Đã khôi phục cơ sở dữ liệu từ tệp JSON sao lưu');
        showToast('Khôi phục cơ sở dữ liệu thành công!', 'success');
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    showToast('Tệp sao lưu không hợp lệ!', 'error');
    return false;
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    showToast('Đang thiết lập lại dữ liệu mẫu ban đầu...', 'info');
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        systemUsers,
        login,
        logout,
        switchRole,
        createUserAccount,
        updateUserAccount,
        deleteUserAccount,
        toggleUserStatus,
        resetUserPassword,
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        schoolName,
        schoolAddress,
        schoolPhone,
        updateSchoolInfo,
        updateSchoolName,
        classes,
        subjects,
        students,
        attendance,
        teachingPlans,
        timetable,
        lessonPlans,
        interactiveGames,
        questions,
        assessments,
        assessmentResults,
        learningMaterials,
        mediaEvidence,
        examHistory,
        isPracticeExamEnabled,
        setIsPracticeExamEnabled,
        isOfficialExamEnabled,
        setIsOfficialExamEnabled,
        notifications,
        auditLogs,
        updateClass,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudentsCSV,
        saveAttendance,
        addTeachingPlan,
        updateTeachingPlan,
        deleteTeachingPlan,
        saveTimetableSlot,
        deleteTimetableSlot,
        addLessonPlan,
        updateLessonPlan,
        deleteLessonPlan,
        duplicateLessonPlan,
        addInteractiveGame,
        updateInteractiveGame,
        deleteInteractiveGame,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        addExamAttempt,
        addMediaEvidence,
        updateMediaEvidence,
        deleteMediaEvidence,
        updateAssessmentResult,
        confirmAssessmentResult,
        sendZaloNotification,
        addNotification,
        deleteNotification,
        addLearningMaterial,
        deleteLearningMaterial,
        logAction,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetAllData,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
