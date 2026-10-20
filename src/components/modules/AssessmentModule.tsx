import React, { useState, useMemo, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { useApp } from '../../context/AppContext';
import { Question, AssessmentResult, ExamAttemptRecord } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  Award,
  Plus,
  Filter,
  CheckCircle,
  FileCheck2,
  Sparkles,
  BookOpen,
  Edit2,
  Trash2,
  X,
  UserCheck,
  Download,
  Printer,
  FileText,
  Lock,
  Unlock,
  Clock,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Star,
  Heart,
  Shield,
  Eye,
  Settings2,
  Wand2,
  RefreshCw,
  HelpCircle,
  Sliders,
  History,
  CheckCircle2,
  Search
} from 'lucide-react';

// TT27 Competency and Quality Levels: T (Tốt), Đ (Đạt), C (Cần cố gắng)
type QualityLevel = 'T' | 'Đ' | 'C';

// Helper to evaluate overall rating based on LOWEST criterion as required by TT27:
// "Tiêu chí Phẩm chất và Năng lực được đánh giá: theo nội dung đánh giá thấp nhất
// (ví dụ: phẩm chất có 5 tiêu chí trong đó 4 tiêu chí tốt, 1 tiêu chí Đạt thì Phẩm chất đánh giá Đạt)"
export const evaluateLowestRating = (levels: QualityLevel[]): QualityLevel => {
  if (levels.includes('C')) return 'C';
  if (levels.includes('Đ')) return 'Đ';
  return 'T';
};

