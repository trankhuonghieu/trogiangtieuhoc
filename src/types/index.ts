export type UserRole = 
  | 'admin'             // Quản trị viên hệ thống
  | 'principal'         // Ban giám hiệu nhà trường
  | 'homeroom_teacher'  // Giáo viên chủ nhiệm
  | 'subject_teacher'   // Giáo viên bộ môn
  | 'parent_student';   // Học sinh & Phụ huynh

export type UserPosition = 
  | 'Hiệu trưởng'
  | 'Hiệu phó'
  | 'Giáo viên bộ môn'
  | 'Giáo viên'
  | 'Quản trị viên'
  | 'Phụ huynh';

export interface User {
  id: string;
  username: string; // e.g. "admin", "gvcn_huong"
  password?: string; // e.g. "123456"
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  position: UserPosition | string; // Chức vụ: "Hiệu trưởng", "Hiệu phó", "Giáo viên bộ môn", "Giáo viên", "Quản trị viên", "Phụ huynh"
  school: string;
  phone: string;
  grade?: number; // Khối nào: 1, 2, 3, 4, 5 (nếu là Giáo viên)
  homeroomClassId?: string;
  homeroomClassName?: string; // Lớp nào: 1A1, 2A2, 3A1, 4A3, 5A2 (nếu là Giáo viên)
  subjects?: string[]; // Môn gì: Toán, Tiếng Việt, Tiếng Anh, Tin học... (nếu là Giáo viên bộ môn)
  linkedStudentId?: string; // Học sinh liên kết (nếu là Phụ huynh)
  linkedStudentName?: string;
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2025 - 2026"
  currentTerm: 'hk1' | 'hk2';
  startDate: string;
  endDate: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "1A1", "3A2", "5A1"
  grade: number; // 1 to 5
  academicYear: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  studentCount: number;
  roomNumber: string;
}

export interface Student {
  id: string;
  studentCode: string; // e.g. "HS2025001"
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  classId: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentZalo: string;
  address: string;
  avatar?: string;
  healthNote?: string;
  status: 'active' | 'transferred' | 'suspended';
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'excused' | 'unexcused';
  note?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  grades: number[];
  color: string;
  iconName: string;
  description: string;
}

export interface TeachingPlan {
  id: string;
  title: string;
  type: 'year' | 'semester' | 'month' | 'week';
  grade: number;
  subjectId: string;
  subjectName: string;
  classId?: string;
  className?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed';
  progressPct: number;
  summary: string;
  lessonsCount: number;
  authorName: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 2 to 7 (Thứ 2 to Thứ 7)
  period: number; // 1 to 8 (Tiết 1-4 Sáng, Tiết 5-8 Chiều)
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  room: string;
}

export interface LessonPhase {
  id: string;
  phase: 'warmup' | 'new_knowledge' | 'practice' | 'application' | 'assessment';
  phaseName: string;
  durationMinutes: number;
  teacherActivity: string;
  studentActivity: string;
  materials: string;
}

export type SlideLayout = 
  | 'cover'             // Bìa bài học sinh động
  | 'objectives'        // Mục tiêu 3 cột màu sắc
  | 'game_warmup'       // Trò chơi khởi động tương tác
  | 'discovery'         // Khám phá kiến thức mới
  | 'practice'          // Luyện tập bảng con & bài tập
  | 'application'       // Vận dụng thực tiễn
  | 'award'             // Vinh danh & Dặn dò
  | 'image_focus'       // Hình ảnh minh họa lớn trực quan
  | 'two_columns';      // Phân tích 2 cột đối sánh

export interface SlideItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  layout: SlideLayout;
  content: string[];
  teacherPrompt?: string;
  studentAction?: string;
  imageUrl?: string;
  imageCaption?: string;
  colorScheme?: 'sky' | 'emerald' | 'amber' | 'purple' | 'rose';
  notes?: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  grade: number;
  subjectId: string;
  subjectName: string;
  topic: string;
  durationMinutes: number;
  objectives: {
    knowledge: string[];
    skills: string[];
    qualities: string[];
  };
  equipment: {
    teacher: string[];
    student: string[];
  };
  phases: LessonPhase[];
  slidesOutline: string[];
  slides?: SlideItem[];
  status: 'draft' | 'ready';
  author: string;
  updatedAt: string;
  // 7-Zone AI Smart Lesson Plan Configuration
  className?: string;
  bookSeries?: string;
  periodsCount?: number;
  subTopic?: string;
  classContext?: {
    studentCount: number;
    region: string;
    ratio: { excellent: number; good: number; average: number; weak: number };
    disabledStudentsCount: number;
    hasInclusiveStudents: boolean;
    inclusiveNote?: string;
  };
  integratedContent?: string[];
  uploadedMaterialName?: string;
  processingMode?: 'new' | 'template';
  detailLevel?: 'concise' | 'standard' | 'detailed' | 'very_detailed';
  formatStyle?: 'design' | 'two_column' | 'three_column';
}

export interface InteractiveGame {
  id: string;
  title: string;
  type: 'wheel' | 'quiz' | 'matching' | 'true_false';
  subjectId: string;
  grade: number;
  topic: string;
  durationMinutes: number;
  data: any;
}

export interface Question {
  id: string;
  content: string;
  subjectId: string;
  grade: number;
  level: 'nhan_biet' | 'thong_hieu' | 'van_dung';
  type: 'single_choice' | 'multi_choice' | 'true_false' | 'matching' | 'essay';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
}

export interface Assessment {
  id: string;
  title: string;
  subjectId: string;
  grade: number;
  classId: string;
  term: 'gk1' | 'ck1' | 'gk2' | 'ck2' | 'thuong_xuyen';
  date: string;
  maxScore: number;
  durationMinutes: number;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  classId: string;
  score?: number;
  performanceLevel: 'T' | 'H' | 'C'; // Hoàn thành Tốt, Hoàn thành, Chưa hoàn thành theo TT 27
  qualitiesLevel: {
    careful: 'T' | 'Đ' | 'CĐ'; // Chăm chỉ
    responsible: 'T' | 'Đ' | 'CĐ'; // Trách nhiệm
    honest: 'T' | 'Đ' | 'CĐ'; // Trung thực
    kind: 'T' | 'Đ' | 'CĐ'; // Nhân ái
  };
  teacherComment: string;
  teacherConfirmed: boolean;
  zaloSent: boolean;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  fileName?: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  type: 'document' | 'slide' | 'image' | 'video' | 'worksheet';
  subjectId: string;
  grade: number;
  topic: string;
  fileSize: string;
  uploaderName: string;
  sourceName?: string; // Tên nguồn tài liệu: e.g. "Bộ Giáo dục & Đào tạo", "Cổng học liệu số Quốc gia", "NXB Giáo dục"
  uploadDate: string;
  downloadsCount: number;
  url: string;
  description: string;
  fileName?: string;
  fileData?: string; // Base64 data or text content for real download
}

export interface MediaEvidence {
  id: string;
  title: string;
  type: 'image' | 'video';
  topic: string; // 'Hoạt động học tập' | 'Trải nghiệm sáng tạo & STEM' | 'Văn nghệ & Thể thao' | 'Tham quan dã ngoại' | 'Hồ sơ minh chứng chuyên môn'
  classId: string;
  className: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaList?: MediaItem[]; // Hỗ trợ mỗi minh chứng có nhiều hình ảnh, video
  date: string;
  uploaderName: string;
  uploaderRole: string;
  description: string;
  tags?: string[];
  viewsCount?: number;
}

export interface ExamAttemptRecord {
  id: string;
  examCode: string; // Mã đề khác nhau mỗi lần thi: e.g. "MĐ-301", "MĐ-408"
  title: string;
  mode: 'practice' | 'official';
  subjectId: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  submittedAt: string;
  durationMinutes: number;
  timeSpentSeconds: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  userAnswers: Record<number, string>;
  questions: Question[]; // Lưu toàn bộ đề thi để giáo viên và học sinh xem lại
}

export interface ParentNotification {
  id: string;
  title: string;
  targetType: 'all' | 'class' | 'student';
  targetClassId?: string;
  targetClassName?: string;
  targetStudentId?: string;
  targetStudentName?: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
  readCount: number;
  totalRecipients: number;
  isUrgent: boolean;
  category: 'hoc_tap' | 'hoat_dong' | 'hoc_phi' | 'suc_khoe' | 'khac';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ip: string;
}