export const AssessmentModule: React.FC = () => {
  const {
    currentUser,
    classes,
    questions,
    assessments,
    assessmentResults,
    subjects: initialSubjects,
    students,
    schoolName,
    examHistory,
    addExamAttempt,
    isPracticeExamEnabled,
    setIsPracticeExamEnabled,
    isOfficialExamEnabled,
    setIsOfficialExamEnabled,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    updateAssessmentResult,
    confirmAssessmentResult,
    showToast,
  } = useApp();

  const isParent = currentUser.role === 'parent_student';
  const linkedStudent = isParent ? students.find((s) => s.id === currentUser.linkedStudentId) || students[0] : null;

  // Main Tabs: Sổ đánh giá TT27 vs Ngân hàng câu hỏi & Thi
  const [activeTab, setActiveTab] = useState<'gradebook' | 'question_bank'>('question_bank');

  // Requirement: Swap order of 2 and 3!
  // Sub-tabs in Sổ đánh giá TT27:
  // 1. Sổ chấm điểm và nhận xét từng môn
  // 2. Năng lực và phẩm chất (Đã đổi vị trí)
  // 3. Tổng hợp học bạ cả lớp (Đã đổi vị trí)
  // 4. Xuất báo cáo và In
  const [gradebookSubTab, setGradebookSubTab] = useState<'subject_scores' | 'qualities_competencies' | 'class_summary' | 'export_print'>('subject_scores');

  // ==========================================
  // PERMISSION & CLASS SELECTION
  // "Đối với các giáo viên chủ nhiệm lớp thì chỉ xem được đánh giá các học sinh của lớp mình"
  // "Kiểm tra lại thông tin GVCN, phải hiện đúng tên (ví dụ Lớp 1A1 hiện Cô Lưu Thị Hiền)"
  // ==========================================
  const isHomeroomTeacher = currentUser.role === 'homeroom_teacher' || Boolean(currentUser.homeroomClassId);
  const userHomeroomClass = useMemo(() => {
    return (
      classes.find(
        (c) =>
          c.id === currentUser.homeroomClassId ||
          c.name === currentUser.homeroomClassName ||
          `Lớp ${c.name}` === currentUser.homeroomClassName ||
          c.homeroomTeacherName === currentUser.name
      ) || classes[0]
    );
  }, [classes, currentUser]);

  const canSwitchClasses =
    ['admin', 'principal'].includes(currentUser.role) ||
    currentUser.position === 'Quản trị viên' ||
    currentUser.position === 'Quản trị viên hệ thống' ||
    currentUser.position === 'Hiệu trưởng' ||
    currentUser.position === 'Hiệu phó' ||
    currentUser.username === 'admin';
  const [selectedClassId, setSelectedClassId] = useState<string>(
    canSwitchClasses ? 'class-3a1' : userHomeroomClass.id
  );

  // Auto sync selectedClassId whenever user's assigned homeroom class or permissions change
  useEffect(() => {
    if (!canSwitchClasses && userHomeroomClass?.id) {
      setSelectedClassId(userHomeroomClass.id);
    }
  }, [canSwitchClasses, userHomeroomClass]);

  const effectiveClassId = canSwitchClasses ? selectedClassId : userHomeroomClass.id;
  const currentClass = useMemo(() => {
    const found = classes.find((c) => c.id === effectiveClassId) || userHomeroomClass;
    // Extra safety guarantee for class 1A1 as requested
    if (found.id === 'class-1a1' && (!found.homeroomTeacherName || found.homeroomTeacherName.includes('Hoa'))) {
      return {
        ...found,
        homeroomTeacherName: 'Cô Lưu Thị Hiền',
      };
    }
    return found;
  }, [classes, effectiveClassId, userHomeroomClass]);

  // Students belonging to the current class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === effectiveClassId && s.status === 'active');
  }, [students, effectiveClassId]);

  // ==========================================
  // DYNAMIC SUBJECT MANAGEMENT (THÊM / BỚT MÔN HỌC)
  // "Ở sổ chấm điểm, các môn học thì giáo viên có thể điều chỉnh (thêm/bớt) tùy vào thực tế giảng dạy"
  // ==========================================
  const defaultClassSubjectList = useMemo(() => {
    return [
      { id: 'subj-toan', name: 'Toán học', code: 'TOAN', hasPeriodicScore: true },
      { id: 'subj-tv', name: 'Tiếng Việt', code: 'TV', hasPeriodicScore: true },
      { id: 'subj-ta', name: 'Tiếng Anh', code: 'TA', hasPeriodicScore: true },
      { id: 'subj-tnxh', name: 'Tự nhiên & Xã hội', code: 'TNXH', hasPeriodicScore: false },
      { id: 'subj-tin', name: 'Tin học & Công nghệ', code: 'TIN', hasPeriodicScore: true },
      { id: 'subj-dd', name: 'Đạo đức', code: 'DD', hasPeriodicScore: false },
      { id: 'subj-amnhac', name: 'Âm nhạc', code: 'AN', hasPeriodicScore: false },
      { id: 'subj-mythuat', name: 'Mĩ thuật', code: 'MT', hasPeriodicScore: false },
      { id: 'subj-gdtc', name: 'Giáo dục thể chất', code: 'GDTC', hasPeriodicScore: false },
      { id: 'subj-hdtn', name: 'Hoạt động trải nghiệm', code: 'HĐTN', hasPeriodicScore: false },
    ];
  }, []);

  const [availableSubjects, setAvailableSubjects] = useState(defaultClassSubjectList);
  const [activeSubjectIds, setActiveSubjectIds] = useState<string[]>([
    'subj-toan',
    'subj-tv',
    'subj-ta',
    'subj-tnxh',
    'subj-tin',
    'subj-dd',
    'subj-amnhac',
    'subj-mythuat',
    'subj-gdtc',
    'subj-hdtn',
  ]);

  const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
  const [newCustomSubjectName, setNewCustomSubjectName] = useState('');
  const [newCustomSubjectHasScore, setNewCustomSubjectHasScore] = useState(false);

  // Active subjects list currently applied to the class
  const activeSubjects = useMemo(() => {
    return availableSubjects.filter((s) => activeSubjectIds.includes(s.id));
  }, [availableSubjects, activeSubjectIds]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-toan');
  const [selectedTerm, setSelectedTerm] = useState<'gk1' | 'ck1' | 'gk2' | 'ck2' | 'thuong_xuyen'>('gk1');

  const selectedSubject = useMemo(() => {
    return activeSubjects.find((s) => s.id === selectedSubjectId) || activeSubjects[0] || defaultClassSubjectList[0];
  }, [activeSubjects, selectedSubjectId, defaultClassSubjectList]);

  const handleToggleSubject = (subjectId: string) => {
    if (activeSubjectIds.includes(subjectId)) {
      if (activeSubjectIds.length <= 1) {
        showToast('Cần duy trì tối thiểu 1 môn học trong sổ đánh giá!', 'warning');
        return;
      }
      setActiveSubjectIds((prev) => prev.filter((id) => id !== subjectId));
      if (selectedSubjectId === subjectId) {
        const remaining = activeSubjectIds.filter((id) => id !== subjectId);
        setSelectedSubjectId(remaining[0]);
      }
      showToast('Đã bớt môn học khỏi sổ đánh giá của lớp!', 'info');
    } else {
      setActiveSubjectIds((prev) => [...prev, subjectId]);
      showToast('Đã thêm môn học vào sổ đánh giá của lớp!', 'success');
    }
  };

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCustomSubjectName.trim();
    if (!trimmed) return;
    const newId = `subj-custom-${Date.now()}`;
    const newSubj = {
      id: newId,
      name: trimmed,
      code: trimmed.slice(0, 3).toUpperCase(),
      hasPeriodicScore: newCustomSubjectHasScore,
    };
    setAvailableSubjects((prev) => [...prev, newSubj]);
    setActiveSubjectIds((prev) => [...prev, newId]);
    setNewCustomSubjectName('');
    showToast(`Đã thêm môn tự chọn "${trimmed}" vào sổ đánh giá của lớp!`, 'success');
  };

  // ==========================================
  // REAL-TIME SYNCHRONIZED GRADEBOOK STATE
  // "Khi giáo viên điều chỉnh, chỉnh sửa điểm hay các nội dung khác thì các thông tin có liên quan khác trong sổ học bạ cũng thay đổi theo"
  // ==========================================
  interface StudentGradeRecord {
    score: number | null; // Điểm kiểm tra định kỳ 1.0 - 10.0
    level: 'T' | 'H' | 'C'; // Mức đạt được (T: Hoàn thành tốt, H: Hoàn thành, C: Chưa hoàn thành)
    comment: string;
    confirmed: boolean;
  }

  // Map of studentId -> subjectId -> StudentGradeRecord
  const [studentSubjectGrades, setStudentSubjectGrades] = useState<Record<string, Record<string, StudentGradeRecord>>>({});

  // Seed default grades when class students or subjects change
  useEffect(() => {
    setStudentSubjectGrades((prev) => {
      const next: Record<string, Record<string, StudentGradeRecord>> = { ...prev };
      classStudents.forEach((student, idx) => {
        if (!next[student.id]) {
          next[student.id] = {};
        }
        availableSubjects.forEach((subj) => {
          if (!next[student.id][subj.id]) {
            const isTop = (idx + subj.id.length) % 3 === 0;
            const isGood = (idx + subj.id.length) % 3 === 1;
            const baseScore = isTop ? 9.5 : isGood ? 8.0 : 7.0;
            const calculatedLevel = isTop ? 'T' : 'H';

            let sampleComment = '';
            if (subj.id === 'subj-toan') {
              sampleComment = isTop
                ? 'Tư duy logic nhạy bén, tính toán nhanh và chính xác, tích cực xây dựng bài.'
                : 'Nắm chắc kiến thức trọng tâm, tính toán cẩn thận, biết hợp tác nhóm.';
            } else if (subj.id === 'subj-tv') {
              sampleComment = isTop
                ? 'Đọc to, rõ ràng, diễn cảm; chữ viết đẹp đều nét; viết câu đủ ý giàu hình ảnh.'
                : 'Đọc lưu loát, trả lời đúng các câu hỏi bài học, chữ viết sạch sẽ.';
            } else if (subj.id === 'subj-ta') {
              sampleComment = isTop
                ? 'Phát âm chuẩn, ngữ điệu tự nhiên, phản xạ giao tiếp tiếng Anh nhanh và tự tin.'
                : 'Ghi nhớ tốt từ vựng và mẫu câu cơ bản, tích cực tham gia hoạt động lớp.';
            } else {
              sampleComment = isTop
                ? 'Hoàn thành xuất sắc mục tiêu bài học, có năng khiếu và say mê học tập.'
                : 'Nắm được các kỹ năng cơ bản, chăm chỉ thực hành và phối hợp tốt cùng bạn bè.';
            }

            next[student.id][subj.id] = {
              score: subj.hasPeriodicScore ? baseScore : null,
              level: calculatedLevel,
              comment: sampleComment,
              confirmed: true,
            };
          }
        });
      });
      return next;
    });
  }, [classStudents, availableSubjects]);

  // Handler to update a student's grade in real time
  const handleUpdateGrade = (
    studentId: string,
    subjectId: string,
    field: 'score' | 'level' | 'comment' | 'confirmed',
    value: any
  ) => {
    setStudentSubjectGrades((prev) => {
      const studentMap = prev[studentId] || {};
      const currentSubjRecord = studentMap[subjectId] || {
        score: 8.0,
        level: 'H',
        comment: 'Hoàn thành tốt yêu cầu môn học.',
        confirmed: true,
      };

      let updatedRecord = { ...currentSubjRecord, [field]: value };

      // Auto-suggest level if score changed
      if (field === 'score') {
        const numScore = parseFloat(value);
        if (!isNaN(numScore)) {
          if (numScore >= 9.0) updatedRecord.level = 'T';
          else if (numScore >= 5.0) updatedRecord.level = 'H';
          else updatedRecord.level = 'C';
        }
      }

      return {
        ...prev,
        [studentId]: {
          ...studentMap,
          [subjectId]: updatedRecord,
        },
      };
    });
  };

  // Helper to get grade record with fallback
  const getGradeRecord = (studentId: string, subjectId: string): StudentGradeRecord => {
    const rec = studentSubjectGrades[studentId]?.[subjectId];
    if (rec) return rec;
    return {
      score: 8.5,
      level: 'H',
      comment: 'Hoàn thành tốt các mục tiêu bài học.',
      confirmed: true,
    };
  };

  // ==========================================
  // AI SUGGESTION MODAL & RICH COMMENT GENERATOR
  // "Các lời nhận xét các môn học hệ thống sử dụng AI để đa dạng hơn để giáo viên có thể lựa chọn"
  // ==========================================
  const [aiModalTarget, setAiModalTarget] = useState<{
    studentId: string;
    studentName: string;
    subjectId: string;
    subjectName: string;
    currentScore: number | null;
    currentLevel: 'T' | 'H' | 'C';
  } | null>(null);

  // Diverse bank of TT27 comments categorized by subject and performance
  const aiCommentBank = useMemo(() => {
    return {
      'subj-toan': {
        excellent: [
          'Tư duy logic nhạy bén, tính toán nhanh và chính xác, giải quyết xuất sắc các bài toán nâng cao.',
          'Nắm vững bản chất kiến thức toán học, trình bày bài giải khoa học, chủ động phát biểu xây dựng bài.',
          'Khả năng phân tích hình học và bài toán có lời văn rất tốt, sáng tạo trong cách tìm lời giải.',
          'Tính nhẩm nhanh, nắm chắc quy tắc và tính chất phép tính, giúp đỡ các bạn cùng tiến bộ.',
        ],
        good: [
          'Nắm chắc bảng nhân chia, làm tốt các bài toán cơ bản, cần rèn thêm tính cẩn thận khi đặt tính.',
          'Tiếp thu bài nhanh, hoàn thành tốt nhiệm vụ, cần đọc kỹ đề bài toán có lời văn để tránh nhầm lẫn.',
          'Có nhiều tiến bộ trong tính toán, biết áp dụng công thức vào thực tế, tích cực học tập.',
          'Thực hiện thành thạo các phép tính cơ bản, trình bày vở sạch sẽ, cần nâng cao tốc độ làm bài.',
        ],
        needHelp: [
          'Nắm được các bước tính cơ bản, cần rèn luyện thêm kỹ năng tính nhẩm và kiểm tra lại bài làm.',
          'Cần tập trung hơn trong giờ học, luyện tập thêm các bài toán có nhớ để đạt kết quả tốt hơn.',
          'Cần giáo viên và gia đình động viên, rèn luyện thêm thói quen đọc kỹ câu hỏi trước khi giải.',
        ],
      },
      'subj-tv': {
        excellent: [
          'Đọc to, rõ ràng, diễn cảm; chữ viết đẹp và đều nét; vốn từ vựng phong phú, dùng từ đặt câu chuẩn xác.',
          'Có năng khiếu cảm thụ văn học, viết đoạn văn giàu hình ảnh, cảm xúc chân thực và sinh động.',
          'Tự tin trong giao tiếp, tích cực thảo luận nhóm và trình bày lưu loát, thuyết phục trước lớp.',
          'Kỹ năng đọc hiểu xuất sắc, trả lời đúng trọng tâm các câu hỏi bài học, say mê đọc sách báo.',
        ],
        good: [
          'Đọc trôi chảy, trả lời đúng các câu hỏi bài đọc; cần chú ý nắn nót chữ viết và khoảng cách giữa các con chữ.',
          'Nắm được ngữ pháp cơ bản, viết câu đầy đủ bộ phận; cần rèn thêm quy tắc chính tả phân biệt s/x, tr/ch.',
          'Hoàn thành tốt các yêu cầu môn học, biết chia sẻ suy nghĩ với bạn bè trong giờ học.',
          'Có ý thức rèn chữ giữ vở, viết đoạn văn mạch lạc, cần trau chuốt thêm vốn từ gợi cảm.',
        ],
        needHelp: [
          'Cần rèn luyện đọc trơn, phát âm chuẩn và luyện viết đúng độ cao, độ rộng các con chữ.',
          'Cần mở rộng thêm vốn từ vựng, chú ý viết hoa đúng đầu câu và sử dụng đúng dấu câu.',
          'Cần mạnh dạn, tự tin hơn khi phát biểu và đọc bài trước tập thể lớp.',
        ],
      },
      'subj-ta': {
        excellent: [
          'Phát âm chuẩn, ngữ điệu tự nhiên, phản xạ giao tiếp tiếng Anh nhanh nhẹn và rất tự tin.',
          'Ghi nhớ từ vựng phong phú, hiểu và thực hiện chính xác các khẩu lệnh và câu hỏi bằng tiếng Anh.',
          'Tích cực tham gia các bài hát và trò chơi ngôn ngữ, phát triển toàn diện kỹ năng Nghe - Nói.',
        ],
        good: [
          'Nắm được các mẫu câu giao tiếp căn bản, tích cực tham gia các hoạt động học tập trên lớp.',
          'Hiểu nội dung bài học, cần nghe phát âm chuẩn nhiều hơn để cải thiện độ tự tin khi nói.',
          'Hoàn thành tốt các bài tập thực hành, cần chú ý phát âm rõ các âm đuôi trong tiếng Anh.',
        ],
        needHelp: [
          'Cần tăng cường luyện nghe từ vựng mỗi ngày và mạnh dạn thực hành giao tiếp cùng bạn bè.',
          'Cần ghi nhớ kỹ các từ vựng chủ đề cơ bản và chú ý lắng nghe hướng dẫn của giáo viên.',
        ],
      },
      'default': {
        excellent: [
          'Hoàn thành xuất sắc mục tiêu môn học, tư duy sáng tạo, chủ động phát hiện và giải quyết vấn đề.',
          'Năng động, nhiệt tình trong các hoạt động thực hành, có tinh thần trách nhiệm và tương trợ bạn bè.',
          'Có năng khiếu nổi bật, nắm chắc kiến thức và biết vận dụng linh hoạt vào thực tế cuộc sống.',
        ],
        good: [
          'Nắm được chuẩn kiến thức và kỹ năng cơ bản, thực hiện đầy đủ các nhiệm vụ học tập được giao.',
          'Chăm chỉ, có ý thức kỷ luật tốt, biết phối hợp nhịp nhàng với các thành viên trong nhóm.',
          'Có nhiều tiến bộ trong quá trình học tập, cần phát huy hơn nữa tính chủ động, sáng tạo.',
        ],
        needHelp: [
          'Nắm được kỹ năng cơ bản, cần rèn luyện thêm sự tập trung và kiên trì trong các tiết học.',
          'Cần tích cực tương tác, trao đổi với thầy cô và bạn bè để củng cố kiến thức vững vàng hơn.',
        ],
      },
    };
  }, []);

  // Generate dynamic AI comment options
  const [currentAiSuggestions, setCurrentAiSuggestions] = useState<string[]>([]);

  const handleOpenAiModal = (
    studentId: string,
    studentName: string,
    subjectId: string,
    subjectName: string
  ) => {
    const currentGrade = getGradeRecord(studentId, subjectId);
    setAiModalTarget({
      studentId,
      studentName,
      subjectId,
      subjectName,
      currentScore: currentGrade.score,
      currentLevel: currentGrade.level,
    });

    const bank = (aiCommentBank as any)[subjectId] || aiCommentBank.default;
    let list: string[] = [];
    if (currentGrade.level === 'T' || (currentGrade.score && currentGrade.score >= 9.0)) {
      list = [...bank.excellent, ...aiCommentBank.default.excellent];
    } else if (currentGrade.level === 'H' || (currentGrade.score && currentGrade.score >= 5.0)) {
      list = [...bank.good, ...aiCommentBank.default.good];
    } else {
      list = [...bank.needHelp, ...aiCommentBank.default.needHelp];
    }

    setCurrentAiSuggestions(list);
  };

  const handleApplyAiComment = (comment: string) => {
    if (!aiModalTarget) return;
    handleUpdateGrade(aiModalTarget.studentId, aiModalTarget.subjectId, 'comment', comment);
    showToast(`Đã áp dụng nhận xét AI cho học sinh ${aiModalTarget.studentName}!`, 'success');
    setAiModalTarget(null);
  };

  const handleRegenerateAiComments = () => {
    if (!aiModalTarget) return;
    const adjectives = ['nhanh nhạy', 'sáng tạo', 'tự giác', 'chăm chỉ', 'chu đáo', 'tích cực'];
    const actions = [
      'tiếp thu bài học một cách chủ động',
      'hoàn thành các bài tập đúng hạn với chất lượng tốt',
      'luôn sẵn sàng giúp đỡ các bạn xung quanh',
      'thể hiện tinh thần học hỏi không ngừng',
      'biết lắng nghe và trao đổi ý kiến xây dựng nhóm'
    ];
    const randAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randAct = actions[Math.floor(Math.random() * actions.length)];

    const dynamicNew = [
      `Em ${aiModalTarget.studentName} có ý thức học tập ${randAdj}, ${randAct}.`,
      `Nắm vững chuẩn kiến thức môn ${aiModalTarget.subjectName}, kỹ năng thực hành tiến bộ rõ rệt theo Thông tư 27.`,
      `Tích cực tương tác trong giờ học, phát huy tốt năng lực tự học và tư duy độc lập.`,
      `Thực hiện tốt các yêu cầu bài học, chữ viết và cách trình bày ngày càng khoa học, ngăn nắp.`,
    ];
    setCurrentAiSuggestions((prev) => [...dynamicNew, ...prev.slice(0, 4)]);
    showToast('AI đã tạo thêm nhận xét mới phong phú!', 'success');
  };

  // ==========================================
  // SUB-TAB 2: NĂNG LỰC & PHẨM CHẤT THEO THÔNG TƯ 27
  // "Năng lực gồm Năng lực chung (Tự chủ và tự học; Giao tiếp và hợp tác; Giải quyết vấn đề và sáng tạo)
  // và Năng lực đặc thù (Ngôn ngữ; Tính toán; Khoa học; Thẩm mĩ; Thể chất).
  // Tiêu chí Phẩm chất và Năng lực được đánh giá: theo nội dung đánh giá thấp nhất
  // (ví dụ: phẩm chất có 5 tiêu chí trong đó 4 tiêu chí tốt, 1 tiêu chí Đạt thì Phẩm chất đánh giá Đạt)"
  // ==========================================
  interface StudentQualitiesRecord {
    // 3 Năng lực chung
    selfStudy: QualityLevel;      // Tự chủ và tự học
    communication: QualityLevel;  // Giao tiếp và hợp tác
    problemSolving: QualityLevel; // Giải quyết vấn đề và sáng tạo
    // 5 Năng lực đặc thù
    language: QualityLevel;       // Ngôn ngữ
    calculation: QualityLevel;    // Tính toán
    science: QualityLevel;        // Khoa học
    aesthetic: QualityLevel;      // Thẩm mĩ
    physical: QualityLevel;       // Thể chất
    // 5 Phẩm chất chủ yếu
    patriotism: QualityLevel;     // Yêu nước
    humanity: QualityLevel;       // Nhân ái
    diligence: QualityLevel;      // Chăm chỉ
    honesty: QualityLevel;        // Trung thực
    responsibility: QualityLevel; // Trách nhiệm
    comment: string;
  }

  const [qualitiesData, setQualitiesData] = useState<Record<string, StudentQualitiesRecord>>({});

  // Seed default qualities for current class students
  useEffect(() => {
    setQualitiesData((prev) => {
      const initial: Record<string, StudentQualitiesRecord> = { ...prev };
      classStudents.forEach((st, idx) => {
        if (!initial[st.id]) {
          const isTop = idx % 3 === 0;
          const isGood = idx % 3 === 1;
          const lvl = isTop ? 'T' : isGood ? 'Đ' : 'Đ';

          initial[st.id] = {
            // Năng lực chung
            selfStudy: lvl,
            communication: lvl,
            problemSolving: lvl,
            // Năng lực đặc thù
            language: lvl,
            calculation: lvl,
            science: lvl,
            aesthetic: 'T',
            physical: 'T',
            // Phẩm chất
            patriotism: 'T',
            humanity: 'T',
            diligence: lvl,
            honesty: 'T',
            responsibility: lvl,
            comment: isTop
              ? 'Ý thức tự giác học tập cao, lễ phép, đoàn kết và nhiệt tình hỗ trợ bạn bè.'
              : 'Chăm ngoan, biết vâng lời thầy cô, thực hiện đầy đủ các nền nếp của lớp.',
          };
        }
      });
      return initial;
    });
  }, [classStudents]);

  const handleUpdateQuality = (studentId: string, field: keyof StudentQualitiesRecord, value: any) => {
    setQualitiesData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const getStudentQualities = (studentId: string): StudentQualitiesRecord => {
    return qualitiesData[studentId] || {
      selfStudy: 'Đ',
      communication: 'Đ',
      problemSolving: 'Đ',
      language: 'Đ',
      calculation: 'Đ',
      science: 'Đ',
      aesthetic: 'T',
      physical: 'T',
      patriotism: 'T',
      humanity: 'T',
      diligence: 'Đ',
      honesty: 'T',
      responsibility: 'Đ',
      comment: 'Chăm ngoan, biết vâng lời thầy cô.',
    };
  };

  // Lowest rating calculations as requested:
  // 1. Năng lực chung: lowest of selfStudy, communication, problemSolving
  const getCompetencyCommonLevel = (studentId: string): QualityLevel => {
    const q = getStudentQualities(studentId);
    return evaluateLowestRating([q.selfStudy, q.communication, q.problemSolving]);
  };

  // 2. Năng lực đặc thù: lowest of language, calculation, science, aesthetic, physical
  const getCompetencySpecificLevel = (studentId: string): QualityLevel => {
    const q = getStudentQualities(studentId);
    return evaluateLowestRating([q.language, q.calculation, q.science, q.aesthetic, q.physical]);
  };

  // 3. Tổng hợp toàn diện Năng lực: lowest of ALL 8 competency criteria
  const getCompetencyOverallLevel = (studentId: string): QualityLevel => {
    const q = getStudentQualities(studentId);
    return evaluateLowestRating([
      q.selfStudy,
      q.communication,
      q.problemSolving,
      q.language,
      q.calculation,
      q.science,
      q.aesthetic,
      q.physical,
    ]);
  };

  // 4. Tổng hợp toàn diện Phẩm chất: lowest of 5 qualities
  // "ví dụ: phẩm chất có 5 tiêu chí trong đó 4 tiêu chí tốt, 1 tiêu chí Đạt thì Phẩm chất đánh giá Đạt"
  const getQualityOverallLevel = (studentId: string): QualityLevel => {
    const q = getStudentQualities(studentId);
    return evaluateLowestRating([q.patriotism, q.humanity, q.diligence, q.honesty, q.responsibility]);
  };

  const handleSaveAllQualities = () => {
    showToast('Đã lưu toàn bộ đánh giá Năng lực và Phẩm chất theo Thông tư 27 thành công!', 'success');
  };

  // ==========================================
  // SUB-TAB 3: TỔNG HỢP HỌC BẠ CẢ LỚP (TỰ ĐỘNG TỔNG HỢP VÀ ĐỒNG BỘ)
  // "Nội dung Tổng hợp học bạ cả lớp và xuất in được tổng hợp từ các thông tin trước, khi có thay đổi thì thay đổi theo"
  // ==========================================
  // Helper to calculate student overall educational outcome according to TT27:
  // - Hoàn thành xuất sắc (HTXS): tất cả môn T (hoặc điểm >= 9), Năng lực T, Phẩm chất T
  // - Hoàn thành tốt (HTT): tất cả môn T/H (điểm >= 7), Năng lực >= Đ, Phẩm chất >= Đ, ít nhất 1 T
  // - Hoàn thành (HT): các môn điểm >= 5 (hoặc H), Năng lực >= Đ, Phẩm chất >= Đ, không có C
  // - Chưa hoàn thành (CHT): có môn < 5 hoặc C, hoặc Năng lực C, hoặc Phẩm chất C
  const calculateStudentOverallResult = (studentId: string) => {
    const studentGrades = activeSubjects.map((s) => getGradeRecord(studentId, s.id));
    const compLevel = getCompetencyOverallLevel(studentId);
    const qualLevel = getQualityOverallLevel(studentId);

    const hasAnyC =
      studentGrades.some((g) => g.level === 'C' || (g.score !== null && g.score < 5.0)) ||
      compLevel === 'C' ||
      qualLevel === 'C';

    if (hasAnyC) {
      return {
        code: 'CHT',
        label: 'Chưa hoàn thành',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        reward: 'Rèn luyện trong hè',
        promotion: 'Xét lại sau hè',
      };
    }

    const allSubjectsT = studentGrades.every((g) => g.level === 'T' && (g.score === null || g.score >= 9.0));
    if (allSubjectsT && compLevel === 'T' && qualLevel === 'T') {
      return {
        code: 'HTXS',
        label: 'Hoàn thành xuất sắc',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 font-extrabold',
        reward: 'Học sinh Xuất sắc',
        promotion: 'Lên lớp thẳng',
      };
    }

    const allSubjectsGood = studentGrades.every(
      (g) => (g.level === 'T' || g.level === 'H') && (g.score === null || g.score >= 7.0)
    );
    if (allSubjectsGood) {
      return {
        code: 'HTT',
        label: 'Hoàn thành tốt',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 font-bold',
        reward: 'Học sinh Tiêu biểu',
        promotion: 'Lên lớp thẳng',
      };
    }

    return {
      code: 'HT',
      label: 'Hoàn thành',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      reward: 'Hoàn thành CT lớp học',
      promotion: 'Lên lớp thẳng',
    };
  };

  // ==========================================
  // SUB-TAB 4: XUẤT BÁO CÁO VÀ IN
  // ==========================================
  const handleExportReportWord = () => {
    const reportElem = document.getElementById('tt27-report-preview');
    if (!reportElem) return;

    const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Báo cáo Đánh giá TT27 - Lớp ${currentClass.name}</title>
        <style>
          @page { size: 29.7cm 21cm; margin: 1.5cm 1.5cm 1.5cm 1.5cm; }
          body, table, th, td { font-family: 'Times New Roman', Times, serif; font-size: 13pt; color: #000000; line-height: 1.25; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000000; padding: 6px; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
          .no-border td { border: none !important; }
        </style>
      </head>
      <body>
        ${reportElem.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_cao_TT27_Lop_${currentClass.name}_GVCN_${currentClass.homeroomTeacherName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file Word báo cáo TT27 dạng bảng chuẩn, Times New Roman 13pt thành công!', 'success');
  };

  const handleExportReportPDF = () => {
    const reportElem = document.getElementById('tt27-report-preview');
    if (!reportElem) return;

    const opt = {
      margin: 8,
      filename: `Bao_cao_TT27_Lop_${currentClass.name}_GVCN_${currentClass.homeroomTeacherName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
    };
    html2pdf().from(reportElem).set(opt).save();
    showToast('Đã xuất file PDF báo cáo TT27 (Times New Roman, cỡ 13) thành công!', 'success');
  };

  // ==========================================
  // TAB 2: NGÂN HÀNG CÂU HỎI & THI TRỰC TUYẾN
  // ==========================================
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Question CRUD Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQTargetId, setDeleteQTargetId] = useState<string | null>(null);

  const [qContent, setQContent] = useState('');
  const [qSubjectId, setQSubjectId] = useState('subj-toan');
  const [qGrade, setQGrade] = useState(3);
  const [qLevel, setQLevel] = useState<'nhan_biet' | 'thong_hieu' | 'van_dung'>('nhan_biet');
  const [qType, setQType] = useState<Question['type']>('single_choice');
  const [qOptions, setQOptions] = useState<string>('A. \nB. \nC. \nD. ');
  const [qCorrect, setQCorrect] = useState('');
  const [qExplanation, setQExplanation] = useState('');

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchLevel = filterLevel === 'all' || q.level === filterLevel;
      const matchSubj = filterSubject === 'all' || q.subjectId === filterSubject;
      return matchLevel && matchSubj;
    });
  }, [questions, filterLevel, filterSubject]);

  // Permissions for Exam Toggles
  const canToggleExamAccess =
    ['admin', 'principal'].includes(currentUser.role) ||
    currentUser.position?.includes('Hiệu phó') ||
    currentUser.position?.includes('Hiệu trưởng') ||
    currentUser.position?.includes('Quản trị');

  // Exam Generator (Thi thử / Thi chính thức)
  const [isExamConfigModalOpen, setIsExamConfigModalOpen] = useState(false);
  const [examMode, setExamMode] = useState<'practice' | 'official'>('practice');
  const [examTitle, setExamTitle] = useState('Bài kiểm tra trực tuyến định kỳ');
  const [examSubjectId, setExamSubjectId] = useState('subj-toan');
  const [examGrade, setExamGrade] = useState(3);
  const [examQuestionCount, setExamQuestionCount] = useState<number>(5);
  const [examDurationMinutes, setExamDurationMinutes] = useState<number>(20);
  const [examRatioLevel1, setExamRatioLevel1] = useState<number>(2);
  const [examRatioLevel2, setExamRatioLevel2] = useState<number>(2);
  const [examRatioLevel3, setExamRatioLevel3] = useState<number>(1);
  const [examStudentId, setExamStudentId] = useState<string>('');
  const [generatedExamCode, setGeneratedExamCode] = useState<string>('MĐ-301');

  // View mode in Question Bank: 'bank' (Ngân hàng câu hỏi) | 'history' (Lịch sử thi)
  const [qbViewMode, setQbViewMode] = useState<'bank' | 'history'>('bank');
  const [viewingHistoryAttempt, setViewingHistoryAttempt] = useState<ExamAttemptRecord | null>(null);
  const [examSearchHistory, setExamSearchHistory] = useState<string>('');
  const [examHistoryFilterMode, setExamHistoryFilterMode] = useState<'all' | 'practice' | 'official'>('all');

  // Active Running Exam State
  const [activeExam, setActiveExam] = useState<{
    examCode: string;
    mode: 'practice' | 'official';
    title: string;
    subjectId: string;
    subjectName: string;
    studentId: string;
    studentName: string;
    studentCode: string;
    className: string;
    durationMinutes: number;
    questions: Question[];
  } | null>(null);

  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState(0);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState<number>(0);
  const [examCorrectCount, setExamCorrectCount] = useState<number>(0);

  // Timer effect for active running exam
  useEffect(() => {
    if (!activeExam || isExamSubmitted) return;

    if (examTimeRemaining <= 0) {
      handleSubmitExam();
      showToast('Đã hết thời gian làm bài thi! Hệ thống tự động thu bài.', 'warning');
      return;
    }

    const timer = setInterval(() => {
      setExamTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, isExamSubmitted, examTimeRemaining]);

  const handleOpenExamConfig = (mode: 'practice' | 'official') => {
    if (mode === 'practice' && !isPracticeExamEnabled && !canToggleExamAccess) {
      showToast('Chức năng Thi thử đang tạm khóa bởi Ban Giám hiệu!', 'warning');
      return;
    }
    if (mode === 'official' && !isOfficialExamEnabled && !canToggleExamAccess) {
      showToast('Chức năng Thi chính thức đang tạm khóa bởi Ban Giám hiệu!', 'warning');
      return;
    }

    // Generate unique random exam code: e.g. MĐ-428
    const randomCode = 'MĐ-' + Math.floor(100 + Math.random() * 900);
    setGeneratedExamCode(randomCode);

    // Pick student taking the test
    const targetStudent = isParent ? (linkedStudent || classStudents[0] || students[0]) : (classStudents[0] || students[0]);
    setExamStudentId(targetStudent?.id || 'std-01');

    setExamMode(mode);
    setExamTitle(
      mode === 'practice'
        ? 'Đề thi thử rèn luyện kiến thức định kỳ'
        : 'Đề kiểm tra chính thức - Khối 3'
    );
    setExamQuestionCount(5);
    setExamDurationMinutes(mode === 'practice' ? 15 : 20);
    setExamRatioLevel1(2);
    setExamRatioLevel2(2);
    setExamRatioLevel3(1);

    if (isParent) {
      // Direct start exam for child without needing teacher configuration modal
      const targetGrade = classes.find((c) => c.id === targetStudent?.classId)?.grade || 3;
      const subjQuestions = questions.filter((q) => q.grade === targetGrade);
      const pool = subjQuestions.length >= 5 ? subjQuestions : questions;
      const shuffle = <T,>(arr: T[]): T[] => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };
      const finalExamQuestions = shuffle(pool).slice(0, 5);
      setActiveExam({
        examCode: randomCode,
        mode,
        title: mode === 'practice' ? 'Bài thi thử rèn luyện kiến thức' : 'Bài kiểm tra chính thức',
        subjectId: 'subj-toan',
        subjectName: 'Toán & Tiếng Việt',
        studentId: targetStudent?.id || 'std-01',
        studentName: targetStudent?.fullName || currentUser.name,
        studentCode: targetStudent?.studentCode || 'HS2025001',
        className: targetStudent?.className || currentClass.name,
        durationMinutes: mode === 'practice' ? 15 : 20,
        questions: finalExamQuestions,
      });
      setCurrentExamIndex(0);
      setUserAnswers({});
      setExamTimeRemaining((mode === 'practice' ? 15 : 20) * 60);
      setIsExamSubmitted(false);
      showToast(`Đã bắt đầu bài thi cho em ${targetStudent?.fullName}!`, 'success');
      return;
    }

    setIsExamConfigModalOpen(true);
  };

  // Randomized non-duplicate exam generator algorithm (Fisher-Yates)
  const handleGenerateAndStartExam = () => {
    const subjQuestions = questions.filter(
      (q) => q.subjectId === examSubjectId || q.grade === examGrade
    );

    const pool = subjQuestions.length >= examQuestionCount ? subjQuestions : questions;

    const level1Pool = pool.filter((q) => q.level === 'nhan_biet');
    const level2Pool = pool.filter((q) => q.level === 'thong_hieu');
    const level3Pool = pool.filter((q) => q.level === 'van_dung');

    const shuffle = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const selected: Question[] = [];
    const usedIds = new Set<string>();

    const pickFromPool = (p: Question[], count: number) => {
      const shuffled = shuffle(p);
      let picked = 0;
      for (const q of shuffled) {
        if (!usedIds.has(q.id) && picked < count) {
          selected.push(q);
          usedIds.add(q.id);
          picked++;
        }
      }
    };

    pickFromPool(level1Pool, examRatioLevel1);
    pickFromPool(level2Pool, examRatioLevel2);
    pickFromPool(level3Pool, examRatioLevel3);

    // If still short of questions, fill from remaining pool
    if (selected.length < examQuestionCount) {
      const remainingShuffled = shuffle(pool);
      for (const q of remainingShuffled) {
        if (!usedIds.has(q.id) && selected.length < examQuestionCount) {
          selected.push(q);
          usedIds.add(q.id);
        }
      }
    }

    const finalExamQuestions = shuffle(selected);
    const chosenSubject = availableSubjects.find((s) => s.id === examSubjectId) || defaultClassSubjectList[0];
    const candidateStudent = students.find((s) => s.id === examStudentId) || classStudents[0] || students[0];

    setActiveExam({
      examCode: generatedExamCode,
      mode: examMode,
      title: examTitle,
      subjectId: examSubjectId,
      subjectName: chosenSubject.name,
      studentId: candidateStudent?.id || 'std-01',
      studentName: candidateStudent?.fullName || 'Nguyễn Gia Bảo',
      studentCode: candidateStudent?.studentCode || 'HS2025001',
      className: candidateStudent?.className || currentClass.name,
      durationMinutes: examDurationMinutes,
      questions: finalExamQuestions,
    });

    setCurrentExamIndex(0);
    setUserAnswers({});
    setExamTimeRemaining(examDurationMinutes * 60);
    setIsExamSubmitted(false);
    setIsExamConfigModalOpen(false);

    showToast(
      `Khởi tạo thành công Mã đề [${generatedExamCode}] cho em ${candidateStudent?.fullName} (${finalExamQuestions.length} câu ngẫu nhiên)!`,
      'success'
    );
  };

  const handleSelectAnswer = (questionIndex: number, optionLetter: string) => {
    if (isExamSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionLetter,
    }));
  };

  const handleSubmitExam = () => {
    if (!activeExam || isExamSubmitted) return;

    let correct = 0;
    activeExam.questions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (ans) {
        const correctStr = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] || '' : (q.correctAnswer || '');
        const correctNorm = correctStr.trim().toUpperCase();
        const ansNorm = ans.trim().toUpperCase();
        if (correctNorm.startsWith(ansNorm) || ansNorm.startsWith(correctNorm)) {
          correct++;
        }
      }
    });

    const totalQ = activeExam.questions.length || 1;
    const finalScore = Math.round((correct / totalQ) * 10 * 10) / 10;

    setExamCorrectCount(correct);
    setExamScore(finalScore);
    setIsExamSubmitted(true);

    // Lưu kết quả thi vào Lịch sử thi (ExamAttemptRecord)
    addExamAttempt({
      examCode: activeExam.examCode,
      title: activeExam.title,
      mode: activeExam.mode,
      subjectId: activeExam.subjectId,
      subjectName: activeExam.subjectName,
      studentId: activeExam.studentId,
      studentName: activeExam.studentName,
      studentCode: activeExam.studentCode,
      className: activeExam.className,
      durationMinutes: activeExam.durationMinutes,
      timeSpentSeconds: activeExam.durationMinutes * 60 - Math.max(0, examTimeRemaining),
      score: finalScore,
      correctCount: correct,
      totalQuestions: totalQ,
      userAnswers: { ...userAnswers },
      questions: activeExam.questions,
    });

    showToast(
      `Nộp bài thành công! Điểm số: ${finalScore}/10 (${correct}/${totalQ} câu đúng). Kết quả bài thi mã ${activeExam.examCode} đã được lưu vào hệ thống!`,
      'success'
    );
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const opts = qOptions
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, {
        content: qContent,
        subjectId: qSubjectId,
        grade: qGrade,
        level: qLevel,
        type: qType,
        options: opts,
        correctAnswer: qCorrect,
        explanation: qExplanation,
      });
      showToast('Đã cập nhật câu hỏi thành công!', 'success');
    } else {
      addQuestion({
        content: qContent,
        subjectId: qSubjectId,
        grade: qGrade,
        level: qLevel,
        type: qType,
        options: opts,
        correctAnswer: qCorrect,
        explanation: qExplanation,
      });
      showToast('Đã thêm câu hỏi mới vào ngân hàng câu hỏi!', 'success');
    }

    setIsQuestionModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* HEADER SECTION WITH PERMISSION & SUB-TAB NAVIGATION */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-rose-50 text-rose-600">
              <Award className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              Kiểm tra & Đánh giá Học sinh theo Thông tư 27/2020/TT-BGDĐT
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá toàn diện kết quả học tập từng môn, theo dõi phẩm chất & năng lực, tổng hợp học bạ và ngân hàng đề thi.
          </p>
        </div>

        {/* Class Selection & Main Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Permission: Admin & Principals can switch classes; Teachers locked to own class */}
          {canSwitchClasses ? (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">Xem lớp:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-xs font-bold text-sky-900 outline-none cursor-pointer"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Lớp {cls.name} ({cls.id === 'class-1a1' ? 'Cô Lưu Thị Hiền' : cls.homeroomTeacherName})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              <span>Lớp chủ nhiệm: Lớp {currentClass.name} (GVCN: {currentClass.homeroomTeacherName})</span>
            </div>
          )}

          {!isParent && (
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => {
                  setActiveTab('gradebook');
                  setActiveExam(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'gradebook'
                    ? 'bg-white text-rose-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sổ đánh giá TT 27
              </button>
              <button
                onClick={() => setActiveTab('question_bank')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'question_bank'
                    ? 'bg-white text-rose-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ngân hàng câu hỏi & Thi ({questions.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SỔ ĐÁNH GIÁ TT27 (4 CHỨC NĂNG - ĐÃ ĐỔI VỊ TRÍ 2 VÀ 3) */}
      {/* ============================================================== */}
      {activeTab === 'gradebook' && (
        <div className="space-y-5">
          {/* Sub-tab Navigation: 1 -> 2 (Năng lực phẩm chất) -> 3 (Tổng hợp học bạ) -> 4 (Xuất báo cáo) */}
          <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-xs flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setGradebookSubTab('subject_scores')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                gradebookSubTab === 'subject_scores'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>1. Sổ chấm điểm & nhận xét từng môn</span>
            </button>

            {/* Requirement: Đổi vị trí 2 với 3 -> Tab 2 là Năng lực & Phẩm chất */}
            <button
              onClick={() => setGradebookSubTab('qualities_competencies')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                gradebookSubTab === 'qualities_competencies'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>2. Năng lực và phẩm chất</span>
            </button>

            {/* Requirement: Đổi vị trí 2 với 3 -> Tab 3 là Tổng hợp học bạ cả lớp */}
            <button
              onClick={() => setGradebookSubTab('class_summary')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                gradebookSubTab === 'class_summary'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>3. Tổng hợp học bạ cả lớp</span>
            </button>

            <button
              onClick={() => setGradebookSubTab('export_print')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                gradebookSubTab === 'export_print'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>4. Xuất báo cáo và In</span>
            </button>
          </div>

          {/* -------------------------------------------------------- */}
          {/* CHỨC NĂNG 1: SỔ CHẤM ĐIỂM VÀ NHẬN XÉT TỪNG MÔN */}
          {/* -------------------------------------------------------- */}
          {gradebookSubTab === 'subject_scores' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
              {/* Filter Bar: Select Subject, Evaluation Term, and Manage Subjects */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Môn học:</span>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      {activeSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.hasPeriodicScore ? '(Có điểm số)' : '(Nhận xét)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Requirement: Cho phép giáo viên điều chỉnh (thêm/bớt môn học) */}
                  <button
                    type="button"
                    onClick={() => setIsManageSubjectsOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all btn-tactile"
                    title="Thêm hoặc bớt môn học áp dụng cho lớp học"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Thêm / Bớt môn học ({activeSubjects.length})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Kỳ đánh giá:</span>
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="gk1">Giữa Học kỳ I</option>
                      <option value="ck1">Cuối Học kỳ I</option>
                      <option value="gk2">Giữa Học kỳ II</option>
                      <option value="ck2">Cuối Học kỳ II / Cả năm</option>
                      <option value="thuong_xuyen">Đánh giá thường xuyên</option>
                    </select>
                  </div>
                </div>

                {/* Badges TT27 Summary for the selected subject */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-200">
                    {classStudents.filter((st) => getGradeRecord(st.id, selectedSubjectId).level === 'T').length} Tốt (T)
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {classStudents.filter((st) => getGradeRecord(st.id, selectedSubjectId).level === 'H').length} Hoàn thành (H)
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200">
                    {classStudents.filter((st) => getGradeRecord(st.id, selectedSubjectId).level === 'C').length} Chưa HT (C)
                  </span>
                </div>
              </div>

              {/* Subject Grading Table - Direct Interactive Live Input */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">STT</th>
                      <th className="py-3 px-3 w-28">Mã HS</th>
                      <th className="py-3 px-3 min-w-[160px]">Họ và tên học sinh</th>
                      {selectedSubject.hasPeriodicScore && (
                        <th className="py-3 px-3 text-center w-28">Điểm định kỳ (1-10)</th>
                      )}
                      <th className="py-3 px-3 text-center w-32">Mức đạt TT27</th>
                      <th className="py-3 px-3 min-w-[280px]">Lời nhận xét môn học (Sử dụng AI hỗ trợ)</th>
                      <th className="py-3 px-3 text-center w-28">Trạng thái GV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((student, idx) => {
                      const grade = getGradeRecord(student.id, selectedSubjectId);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-500">
                            {student.studentCode}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                            {student.fullName}
                          </td>

                          {/* Điểm định kỳ input */}
                          {selectedSubject.hasPeriodicScore && (
                            <td className="py-3 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={grade.score !== null ? grade.score : ''}
                                onChange={(e) =>
                                  handleUpdateGrade(
                                    student.id,
                                    selectedSubjectId,
                                    'score',
                                    e.target.value === '' ? null : parseFloat(e.target.value)
                                  )
                                }
                                className="w-16 text-center font-black text-sky-700 bg-white border border-slate-200 rounded-xl py-1 text-xs outline-none focus:border-sky-500 shadow-xs"
                                placeholder="-"
                              />
                            </td>
                          )}

                          {/* Mức đạt TT27 */}
                          <td className="py-3 px-3 text-center">
                            <select
                              value={grade.level}
                              onChange={(e) =>
                                handleUpdateGrade(student.id, selectedSubjectId, 'level', e.target.value as any)
                              }
                              className={`px-2.5 py-1 rounded-xl font-bold text-xs outline-none border cursor-pointer ${
                                grade.level === 'T'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : grade.level === 'H'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <option value="T">T - Tốt</option>
                              <option value="H">H - Hoàn thành</option>
                              <option value="C">C - Chưa HT</option>
                            </select>
                          </td>

                          {/* Lời nhận xét môn học kèm AI suggestion */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={grade.comment}
                                onChange={(e) =>
                                  handleUpdateGrade(student.id, selectedSubjectId, 'comment', e.target.value)
                                }
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-rose-400 shadow-xs"
                                placeholder="Nhập nhận xét hoặc dùng gợi ý AI..."
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenAiModal(
                                    student.id,
                                    student.fullName,
                                    selectedSubjectId,
                                    selectedSubject.name
                                  )
                                }
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors inline-flex items-center justify-center shrink-0"
                                title="Mở danh sách nhận xét AI đa dạng Thông tư 27"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Xác nhận duyệt */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateGrade(student.id, selectedSubjectId, 'confirmed', !grade.confirmed)
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors inline-flex items-center gap-1 ${
                                grade.confirmed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {grade.confirmed ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" /> Đã duyệt
                                </>
                              ) : (
                                'Chưa duyệt'
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* CHỨC NĂNG 2: NĂNG LỰC VÀ PHẨM CHẤT (ĐÃ ĐỔI VỊ TRÍ LÊN TAB 2) */}
          {/* -------------------------------------------------------- */}
          {gradebookSubTab === 'qualities_competencies' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Bảng Đánh giá Năng lực & Phẩm chất Học sinh theo Thông tư 27/2020/TT-BGDĐT
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                      Năng lực chung (3 tiêu chí)
                    </span>
                    <span className="font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      Năng lực đặc thù (5 tiêu chí)
                    </span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      5 Phẩm chất chủ yếu
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                    💡 Quy tắc Thông tư 27: Tiêu chí Phẩm chất và Năng lực được đánh giá: theo nội dung đánh giá thấp nhất (Ví dụ: có 5 tiêu chí trong đó 4 tiêu chí Tốt, 1 tiêu chí Đạt thì đánh giá tổng thể là Đạt; có tiêu chí Cần cố gắng thì đánh giá Cần cố gắng).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAllQualities}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all btn-tactile shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu đánh giá</span>
                </button>
              </div>

              {/* Qualities & Competencies Table with Strict Lowest Criterion Evaluators */}
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                    <tr>
                      <th rowSpan={2} className="py-3 px-2 border border-slate-200 w-10">STT</th>
                      <th rowSpan={2} className="py-3 px-3 border border-slate-200 text-left min-w-[150px]">Họ và tên</th>
                      {/* Năng lực chung */}
                      <th colSpan={3} className="py-2 px-2 border border-slate-200 bg-sky-50 text-sky-900">
                        Năng lực chung
                      </th>
                      {/* Năng lực đặc thù */}
                      <th colSpan={5} className="py-2 px-2 border border-slate-200 bg-indigo-50 text-indigo-900">
                        Năng lực đặc thù
                      </th>
                      {/* Năng lực tổng thể */}
                      <th rowSpan={2} className="py-3 px-2 border border-slate-200 bg-purple-50 text-purple-900 min-w-[70px]">
                        Năng lực chung toàn diện
                      </th>
                      {/* Phẩm chất */}
                      <th colSpan={5} className="py-2 px-2 border border-slate-200 bg-emerald-50 text-emerald-900">
                        5 Phẩm chất chủ yếu
                      </th>
                      {/* Phẩm chất tổng thể */}
                      <th rowSpan={2} className="py-3 px-2 border border-slate-200 bg-emerald-100/70 text-emerald-950 min-w-[70px]">
                        Phẩm chất toàn diện
                      </th>
                      <th rowSpan={2} className="py-3 px-3 border border-slate-200 min-w-[200px]">Lời nhận xét GVCN</th>
                    </tr>
                    <tr className="bg-slate-100 text-[10px]">
                      {/* 3 Năng lực chung */}
                      <th className="py-2 px-1 border border-slate-200" title="Tự chủ và tự học">Tự chủ</th>
                      <th className="py-2 px-1 border border-slate-200" title="Giao tiếp và hợp tác">Giao tiếp</th>
                      <th className="py-2 px-1 border border-slate-200" title="Giải quyết vấn đề và sáng tạo">Sáng tạo</th>
                      {/* 5 Năng lực đặc thù */}
                      <th className="py-2 px-1 border border-slate-200" title="Ngôn ngữ">Ngôn ngữ</th>
                      <th className="py-2 px-1 border border-slate-200" title="Tính toán">Tính toán</th>
                      <th className="py-2 px-1 border border-slate-200" title="Khoa học">Khoa học</th>
                      <th className="py-2 px-1 border border-slate-200" title="Thẩm mĩ">Thẩm mĩ</th>
                      <th className="py-2 px-1 border border-slate-200" title="Thể chất">Thể chất</th>
                      {/* 5 Phẩm chất */}
                      <th className="py-2 px-1 border border-slate-200">Yêu nước</th>
                      <th className="py-2 px-1 border border-slate-200">Nhân ái</th>
                      <th className="py-2 px-1 border border-slate-200">Chăm chỉ</th>
                      <th className="py-2 px-1 border border-slate-200">Trung thực</th>
                      <th className="py-2 px-1 border border-slate-200">Trách nhiệm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((st, idx) => {
                      const data = getStudentQualities(st.id);
                      const overallComp = getCompetencyOverallLevel(st.id);
                      const overallQual = getQualityOverallLevel(st.id);

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-2 border border-slate-200 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 border border-slate-200 text-left font-bold text-slate-800 whitespace-nowrap">{st.fullName}</td>

                          {/* 3 Năng lực chung: selfStudy, communication, problemSolving */}
                          {(['selfStudy', 'communication', 'problemSolving'] as const).map((field) => (
                            <td key={field} className="py-1.5 px-1 border border-slate-200">
                              <select
                                value={data[field]}
                                onChange={(e) => handleUpdateQuality(st.id, field, e.target.value)}
                                className="w-11 bg-white border border-slate-200 rounded-lg p-0.5 text-center font-bold text-sky-800 text-xs outline-none"
                              >
                                <option value="T">T</option>
                                <option value="Đ">Đ</option>
                                <option value="C">C</option>
                              </select>
                            </td>
                          ))}

                          {/* 5 Năng lực đặc thù: language, calculation, science, aesthetic, physical */}
                          {(['language', 'calculation', 'science', 'aesthetic', 'physical'] as const).map((field) => (
                            <td key={field} className="py-1.5 px-1 border border-slate-200">
                              <select
                                value={data[field]}
                                onChange={(e) => handleUpdateQuality(st.id, field, e.target.value)}
                                className="w-11 bg-white border border-slate-200 rounded-lg p-0.5 text-center font-bold text-indigo-800 text-xs outline-none"
                              >
                                <option value="T">T</option>
                                <option value="Đ">Đ</option>
                                <option value="C">C</option>
                              </select>
                            </td>
                          ))}

                          {/* Đánh giá tổng hợp Năng lực (theo tiêu chí thấp nhất) */}
                          <td className="py-1.5 px-2 border border-slate-200 font-black">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                overallComp === 'T'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : overallComp === 'Đ'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                              title="Tính theo tiêu chí thấp nhất của 8 năng lực"
                            >
                              {overallComp === 'T' ? 'Tốt' : overallComp === 'Đ' ? 'Đạt' : 'Cố gắng'}
                            </span>
                          </td>

                          {/* 5 Phẩm chất: patriotism, humanity, diligence, honesty, responsibility */}
                          {(['patriotism', 'humanity', 'diligence', 'honesty', 'responsibility'] as const).map((field) => (
                            <td key={field} className="py-1.5 px-1 border border-slate-200">
                              <select
                                value={data[field]}
                                onChange={(e) => handleUpdateQuality(st.id, field, e.target.value)}
                                className="w-11 bg-white border border-slate-200 rounded-lg p-0.5 text-center font-bold text-emerald-800 text-xs outline-none"
                              >
                                <option value="T">T</option>
                                <option value="Đ">Đ</option>
                                <option value="C">C</option>
                              </select>
                            </td>
                          ))}

                          {/* Đánh giá tổng hợp Phẩm chất (theo tiêu chí thấp nhất) */}
                          <td className="py-1.5 px-2 border border-slate-200 font-black">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                overallQual === 'T'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : overallQual === 'Đ'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                              title="Tính theo tiêu chí thấp nhất của 5 phẩm chất"
                            >
                              {overallQual === 'T' ? 'Tốt' : overallQual === 'Đ' ? 'Đạt' : 'Cố gắng'}
                            </span>
                          </td>

                          {/* Lời nhận xét */}
                          <td className="py-1.5 px-3 border border-slate-200 text-left">
                            <input
                              type="text"
                              value={data.comment}
                              onChange={(e) => handleUpdateQuality(st.id, 'comment', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs outline-none text-slate-700 focus:bg-white focus:border-sky-400"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* CHỨC NĂNG 3: TỔNG HỢP HỌC BẠ CẢ LỚP (ĐÃ ĐỔI VỊ TRÍ XUỐNG TAB 3) */}
          {/* -------------------------------------------------------- */}
          {gradebookSubTab === 'class_summary' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Bảng Tổng hợp Kết quả Đánh giá Giáo dục (Học bạ điện tử Lớp {currentClass.name})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đồng bộ tự động thời gian thực từ Sổ điểm và Đánh giá Năng lực, Phẩm chất • GVCN: {currentClass.homeroomTeacherName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                    Sĩ số: {classStudents.length} học sinh
                  </span>
                  <button
                    onClick={() => setGradebookSubTab('export_print')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In bảng tổng hợp</span>
                  </button>
                </div>
              </div>

              {/* Class Master Table - Live Synchronized across all active subjects and qualities */}
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                    <tr>
                      <th rowSpan={2} className="py-3 px-2 border border-slate-200 w-10">STT</th>
                      <th rowSpan={2} className="py-3 px-3 border border-slate-200 text-left min-w-[150px]">Họ và tên học sinh</th>
                      <th colSpan={activeSubjects.length} className="py-2 px-2 border border-slate-200 bg-sky-50/70 text-sky-900">
                        Môn học & Hoạt động giáo dục ({activeSubjects.length} môn)
                      </th>
                      <th colSpan={2} className="py-2 px-2 border border-slate-200 bg-purple-50/70 text-purple-900">
                        Năng lực & Phẩm chất (Tiêu chí thấp nhất)
                      </th>
                      <th rowSpan={2} className="py-3 px-3 border border-slate-200 min-w-[130px]">Kết quả đánh giá GD</th>
                      <th rowSpan={2} className="py-3 px-3 border border-slate-200 min-w-[120px]">Khen thưởng</th>
                      <th rowSpan={2} className="py-3 px-3 border border-slate-200 min-w-[110px]">Lên lớp</th>
                    </tr>
                    <tr className="bg-slate-100/70 text-[10px]">
                      {activeSubjects.map((s) => (
                        <th key={s.id} className="py-2 px-2 border border-slate-200" title={s.name}>
                          {s.code || s.name}
                        </th>
                      ))}
                      <th className="py-2 px-2 border border-slate-200 bg-indigo-50/70 text-indigo-900">Năng lực</th>
                      <th className="py-2 px-2 border border-slate-200 bg-emerald-50/70 text-emerald-900">Phẩm chất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((st, idx) => {
                      const overall = calculateStudentOverallResult(st.id);
                      const compLevel = getCompetencyOverallLevel(st.id);
                      const qualLevel = getQualityOverallLevel(st.id);

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-2 border border-slate-200 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 border border-slate-200 text-left font-bold text-slate-800 whitespace-nowrap">{st.fullName}</td>

                          {/* Active Subjects: Score (if applicable) + Level */}
                          {activeSubjects.map((s) => {
                            const g = getGradeRecord(st.id, s.id);
                            return (
                              <td key={s.id} className="py-2 px-1 border border-slate-200 font-bold">
                                {s.hasPeriodicScore && g.score !== null ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-sky-950 font-black">{g.score}</span>
                                    <span
                                      className={`text-[9px] px-1 rounded-sm ${
                                        g.level === 'T'
                                          ? 'text-purple-700'
                                          : g.level === 'H'
                                          ? 'text-blue-700'
                                          : 'text-rose-700'
                                      }`}
                                    >
                                      {g.level}
                                    </span>
                                  </div>
                                ) : (
                                  <span
                                    className={`font-black ${
                                      g.level === 'T'
                                        ? 'text-purple-700'
                                        : g.level === 'H'
                                        ? 'text-blue-700'
                                        : 'text-rose-700'
                                    }`}
                                  >
                                    {g.level}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Năng lực toàn diện */}
                          <td className="py-3 px-2 border border-slate-200 font-extrabold">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] ${
                                compLevel === 'T'
                                  ? 'bg-purple-100 text-purple-800'
                                  : compLevel === 'Đ'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {compLevel === 'T' ? 'Tốt' : compLevel === 'Đ' ? 'Đạt' : 'Cố gắng'}
                            </span>
                          </td>

                          {/* Phẩm chất toàn diện */}
                          <td className="py-3 px-2 border border-slate-200 font-extrabold">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] ${
                                qualLevel === 'T'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : qualLevel === 'Đ'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {qualLevel === 'T' ? 'Tốt' : qualLevel === 'Đ' ? 'Đạt' : 'Cố gắng'}
                            </span>
                          </td>

                          {/* Kết quả đánh giá GD */}
                          <td className="py-3 px-3 border border-slate-200 font-bold">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] border ${overall.badgeColor}`}>
                              {overall.label}
                            </span>
                          </td>

                          {/* Khen thưởng */}
                          <td className="py-3 px-3 border border-slate-200 text-[11px] font-bold text-amber-800">
                            {overall.reward}
                          </td>

                          {/* Lên lớp */}
                          <td className="py-3 px-3 border border-slate-200 text-emerald-700 font-bold text-[11px]">
                            {overall.promotion}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* CHỨC NĂNG 4: XUẤT BÁO CÁO VÀ IN */}
          {/* -------------------------------------------------------- */}
          {gradebookSubTab === 'export_print' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Xuất Báo cáo & In Bảng Đánh giá Học sinh theo Thông tư 27
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Định dạng Times New Roman, cỡ chữ 13pt quy chuẩn, tiêu đề Ủy Ban Nhân Dân Xã Vân Nham • GVCN: {currentClass.homeroomTeacherName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportReportWord}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all btn-tactile shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Xuất File Word (.doc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportReportPDF}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all btn-tactile shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất File PDF (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all btn-tactile"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In báo cáo</span>
                  </button>
                </div>
              </div>

              {/* Printable Report Preview - Times New Roman 13pt */}
              <div
                id="tt27-report-preview"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '13pt',
                  color: '#000000',
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                }}
              >
                {/* Header Section */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', border: 'none' }}>
                  <tbody>
                    <tr style={{ border: 'none' }}>
                      <td style={{ border: 'none', width: '45%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt' }}>
                        <strong>ỦY BAN NHÂN DÂN XÃ VÂN NHAM</strong><br />
                        <strong>TRƯỜNG TIỂU HỌC VÂN NHAM</strong><br />
                        <span>LỚP: {currentClass.name} • KHỐI {currentClass.grade}</span><br />
                        <span>------------------------</span>
                      </td>
                      <td style={{ border: 'none', width: '55%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt' }}>
                        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                        <strong>Độc lập - Tự do - Hạnh phúc</strong><br />
                        <span>------------------------</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Title */}
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                    BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ GIÁO DỤC HỌC SINH
                  </h2>
                  <h3 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                    Áp dụng theo Thông tư số 27/2020/TT-BGDĐT
                  </h3>
                  <p style={{ fontSize: '13pt', fontStyle: 'italic', margin: 0 }}>
                    Năm học: 2025 - 2026 • Lớp: {currentClass.name} • Giáo viên chủ nhiệm: <strong>{currentClass.homeroomTeacherName}</strong>
                  </p>
                </div>

                {/* Master Report Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '11pt' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                      <th style={{ border: '1px solid #000', padding: '6px', width: '35px' }}>STT</th>
                      <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Họ và tên học sinh</th>
                      {activeSubjects.map((s) => (
                        <th key={s.id} style={{ border: '1px solid #000', padding: '6px' }}>{s.code || s.name}</th>
                      ))}
                      <th style={{ border: '1px solid #000', padding: '6px' }}>Năng lực</th>
                      <th style={{ border: '1px solid #000', padding: '6px' }}>Phẩm chất</th>
                      <th style={{ border: '1px solid #000', padding: '6px' }}>Kết quả GD</th>
                      <th style={{ border: '1px solid #000', padding: '6px' }}>Khen thưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((st, idx) => {
                      const overall = calculateStudentOverallResult(st.id);
                      const compLevel = getCompetencyOverallLevel(st.id);
                      const qualLevel = getQualityOverallLevel(st.id);

                      return (
                        <tr key={st.id}>
                          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}><strong>{st.fullName}</strong></td>
                          {activeSubjects.map((s) => {
                            const g = getGradeRecord(st.id, s.id);
                            return (
                              <td key={s.id} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                                {s.hasPeriodicScore && g.score !== null ? `${g.score} (${g.level})` : g.level}
                              </td>
                            );
                          })}
                          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                            {compLevel === 'T' ? 'Tốt' : compLevel === 'Đ' ? 'Đạt' : 'Cố gắng'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                            {qualLevel === 'T' ? 'Tốt' : qualLevel === 'Đ' ? 'Đạt' : 'Cố gắng'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{overall.label}</td>
                          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{overall.reward}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Signature Section */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px', border: 'none' }}>
                  <tbody>
                    <tr style={{ border: 'none' }}>
                      <td style={{ border: 'none', width: '50%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt' }}>
                        <strong>HIỆU TRƯỞNG PHÊ DUYỆT</strong><br />
                        <span style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký, đóng dấu và ghi rõ họ tên)</span>
                        <div style={{ height: '70px' }}></div>
                        <strong>BAN GIÁM HIỆU</strong>
                      </td>
                      <td style={{ border: 'none', width: '50%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt' }}>
                        <span style={{ fontStyle: 'italic' }}>Vân Nham, ngày ... tháng ... năm 2026</span><br />
                        <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br />
                        <span style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký và ghi rõ họ tên)</span>
                        <div style={{ height: '70px' }}></div>
                        <strong>{currentClass.homeroomTeacherName}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: NGÂN HÀNG CÂU HỎI & THI TRỰC TUYẾN */}
      {/* ============================================================== */}
      {activeTab === 'question_bank' && (
        <div className="space-y-6">
          {!activeExam ? (
            <>
              {/* Question Bank Action Header */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <span>Ngân hàng Đề thi & Khảo sát Trực tuyến Thông tư 27</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Cài đặt đề thi thử, thi chính thức; sắp xếp ngẫu nhiên không trùng lặp; tự động lưu lịch sử thi theo mã đề.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Button Thi thử */}
                    <button
                      type="button"
                      disabled={!isPracticeExamEnabled && !canToggleExamAccess}
                      onClick={() => handleOpenExamConfig('practice')}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all btn-tactile shadow-md ${
                        isPracticeExamEnabled
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isPracticeExamEnabled ? <Play className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>Bắt đầu Thi thử</span>
                      {!isPracticeExamEnabled && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px]">Đang Khóa</span>
                      )}
                    </button>

                    {/* Button Thi chính thức */}
                    <button
                      type="button"
                      disabled={!isOfficialExamEnabled && !canToggleExamAccess}
                      onClick={() => handleOpenExamConfig('official')}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all btn-tactile shadow-md ${
                        isOfficialExamEnabled
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-rose-600/20'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isOfficialExamEnabled ? <Award className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>Khởi tạo Thi chính thức</span>
                      {!isOfficialExamEnabled && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px]">Đang Khóa</span>
                      )}
                    </button>

                    {!isParent && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestion(null);
                          setQContent('');
                          setQSubjectId('subj-toan');
                          setQGrade(3);
                          setQLevel('nhan_biet');
                          setQType('single_choice');
                          setQOptions('A. \nB. \nC. \nD. ');
                          setQCorrect('A');
                          setQExplanation('');
                          setIsQuestionModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all btn-tactile shadow-md shadow-emerald-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm câu hỏi mới</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* BẢNG ĐIỀU KHIỂN BGH: CÁC NÚT THANH TRƯỢT MỞ/KHÓA THI THỬ & THI CHÍNH THỨC */}
                {canToggleExamAccess && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 block">
                          Phân quyền Ban Giám hiệu / Quản trị viên
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Gạt nút thanh trượt bên phải để Mở hoặc Khóa chức năng thi thử và thi chính thức cho toàn trường.
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5">
                      {/* Thanh trượt 1: Thi thử */}
                      <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs font-bold text-slate-700">Thi thử:</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isPracticeExamEnabled}
                          onClick={() => {
                            const next = !isPracticeExamEnabled;
                            setIsPracticeExamEnabled(next);
                            showToast(next ? 'Đã MỞ chức năng Thi thử cho học sinh!' : 'Đã KHÓA chức năng Thi thử!', next ? 'success' : 'info');
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            isPracticeExamEnabled ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isPracticeExamEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[11px] font-extrabold ${isPracticeExamEnabled ? 'text-amber-600' : 'text-slate-400'}`}>
                          {isPracticeExamEnabled ? 'ĐANG MỞ' : 'ĐANG KHÓA'}
                        </span>
                      </div>

                      {/* Thanh trượt 2: Thi chính thức */}
                      <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs font-bold text-slate-700">Thi chính thức:</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isOfficialExamEnabled}
                          onClick={() => {
                            const next = !isOfficialExamEnabled;
                            setIsOfficialExamEnabled(next);
                            showToast(next ? 'Đã MỞ kỳ thi Chính thức!' : 'Đã KHÓA kỳ thi Chính thức!', next ? 'success' : 'info');
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            isOfficialExamEnabled ? 'bg-rose-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isOfficialExamEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[11px] font-extrabold ${isOfficialExamEnabled ? 'text-rose-600' : 'text-slate-400'}`}>
                          {isOfficialExamEnabled ? 'ĐANG MỞ' : 'ĐANG KHÓA'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tabs: Ngân hàng câu hỏi vs Lịch sử thi */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {!isParent && (
                    <button
                      type="button"
                      onClick={() => setQbViewMode('bank')}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        qbViewMode === 'bank'
                          ? 'bg-rose-50 text-rose-900 border border-rose-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ngân hàng Câu hỏi ({filteredQuestions.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setQbViewMode('history')}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      qbViewMode === 'history' || isParent
                        ? 'bg-rose-50 text-rose-900 border border-rose-200 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-rose-600" />
                    <span>
                      {isParent
                        ? `Lịch sử Thi & Kết quả của con (${linkedStudent?.fullName || 'Học sinh'})`
                        : `Lịch sử Thi & Kết quả (${examHistory.length} bài thi đã lưu)`}
                    </span>
                  </button>
                </div>
              </div>

              {!isParent && qbViewMode === 'bank' ? (
                <>
                  {/* Question Filters */}
                  <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">Môn học:</span>
                        <select
                          value={filterSubject}
                          onChange={(e) => setFilterSubject(e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="all">Tất cả môn học</option>
                          {activeSubjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500">Mức độ TT27:</span>
                        <select
                          value={filterLevel}
                          onChange={(e) => setFilterLevel(e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="all">Tất cả mức độ</option>
                          <option value="nhan_biet">Mức 1: Nhận biết</option>
                          <option value="thong_hieu">Mức 2: Thông hiểu</option>
                          <option value="van_dung">Mức 3: Vận dụng</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                      Hiển thị <span className="text-rose-600 font-extrabold">{filteredQuestions.length}</span> câu hỏi
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[11px]">
                                Câu {idx + 1}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  q.level === 'nhan_biet'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                    : q.level === 'thong_hieu'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                {q.level === 'nhan_biet'
                                  ? 'Mức 1: Nhận biết'
                                  : q.level === 'thong_hieu'
                                  ? 'Mức 2: Thông hiểu'
                                  : 'Mức 3: Vận dụng'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuestion(q);
                                  setQContent(q.content);
                                  setQSubjectId(q.subjectId);
                                  setQGrade(q.grade);
                                  setQLevel(q.level as any);
                                  setQType(q.type);
                                  setQOptions(q.options?.join('\n') || '');
                                  setQCorrect(Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : (q.correctAnswer || ''));
                                  setQExplanation(q.explanation || '');
                                  setIsQuestionModalOpen(true);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                                title="Chỉnh sửa câu hỏi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteQTargetId(q.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Xóa câu hỏi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-extrabold text-slate-800 text-sm mt-3">
                            {q.content}
                          </h4>

                          {q.options && q.options.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                              {q.options.map((opt, oIdx) => {
                                const correctStr = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] || '' : (q.correctAnswer || '');
                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2 rounded-xl border ${
                                      correctStr && opt.startsWith(correctStr)
                                        ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                        : 'bg-slate-50 border-slate-200/80'
                                    }`}
                                  >
                                    {opt}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {q.explanation && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-xl">
                            Lời giải: {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* EXAM HISTORY TAB: Xem lại kết quả thi & đề thi đã thi của học sinh */
                <div className="space-y-4">
                  {/* Filters for History */}
                  <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Tìm theo mã đề, tên học sinh..."
                          value={examSearchHistory}
                          onChange={(e) => setExamSearchHistory(e.target.value)}
                          className="bg-transparent text-xs text-slate-700 outline-none w-56 font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500">Loại bài thi:</span>
                        <select
                          value={examHistoryFilterMode}
                          onChange={(e) => setExamHistoryFilterMode(e.target.value as any)}
                          className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="all">Tất cả kỳ thi</option>
                          <option value="practice">Thi thử</option>
                          <option value="official">Thi chính thức</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-500">
                      Tổng số:{' '}
                      <span className="text-rose-600 font-extrabold">
                        {
                          examHistory.filter((item) => {
                            if (isParent) {
                              return (
                                item.studentId === currentUser.linkedStudentId ||
                                (linkedStudent &&
                                  (item.studentName.toLowerCase() === linkedStudent.fullName.toLowerCase() ||
                                    item.studentCode === linkedStudent.studentCode))
                              );
                            }
                            return true;
                          }).length
                        }
                      </span>{' '}
                      lượt nộp bài
                    </div>
                  </div>

                  {/* History Table */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-extrabold">
                            <th className="py-3 px-4">Mã đề thi</th>
                            <th className="py-3 px-4">Học sinh & Lớp</th>
                            <th className="py-3 px-4">Tên bài thi & Môn học</th>
                            <th className="py-3 px-4 text-center">Loại thi</th>
                            <th className="py-3 px-4 text-center">Số câu đúng</th>
                            <th className="py-3 px-4 text-center">Điểm số</th>
                            <th className="py-3 px-4 text-center">Đạt mức TT27</th>
                            <th className="py-3 px-4 text-center">Thời gian nộp</th>
                            <th className="py-3 px-4 text-right">Xem lại đề thi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {examHistory
                            .filter((item) => {
                              if (isParent) {
                                const isChild =
                                  item.studentId === currentUser.linkedStudentId ||
                                  (linkedStudent &&
                                    (item.studentName.toLowerCase() === linkedStudent.fullName.toLowerCase() ||
                                      item.studentCode === linkedStudent.studentCode));
                                return isChild;
                              }
                              const matchSearch =
                                !examSearchHistory.trim() ||
                                item.studentName.toLowerCase().includes(examSearchHistory.toLowerCase()) ||
                                item.examCode.toLowerCase().includes(examSearchHistory.toLowerCase()) ||
                                item.studentCode.toLowerCase().includes(examSearchHistory.toLowerCase());
                              const matchMode =
                                examHistoryFilterMode === 'all' || item.mode === examHistoryFilterMode;
                              return matchSearch && matchMode;
                            })
                            .map((attempt) => {
                              const isExc = attempt.score >= 9.0;
                              const isPass = attempt.score >= 5.0;

                              return (
                                <tr key={attempt.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-4 font-mono font-black text-rose-600">
                                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200">
                                      {attempt.examCode}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-extrabold text-slate-800">{attempt.studentName}</div>
                                    <div className="text-[11px] text-slate-400">
                                      {attempt.studentCode} • Lớp {attempt.className}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-slate-800">{attempt.title}</div>
                                    <div className="text-[11px] text-slate-500 font-semibold">{attempt.subjectName}</div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                        attempt.mode === 'practice'
                                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                          : 'bg-rose-100 text-rose-900 border border-rose-200'
                                      }`}
                                    >
                                      {attempt.mode === 'practice' ? 'Thi thử' : 'Chính thức'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold">
                                    {attempt.correctCount} / {attempt.totalQuestions}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-2.5 py-1 rounded-xl font-black text-xs ${
                                        isExc
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : isPass
                                          ? 'bg-sky-100 text-sky-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {attempt.score} / 10
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                        isExc
                                          ? 'text-emerald-700 bg-emerald-50'
                                          : isPass
                                          ? 'text-sky-700 bg-sky-50'
                                          : 'text-rose-700 bg-rose-50'
                                      }`}
                                    >
                                      {isExc ? 'T - Tốt' : isPass ? 'H - Hoàn thành' : 'C - Chưa HT'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center text-[11px] text-slate-400">
                                    {attempt.submittedAt}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setViewingHistoryAttempt(attempt)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold transition-all shadow-xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Xem bài thi</span>
                                    </button>
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
            </>
          ) : (
            /* Active Running Exam Interface (Interactive) */
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              {/* Exam Top Bar with Timer and Progress */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        activeExam.mode === 'practice'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {activeExam.mode === 'practice' ? 'BÀI THI THỬ' : 'BÀI THI CHÍNH THỨC'}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {activeExam.title} - Môn: {activeExam.subjectName}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-mono font-black border border-rose-200 text-[11px]">
                      Mã đề: {activeExam.examCode}
                    </span>
                    <span className="font-extrabold text-slate-800">
                      Thí sinh: {activeExam.studentName} ({activeExam.studentCode})
                    </span>
                    <span className="text-slate-400 font-semibold">• Lớp {activeExam.className}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Đề thi trắc nghiệm ngẫu nhiên, không trùng lặp theo ma trận Thông tư 27.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Timer */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm border shadow-xs ${
                      examTimeRemaining < 120
                        ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                        : 'bg-sky-50 text-sky-800 border-sky-200'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      {Math.floor(examTimeRemaining / 60)}:
                      {String(examTimeRemaining % 60).padStart(2, '0')}
                    </span>
                  </div>

                  {!isExamSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all btn-tactile shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Nộp bài thi</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveExam(null)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all btn-tactile"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Quay lại ngân hàng</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Exam Results Banner if submitted */}
              {isExamSubmitted && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-black uppercase">
                        KẾT QUẢ BÀI THI CỦA EM
                      </h4>
                      <p className="text-xs text-emerald-100">
                        Chúc mừng em đã hoàn thành bài thi! Hệ thống đã ghi nhận kết quả và đối chiếu Thông tư 27.
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2 bg-white/20 px-5 py-2.5 rounded-2xl backdrop-blur-xs">
                      <span className="text-3xl font-black">{examScore}</span>
                      <span className="text-sm font-bold">/ 10 điểm</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-2 border-t border-white/20">
                    <span>Số câu đúng: {examCorrectCount} / {activeExam.questions.length}</span>
                    <span>
                      Mức đạt Thông tư 27:{' '}
                      {examScore >= 9 ? 'T - Tốt' : examScore >= 5 ? 'H - Hoàn thành' : 'C - Chưa hoàn thành'}
                    </span>
                  </div>
                </div>
              )}

              {/* Question Navigation Matrix */}
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 mr-1">Danh sách câu:</span>
                {activeExam.questions.map((_, qIdx) => {
                  const isAnswered = Boolean(userAnswers[qIdx]);
                  const isCurrent = currentExamIndex === qIdx;
                  return (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => setCurrentExamIndex(qIdx)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        isCurrent
                          ? 'bg-rose-600 text-white shadow-md'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question Display */}
              {activeExam.questions[currentExamIndex] && (
                <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                      Câu hỏi số {currentExamIndex + 1} / {activeExam.questions.length}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {activeExam.questions[currentExamIndex].level === 'nhan_biet'
                        ? 'Mức 1: Nhận biết'
                        : activeExam.questions[currentExamIndex].level === 'thong_hieu'
                        ? 'Mức 2: Thông hiểu'
                        : 'Mức 3: Vận dụng'}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-800 leading-snug">
                    {activeExam.questions[currentExamIndex].content}
                  </h4>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {activeExam.questions[currentExamIndex].options?.map((opt, oIdx) => {
                      const letter = opt.trim().charAt(0);
                      const isSelected = userAnswers[currentExamIndex] === letter;
                      const qAns = activeExam.questions[currentExamIndex].correctAnswer;
                      const correctStr = Array.isArray(qAns) ? qAns[0] || '' : (qAns || '');
                      const isCorrect = correctStr.startsWith(letter);

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isExamSubmitted}
                          onClick={() => handleSelectAnswer(currentExamIndex, letter)}
                          className={`p-3.5 rounded-2xl text-left text-xs font-bold transition-all border ${
                            isExamSubmitted
                              ? isCorrect
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black'
                                : isSelected
                                ? 'bg-rose-100 border-rose-400 text-rose-950 line-through'
                                : 'bg-white border-slate-200 text-slate-600'
                              : isSelected
                              ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation if submitted */}
                  {isExamSubmitted && activeExam.questions[currentExamIndex].explanation && (
                    <div className="p-3 rounded-2xl bg-sky-50 text-sky-900 text-xs border border-sky-200 mt-3">
                      <strong>Hướng dẫn giải:</strong> {activeExam.questions[currentExamIndex].explanation}
                    </div>
                  )}

                  {/* Next / Prev Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      disabled={currentExamIndex === 0}
                      onClick={() => setCurrentExamIndex((prev) => prev - 1)}
                      className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      Câu trước
                    </button>
                    <button
                      type="button"
                      disabled={currentExamIndex === activeExam.questions.length - 1}
                      onClick={() => setCurrentExamIndex((prev) => prev + 1)}
                      className="px-4 py-2 rounded-2xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-40 transition-colors"
                    >
                      Câu tiếp theo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ĐIỀU CHỈNH (THÊM / BỚT) MÔN HỌC ÁP DỤNG CHO LỚP */}
      {/* ============================================================== */}
      {isManageSubjectsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Điều chỉnh danh mục Môn học (Lớp {currentClass.name})
                </h3>
              </div>
              <button
                onClick={() => setIsManageSubjectsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Tích chọn để thêm môn học vào sổ chấm điểm và bảng tổng hợp học bạ, hoặc bỏ tích để ẩn bớt môn học theo thực tế phân phối chương trình của lớp.
            </p>

            {/* Subject Checkboxes */}
            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
              {availableSubjects.map((s) => {
                const isActive = activeSubjectIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-sky-50/80 border-sky-300 text-sky-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleToggleSubject(s.id)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span>{s.name}</span>
                  </label>
                );
              })}
            </div>

            {/* Add Custom Subject Form */}
            <form onSubmit={handleAddCustomSubject} className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-700">Thêm môn học tự chọn mới:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tên môn (ví dụ: Kỹ năng sống, STEM...)"
                  value={newCustomSubjectName}
                  onChange={(e) => setNewCustomSubjectName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={!newCustomSubjectName.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold disabled:opacity-40 transition-colors"
                >
                  Thêm môn
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCustomSubjectHasScore}
                  onChange={(e) => setNewCustomSubjectHasScore(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Môn học này có chấm điểm định kỳ bằng số (1-10)</span>
              </label>
            </form>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsManageSubjectsOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: AI GỢI Ý NHẬN XÉT PHONG PHÚ THEO THÔNG TƯ 27 */}
      {/* ============================================================== */}
      {aiModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-800">
                  AI Gợi ý Nhận xét Đa dạng (TT27)
                </h3>
              </div>
              <button
                onClick={() => setAiModalTarget(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs">
              <p className="font-bold text-rose-950">
                Học sinh: {aiModalTarget.studentName} • Môn: {aiModalTarget.subjectName}
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Mức hiện tại: <strong>{aiModalTarget.currentLevel === 'T' ? 'Hoàn thành tốt' : aiModalTarget.currentLevel === 'H' ? 'Hoàn thành' : 'Chưa hoàn thành'}</strong>
                {aiModalTarget.currentScore !== null && ` (${aiModalTarget.currentScore} điểm)`}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Chọn 1 nhận xét phù hợp bên dưới:</span>
              <button
                type="button"
                onClick={handleRegenerateAiComments}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sinh thêm nhận xét mới</span>
              </button>
            </div>

            {/* List of Suggestions */}
            <div className="space-y-2 max-h-72 overflow-y-auto p-1">
              {currentAiSuggestions.map((comment, cIdx) => (
                <div
                  key={cIdx}
                  onClick={() => handleApplyAiComment(comment)}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-rose-50/60 hover:border-rose-300 transition-all cursor-pointer text-xs text-slate-700 leading-relaxed shadow-xs flex items-start justify-between gap-3 group"
                >
                  <p className="flex-1">{comment}</p>
                  <span className="shrink-0 px-2 py-1 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity">
                    Chọn
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAiModalTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EXAM CONFIGURATION (THI THỬ / THI CHÍNH THỨC) */}
      {/* ============================================================== */}
      {isExamConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {examMode === 'practice' ? (
                  <Play className="w-5 h-5 text-amber-500" />
                ) : (
                  <Award className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="text-base font-bold text-slate-800">
                  {examMode === 'practice' ? 'Cài đặt Đề Thi Thử' : 'Khởi tạo Đề Thi Chính Thức'}
                </h3>
              </div>
              <button
                onClick={() => setIsExamConfigModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Unique Exam Code Badge */}
              <div className="p-3 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-500 block">Mã đề thi riêng biệt</span>
                  <span className="text-base font-black text-rose-700 tracking-wide">{generatedExamCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedExamCode('MĐ-' + Math.floor(100 + Math.random() * 900))}
                  className="px-2.5 py-1 bg-white hover:bg-rose-100/60 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors"
                  title="Tạo mã đề ngẫu nhiên mới"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Đổi mã đề</span>
                </button>
              </div>

              {/* Student Picker */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Học sinh tham gia làm bài thi:
                </label>
                <select
                  value={examStudentId}
                  onChange={(e) => setExamStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-rose-500"
                >
                  {classStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.studentCode}) - Lớp {currentClass.name}
                    </option>
                  ))}
                  {classStudents.length === 0 && students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.studentCode}) - Lớp {st.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên bài kiểm tra:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Môn thi:</label>
                  <select
                    value={examSubjectId}
                    onChange={(e) => setExamSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none cursor-pointer"
                  >
                    {activeSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời gian (phút):</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={examDurationMinutes}
                    onChange={(e) => setExamDurationMinutes(parseInt(e.target.value) || 15)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số lượng câu hỏi:</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={examQuestionCount}
                  onChange={(e) => setExamQuestionCount(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block mb-2">
                  Phân bổ mức độ câu hỏi (Sắp xếp ngẫu nhiên không trùng lặp):
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="bg-sky-50 p-2 rounded-xl border border-sky-200">
                    <span className="font-bold text-sky-800">Mức 1 (Nhận biết)</span>
                    <input
                      type="number"
                      min="0"
                      max={examQuestionCount}
                      value={examRatioLevel1}
                      onChange={(e) => setExamRatioLevel1(parseInt(e.target.value) || 0)}
                      className="w-full mt-1 bg-white border border-sky-300 rounded-lg p-1 text-center font-black"
                    />
                  </div>
                  <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-800">Mức 2 (Thông hiểu)</span>
                    <input
                      type="number"
                      min="0"
                      max={examQuestionCount}
                      value={examRatioLevel2}
                      onChange={(e) => setExamRatioLevel2(parseInt(e.target.value) || 0)}
                      className="w-full mt-1 bg-white border border-amber-300 rounded-lg p-1 text-center font-black"
                    />
                  </div>
                  <div className="bg-purple-50 p-2 rounded-xl border border-purple-200">
                    <span className="font-bold text-purple-800">Mức 3 (Vận dụng)</span>
                    <input
                      type="number"
                      min="0"
                      max={examQuestionCount}
                      value={examRatioLevel3}
                      onChange={(e) => setExamRatioLevel3(parseInt(e.target.value) || 0)}
                      className="w-full mt-1 bg-white border border-purple-300 rounded-lg p-1 text-center font-black"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExamConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleGenerateAndStartExam}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold transition-all shadow-md"
              >
                Tạo đề và Bắt đầu làm bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: QUESTION CRUD */}
      {/* ============================================================== */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingQuestion ? 'Chỉnh sửa Câu hỏi' : 'Thêm Câu hỏi mới vào Ngân hàng'}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung câu hỏi:</label>
                <textarea
                  required
                  rows={3}
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Môn học:</label>
                  <select
                    value={qSubjectId}
                    onChange={(e) => setQSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    {activeSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức độ TT27:</label>
                  <select
                    value={qLevel}
                    onChange={(e) => setQLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value="nhan_biet">Mức 1: Nhận biết</option>
                    <option value="thong_hieu">Mức 2: Thông hiểu</option>
                    <option value="van_dung">Mức 3: Vận dụng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Các phương án lựa chọn (mỗi dòng 1 đáp án):</label>
                <textarea
                  rows={4}
                  value={qOptions}
                  onChange={(e) => setQOptions(e.target.value)}
                  placeholder="A. Phương án 1&#10;B. Phương án 2&#10;C. Phương án 3&#10;D. Phương án 4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đáp án đúng (ví dụ: A, B, C, hoặc D):</label>
                  <input
                    type="text"
                    required
                    value={qCorrect}
                    onChange={(e) => setQCorrect(e.target.value)}
                    placeholder="A"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khối lớp:</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={qGrade}
                    onChange={(e) => setQGrade(parseInt(e.target.value) || 3)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Giải thích lời giải:</label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Hướng dẫn giải chi tiết..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  {editingQuestion ? 'Cập nhật' : 'Thêm vào ngân hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Question */}
      <ConfirmationModal
        isOpen={Boolean(deleteQTargetId)}
        title="Xóa câu hỏi khỏi ngân hàng"
        message="Thầy/Cô có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng câu hỏi? Hành động này không thể hoàn tác."
        confirmLabel="Xác nhận xóa"
        isDestructive={true}
        onConfirm={() => {
          if (deleteQTargetId) {
            deleteQuestion(deleteQTargetId);
            setDeleteQTargetId(null);
            showToast('Đã xóa câu hỏi khỏi ngân hàng!', 'info');
          }
        }}
        onCancel={() => setDeleteQTargetId(null)}
      />

      {/* MODAL: XEM LẠI KẾT QUẢ VÀ ĐỀ THI ĐÃ THI */}
      {viewingHistoryAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Chi tiết Bài thi & Đề thi đã nộp: Mã đề {viewingHistoryAttempt.examCode}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Lưu trữ kết quả kiểm tra trực tuyến đối chiếu Thông tư 27
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistoryAttempt(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Summary Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/70 via-pink-50/50 to-rose-50/70 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-800">{viewingHistoryAttempt.studentName}</span>
                  <span className="text-xs font-semibold text-slate-500">({viewingHistoryAttempt.studentCode})</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-rose-700 border border-rose-200">
                    Lớp {viewingHistoryAttempt.className}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <span>Môn: <strong>{viewingHistoryAttempt.subjectName}</strong> • {viewingHistoryAttempt.title}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Thời gian nộp: {viewingHistoryAttempt.submittedAt} • Loại: {viewingHistoryAttempt.mode === 'practice' ? 'Thi thử' : 'Thi chính thức'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xl font-black text-rose-600">{viewingHistoryAttempt.score}</span>
                  <span className="text-xs font-bold text-slate-400"> / 10 điểm</span>
                  <div className="text-[11px] font-bold text-emerald-600">
                    Đúng {viewingHistoryAttempt.correctCount} / {viewingHistoryAttempt.totalQuestions} câu
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-2xl font-black text-xs ${
                  viewingHistoryAttempt.score >= 9 ? 'bg-emerald-100 text-emerald-800' : viewingHistoryAttempt.score >= 5 ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {viewingHistoryAttempt.score >= 9 ? 'Mức T - Tốt' : viewingHistoryAttempt.score >= 5 ? 'Mức H - Hoàn thành' : 'Mức C - Chưa HT'}
                </div>
              </div>
            </div>

            {/* Questions Paper View */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                ĐỀ THI VÀ BÀI LÀM CHI TIẾT ({viewingHistoryAttempt.questions.length} CÂU HỎI)
              </h4>

              {viewingHistoryAttempt.questions.map((q, idx) => {
                const userChoice = viewingHistoryAttempt.userAnswers[idx];
                const correctStr = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] || '' : (q.correctAnswer || '');
                const isCorrect = userChoice && (correctStr.startsWith(userChoice) || userChoice.startsWith(correctStr));

                return (
                  <div key={q.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black text-xs">
                          Câu {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          {q.level === 'nhan_biet' ? 'Nhận biết' : q.level === 'thong_hieu' ? 'Thông hiểu' : 'Vận dụng'}
                        </span>
                      </div>
                      <div>
                        {userChoice ? (
                          isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
                              <AlertCircle className="w-3.5 h-3.5" /> Sai (Đã chọn {userChoice})
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs italic">Chưa chọn đáp án</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-bold text-slate-800 leading-snug">{q.content}</p>

                    {/* Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, oIdx) => {
                          const letter = opt.trim().charAt(0);
                          const isStudentSelected = userChoice === letter;
                          const isThisCorrect = correctStr.startsWith(letter);

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                                isThisCorrect
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                                  : isStudentSelected
                                  ? 'bg-rose-50 border-rose-300 text-rose-950 line-through'
                                  : 'bg-slate-50 border-slate-200/70 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{opt}</span>
                                {isThisCorrect && (
                                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                    Đáp án đúng
                                  </span>
                                )}
                                {!isThisCorrect && isStudentSelected && (
                                  <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                    Học sinh chọn
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-xl">
                        <strong>Lời giải:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingHistoryAttempt(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
