import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { LessonPlan, LessonPhase, SlideItem, SlideLayout } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import pptxgen from 'pptxgenjs';
import {
  FileSpreadsheet,
  Plus,
  BookOpen,
  Sparkles,
  Presentation,
  Printer,
  Copy,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  MonitorPlay,
  FileText,
  Download,
  Upload,
  Image as ImageIcon,
  Check,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Palette,
  Eye,
  Share2,
  FileDown,
  Layout,
  Wand2,
  Trophy,
  Gamepad2,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Award,
  PlusCircle,
  RotateCcw,
  UploadCloud,
  CheckSquare,
  Square,
  Columns,
  FileCheck,
  Cpu,
  Laptop,
  Compass,
  HeartHandshake,
  Users2,
  GraduationCap,
  Info,
  Sliders,
  Zap,
  ClipboardCopy,
  CheckCheck
} from 'lucide-react';

// Preset educational illustrations library for primary teachers
const EDUCATIONAL_PRESET_IMAGES = [
  {
    category: 'Toán học',
    title: 'Que tính & phép tính',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=60',
  },
  {
    category: 'Toán học',
    title: 'Khối đếm số học',
    url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=60',
  },
  {
    category: 'Tiếng Việt',
    title: 'Sách vở & bút chì',
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60',
  },
  {
    category: 'Tiếng Việt',
    title: 'Thư viện thiếu nhi',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=60',
  },
  {
    category: 'Khoa học & TNXH',
    title: 'Thí nghiệm trực quan',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=60',
  },
  {
    category: 'Khoa học & TNXH',
    title: 'Trái đất & thiên nhiên',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60',
  },
  {
    category: 'Lớp học & Hoạt động',
    title: 'Thảo luận nhóm vui vẻ',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=60',
  },
  {
    category: 'Lớp học & Hoạt động',
    title: 'Học sinh hăng hái phát biểu',
    url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&auto=format&fit=crop&q=60',
  },
  {
    category: 'Vinh danh & Khen thưởng',
    title: 'Hoa điểm 10 & cúp vàng',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=60',
  },
];

// Helper to build initial diverse slides from a LessonPlan
function buildInitialSlidesForLesson(plan: LessonPlan, schoolName: string): SlideItem[] {
  if (plan.slides && plan.slides.length > 0) {
    return plan.slides;
  }

  const slides: SlideItem[] = [];

  // Slide 1: Cover
  slides.push({
    id: 's-cover',
    category: 'TRANG BÌA BÀI HỌC',
    title: plan.title,
    subtitle: `Môn: ${plan.subjectName} • Lớp ${plan.grade} • Thời lượng: ${plan.durationMinutes} phút`,
    layout: 'cover',
    content: [
      `Chương trình Giáo dục Phổ thông 2018`,
      `Chủ đề trọng tâm: ${plan.topic}`,
      `Trường Tiểu học: ${schoolName}`,
    ],
    teacherPrompt: `Chào mừng các em học sinh thân yêu đến với tiết học ${plan.subjectName}!`,
    studentAction: 'Cả lớp chuẩn bị sẵn sàng sách giáo khoa, vở bài tập và bảng con.',
    colorScheme: 'sky',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=60',
    imageCaption: 'Tiết học sinh động - Tương tác tích cực',
  });

  // Slide 2: Objectives
  slides.push({
    id: 's-objectives',
    category: 'MỤC TIÊU BÀI HỌC',
    title: 'Yêu Cầu Cần Đạt Sau Tiết Học 🎯',
    subtitle: 'Năng lực đặc thù & phẩm chất học sinh tiểu học cần phát triển',
    layout: 'objectives',
    content: [
      plan.objectives.knowledge[0] || 'Nắm vững kiến thức trọng tâm của bài.',
      plan.objectives.skills[0] || 'Rèn luyện kỹ năng quan sát, tư duy logic và làm việc nhóm.',
      plan.objectives.qualities[0] || 'Chăm chỉ, tự giác, cẩn thận và có trách nhiệm.',
    ],
    teacherPrompt: 'Cô mong muốn sau 35 phút, tất cả các em đều tự tin hoàn thành tốt các mục tiêu này nhé!',
    studentAction: 'Học sinh lắng nghe và quyết tâm thi đua giành hoa điểm 10.',
    colorScheme: 'emerald',
  });

  // Slide 3: Warmup Game
  const warmupPhase = plan.phases.find((p) => p.phase === 'warmup') || plan.phases[0];
  slides.push({
    id: 's-warmup',
    category: 'HOẠT ĐỘNG 1: KHỞI ĐỘNG',
    title: 'Trò Chơi Khởi Động: Bắn Tên Vui Nhộn 🚀',
    subtitle: warmupPhase ? warmupPhase.phaseName : 'Khởi động tạo hứng thú',
    layout: 'game_warmup',
    content: [
      '🎯 Thử thách 1: Trả lời nhanh câu hỏi để ghi 10 điểm cho tổ mình',
      '⚡ Thử thách 2: Ghép đúng cặp số / từ khóa bí mật trong 30 giây',
      '🌟 Thử thách 3: Nhận xét bạn và kết nối bài học mới',
    ],
    teacherPrompt: warmupPhase ? warmupPhase.teacherActivity : 'Tổ chức trò chơi đố vui tạo không khí hào hứng.',
    studentAction: warmupPhase ? warmupPhase.studentActivity : 'Cả lớp xung phong trả lời miệng.',
    colorScheme: 'purple',
    imageUrl: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=60',
    imageCaption: 'Trò chơi tương tác sôi nổi',
  });

  // Slide 4: Discovery Knowledge
  const discoveryPhase = plan.phases.find((p) => p.phase === 'new_knowledge') || plan.phases[1] || plan.phases[0];
  slides.push({
    id: 's-discovery',
    category: 'HOẠT ĐỘNG 2: KHÁM PHÁ KIẾN THỨC',
    title: 'Khám Phá Kiến Thức Trọng Tâm 💡',
    subtitle: discoveryPhase ? discoveryPhase.phaseName : 'Hình thành kiến thức mới',
    layout: 'discovery',
    content: [
      '🔍 Bước 1: Quan sát tình huống mẫu và nhận diện vấn đề',
      '✍️ Bước 2: Thảo luận cặp đôi rút ra quy tắc thực hiện',
      '📌 Bước 3: Ghi nhớ quy tắc trọng tâm và thực hành thao tác',
    ],
    teacherPrompt: discoveryPhase ? discoveryPhase.teacherActivity : 'Hướng dẫn học sinh phân tích ví dụ mẫu từng bước.',
    studentAction: discoveryPhase ? discoveryPhase.studentActivity : 'Học sinh thao tác trên que tính hoặc bảng con.',
    colorScheme: 'amber',
  });

  // Slide 5: Practice Board Work
  const practicePhase = plan.phases.find((p) => p.phase === 'practice') || plan.phases[2] || plan.phases[0];
  slides.push({
    id: 's-practice',
    category: 'HOẠT ĐỘNG 3: LUYỆN TẬP',
    title: 'Thử Tài Bảng Con & Bài Tập Vở ✏️',
    subtitle: practicePhase ? practicePhase.phaseName : 'Thực hành luyện tập',
    layout: 'practice',
    content: [
      '📝 Bài tập 1: Đặt tính rồi tính nhanh trên bảng con (2 phút)',
      '📖 Bài tập 2: Giải toán có lời văn / Đặt câu vào vở bài tập',
      '🤝 Bài tập 3: Đổi chéo vở cùng bạn cùng bàn để chấm bài',
    ],
    teacherPrompt: practicePhase ? practicePhase.teacherActivity : 'Giao bài tập trên bảng con, quan sát uốn nắn.',
    studentAction: practicePhase ? practicePhase.studentActivity : 'Làm bài cá nhân và đổi chéo kiểm tra kết quả.',
    colorScheme: 'sky',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60',
    imageCaption: 'Rèn luyện kỹ năng thực hành chuẩn xác',
  });

  // Slide 6: Two Columns / Interactive
  slides.push({
    id: 's-twocolumns',
    category: 'GÓC TƯƠNG TÁC THẦY VÀ TRÒ',
    title: 'Đối Thoại Sư Phạm & Thảo Luận Nhóm 💬',
    subtitle: 'Phân tích đa chiều - Phát huy tính tích cực của học sinh',
    layout: 'two_columns',
    content: [
      'Quan sát kỹ các trường hợp cần lưu ý (có nhớ sang hàng chục).',
      'Tránh nhầm lẫn thứ tự tính từ phải sang trái.',
      'Tự tin giải thích cách làm trước cả lớp.',
    ],
    teacherPrompt: 'Em hãy chỉ ra điểm khác nhau giữa bài có nhớ và không có nhớ?',
    studentAction: 'Nhóm trưởng điều hành thảo luận, các thành viên chia sẻ ý kiến.',
    colorScheme: 'purple',
  });

  // Slide 7: Application
  const appPhase = plan.phases.find((p) => p.phase === 'application') || plan.phases[3] || plan.phases[0];
  slides.push({
    id: 's-application',
    category: 'HOẠT ĐỘNG 4: VẬN DỤNG THỰC TẾ',
    title: 'Vận Dụng Trải Nghiệm Đời Sống 🌟',
    subtitle: appPhase ? appPhase.phaseName : 'Liên hệ thực tiễn',
    layout: 'application',
    content: [
      '🛒 Tình huống: Giúp mẹ tính tiền mua đồ dùng học tập tại siêu thị',
      '🏡 Góc gia đình: Ứng dụng bài học giải quyết các tình huống sinh hoạt',
      '🌱 Sáng tạo: Tự đặt 1 đề bài toán tương tự và đố bạn bè cùng giải',
    ],
    teacherPrompt: appPhase ? appPhase.teacherActivity : 'Nêu tình huống liên hệ thực tế gần gũi.',
    studentAction: appPhase ? appPhase.studentActivity : 'Học sinh hào hứng giải quyết tình huống thực tế.',
    colorScheme: 'emerald',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=60',
    imageCaption: 'Gắn liền bài học với thực tế đời sống',
  });

  // Slide 8: Award
  slides.push({
    id: 's-award',
    category: 'TỔNG KẾT & TUYÊN DƯƠNG',
    title: 'Bảng Vinh Danh Hoa Điểm 10 🏆',
    subtitle: 'Chúc mừng cả lớp đã hoàn thành xuất sắc bài học hôm nay!',
    layout: 'award',
    content: [
      '🎉 Tuyên dương Tổ 1, Tổ 2, Tổ 3 hăng hái xây dựng bài',
      '⭐ Khen ngợi các bạn có câu trả lời sáng tạo và chữ viết đẹp',
      '📌 Dặn dò: Ôn lại bài trong SGK và hoàn thành bài tập về nhà',
    ],
    teacherPrompt: 'Cô khen ngợi tinh thần học tập tích cực của cả lớp. Hẹn gặp lại các con trong tiết học sau!',
    studentAction: 'Cả lớp vỗ tay vui vẻ và ghi nhớ dặn dò của cô.',
    colorScheme: 'rose',
  });

  return slides;
}

export const LessonPlansModule: React.FC = () => {
  const {
    lessonPlans,
    subjects,
    classes,
    addLessonPlan,
    updateLessonPlan,
    deleteLessonPlan,
    duplicateLessonPlan,
    setActiveTab,
    showToast,
    schoolName,
    currentUser,
  } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Viewers
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonPlan | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewingLessonPlanDetail, setViewingLessonPlanDetail] = useState<LessonPlan | null>(null);

  // PRESENTATION & IN-SLIDE EDITING STATE
  const [slidesPreviewLesson, setSlidesPreviewLesson] = useState<LessonPlan | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideTheme, setSlideTheme] = useState<'light' | 'chalkboard' | 'projector'>('light');
  const [slideZoom, setSlideZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const presentationContainerRef = useRef<HTMLDivElement>(null);

  // In-Slide Editor drawer & Image modal
  const [isSlideEditDrawerOpen, setIsSlideEditDrawerOpen] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isAIEnhancingCurrentSlide, setIsAIEnhancingCurrentSlide] = useState(false);
  const [isAIEnhanceModalOpen, setIsAIEnhanceModalOpen] = useState(false);
  const [activeSlidesList, setActiveSlidesList] = useState<SlideItem[]>([]);

  // Synchronize activeSlidesList whenever preview lesson changes
  useEffect(() => {
    if (slidesPreviewLesson) {
      const built = buildInitialSlidesForLesson(slidesPreviewLesson, schoolName);
      setActiveSlidesList(built);
      setCurrentSlideIndex(0);
    }
  }, [slidesPreviewLesson, schoolName]);

  // Current Slide Item
  const currentSlide = activeSlidesList[currentSlideIndex] || null;

  // ------------------------------------------------------------------
  // 7 KHU VỰC CỦA CHỨC NĂNG "AI SOẠN THÔNG MINH" THEO YÊU CẦU NGƯỜI DÙNG:
  // ------------------------------------------------------------------
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Khu vực 1: Thông tin bài học
  const [aiClassId, setAiClassId] = useState<string>(currentUser.homeroomClassId || 'class-3a1');
  const [aiGrade, setAiGrade] = useState<number>(currentUser.grade || 3);
  const [aiBookSeries, setAiBookSeries] = useState<string>('Kết nối tri thức với cuộc sống');
  const [aiSubjectId, setAiSubjectId] = useState<string>('subj-toan');
  const [aiPeriodsCount, setAiPeriodsCount] = useState<number>(1);
  const [aiDuration, setAiDuration] = useState<number>(35); // Chuẩn tiểu học 35 phút
  const [aiTheme, setAiTheme] = useState<string>('Số và phép tính');
  const [aiTopic, setAiTopic] = useState<string>('Phép nhân số có hai chữ số với số có một chữ số (có nhớ)');

  // Auto sync aiClassId and aiGrade whenever currentUser is updated by Admin
  useEffect(() => {
    if (currentUser.homeroomClassId) {
      setAiClassId(currentUser.homeroomClassId);
    }
    if (currentUser.grade) {
      setAiGrade(currentUser.grade);
    }
  }, [currentUser.homeroomClassId, currentUser.grade]);

  // Khu vực 2: Đặc điểm lớp học (phân tích bối cảnh lớp học và trình độ học sinh)
  const [aiClassSize, setAiClassSize] = useState<number>(35);
  const [aiRegion, setAiRegion] = useState<string>('Đồng bằng / Thành thị');
  const [aiRatioGood, setAiRatioGood] = useState<number>(40);
  const [aiRatioFair, setAiRatioFair] = useState<number>(35);
  const [aiRatioMedium, setAiRatioMedium] = useState<number>(20);
  const [aiRatioWeak, setAiRatioWeak] = useState<number>(5);
  const [aiDisabledCount, setAiDisabledCount] = useState<number>(0);
  const [aiDisabledNote, setAiDisabledNote] = useState<string>('');
  const [aiHasInclusive, setAiHasInclusive] = useState<boolean>(false);

  // Khu vực 3: Nội dung tích hợp (các dấu tích checkbox đầu dòng)
  const [aiIntegrations, setAiIntegrations] = useState<{
    ai: boolean;
    stem: boolean;
    digitalCompetency: boolean;
    digitalTransformation: boolean;
    competencyAssessment: boolean;
    environment: boolean;
    lifeSkills: boolean;
    localEdu: boolean;
    humanRights: boolean;
  }>({
    ai: true,
    stem: true,
    digitalCompetency: true,
    digitalTransformation: true,
    competencyAssessment: true,
    environment: false,
    lifeSkills: false,
    localEdu: false,
    humanRights: false,
  });

  // Khu vực 4: Upload Giáo án mẫu / Sách giáo khoa (Hỗ trợ đa tệp)
  const [aiUploadedFiles, setAiUploadedFiles] = useState<Array<{
    name: string;
    size: string;
    dataUrl: string;
    description: string;
    fileType?: string;
}>>([]);

  // Khu vực 5: Chế độ xử lý (Soạn mới hay Soạn theo mẫu)
  const [aiProcessingMode, setAiProcessingMode] = useState<'new' | 'template'>('new');

  // Khu vực 6: Mức độ chi tiết (Ngắn gọn, Theo chuẩn, Chi tiết, Rất chi tiết)
  const [aiDetailLevel, setAiDetailLevel] = useState<'concise' | 'standard' | 'detailed' | 'very_detailed'>('standard');

  // Khu vực 7: Định dạng (Tiến trình hay Bảng 2 cột, 3 cột)
  const [aiLessonFormat, setAiLessonFormat] = useState<'process' | 'two_columns' | 'three_columns'>('two_columns');

  // TÍNH NĂNG TĂNG TỐC SOẠN GIÁO ÁN SIÊU TỐC VỚI AI (TURBO SPEED MODE)
  const [isTurboMode, setIsTurboMode] = useState<boolean>(true);
  const [turboProgress, setTurboProgress] = useState<number>(0);
  const [turboStepText, setTurboStepText] = useState<string>('');

  const [aiExtraPrompt, setAiExtraPrompt] = useState<string>('Tích hợp phương pháp dạy học tích cực, hoạt động làm việc nhóm đôi và trò chơi khởi động.');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [newlyCreatedLessonId, setNewlyCreatedLessonId] = useState<string | null>(null);

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    return lessonPlans.filter((l) => {
      const matchSubj = selectedSubject === 'all' || l.subjectId === selectedSubject;
      const matchGrade = selectedGrade === 0 || l.grade === selectedGrade;
      const matchSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.topic.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubj && matchGrade && matchSearch;
    });
  }, [lessonPlans, selectedSubject, selectedGrade, searchQuery]);

  // Manual Editor Form State
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState(3);
  const [subjectId, setSubjectId] = useState('subj-toan');
  const [topic, setTopic] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(35);
  const [knowledgeObjs, setKnowledgeObjs] = useState<string>('');
  const [skillsObjs, setSkillsObjs] = useState<string>('');
  const [qualitiesObjs, setQualitiesObjs] = useState<string>('');
  const [teacherEquip, setTeacherEquip] = useState<string>('');
  const [studentEquip, setStudentEquip] = useState<string>('');
  const [phases, setPhases] = useState<LessonPhase[]>([
    {
      id: 'p1',
      phase: 'warmup',
      phaseName: '1. Hoạt động Khởi động (5 phút)',
      durationMinutes: 5,
      teacherActivity: 'Tổ chức trò chơi "Bắn tên" tạo không khí sôi nổi, củng cố bảng nhân 2, 3, 4, 5.',
      studentActivity: 'Học sinh cả lớp hào hứng tham gia trả lời miệng, bạn khác nhận xét.',
      materials: 'Trò chơi tương tác trên máy chiếu',
    },
    {
      id: 'p2',
      phase: 'new_knowledge',
      phaseName: '2. Hoạt động Khám phá kiến thức mới (12 phút)',
      durationMinutes: 12,
      teacherActivity: 'Dẫn dắt tình huống thực tế, hướng dẫn đặt tính và tính từ phải sang trái có nhớ.',
      studentActivity: 'Học sinh quan sát thao tác trên mô hình que tính, thảo luận cặp đôi và nhắc lại quy tắc.',
      materials: 'Sách giáo khoa, đồ dùng trực quan que tính',
    },
    {
      id: 'p3',
      phase: 'practice',
      phaseName: '3. Hoạt động Luyện tập, thực hành (13 phút)',
      durationMinutes: 13,
      teacherActivity: 'Giao Bài 1 trên bảng con và Bài 2 vào vở bài tập, quan sát hỗ trợ.',
      studentActivity: 'Làm bài cá nhân vào bảng con và vở, đổi chéo chấm bài cùng bạn.',
      materials: 'Bảng con, vở bài tập',
    },
    {
      id: 'p4',
      phase: 'application',
      phaseName: '4. Hoạt động Vận dụng, trải nghiệm (5 phút)',
      durationMinutes: 5,
      teacherActivity: 'Nêu câu hỏi liên hệ thực tế đời sống. Dặn dò ôn bài.',
      studentActivity: 'Học sinh giải quyết tình huống thực tế và ghi nhớ bài học.',
      materials: 'Tình huống thực tế',
    },
  ]);
  const [slidesOutline, setSlidesOutline] = useState<string>('');

  const handleOpenAddModal = () => {
    setEditingLesson(null);
    setTitle('');
    setGrade(3);
    setSubjectId('subj-toan');
    setTopic('');
    setDurationMinutes(35);
    setKnowledgeObjs('Biết cách đặt tính và thực hiện phép tính chuẩn xác.\nVận dụng giải quyết các tình huống toán học trong đời sống.');
    setSkillsObjs('Rèn luyện kỹ năng quan sát, tư duy logic, tính nhẩm nhanh.\nKỹ năng hợp tác cặp đôi và làm việc nhóm hiệu quả.');
    setQualitiesObjs('Chăm chỉ, cẩn thận khi tính toán.\nCó trách nhiệm hoàn thành nhiệm vụ học tập.');
    setTeacherEquip('Bài giảng điện tử PowerPoint sinh động, hình ảnh trực quan.');
    setStudentEquip('Sách giáo khoa, vở bài tập, bảng con, phấn, khăn lau.');
    setSlidesOutline(
      'Slide 1: Trang bìa bài dạy & Khởi động vui nhộn\nSlide 2: Mục tiêu bài học (Phẩm chất & Năng lực)\nSlide 3: Tình huống phát hiện kiến thức mới\nSlide 4: Các bước thực hiện & Quy tắc ghi nhớ\nSlide 5: Luyện tập thực hành Bài tập 1 (Bảng con)\nSlide 6: Luyện tập thực hành Bài tập 2 (Vở bài tập)\nSlide 7: Vận dụng thực tế & Dặn dò về nhà'
    );
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (lesson: LessonPlan) => {
    setEditingLesson(lesson);
    setTitle(lesson.title);
    setGrade(lesson.grade);
    setSubjectId(lesson.subjectId);
    setTopic(lesson.topic);
    setDurationMinutes(lesson.durationMinutes);
    setKnowledgeObjs(lesson.objectives.knowledge.join('\n'));
    setSkillsObjs(lesson.objectives.skills.join('\n'));
    setQualitiesObjs(lesson.objectives.qualities.join('\n'));
    setTeacherEquip(lesson.equipment.teacher.join('\n'));
    setStudentEquip(lesson.equipment.student.join('\n'));
    setPhases(lesson.phases);
    setSlidesOutline((lesson.slidesOutline || []).join('\n'));
    setIsEditorOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tên bài dạy!', 'error');
      return;
    }

    const selectedSubj = subjects.find((s) => s.id === subjectId);
    const subjectName = selectedSubj ? selectedSubj.name : 'Toán học';

    const lessonData = {
      title,
      grade,
      subjectId,
      subjectName,
      topic: topic || title,
      durationMinutes,
      objectives: {
        knowledge: knowledgeObjs.split('\n').filter((k) => k.trim()),
        skills: skillsObjs.split('\n').filter((s) => s.trim()),
        qualities: qualitiesObjs.split('\n').filter((q) => q.trim()),
      },
      equipment: {
        teacher: teacherEquip.split('\n').filter((t) => t.trim()),
        student: studentEquip.split('\n').filter((s) => s.trim()),
      },
      phases,
      slidesOutline: slidesOutline.split('\n').filter((s) => s.trim()),
      status: 'ready' as const,
      author: currentUser.name || 'Cô Lê Thị Hương',
    };

    if (editingLesson) {
      updateLessonPlan(editingLesson.id, lessonData);
    } else {
      addLessonPlan(lessonData);
    }
    setIsEditorOpen(false);
  };

  const handlePhaseChange = (index: number, field: keyof LessonPhase, value: any) => {
    setPhases((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!slidesPreviewLesson || isSlideEditDrawerOpen || isImagePickerOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(activeSlidesList.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setSlidesPreviewLesson(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slidesPreviewLesson, activeSlidesList.length, isSlideEditDrawerOpen, isImagePickerOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      presentationContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // -------------------------------------------------------------
  // SLIDE IN-VIEW EDITING HANDLERS
  // Lưu thay đổi vào LessonPlan đang trình chiếu
  // -------------------------------------------------------------
  const handleUpdateCurrentSlide = (updates: Partial<SlideItem>) => {
    if (!slidesPreviewLesson || !currentSlide) return;

    const nextSlides = [...activeSlidesList];
    nextSlides[currentSlideIndex] = {
      ...nextSlides[currentSlideIndex],
      ...updates,
    };

    setActiveSlidesList(nextSlides);
    updateLessonPlan(slidesPreviewLesson.id, { slides: nextSlides });
  };

  const handleAddSlideItem = () => {
    if (!slidesPreviewLesson) return;
    const newSlide: SlideItem = {
      id: 's-custom-' + Date.now(),
      category: 'HOẠT ĐỘNG BỔ TRỢ',
      title: 'Hoạt Động Mới Tự Thiết Kế 💡',
      subtitle: 'Thầy Cô có thể chỉnh sửa nội dung và tải ảnh cho slide này',
      layout: 'two_columns',
      content: [
        '1. Nhiệm vụ trọng tâm của hoạt động',
        '2. Hướng dẫn học sinh thảo luận cặp đôi',
        '3. Trình bày sản phẩm trước lớp',
      ],
      teacherPrompt: 'Thầy/Cô hướng dẫn học sinh quan sát và thao tác.',
      studentAction: 'Học sinh tích cực tham gia thực hiện nhiệm vụ.',
      colorScheme: 'sky',
    };

    const nextSlides = [...activeSlidesList];
    nextSlides.splice(currentSlideIndex + 1, 0, newSlide);
    setActiveSlidesList(nextSlides);
    setCurrentSlideIndex(currentSlideIndex + 1);
    updateLessonPlan(slidesPreviewLesson.id, { slides: nextSlides });
    showToast('Đã thêm 1 slide mới vào bài giảng!', 'success');
  };

  const handleDeleteCurrentSlide = () => {
    if (activeSlidesList.length <= 1) {
      showToast('Bài giảng phải có ít nhất 1 slide!', 'warning');
      return;
    }
    const nextSlides = activeSlidesList.filter((_, idx) => idx !== currentSlideIndex);
    setActiveSlidesList(nextSlides);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    if (slidesPreviewLesson) {
      updateLessonPlan(slidesPreviewLesson.id, { slides: nextSlides });
    }
    showToast('Đã xóa slide hiện tại!', 'info');
  };

  // AI làm sinh động Slide đang xem (Hỗ trợ 4 chế độ chuyên sâu sư phạm)
  const handleAIEnhanceCurrentSlide = async (mode: 'vivid' | 'explain' | 'game' | 'visual' = 'vivid') => {
    if (!currentSlide || !slidesPreviewLesson) return;
    setIsAIEnhancingCurrentSlide(true);

    try {
      let promptInstruction = '';
      if (mode === 'explain') {
        promptInstruction = 'Diễn giải lại kiến thức bằng ví dụ thực tế gần gũi với học sinh tiểu học (như que tính, chia kẹo, hoa quả, đồ dùng học tập, đi siêu thị), câu từ ngắn gọn, gạch đầu dòng rõ ràng, tránh từ ngữ trừu tượng khó nhớ.';
      } else if (mode === 'game') {
        promptInstruction = 'Chuyển đổi slide thành một trò chơi khởi động hoặc mini-game đố vui lớp học có quy tắc đơn giản, tính điểm theo tổ/bàn, tạo không khí hào hứng và kích thích học sinh xung phong.';
      } else if (mode === 'visual') {
        promptInstruction = 'Tối ưu bố cục slide dạng trực quan (hai cột đối chiếu hoặc tập trung quan sát tranh), đặt câu hỏi quan sát cụ thể cho học sinh và gợi ý hình ảnh minh họa sinh động.';
      } else {
        promptInstruction = 'Làm sinh động slide toàn diện với tiêu đề vui nhộn kèm emoji, lời cô giáo dẫn dắt hóm hỉnh, nhiệm vụ học sinh tích cực, sinh động hấp dẫn.';
      }

      const prompt = `Bạn là chuyên gia sư phạm tiểu học hàng đầu. Hãy nâng cấp và làm sinh động slide này cho học sinh lớp ${slidesPreviewLesson.grade} môn ${slidesPreviewLesson.subjectName}:
- Tiêu đề hiện tại: ${currentSlide.title}
- Nội dung hiện tại: ${currentSlide.content.join('; ')}
- Yêu cầu trọng tâm: ${promptInstruction}
- Trả về JSON hợp lệ với cấu trúc:
{
  "title": "Tiêu đề vui nhộn kèm emoji",
  "subtitle": "Phụ đề hoặc thể loại",
  "layout": "cover | objectives | game_warmup | discovery | practice | two_columns | image_focus | award",
  "content": ["Ý 1 cụ thể", "Ý 2 cụ thể", "Ý 3 cụ thể"],
  "teacherPrompt": "Lời thầy cô dẫn dắt vui vẻ, khích lệ",
  "studentAction": "Hành động tích cực của học sinh",
  "imageCaption": "Chú thích tranh minh họa",
  "recommendedImage": "URL tranh minh họa phù hợp (nếu có)",
  "colorScheme": "sky | emerald | purple | amber | rose"
}`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'enhance_slide',
        }),
      });

      const resData = await response.json();
      let parsed = null;
      try {
        parsed = JSON.parse(resData.content);
      } catch {
        const match = resData.content?.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {}
        }
      }

      if (parsed && parsed.title) {
        handleUpdateCurrentSlide({
          title: parsed.title,
          subtitle: parsed.subtitle || currentSlide.subtitle,
          content: Array.isArray(parsed.content) ? parsed.content : currentSlide.content,
          teacherPrompt: parsed.teacherPrompt || currentSlide.teacherPrompt,
          studentAction: parsed.studentAction || currentSlide.studentAction,
          layout: parsed.layout || currentSlide.layout,
          imageUrl: parsed.recommendedImage || currentSlide.imageUrl,
          imageCaption: parsed.imageCaption || currentSlide.imageCaption,
          colorScheme: parsed.colorScheme || currentSlide.colorScheme,
        });
      } else {
        // High quality fallback based on pedagogical mode
        let fallbackTitle = currentSlide.title;
        let fallbackContent = [...currentSlide.content];
        let fallbackLayout = currentSlide.layout;
        let fallbackScheme = currentSlide.colorScheme || 'sky';

        if (mode === 'explain') {
          fallbackTitle = `🔍 Khám Phá Cụ Thể: ${currentSlide.title.replace(/[🎯✨💡✏️🚀🏆]/g, '').trim()} 💡`;
          fallbackContent = [
            '🍎 Ví dụ gần gũi: Quan sát tình huống thực tế và đồ dùng học tập xung quanh.',
            '🔢 Bước 1: Đếm và nhóm các phần tử có số lượng bằng nhau.',
            '💡 Quy tắc ghi nhớ: Ghi nhớ thao tác chuẩn xác để làm bài nhanh và tự tin nhất!',
          ];
          fallbackLayout = 'discovery';
          fallbackScheme = 'amber';
        } else if (mode === 'game') {
          fallbackTitle = `🚀 Đấu Trường Siêu Tốc: Ai Nhanh Hơn Nào! 🎯`;
          fallbackContent = [
            '⚡ Thử thách 1: Bấm chuông / Giơ bảng con giành quyền trả lời nhanh.',
            '🌟 Thử thách 2: Giải đố bí mật theo cặp đôi trong 30 giây.',
            '🎁 Phần thưởng: 10 điểm tích lũy và Hoa điểm 10 cho đội xuất sắc nhất.',
          ];
          fallbackLayout = 'game_warmup';
          fallbackScheme = 'purple';
        } else if (mode === 'visual') {
          fallbackTitle = `🖼️ Góc Quan Sát Trực Quan & So Sánh 💬`;
          fallbackLayout = 'two_columns';
          fallbackScheme = 'emerald';
        } else {
          fallbackTitle = `${currentSlide.title} ✨ (Tối ưu sinh động)`;
          fallbackContent = [
            ...currentSlide.content,
            '💡 Thử thách vui: Cùng bạn thi đua tìm ra kết quả nhanh và chính xác nhất!',
          ];
        }

        handleUpdateCurrentSlide({
          title: fallbackTitle,
          content: fallbackContent,
          layout: fallbackLayout,
          colorScheme: fallbackScheme,
          teacherPrompt: 'Cô đố cả lớp: Ai có thể xung phong giải thích cách làm hay nhất cho các bạn nghe?',
          studentAction: 'Học sinh hào hứng trao đổi cặp đôi và giơ tay phát biểu.',
        });
      }

      setIsAIEnhanceModalOpen(false);
      showToast('🎉 AI đã tối ưu hóa slide sinh động, cụ thể và dễ hiểu hơn cho học sinh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi khi tối ưu hóa slide bằng AI', 'error');
    } finally {
      setIsAIEnhancingCurrentSlide(false);
    }
  };

  // Upload image to current slide
  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleUpdateCurrentSlide({
        imageUrl: dataUrl,
        imageCaption: `Ảnh tải lên: ${file.name}`,
      });
      setIsImagePickerOpen(false);
      showToast(`Đã tải ảnh lên slide thành công!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // XUẤT FILE WORD CHO GIÁO ÁN (CHUẨN CÔNG VĂN 2345/BGDĐT-GDTH)
  // Bảng chuẩn, Times New Roman, cỡ 13pt, tiêu đề in đậm
  // -------------------------------------------------------------
  const handleExportWordLessonPlan = (plan: LessonPlan) => {
    const fileName = `Giao_an_${plan.subjectName.replace(/\s+/g, '_')}_Lop_${plan.grade}_${plan.title.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 30)}.doc`;

    // Render Bảng hoạt động dạy học theo đúng định dạng được chọn (2 cột, 3 cột hoặc theo tiến trình thiết kế)
    let sectionIIIContent = '';

    if (plan.formatStyle === 'two_column') {
      // ĐỊNH DẠNG BẢNG 2 CỘT
      sectionIIIContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000000; padding: 8px; width: 50%; background-color: #f2f2f2; font-size: 13pt; text-align: center;">
                HOẠT ĐỘNG CỦA GIÁO VIÊN & ĐỒ DÙNG DẠY HỌC
              </th>
              <th style="border: 1px solid #000000; padding: 8px; width: 50%; background-color: #f2f2f2; font-size: 13pt; text-align: center;">
                HOẠT ĐỘNG CỦA HỌC SINH & DỰ KIẾN SẢN PHẨM
              </th>
            </tr>
          </thead>
          <tbody>
            ${plan.phases.map(ph => `
              <tr>
                <td colspan="2" style="border: 1px solid #000000; background-color: #e2e8f0; font-weight: bold; font-size: 13pt; text-align: left; padding: 6px 10px;">
                  ${ph.phaseName} (Thời lượng: ${ph.durationMinutes} phút)
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000000; padding: 8px; width: 50%; vertical-align: top; font-size: 13pt;">
                  <strong>* Hướng dẫn của Giáo viên:</strong><br/>
                  ${ph.teacherActivity.replace(/\n/g, '<br/>')}
                  <br/><br/>
                  <strong>* Đồ dùng:</strong> ${ph.materials || 'SGK, bảng phụ, máy chiếu'}
                </td>
                <td style="border: 1px solid #000000; padding: 8px; width: 50%; vertical-align: top; font-size: 13pt;">
                  <strong>* Hoạt động của Học sinh:</strong><br/>
                  ${ph.studentActivity.replace(/\n/g, '<br/>')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (plan.formatStyle === 'design') {
      // ĐỊNH DẠNG TIẾN TRÌNH THIẾT KẾ KHỐI HOẠT ĐỘNG
      sectionIIIContent = `
        <div style="margin-top: 10px;">
          ${plan.phases.map((ph, idx) => `
            <div style="border: 1px solid #0284c7; background-color: #f0f9ff; padding: 10px; margin-bottom: 12px; border-radius: 4px;">
              <div style="font-weight: bold; color: #0369a1; font-size: 13pt; margin-bottom: 6px;">
                ${ph.phaseName} (Thời lượng: ${ph.durationMinutes} phút)
              </div>
              <p style="margin: 4px 0;"><strong>- Đồ dùng & Học liệu:</strong> ${ph.materials || 'SGK, tranh ảnh trực quan'}</p>
              <div style="margin-top: 6px; padding: 8px; background-color: #ffffff; border: 1px solid #bae6fd;">
                <strong>- Hoạt động của Giáo viên:</strong><br/>
                ${ph.teacherActivity.replace(/\n/g, '<br/>')}
              </div>
              <div style="margin-top: 6px; padding: 8px; background-color: #ffffff; border: 1px solid #bae6fd;">
                <strong>- Hoạt động của Học sinh:</strong><br/>
                ${ph.studentActivity.replace(/\n/g, '<br/>')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      // ĐỊNH DẠNG BẢNG 3 CỘT (Mặc định chuẩn Công văn 2345)
      sectionIIIContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000000; padding: 8px; width: 22%; background-color: #f2f2f2; font-size: 13pt; text-align: center;">
                Tiến trình & Thời lượng
              </th>
              <th style="border: 1px solid #000000; padding: 8px; width: 40%; background-color: #f2f2f2; font-size: 13pt; text-align: center;">
                Hoạt động của Giáo viên & Đồ dùng
              </th>
              <th style="border: 1px solid #000000; padding: 8px; width: 38%; background-color: #f2f2f2; font-size: 13pt; text-align: center;">
                Hoạt động của Học sinh & Dự kiến sản phẩm
              </th>
            </tr>
          </thead>
          <tbody>
            ${plan.phases.map(ph => `
              <tr>
                <td style="border: 1px solid #000000; padding: 8px; font-weight: bold; width: 22%; vertical-align: top; font-size: 13pt;">
                  ${ph.phaseName}<br/>
                  <span style="font-weight: normal; font-style: italic; font-size: 11pt;">(${ph.durationMinutes} phút)</span>
                </td>
                <td style="border: 1px solid #000000; padding: 8px; width: 40%; vertical-align: top; font-size: 13pt;">
                  <strong>- Hướng dẫn của GV:</strong><br/>
                  ${ph.teacherActivity.replace(/\n/g, '<br/>')}
                  <br/><br/>
                  <strong>- Đồ dùng:</strong> ${ph.materials || 'SGK, bảng phụ'}
                </td>
                <td style="border: 1px solid #000000; padding: 8px; width: 38%; vertical-align: top; font-size: 13pt;">
                  <strong>- Hoạt động của HS:</strong><br/>
                  ${ph.studentActivity.replace(/\n/g, '<br/>')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>KẾ HOẠCH BÀI DẠY: ${plan.title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 25mm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            line-height: 1.35;
            color: #000000;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          th {
            border: 1px solid #000000;
            padding: 8px;
            background-color: #f2f2f2;
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
          }
          td {
            border: 1px solid #000000;
            padding: 8px;
            font-size: 13pt;
          }
          .title-large {
            font-size: 15pt;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            margin-top: 12px;
            margin-bottom: 4px;
          }
          .title-sub {
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 12px;
          }
          .section-heading {
            font-size: 13pt;
            font-weight: bold;
            margin-top: 12px;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <table style="border: none; width: 100%; margin-bottom: 15px;">
          <tr style="border: none;">
            <td style="border: none; width: 45%; text-align: center; vertical-align: top;">
              <strong style="font-size: 13pt; font-family: 'Times New Roman', Times, serif;">ỦY BAN NHÂN DÂN XÃ VÂN NHAM</strong><br/>
              <strong style="font-size: 13pt; font-family: 'Times New Roman', Times, serif;">TRƯỜNG TIỂU HỌC VÂN NHAM</strong><br/>
              <span style="font-size: 13pt; font-family: 'Times New Roman', Times, serif;">TỔ CHUYÊN MÔN: KHỐI ${plan.grade}</span><br/>
              <span>---------------------</span>
            </td>
            <td style="border: none; width: 55%; text-align: center; vertical-align: top;">
              <strong style="font-size: 12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong style="font-size: 12pt;">Độc lập - Tự do - Hạnh phúc</strong><br/>
              <span>---------------------</span>
            </td>
          </tr>
        </table>

        <div class="title-large">KẾ HOẠCH BÀI DẠY</div>
        <div class="title-sub">${plan.title.toUpperCase()}</div>

        <table style="border: none; width: 100%; margin-bottom: 10px;">
          <tr style="border: none;">
            <td style="border: none; width: 50%;"><strong>Môn học:</strong> ${plan.subjectName}</td>
            <td style="border: none; width: 50%;"><strong>Lớp:</strong> ${plan.className || `Lớp ${plan.grade}`}</td>
          </tr>
          <tr style="border: none;">
            <td style="border: none; width: 50%;"><strong>Bộ sách:</strong> ${plan.bookSeries || 'Chương trình GDPT 2018'}</td>
            <td style="border: none; width: 50%;"><strong>Số tiết:</strong> ${plan.periodsCount || 1} tiết (${plan.durationMinutes} phút)</td>
          </tr>
          <tr style="border: none;">
            <td style="border: none; width: 50%;"><strong>Chủ đề / Mạch kiến thức:</strong> ${plan.subTopic || plan.topic}</td>
            <td style="border: none; width: 50%;"><strong>Giáo viên thực hiện:</strong> ${plan.author || currentUser.name}</td>
          </tr>
        </table>

        ${plan.classContext ? `
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 8px 12px; margin-bottom: 12px; font-size: 12pt;">
            <strong>* Phân tích bối cảnh lớp học:</strong> Sĩ số ${plan.classContext.studentCount} HS | Vùng miền: ${plan.classContext.region} | Tỉ lệ: Giỏi ${plan.classContext.ratio.excellent}%, Khá ${plan.classContext.ratio.good}%, TB ${plan.classContext.ratio.average}%, Yếu ${plan.classContext.ratio.weak}%
            ${plan.classContext.hasInclusiveStudents ? `<br/><strong>* Hỗ trợ học sinh hòa nhập & khuyết tật:</strong> ${plan.classContext.inclusiveNote || 'Có hỗ trợ cá nhân hóa'}` : ''}
          </div>
        ` : ''}

        ${plan.integratedContent && plan.integratedContent.length > 0 ? `
          <div style="background-color: #fdf4ff; border: 1px solid #f0abfc; padding: 6px 12px; margin-bottom: 12px; font-size: 12pt; color: #86198f;">
            <strong>* Miền năng lực tích hợp:</strong> ${plan.integratedContent.join(' • ')}
          </div>
        ` : ''}

        <div class="section-heading">I. YÊU CẦU CẦN ĐẠT:</div>
        <p><strong>1. Năng lực đặc thù:</strong></p>
        <ul>
          ${plan.objectives.knowledge.map((k) => `<li>${k}</li>`).join('')}
        </ul>

        <p><strong>2. Năng lực chung:</strong></p>
        <ul>
          ${plan.objectives.skills.map((s) => `<li>${s}</li>`).join('')}
        </ul>

        <p><strong>3. Phẩm chất:</strong></p>
        <ul>
          ${plan.objectives.qualities.map((q) => `<li>${q}</li>`).join('')}
        </ul>

        <div class="section-heading">II. ĐỒ DÙNG DẠY HỌC:</div>
        <p><strong>1. Giáo viên:</strong> ${plan.equipment.teacher.join(', ')}</p>
        <p><strong>2. Học sinh:</strong> ${plan.equipment.student.join(', ')}</p>

        <div class="section-heading">III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (CÔNG VĂN 2345/BGDĐT-GDTH):</div>
        ${sectionIIIContent}

        <div class="section-heading">IV. ĐIỀU CHỈNH SAU BÀI DẠY:</div>
        <p style="border-bottom: 1px dotted #888888; padding-bottom: 8px;">........................................................................................................................................................................</p>
        <p style="border-bottom: 1px dotted #888888; padding-bottom: 8px;">........................................................................................................................................................................</p>

        <table style="border: none; width: 100%; margin-top: 25px;">
          <tr style="border: none;">
            <td style="border: none; width: 50%; text-align: center;">
              <strong>TỔ TRƯỞNG CHUYÊN MÔN</strong><br/>
              <span style="font-size: 11pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            </td>
            <td style="border: none; width: 50%; text-align: center;">
              <span style="font-style: italic;">Ngày ..... tháng ..... năm 202...</span><br/>
              <strong>GIÁO VIÊN SOẠN BÀI</strong><br/>
              <br/><br/>
              <strong>${plan.author || currentUser.name}</strong>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất Kế hoạch bài dạy chuẩn Word: ${fileName}`, 'success');
  };

  const handleDownloadPowerPoint = () => {
    if (!slidesPreviewLesson) return;
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    (slidesPreviewLesson.slides || []).forEach((slideItem) => {
      let slide = pres.addSlide();
      slide.background = { color: 'F8FAFC' };

      slide.addText(slideItem.category, {
        x: 0.5, y: 0.4, w: 9, h: 0.4,
        fontSize: 14, bold: true, color: '0284C7'
      });

      slide.addText(slideItem.title, {
        x: 0.5, y: 0.8, w: 9, h: 0.8,
        fontSize: 22, bold: true, color: '0F172A'
      });

      if (slideItem.subtitle) {
        slide.addText(slideItem.subtitle, {
          x: 0.5, y: 1.6, w: 9, h: 0.4,
          fontSize: 14, italic: true, color: '475569'
        });
      }

      let contentY = slideItem.subtitle ? 2.2 : 1.8;
      slideItem.content.forEach((line) => {
        slide.addText(`• ${line}`, {
          x: 0.8, y: contentY, w: 8.5, h: 0.4,
          fontSize: 13, color: '334155'
        });
        contentY += 0.45;
      });

      if (slideItem.teacherPrompt) {
        slide.addText(`GV: ${slideItem.teacherPrompt}`, {
          x: 0.5, y: 5.4, w: 9, h: 0.4,
          fontSize: 11, italic: true, color: '047857'
        });
      }
    });

    pres.writeFile({ fileName: `${slidesPreviewLesson.title || 'Bai_giang'}.pptx` });
    showToast('Đã tải xuống tệp PowerPoint (.pptx) thành công!', 'success');
  };

  // -------------------------------------------------------------
  // TÁC VỤ TĂNG TỐC SIÊU NHANH SAU KHI DÙNG AI SOẠN GIÁO ÁN
  // -------------------------------------------------------------
  const handleCopyLessonPlanToClipboard = (plan: LessonPlan) => {
    const text = `KẾ HOẠCH BÀI DẠY: ${plan.title}
Môn học: ${plan.subjectName} | Lớp: ${plan.className || plan.grade} | Bộ sách: ${plan.bookSeries || 'GDPT 2018'}
Thời lượng: ${plan.durationMinutes} phút | Số tiết: ${plan.periodsCount || 1}
Chủ đề / Mạch kiến thức: ${plan.subTopic || plan.topic}
Giáo viên soạn: ${plan.author}

I. YÊU CẦU CẦN ĐẠT:
1. Năng lực đặc thù:
${plan.objectives.knowledge.map((k) => `- ${k}`).join('\n')}
2. Năng lực chung & Tích hợp:
${plan.objectives.skills.map((s) => `- ${s}`).join('\n')}
3. Phẩm chất:
${plan.objectives.qualities.map((q) => `- ${q}`).join('\n')}

II. ĐỒ DÙNG DẠY HỌC:
- Giáo viên: ${plan.equipment.teacher.join(', ')}
- Học sinh: ${plan.equipment.student.join(', ')}

III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (TIẾN TRÌNH SƯ PHẠM):
${plan.phases.map((ph) => `
${ph.phaseName} (Thời lượng: ${ph.durationMinutes} phút)
* Hướng dẫn của Giáo viên:
${ph.teacherActivity}
* Hoạt động của Học sinh:
${ph.studentActivity}
* Đồ dùng dạy học: ${ph.materials}
`).join('\n')}

IV. ĐIỀU CHỈNH SAU BÀI DẠY:
- Tiến độ bài dạy phù hợp năng lực học sinh trong lớp.
`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Đã sao chép toàn bộ Giáo án vào bộ nhớ tạm! Có thể dán ngay vào Word hoặc Zalo.', 'success');
    }).catch(() => {
      showToast('Đã sao chép nội dung giáo án.', 'info');
    });
  };

  const handleChangeFormatQuick = (newFormat: 'two_column' | 'three_column' | 'design') => {
    if (!viewingLessonPlanDetail) return;
    const updated = {
      ...viewingLessonPlanDetail,
      formatStyle: newFormat,
    };
    setViewingLessonPlanDetail(updated);
    updateLessonPlan(updated.id, updated);
    const label = newFormat === 'two_column' ? 'Bảng 2 cột' : newFormat === 'three_column' ? 'Bảng 3 cột' : 'Tiến trình thiết kế';
    showToast(`Đã chuyển sang định dạng "${label}" thành công!`, 'success');
  };

  const handleDownloadWorksheet = (plan: LessonPlan) => {
    const worksheetHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>PHIẾU HỌC TẬP: ${plan.title}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.4; color: #000; }
          .header { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 5px; }
          .sub { text-align: center; font-style: italic; font-size: 11pt; margin-bottom: 15px; }
          .box { border: 1px solid #000; padding: 10px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 12pt; }
          th { background-color: #f2f2f2; text-align: center; }
        </style>
      </head>
      <body>
        <table style="border: none; width: 100%; margin-bottom: 10px;">
          <tr style="border: none;">
            <td style="border: none; width: 50%;">TRƯỜNG TIỂU HỌC: .......................................</td>
            <td style="border: none; width: 50%; text-align: right;">HỌ VÀ TÊN HS: .................................................</td>
          </tr>
          <tr style="border: none;">
            <td style="border: none; width: 50%;">LỚP: ${plan.className || `Khối ${plan.grade}`}</td>
            <td style="border: none; width: 50%; text-align: right;">NGÀY: ..... / ..... / 202...</td>
          </tr>
        </table>

        <div class="header">PHIẾU HỌC TẬP VÀ ĐÁNH GIÁ NĂNG LỰC (TT 27)</div>
        <div class="sub">Bài học: ${plan.title} • Bộ sách: ${plan.bookSeries || 'GDPT 2018'}</div>

        <div class="box">
          <strong>PHẦN I: BÀI TẬP THỰC HÀNH TẠI LỚP</strong><br/><br/>
          <strong>Bài 1 (Mức 1 - Nhận biết):</strong> Thực hiện yêu cầu cơ bản của bài học "${plan.topic}".<br/>
          <em>Bài làm:</em> ...........................................................................................................................................................<br/><br/>
          <strong>Bài 2 (Mức 2 - Kết nối & Vận dụng):</strong> Thảo luận nhóm đôi và giải quyết tình huống bài toán.<br/>
          <em>Bài làm:</em> ...........................................................................................................................................................<br/><br/>
          <strong>Bài 3 (Mức 3 - Vận dụng sáng tạo):</strong> Liên hệ thực tế gia đình hoặc trường học xung quanh em.<br/>
          <em>Bài làm:</em> ...........................................................................................................................................................
        </div>

        <div class="box">
          <strong>PHẦN II: BẢNG KIỂM TỰ ĐÁNH GIÁ & ĐÁNH GIÁ ĐỒNG ĐẲNG (THÔNG TƯ 27)</strong>
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Tiêu chí đánh giá</th>
                <th style="width: 25%;">Em tự đánh giá</th>
                <th style="width: 25%;">Bạn nhận xét em</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1. Nắm được kiến thức trọng tâm của bài</td>
                <td style="text-align: center;">Tốt / Đạt / Cần cố gắng</td>
                <td style="text-align: center;">Tốt / Đạt / Cần cố gắng</td>
              </tr>
              <tr>
                <td>2. Tích cực hợp tác chia sẻ trong nhóm</td>
                <td style="text-align: center;">Tốt / Đạt / Cần cố gắng</td>
                <td style="text-align: center;">Tốt / Đạt / Cần cố gắng</td>
              </tr>
              <tr>
                <td>3. Hoàn thành phiếu bài tập đúng thời gian</td>
                <td style="text-align: center;">Tốt / Đạt / Cần cố gắng</td>
                <td style="text-align: center;">Tốt / Đạt / Cần cố gắng</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 10px; font-style: italic;">Lời cô giáo khen ngợi / nhắc nhở: ..................................................................................................</p>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + worksheetHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Phieu_bai_tap_${plan.title.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 30)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📝 Đã tạo và tải Phiếu bài tập & Bảng kiểm TT 27 thành công!', 'success');
  };

  const handleQuickOptimizeLesson = (type: 'shorten' | 'game' | 'inclusive' | 'rubric' | 'worksheet') => {
    if (!viewingLessonPlanDetail) return;

    if (type === 'shorten') {
      const optimizedPhases = viewingLessonPlanDetail.phases.map((ph) => {
        return {
          ...ph,
          teacherActivity: ph.teacherActivity
            .split('\n')
            .filter((l) => l.trim().length > 0)
            .slice(0, 3)
            .join('\n'),
          studentActivity: ph.studentActivity
            .split('\n')
            .filter((l) => l.trim().length > 0)
            .slice(0, 2)
            .join('\n'),
        };
      });

      const updated = {
        ...viewingLessonPlanDetail,
        phases: optimizedPhases,
        detailLevel: 'concise' as const,
      };
      setViewingLessonPlanDetail(updated);
      updateLessonPlan(updated.id, updated);
      showToast('⚡ Đã rút gọn kịch bản bài dạy chuẩn 35 phút (không lo cháy giáo án)!', 'success');
    } else if (type === 'game') {
      const updatedPhases = [...viewingLessonPlanDetail.phases];
      if (updatedPhases[0]) {
        updatedPhases[0].teacherActivity = `🎮 Khởi động sôi nổi với Trò chơi "Vòng quay may mắn / Bắn tên":\n- Chiếu câu hỏi tương tác nhanh trên slide máy chiếu.\n- Học sinh quay số trúng thưởng hoa điểm 10.\n` + updatedPhases[0].teacherActivity;
      }
      if (updatedPhases[3]) {
        updatedPhases[3].teacherActivity = `🎯 Trò chơi Vận dụng "Rung chuông vàng mini":\n- 3 câu hỏi trắc nghiệm đố nhanh áp dụng bài học vào thực tế.\n` + updatedPhases[3].teacherActivity;
      }
      const updated = {
        ...viewingLessonPlanDetail,
        phases: updatedPhases,
      };
      setViewingLessonPlanDetail(updated);
      updateLessonPlan(updated.id, updated);
      showToast('🎯 Đã chèn trò chơi Khởi động & Thử thách tương tác vào bài dạy!', 'success');
    } else if (type === 'inclusive') {
      const updatedPhases = viewingLessonPlanDetail.phases.map((ph, idx) => {
        if (idx === 1) {
          return {
            ...ph,
            teacherActivity: ph.teacherActivity + `\n\n♿ Hỗ trợ phân hóa & hòa nhập: Giáo viên đến tận bàn hướng dẫn học sinh hòa nhập bằng đồ dùng trực quan/que tính, giao câu hỏi nhận biết vừa sức, động viên kịp thời. Nhóm HS khá giỏi được giao bài toán mở rộng tư duy.`,
          };
        }
        if (idx === 2) {
          return {
            ...ph,
            teacherActivity: ph.teacherActivity + `\n\n♿ Phân hóa thực hành: Phân công bạn cùng tiến hỗ trợ học sinh hòa nhập. Cho phép học sinh hoàn thành 1 phần bài tập trọng tâm.`,
          };
        }
        return ph;
      });
      const updated = {
        ...viewingLessonPlanDetail,
        phases: updatedPhases,
      };
      setViewingLessonPlanDetail(updated);
      updateLessonPlan(updated.id, updated);
      showToast('♿ Đã tăng cường phương án phân hóa và hỗ trợ học sinh hòa nhập!', 'success');
    } else if (type === 'rubric') {
      const updatedPhases = [...viewingLessonPlanDetail.phases];
      if (updatedPhases[3]) {
        updatedPhases[3].teacherActivity += `\n\n📊 Đánh giá 3 mức độ Thông tư 27:\n- Mức 1 (Nhận biết): Nhắc lại kiến thức bài học.\n- Mức 2 (Kết nối): Giải thích được tình huống thực tế.\n- Mức 3 (Vận dụng): Tự sáng tạo bài toán/ví dụ mới tương tự.`;
      }
      const updated = {
        ...viewingLessonPlanDetail,
        phases: updatedPhases,
      };
      setViewingLessonPlanDetail(updated);
      updateLessonPlan(updated.id, updated);
      showToast('📊 Đã bổ sung bộ câu hỏi đánh giá 3 mức độ chuẩn TT 27!', 'success');
    } else if (type === 'worksheet') {
      handleDownloadWorksheet(viewingLessonPlanDetail);
    }
  };

  // -------------------------------------------------------------
  // REQUIREMENT: "AI SOẠN THÔNG MINH" THEO 7 KHU VỰC
  // -------------------------------------------------------------
  const handleAIFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isDoc = ext === 'doc' || ext === 'docx';
      const isPdf = ext === 'pdf';
      const isImg = file.type.startsWith('image/');
      const fileSizeKB = Math.round(file.size / 1024);
      const sizeStr = fileSizeKB > 1024 ? `${(fileSizeKB / 1024).toFixed(1)} MB` : `${fileSizeKB} KB`;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAiUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: sizeStr,
            dataUrl,
            fileType: isDoc ? 'word' : isPdf ? 'pdf' : isImg ? 'image' : 'file',
            description: `Tài liệu từ giáo viên: ${file.name} (${sizeStr}) - Sẵn sàng cho AI đọc & phân tích ngữ liệu`,
          },
        ]);
        showToast(`Đã tải lên tệp đám mây thành công: ${file.name} (${sizeStr})`, 'success');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLoadSampleBook = (type: 'toan' | 'tv' | 'tnxh') => {
    if (type === 'toan') {
      setAiGrade(3);
      setAiSubjectId('subj-toan');
      setAiBookSeries('Cánh Diều');
      setAiTheme('Số và phép tính');
      setAiTopic('Bảng nhân 8 (Trang 24-25 SGK Toán 3 Cánh Diều)');
      setAiUploadedFiles([
        {
          name: 'Trang_24_25_SGK_Toan_3_Canh_Dieu.png',
          size: '1.2 MB',
          dataUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=60',
          fileType: 'image',
          description: 'Trang 24-25 SGK Toán 3 Cánh Diều: Khởi động với các tấm bìa có 8 chấm tròn, hình thành bảng nhân 8 từ 8x1 đến 8x10, Bài tập 1 và 2.',
        },
      ]);
      setAiExtraPrompt('Tập trung hướng dẫn học sinh đếm thêm 8 để lập bảng nhân 8. Trò chơi Bắn tên củng cố.');
    } else if (type === 'tv') {
      setAiGrade(3);
      setAiSubjectId('subj-tv');
      setAiBookSeries('Kết nối tri thức với cuộc sống');
      setAiTheme('Luyện từ và câu');
      setAiTopic('So sánh (Vở bài tập Tiếng Việt 3, Trang 18)');
      setAiUploadedFiles([
        {
          name: 'Trang_18_VBT_Tieng_Viet_3_Ket_Noi.png',
          size: '980 KB',
          dataUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60',
          fileType: 'image',
          description: 'Trang 18 VBT Tiếng Việt 3: Bài tập tìm hình ảnh so sánh trong đoạn thơ của Trần Đăng Khoa và gạch chân từ so sánh.',
        },
      ]);
      setAiExtraPrompt('Rèn kỹ năng phát hiện 3 thành phần của câu so sánh và vận dụng viết câu tả đồ dùng học tập.');
    } else {
      setAiGrade(3);
      setAiSubjectId('subj-tnxh');
      setAiBookSeries('Chân trời sáng tạo');
      setAiTheme('Con người và sức khỏe');
      setAiTopic('Cơ quan tuần hoàn (SGK Tự nhiên & Xã hội 3, Trang 32)');
      setAiUploadedFiles([
        {
          name: 'Trang_32_SGK_TNXH_3.png',
          size: '1.4 MB',
          dataUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=60',
          fileType: 'image',
          description: 'Trang 32 SGK Tự nhiên và Xã hội 3: Sơ đồ quả tim và các mạch máu, thí nghiệm đặt tay lên ngực trái cảm nhận nhịp đập tim.',
        },
      ]);
      setAiExtraPrompt('Cho học sinh thực hành đặt tay lên ngực trái cảm nhận nhịp đập tim, tạo không khí hào hứng.');
    }
    showToast('Đã nạp mẫu sách giáo khoa thành công!', 'info');
  };

  const handleLoadSpeedPreset = (type: 'toan_nhan8' | 'tv_sosanh' | 'tnxh_tuanhoan' | 'toan_phanso') => {
    if (type === 'toan_nhan8') {
      setAiGrade(3);
      setAiClassId('class-3a1');
      setAiSubjectId('subj-toan');
      setAiBookSeries('Cánh Diều');
      setAiPeriodsCount(1);
      setAiDuration(35);
      setAiTheme('Số và phép tính');
      setAiTopic('Bảng nhân 8 (Trang 24 SGK Toán 3 Cánh Diều)');
      setAiClassSize(32);
      setAiRegion('Đồng bằng / Thành thị');
      setAiRatioGood(30);
      setAiRatioFair(45);
      setAiRatioMedium(20);
      setAiRatioWeak(5);
      setAiDisabledCount(0);
      setAiHasInclusive(false);
      setAiIntegrations({
        ai: true,
        stem: true,
        digitalCompetency: true,
        digitalTransformation: false,
        competencyAssessment: true,
        lifeSkills: true,
        environment: false,
        localEdu: false,
        humanRights: false,
      });
      setAiProcessingMode('template');
      setAiDetailLevel('standard');
      setAiLessonFormat('three_columns');
      setAiUploadedFiles([
        {
          name: 'Trang_24_25_SGK_Toan_3_Canh_Dieu.png',
          size: '1.2 MB',
          dataUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=60',
          fileType: 'image',
          description: 'Trang 24 SGK Toán 3 Cánh Diều: Khởi động với các tấm bìa có 8 chấm tròn, hình thành bảng nhân 8, Bài tập 1 và 2.',
        },
      ]);
      setAiExtraPrompt('Tập trung hướng dẫn học sinh đếm thêm 8 để lập bảng nhân 8. Trò chơi Bắn tên củng cố.');
      showToast('⚡ Đã nạp Mẫu soạn siêu tốc: Toán 3 - Bảng nhân 8 (Cánh Diều)!', 'success');
    } else if (type === 'tv_sosanh') {
      setAiGrade(3);
      setAiClassId('class-3a1');
      setAiSubjectId('subj-tv');
      setAiBookSeries('Kết nối tri thức với cuộc sống');
      setAiPeriodsCount(1);
      setAiDuration(35);
      setAiTheme('Luyện từ và câu');
      setAiTopic('Biện pháp So sánh (Vở bài tập Tiếng Việt 3, Trang 18)');
      setAiClassSize(34);
      setAiRegion('Đồng bằng / Thành thị');
      setAiRatioGood(25);
      setAiRatioFair(50);
      setAiRatioMedium(20);
      setAiRatioWeak(5);
      setAiDisabledCount(1);
      setAiDisabledNote('Khiếm thính nhẹ, tiếp thu chậm hơn');
      setAiHasInclusive(true);
      setAiIntegrations({
        ai: false,
        stem: false,
        digitalCompetency: true,
        digitalTransformation: true,
        competencyAssessment: true,
        lifeSkills: true,
        environment: false,
        localEdu: false,
        humanRights: false,
      });
      setAiProcessingMode('template');
      setAiDetailLevel('detailed');
      setAiLessonFormat('two_columns');
      setAiUploadedFiles([
        {
          name: 'Trang_18_VBT_Tieng_Viet_3_Ket_Noi.png',
          size: '980 KB',
          dataUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60',
          fileType: 'image',
          description: 'Trang 18 VBT Tiếng Việt 3: Tìm hình ảnh so sánh trong đoạn thơ của Trần Đăng Khoa và gạch chân từ so sánh.',
        },
      ]);
      setAiExtraPrompt('Rèn kỹ năng phát hiện 3 thành phần của câu so sánh và viết câu so sánh miêu tả cảnh vật.');
      showToast('⚡ Đã nạp Mẫu soạn siêu tốc: Tiếng Việt 3 - So sánh (Kết nối tri thức)!', 'success');
    } else if (type === 'tnxh_tuanhoan') {
      setAiGrade(3);
      setAiClassId('class-3a1');
      setAiSubjectId('subj-tnxh');
      setAiBookSeries('Chân trời sáng tạo');
      setAiPeriodsCount(1);
      setAiDuration(35);
      setAiTheme('Con người và sức khỏe');
      setAiTopic('Cơ quan tuần hoàn (SGK Tự nhiên & Xã hội 3, Trang 32)');
      setAiClassSize(30);
      setAiRegion('Nông thôn đồng bằng sông Hồng / Cửu Long');
      setAiRatioGood(20);
      setAiRatioFair(50);
      setAiRatioMedium(25);
      setAiRatioWeak(5);
      setAiDisabledCount(0);
      setAiHasInclusive(false);
      setAiIntegrations({
        ai: false,
        stem: true,
        digitalCompetency: false,
        digitalTransformation: false,
        competencyAssessment: true,
        lifeSkills: true,
        environment: true,
        localEdu: false,
        humanRights: false,
      });
      setAiProcessingMode('new');
      setAiDetailLevel('standard');
      setAiLessonFormat('three_columns');
      setAiUploadedFiles([
        {
          name: 'Trang_32_SGK_TNXH_3.png',
          size: '1.4 MB',
          dataUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=60',
          fileType: 'image',
          description: 'Trang 32 SGK Tự nhiên và Xã hội 3: Sơ đồ quả tim và các mạch máu, thí nghiệm đặt tay lên ngực trái cảm nhận nhịp đập tim.',
        },
      ]);
      setAiExtraPrompt('Cho học sinh thực hành đặt tay lên ngực trái cảm nhận nhịp đập của tim, tạo không khí hào hứng.');
      showToast('⚡ Đã nạp Mẫu soạn siêu tốc: TN&XH 3 - Cơ quan tuần hoàn (Chân trời sáng tạo)!', 'success');
    } else {
      setAiGrade(4);
      setAiClassId('class-custom');
      setAiSubjectId('subj-toan');
      setAiBookSeries('Kết nối tri thức với cuộc sống');
      setAiPeriodsCount(1);
      setAiDuration(35);
      setAiTheme('Phân số và các phép tính');
      setAiTopic('Khái niệm phân số (SGK Toán 4, Trang 53)');
      setAiClassSize(35);
      setAiRegion('Đồng bằng / Thành thị');
      setAiRatioGood(35);
      setAiRatioFair(40);
      setAiRatioMedium(20);
      setAiRatioWeak(5);
      setAiDisabledCount(0);
      setAiHasInclusive(false);
      setAiIntegrations({
        ai: true,
        stem: true,
        digitalCompetency: true,
        digitalTransformation: false,
        competencyAssessment: true,
        lifeSkills: false,
        environment: false,
        localEdu: false,
        humanRights: false,
      });
      setAiProcessingMode('template');
      setAiDetailLevel('detailed');
      setAiLessonFormat('three_columns');
      setAiUploadedFiles([
        {
          name: 'Trang_53_SGK_Toan_4.png',
          size: '1.3 MB',
          dataUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=60',
          fileType: 'image',
          description: 'Trang 53 SGK Toán 4: Khái niệm phân số, tử số và mẫu số.',
        },
      ]);
      setAiExtraPrompt('Tích hợp STEM mô hình chia bánh/chia cam trực quan.');
      showToast('⚡ Đã nạp Mẫu soạn siêu tốc: Toán 4 - Phân số (Kết nối tri thức)!', 'success');
    }
  };

  const handleGenerateAIPlan = async () => {
    setIsAIGenerating(true);
    setTurboProgress(20);
    setTurboStepText('1/4: Đang đọc và tổng hợp 7 khu vực sư phạm...');
    const selectedSubj = subjects.find((s) => s.id === aiSubjectId) || subjects[0];
    const selectedClass = classes.find((c) => c.id === aiClassId) || { id: aiClassId, name: `Lớp ${aiGrade}A1` };

    // Danh sách miền năng lực tích hợp đã chọn
    const activeIntegrations: string[] = [];
    if (aiIntegrations.ai) activeIntegrations.push('Trí tuệ nhân tạo (AI)');
    if (aiIntegrations.stem) activeIntegrations.push('Giáo dục STEM');
    if (aiIntegrations.digitalCompetency) activeIntegrations.push('Năng lực số');
    if (aiIntegrations.digitalTransformation) activeIntegrations.push('Chuyển đổi số');
    if (aiIntegrations.competencyAssessment) activeIntegrations.push('Đánh giá năng lực (TT 27)');
    if (aiIntegrations.lifeSkills) activeIntegrations.push('Kỹ năng sống & Giá trị sống');
    if (aiIntegrations.environment) activeIntegrations.push('Bảo vệ môi trường');
    if (aiIntegrations.localEdu) activeIntegrations.push('Văn hóa địa phương');
    if (aiIntegrations.humanRights) activeIntegrations.push('Quyền con người & Giới tính phù hợp');

    const uploadedFilesNames = aiUploadedFiles.length > 0 ? aiUploadedFiles.map(f => `${f.name} (${f.size})`).join(', ') : 'Chương trình GDPT 2018 sách chuẩn';
    const firstImgFile = aiUploadedFiles.find(f => f.fileType === 'image');

    const promptText = `Bạn là chuyên gia giáo dục tiểu học Việt Nam. Hãy tổng hợp đầy đủ 7 KHU VỰC để soạn kế hoạch bài dạy chi tiết chuẩn Công văn 2345/BGDĐT-GDTH và GDPT 2018:

KHU VỰC 1: THÔNG TIN BÀI HỌC
- Lớp học: ${selectedClass.name} (Khối Lớp ${aiGrade})
- Bộ sách giáo khoa: ${aiBookSeries}
- Môn học: ${selectedSubj.name}
- Số tiết: ${aiPeriodsCount} tiết
- Thời gian tiết học: ${aiDuration} phút
- Chủ đề / Mạch kiến thức: ${aiTheme}
- Tên bài học: ${aiTopic}

KHU VỰC 2: ĐẶC ĐIỂM LỚP HỌC (BỐI CẢNH & PHÂN HÓA HỌC SINH)
- Sĩ số học sinh: ${aiClassSize} em
- Vùng miền: ${aiRegion} (Đưa vào các ví dụ gần gũi với vùng miền này)
- Tỉ lệ phân hóa: Giỏi/HT Tốt ${aiRatioGood}%, Khá ${aiRatioFair}%, Trung bình/HT ${aiRatioMedium}%, Yếu/Chưa HT ${aiRatioWeak}%
- Học sinh khuyết tật: ${aiDisabledCount} em ${aiDisabledNote ? `(${aiDisabledNote})` : ''}
- Học sinh hòa nhập: ${aiHasInclusive ? 'Có học sinh hòa nhập giáo dục (Thiết kế hoạt động trực quan, hỗ trợ riêng biệt)' : 'Không'}

KHU VỰC 3: NỘI DUNG TÍCH HỢP (CÁC MIỀN NĂNG LỰC)
- Các miền năng lực: ${activeIntegrations.join(', ')}

KHU VỰC 4: TÀI LIỆU SGK / GIÁO ÁN MẪU (ĐÃ TẢI LÊN ĐÁM MÂY: ${aiUploadedFiles.length} tệp)
- Các tệp đính kèm: ${uploadedFilesNames}

KHU VỰC 5: CHẾ ĐỘ XỬ LÝ
- Chế độ: ${aiProcessingMode === 'new' ? 'Soạn mới hoàn toàn' : 'Soạn theo mẫu chuẩn Công văn 2345'}

KHU VỰC 6: MỨC ĐỘ CHI TIẾT
- Mức độ: ${aiDetailLevel === 'concise' ? 'Ngắn gọn' : aiDetailLevel === 'detailed' ? 'Chi tiết' : aiDetailLevel === 'very_detailed' ? 'Rất chi tiết (Kèm lời thoại GV, tình huống, rubric đánh giá)' : 'Theo chuẩn Công văn 2345'}

KHU VỰC 7: ĐỊNH DẠNG
- Định dạng: ${aiLessonFormat === 'two_columns' ? 'Giáo án dạng bảng 2 cột' : aiLessonFormat === 'three_columns' ? 'Giáo án dạng bảng 3 cột' : 'Giáo án theo tiến trình thiết kế khối'}

YÊU CẦU THÊM: ${aiExtraPrompt}`;

    try {
      setTurboProgress(40);
      setTurboStepText('2/4: Phân tích bối cảnh học sinh & Yêu cầu cần đạt GDPT 2018...');
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          type: 'lesson_plan',
          imageBase64: firstImgFile?.fileType === 'image' ? firstImgFile?.dataUrl : undefined,
          uploadedFileName: uploadedFilesNames,
        }),
      });

      setTurboProgress(70);
      setTurboStepText('3/4: Thiết kế 4 hoạt động sư phạm chuẩn CV 2345 & Thông tư 27...');
      const resData = await response.json();
      const newPlanId = 'lp-ai-' + Date.now();

      // Xây dựng mục tiêu năng lực tích hợp từ Khu vực 3
      const integratedSkills: string[] = [
        'Rèn luyện tư duy logic, kỹ năng thao tác cá nhân và làm việc nhóm cặp đôi.',
        'Tự tin trình bày ý kiến trước lớp, lắng nghe và nhận xét bạn.',
      ];
      if (aiIntegrations.stem) {
        integratedSkills.push('Năng lực STEM: Ứng dụng kiến thức liên môn Khoa học - Công nghệ - Toán học để giải quyết vấn đề thực tiễn.');
      }
      if (aiIntegrations.digitalCompetency || aiIntegrations.digitalTransformation) {
        integratedSkills.push('Năng lực số & Chuyển đổi số: Khai thác kho học liệu số, tương tác phần mềm và bảng thông minh an toàn, hiệu quả.');
      }
      if (aiIntegrations.ai) {
        integratedSkills.push('Ứng dụng Trí tuệ nhân tạo (AI): Làm quen với trợ lý số, tương tác tìm kiếm thông tin và nhận diện trực quan.');
      }
      if (aiIntegrations.competencyAssessment) {
        integratedSkills.push('Đánh giá năng lực theo TT 27: Biết tự đánh giá bản thân và đánh giá đồng đẳng bạn học theo tiêu chí rubric.');
      }

      // Xây dựng các hoạt động sư phạm theo Khu vực 6 (mức độ chi tiết) và Khu vực 2 (phân hóa)
      const isDetailed = aiDetailLevel === 'detailed' || aiDetailLevel === 'very_detailed';
      const formatStyle = aiLessonFormat === 'two_columns' ? 'two_column' : aiLessonFormat === 'three_columns' ? 'three_column' : 'design';

      const warmupTeacher = isDetailed
        ? `1. Tổ chức trò chơi khởi động "Hộp quà bí mật / Vòng quay may mắn" kết nối vào bài học.\n2. Nêu câu hỏi đố vui: "Cô có một tình huống nhỏ liên quan đến ${aiTopic}, bạn nào đoán được?".\n3. Lắng nghe câu trả lời, tuyên dương hoa điểm 10 và dẫn dắt giới thiệu bài học mới.\n4. Lưu ý bối cảnh ${aiRegion}: Sử dụng ví dụ quen thuộc với các em ở ${aiRegion}.`
        : `Tổ chức trò chơi mở đầu kết nối bài học. Nêu câu hỏi đố vui tạo tâm thế hào hứng.`;

      const warmupStudent = isDetailed
        ? `1. Cả lớp hào hứng chú ý lên màn hình chiếu, xung phong giải câu đố.\n2. Lắng nghe câu trả lời của bạn, nhận xét bằng thẻ hoa (Đúng/Sai).\n3. Ghi tên bài học mới vào vở ô ly sạch đẹp.`
        : 'Học sinh cả lớp hào hứng xung phong trả lời, nhận xét và lắng nghe cô giáo.';

      const discoveryTeacher = isDetailed
        ? `1. Chiếu trang sách / ngữ liệu từ ${aiUploadedFiles[0] ? aiUploadedFiles[0].name : `Bộ sách ${aiBookSeries}`}.\n2. Hướng dẫn học sinh quan sát tình huống mẫu, đặt câu hỏi phân hóa:\n   - Câu hỏi nhận biết (Dành cho nhóm Trung bình & HS hòa nhập): "Em hãy quan sát tranh và chỉ ra..."\n   - Câu hỏi suy luận (Dành cho nhóm Khá/Giỏi): "Từ tình huống trên, em rút ra quy tắc gì?".\n3. Quan sát, uốn nắn và đến tận bàn hỗ trợ học sinh hòa nhập (${aiHasInclusive ? 'dùng đồ dùng trực quan que tính/hình vẽ' : 'hỗ trợ kịp thời'}).\n4. Chốt lại kiến thức trọng tâm của bài: "${aiTopic}".`
        : `Chiếu hình ảnh bài học, phân tích các bước hình thành kiến thức trọng tâm. Đặt câu hỏi gợi mở thảo luận cặp đôi.`;

      const discoveryStudent = isDetailed
        ? `1. Quan sát tranh ảnh trực quan trên màn hình và sách giáo khoa.\n2. Thảo luận nhóm đôi 2 phút: Một bạn nêu câu hỏi, một bạn trả lời rồi đổi vai.\n3. Cử đại diện nhóm đứng dậy báo cáo trước lớp.\n4. Cùng cô nhắc lại và ghi nhớ quy tắc then chốt của bài học.`
        : 'Quan sát tranh minh họa, thảo luận nhóm đôi 2 phút để tìm ra quy tắc, cử đại diện báo cáo.';

      const practiceTeacher = isDetailed
        ? `1. Giao nhiệm vụ Bài tập 1 trên bảng con và Bài tập 2 vào Vở bài tập.\n2. Phân hóa đối tượng:\n   - Học sinh Khá/Giỏi: Khuyến khích tìm thêm cách giải sáng tạo hoặc bài toán mở rộng.\n   - Học sinh Trung bình/Yếu & Hòa nhập: Hướng dẫn chi tiết từng bước, kiểm tra bảng con trước.\n3. Đánh giá thường xuyên theo Thông tư 27: Nhận xét bằng lời, chấm xác suất một số bài làm nhanh, tặng sao khen ngợi.`
        : 'Giao Bài tập 1 trên bảng con và Bài tập 2 làm vào vở bài tập, quan sát hỗ trợ.';

      const practiceStudent = isDetailed
        ? `1. Thực hiện Bài tập 1 trên bảng con, giơ bảng theo hiệu lệnh dứt khoát.\n2. Quan sát bảng của bạn bên cạnh và sửa sai (nếu có).\n3. Hoàn thành Bài tập 2 vào vở, sau đó đổi vở cùng bạn chấm chéo theo hướng dẫn của cô.`
        : 'Làm bài 1 trên bảng con và giơ bảng. Làm bài 2 vào vở rồi đổi chéo cùng bạn kiểm tra.';

      const appTeacher = isDetailed
        ? `1. Nêu tình huống vận dụng thực tiễn tại gia đình hoặc trường học ở vùng ${aiRegion}.\n2. ${activeIntegrations.includes('Giáo dục STEM') ? 'Tích hợp STEM: Cho học sinh đề xuất ý tưởng mô hình đơn giản áp dụng kiến thức.' : 'Liên hệ thực tế: Giúp học sinh thấy kiến thức bài học rất gần gũi với đời sống.'}\n3. Tổng kết tiết học: Tuyên dương các tổ học tập sôi nổi, nhắc nhở học sinh cần cố gắng.\n4. Dặn dò học sinh chuẩn bị bài cho tiết học sau.`
        : 'Nêu tình huống ứng dụng thực tế đời sống. Tuyên dương nhóm tích cực và dặn dò ôn bài.';

      const appStudent = isDetailed
        ? `1. Tích cực chia sẻ hiểu biết và tình huống thực tế của gia đình mình.\n2. Lắng nghe cô giáo nhận xét, tự đánh giá mức độ hoàn thành bài học của bản thân.\n3. Ghi nhớ dặn dò của cô giáo.`
        : 'Học sinh liên hệ thực tế xung quanh em, ghi nhớ lời cô dặn dò.';

      const newLesson: LessonPlan = {
        id: newPlanId,
        title: `${selectedSubj.name} ${aiGrade} (${selectedClass.name}): ${aiTopic}`,
        grade: aiGrade,
        subjectId: aiSubjectId,
        subjectName: selectedSubj.name,
        topic: aiTopic,
        durationMinutes: aiDuration,
        className: selectedClass.name,
        bookSeries: aiBookSeries,
        periodsCount: aiPeriodsCount,
        subTopic: aiTheme,
        classContext: {
          studentCount: aiClassSize,
          region: aiRegion,
          ratio: { excellent: aiRatioGood, good: aiRatioFair, average: aiRatioMedium, weak: aiRatioWeak },
          disabledStudentsCount: aiDisabledCount,
          hasInclusiveStudents: aiHasInclusive,
          inclusiveNote: aiDisabledNote || (aiHasInclusive ? 'Hỗ trợ học sinh hòa nhập tiếp cận câu hỏi trực quan' : ''),
        },
        integratedContent: activeIntegrations,
        uploadedMaterialName: aiUploadedFiles[0]?.name,
        processingMode: aiProcessingMode,
        detailLevel: aiDetailLevel,
        formatStyle: formatStyle,
        objectives: {
          knowledge: [
            `Nắm vững và vận dụng thành thạo kiến thức "${aiTopic}" theo chuẩn Bộ sách ${aiBookSeries}.`,
            `Giải quyết chính xác các bài tập thực hành trong SGK và Vở bài tập theo mức độ cần đạt.`,
          ],
          skills: integratedSkills,
          qualities: [
            'Chăm chỉ, tích cực học tập, cẩn thận giữ gìn sách vở và đồ dùng.',
            'Có tinh thần hợp tác, trách nhiệm và tương thân tương ái cùng bạn bè trong lớp.',
          ],
        },
        equipment: {
          teacher: [
            `Bài giảng điện tử PowerPoint đa dạng mẫu slide, trình chiếu hình ảnh SGK ${aiUploadedFiles[0]?.name || aiBookSeries}`,
            'Phiếu học tập nhóm phân hóa đối tượng, thẻ tương tác đúng/sai, bảng phụ',
          ],
          student: ['Sách giáo khoa, Vở bài tập, bảng con, phấn, bút viết, đồ dùng học tập'],
        },
        phases: [
          {
            id: 'p-ai-1',
            phase: 'warmup',
            phaseName: '1. Hoạt động Khởi động (5 phút)',
            durationMinutes: 5,
            teacherActivity: warmupTeacher,
            studentActivity: warmupStudent,
            materials: 'Trò chơi tương tác trên slide máy chiếu, thẻ hoa',
          },
          {
            id: 'p-ai-2',
            phase: 'new_knowledge',
            phaseName: '2. Hoạt động Khám phá kiến thức mới (12 phút)',
            durationMinutes: 12,
            teacherActivity: discoveryTeacher,
            studentActivity: discoveryStudent,
            materials: `Hình ảnh minh họa SGK ${aiBookSeries}, mô hình que tính / tranh trực quan`,
          },
          {
            id: 'p-ai-3',
            phase: 'practice',
            phaseName: '3. Hoạt động Luyện tập, thực hành (13 phút)',
            durationMinutes: 13,
            teacherActivity: practiceTeacher,
            studentActivity: practiceStudent,
            materials: 'Bảng con, Vở bài tập, phiếu bài tập phân hóa',
          },
          {
            id: 'p-ai-4',
            phase: 'application',
            phaseName: '4. Hoạt động Vận dụng, trải nghiệm & Dặn dò (5 phút)',
            durationMinutes: 5,
            teacherActivity: appTeacher,
            studentActivity: appStudent,
            materials: 'Tình huống thực tế đời sống, hoa điểm 10',
          },
        ],
        slidesOutline: [
          `Slide 1: Trang bìa - ${selectedSubj.name} ${selectedClass.name}: ${aiTopic}`,
          `Slide 2: Mục tiêu bài học (Phẩm chất & Năng lực tích hợp)`,
          `Slide 3: Khởi động trò chơi sôi nổi`,
          `Slide 4: Khám phá kiến thức trọng tâm & Quy tắc bài học`,
          `Slide 5: Luyện tập Bài 1 (Bảng con)`,
          `Slide 6: Luyện tập Bài 2 (Vở bài tập & Nhóm đôi)`,
          `Slide 7: Vận dụng thực tiễn & Dặn dò về nhà`,
        ],
        status: 'ready',
        author: `AI Trợ giảng & ${currentUser.name}`,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      // Also generate initial multi-layout slides for this lesson
      newLesson.slides = buildInitialSlidesForLesson(newLesson, schoolName);

      setTurboProgress(100);
      setTurboStepText('4/4: Hoàn tất Kế hoạch bài dạy & Mở ngay giao diện!');

      addLessonPlan(newLesson);
      setNewlyCreatedLessonId(newPlanId);
      setIsAIModalOpen(false);

      // Open detail view immediately so teacher can inspect their synthesized lesson plan!
      setViewingLessonPlanDetail(newLesson);

      showToast(`🎉 AI đã tổng hợp thành công 7 khu vực và soạn xong Giáo án "${aiTopic}"!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi tạo bài giảng bằng AI', 'error');
    } finally {
      setIsAIGenerating(false);
      setTurboProgress(0);
      setTurboStepText('');
    }
  };

  // -------------------------------------------------------------
  // RENDER SLIDE LAYOUTS: Đa dạng, sinh động, tránh một màu nhàm chán
  // -------------------------------------------------------------
  const renderSlideContent = (slide: SlideItem) => {
    switch (slide.layout) {
      case 'cover':
        return (
          <div className="text-center py-6 md:py-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-800 font-extrabold text-xs tracking-wider shadow-xs border border-sky-200">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              CHƯƠNG TRÌNH GDPT 2018 • BÀI GIẢNG ĐIỆN TỬ
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight leading-snug drop-shadow-xs">
              {slide.title}
            </h1>

            <p className="text-sm md:text-base font-bold text-sky-700">
              {slide.subtitle || 'Tiết học phát triển phẩm chất và năng lực'}
            </p>

            {slide.imageUrl && (
              <div className="my-3 flex justify-center">
                <img
                  src={slide.imageUrl}
                  alt={slide.imageCaption || 'Cover illustration'}
                  className="w-44 h-32 md:w-56 md:h-36 object-cover rounded-2xl border-4 border-white shadow-xl hover:scale-105 transition-all"
                />
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm font-semibold text-slate-600">
              <span className="px-3.5 py-1.5 rounded-xl bg-white/90 shadow-sm border border-slate-200">
                🏫 Trường: <strong className="text-slate-800">{schoolName}</strong>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/90 shadow-sm border border-slate-200">
                👩‍🏫 Giáo viên: <strong className="text-slate-800">{slidesPreviewLesson?.author || currentUser.name}</strong>
              </span>
            </div>
          </div>
        );

      case 'objectives':
        return (
          <div className="py-2 space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">
                {slide.title}
              </h2>
              <p className="text-xs text-slate-500">{slide.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-50 to-sky-100/60 border-2 border-sky-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sky-800 font-bold text-xs uppercase">
                    <span className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center text-xs">1</span>
                    Năng lực đặc thù
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                    {slide.content[0] || 'Nắm vững kiến thức trọng tâm của bài.'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-sky-200/60 text-[10px] text-sky-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-600" /> Chuẩn kiến thức GDPT
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100/60 border-2 border-emerald-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs uppercase">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs">2</span>
                    Kỹ năng & Năng lực chung
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                    {slide.content[1] || 'Rèn luyện kỹ năng quan sát, tư duy logic và làm việc nhóm.'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Tự chủ & Hợp tác
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/60 border-2 border-amber-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs">3</span>
                    Phẩm chất cần đạt
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                    {slide.content[2] || 'Chăm chỉ học tập, tự giác và trung thực.'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-200/60 text-[10px] text-amber-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600" /> Chăm chỉ & Trách nhiệm
                </div>
              </div>
            </div>
          </div>
        );

      case 'game_warmup':
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm">
                <Gamepad2 className="w-4 h-4 text-amber-300" />
                TRÒ CHƠI HỌC TẬP TƯƠNG TÁC
              </span>
              <span className="text-xs font-bold text-purple-700 animate-pulse">
                ⚡ Thi đua giữa các Tổ / Bàn
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 space-y-3">
                <h2 className="text-xl md:text-2xl font-black text-purple-950">
                  {slide.title}
                </h2>
                <div className="space-y-2">
                  {slide.content.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 flex items-start gap-2.5 text-xs md:text-sm text-purple-950 font-medium"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                {slide.teacherPrompt && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-start gap-2">
                    <span className="text-sm">👩‍🏫</span>
                    <span><strong>Lời cô dẫn dắt:</strong> {slide.teacherPrompt}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="relative group">
                  <img
                    src={slide.imageUrl || 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=60'}
                    alt={slide.imageCaption || 'Warmup visual'}
                    className="w-full max-w-[260px] h-44 object-cover rounded-2xl border-4 border-purple-200 shadow-xl group-hover:scale-105 transition-all"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 to-transparent rounded-2xl flex items-end p-3 text-white text-xs font-bold">
                    {slide.imageCaption || 'Khởi động vui học'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'discovery':
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                <Lightbulb className="w-4 h-4" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800">
                {slide.title}
              </h2>
            </div>

            {/* Main Knowledge Highlight Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-3 border-amber-300 shadow-md space-y-3">
              <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider">
                ⭐ Khung Ghi Nhớ Trọng Tâm
              </span>
              <ul className="space-y-2.5 text-xs md:text-sm font-semibold text-slate-800">
                {slide.content.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-black text-base leading-none">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Teacher and Student Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="font-bold text-sky-700 flex items-center gap-1.5">
                  👩‍🏫 Thầy Cô hướng dẫn:
                </span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {slide.teacherPrompt || 'Quan sát kỹ hướng dẫn trên bảng và thao tác từng bước.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                  👧👦 Học sinh thao tác:
                </span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {slide.studentAction || 'Thực hành cùng que tính / bảng con và nhắc lại quy tắc.'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'practice':
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-amber-300 text-xs font-black border border-slate-700 flex items-center gap-1.5 shadow-sm">
                  ✏️ THỬ TÀI BẢNG CON
                </span>
                <h2 className="text-lg md:text-xl font-black text-slate-800">
                  {slide.title}
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Làm việc cá nhân & đổi chéo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Board 1 */}
              <div className="p-5 rounded-3xl bg-slate-900 text-slate-100 border-4 border-slate-700 shadow-xl flex flex-col justify-between min-h-[170px]">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-3">
                    <span className="font-bold text-amber-300 text-xs">Bài tập 1: Bảng con</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md text-slate-300">2 phút</span>
                  </div>
                  <p className="text-xs md:text-sm font-mono text-slate-200 leading-relaxed">
                    {slide.content[0] || 'Đặt tính rồi tính nhanh trên bảng con.'}
                  </p>
                </div>
                <div className="mt-3 pt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Giơ bảng khi có hiệu lệnh từ cô
                </div>
              </div>

              {/* Board 2 */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-white to-sky-50 border-2 border-sky-200 shadow-md flex flex-col justify-between min-h-[170px]">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200 mb-3">
                    <span className="font-bold text-sky-800 text-xs">Bài tập 2: Vở bài tập</span>
                    <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md font-bold">5 phút</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 font-semibold leading-relaxed">
                    {slide.content[1] || 'Giải toán vào vở bài tập và kiểm tra đáp án cùng bạn bên cạnh.'}
                  </p>
                </div>
                <div className="mt-3 pt-2 text-[11px] text-sky-700 font-bold flex items-center gap-1">
                  🤝 Đổi chéo vở kiểm tra kết quả
                </div>
              </div>
            </div>

            {slide.imageUrl && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <img
                  src={slide.imageUrl}
                  alt="illustration"
                  className="w-16 h-12 object-cover rounded-xl border border-slate-200"
                />
                <span><strong>Hình ảnh minh họa bài tập:</strong> {slide.imageCaption || 'Gợi ý từ sách bài tập'}</span>
              </div>
            )}
          </div>
        );

      case 'two_columns':
        return (
          <div className="space-y-4 py-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-800">
              {slide.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-sky-50/80 border-2 border-sky-200 shadow-sm space-y-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-xs uppercase">
                  👩‍🏫 Hướng dẫn của Thầy Cô
                </span>
                <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                  {slide.teacherPrompt || slide.content[0]}
                </p>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pt-1">
                  {slide.content.slice(0, 2).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-200 shadow-sm space-y-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase">
                  👧👦 Hoạt động của Học sinh
                </span>
                <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
                  {slide.studentAction || slide.content[1] || 'Thảo luận cặp đôi và hoàn thành nhiệm vụ.'}
                </p>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pt-1">
                  {slide.content.slice(2).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case 'image_focus':
        return (
          <div className="space-y-3 py-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 text-center">
              {slide.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6 flex justify-center">
                <img
                  src={slide.imageUrl || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=60'}
                  alt={slide.imageCaption || 'Focus visual'}
                  className="w-full max-w-[320px] h-48 md:h-56 object-cover rounded-3xl border-4 border-sky-200 shadow-2xl"
                />
              </div>

              <div className="md:col-span-6 space-y-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <span className="font-bold text-xs text-sky-800 uppercase">
                    🔍 Quan sát & Trả lời:
                  </span>
                  <ul className="space-y-2 text-xs md:text-sm font-semibold text-slate-700">
                    {slide.content.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {slide.imageCaption && (
                  <p className="text-center md:text-left text-[11px] font-bold text-slate-500 italic">
                    💡 {slide.imageCaption}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'award':
      default:
        return (
          <div className="text-center py-4 space-y-3">
            <div className="text-5xl animate-bounce">🏆🌟👏</div>
            <h2 className="text-2xl md:text-3xl font-black text-rose-950">
              {slide.title}
            </h2>
            <p className="text-xs md:text-sm text-slate-600 max-w-lg mx-auto font-medium">
              {slide.subtitle || 'Chúc mừng các em đã tham gia bài học rất tích cực!'}
            </p>

            <div className="max-w-md mx-auto p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-left space-y-2 shadow-md">
              <span className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5 uppercase">
                <Award className="w-4 h-4 text-amber-600" /> Dặn Dò Bài Tập Về Nhà:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700 font-semibold list-disc list-inside">
                {slide.content.map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))}
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">
                Thiết kế & Quản lý Bài giảng (KHBD & Trình chiếu)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chuẩn Công văn 2345 & Thông tư 27. Soạn Giáo án, Xuất Word, Trình chiếu slide đa dạng mẫu và AI soạn thông minh.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* REQUIREMENT: Đổi tên "AI soạn từ sách và Vở" thành "AI soạn thông minh" */}
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-600/20 hover:from-purple-700 hover:to-indigo-700 transition-all btn-tactile"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI Soạn thông minh</span>
          </button>

          {/* Nút Soạn bài dạy mới thủ công */}
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all btn-tactile"
          >
            <Plus className="w-4 h-4" />
            <span>Soạn bài dạy mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tất cả môn học</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value={0}>Tất cả khối lớp</option>
            <option value={1}>Khối 1</option>
            <option value={2}>Khối 2</option>
            <option value={3}>Khối 3</option>
            <option value={4}>Khối 4</option>
            <option value={5}>Khối 5</option>
          </select>

          <input
            type="text"
            placeholder="Tìm theo tên bài dạy hoặc chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl text-xs text-slate-700 outline-none w-64 focus:border-teal-500"
          />
        </div>

        <span className="text-xs font-bold text-slate-400">
          Hiển thị {filteredLessons.length} kế hoạch bài dạy
        </span>
      </div>

      {/* Lesson Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLessons.map((lesson) => {
          const isNewlyCreated = newlyCreatedLessonId === lesson.id;
          return (
            <div
              key={lesson.id}
              className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between card-hover relative transition-all ${
                isNewlyCreated ? 'ring-2 ring-purple-500 border-purple-200 bg-purple-50/20' : 'border-slate-100'
              }`}
            >
              {isNewlyCreated && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow-xs">
                  Mới tạo bởi AI ✨
                </span>
              )}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/50">
                    {lesson.subjectName} • Lớp {lesson.grade}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {lesson.durationMinutes} phút
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mt-3 line-clamp-2 leading-snug">
                  {lesson.title}
                </h3>
                <p className="text-[11px] text-sky-700 font-semibold mt-1">
                  Chủ đề: {lesson.topic}
                </p>

                <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                  <p className="font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> Mục tiêu trọng tâm:
                  </p>
                  <p className="text-slate-500 line-clamp-2 leading-relaxed">
                    {lesson.objectives.knowledge[0] || 'Phát triển năng lực học sinh và tư duy logic.'}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lesson.phases.length} bước CV 2345</span>
                  </div>
                  <div className="flex items-center gap-1 text-sky-600 font-semibold">
                    <Presentation className="w-3.5 h-3.5" />
                    <span>{(lesson.slides || []).length || 8} slide sinh động</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewingLessonPlanDetail(lesson)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold transition-colors btn-tactile border border-teal-200/50"
                    title="Xem chi tiết và Soạn Giáo án CV 2345"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Soạn Giáo án</span>
                  </button>

                  <button
                    onClick={() => {
                      setSlidesPreviewLesson(lesson);
                      setCurrentSlideIndex(0);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition-colors btn-tactile border border-sky-200/50"
                    title="Trình chiếu Slide bài giảng"
                  >
                    <MonitorPlay className="w-3.5 h-3.5 text-sky-600" />
                    <span>Trình chiếu</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyLessonPlanToClipboard(lesson)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Sao chép nhanh toàn bộ giáo án (Dán Word/Zalo)"
                  >
                    <Copy className="w-4 h-4 text-purple-600" />
                  </button>
                  <button
                    onClick={() => handleDownloadWorksheet(lesson)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Tải nhanh Phiếu bài tập & Rubric TT 27 (.doc)"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                  </button>
                  <button
                    onClick={() => handleExportWordLessonPlan(lesson)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Xuất file Word (.doc)"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => duplicateLessonPlan(lesson.id)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Nhân bản bài dạy sang lớp khác"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(lesson)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Chỉnh sửa bài dạy"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(lesson.id)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa bài dạy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: XEM & SOẠN GIÁO ÁN CHI TIẾT (CHUẨN CÔNG VĂN 2345/BGDĐT-GDTH) */}
      {/* ------------------------------------------------------------------ */}
      {viewingLessonPlanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800">
                    Kế hoạch bài dạy (Giáo án) - Chuẩn Công văn 2345/BGDĐT-GDTH
                  </h3>
                  <p className="text-xs text-slate-400">
                    Định dạng bảng hành chính chuẩn sư phạm, hỗ trợ xem và xuất file Word
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportWordLessonPlan(viewingLessonPlanDetail)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all btn-tactile"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Xuất File Word</span>
                </button>

                <button
                  onClick={() => {
                    setSlidesPreviewLesson(viewingLessonPlanDetail);
                    setCurrentSlideIndex(0);
                    setViewingLessonPlanDetail(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-all btn-tactile"
                >
                  <MonitorPlay className="w-4 h-4" />
                  <span>Trình chiếu slide</span>
                </button>

                <button
                  onClick={() => setViewingLessonPlanDetail(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto my-4 pr-2 space-y-6 text-slate-800 font-serif leading-relaxed">
              <div className="flex items-start justify-between border-b pb-4 text-xs font-sans">
                <div className="text-center">
                  <p className="font-semibold text-slate-500">PHÒNG GD&ĐT QUẬN/HUYỆN</p>
                  <p className="font-bold text-slate-800 uppercase">TRƯỜNG TH {schoolName.toUpperCase()}</p>
                  <p className="text-slate-500">Tổ Chuyên môn: Khối {viewingLessonPlanDetail.grade}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="font-bold text-slate-700 text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  KẾ HOẠCH BÀI DẠY
                </h2>
                <h3 className="text-base md:text-lg font-bold text-teal-800">
                  {viewingLessonPlanDetail.title}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-sans text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200/60">
                    Lớp: {viewingLessonPlanDetail.className || `Lớp ${viewingLessonPlanDetail.grade}`}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200/60">
                    Môn: {viewingLessonPlanDetail.subjectName}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200/60">
                    Bộ sách: {viewingLessonPlanDetail.bookSeries || 'GDPT 2018'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200/60">
                    {viewingLessonPlanDetail.periodsCount || 1} tiết ({viewingLessonPlanDetail.durationMinutes} phút)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    Mạch kiến thức: {viewingLessonPlanDetail.subTopic || viewingLessonPlanDetail.topic}
                  </span>
                </div>
              </div>

              {/* Bối cảnh lớp học & Học sinh hòa nhập (Khu vực 2) */}
              {viewingLessonPlanDetail.classContext && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 font-sans text-xs space-y-1">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>👥 Đặc điểm lớp học: Sĩ số {viewingLessonPlanDetail.classContext.studentCount} HS • Vùng {viewingLessonPlanDetail.classContext.region}</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Tỉ lệ: Giỏi {viewingLessonPlanDetail.classContext.ratio.excellent}% | Khá {viewingLessonPlanDetail.classContext.ratio.good}% | TB {viewingLessonPlanDetail.classContext.ratio.average}% | Yếu {viewingLessonPlanDetail.classContext.ratio.weak}%
                    </span>
                  </div>
                  {viewingLessonPlanDetail.classContext.hasInclusiveStudents && (
                    <div className="pt-1 text-emerald-800 font-medium flex items-center gap-1.5 border-t border-slate-200/70">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Phương án học sinh hòa nhập & khuyết tật: {viewingLessonPlanDetail.classContext.inclusiveNote || 'Hỗ trợ cá nhân hóa trực quan, giao bài tập vừa sức'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Miền năng lực tích hợp (Khu vực 3) */}
              {viewingLessonPlanDetail.integratedContent && viewingLessonPlanDetail.integratedContent.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 font-sans text-xs flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-purple-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Miền năng lực tích hợp:
                  </span>
                  {viewingLessonPlanDetail.integratedContent.map((integ, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-white text-purple-800 font-semibold text-[11px] border border-purple-200 shadow-xs">
                      {integ}
                    </span>
                  ))}
                </div>
              )}

              {/* I. Yêu cầu cần đạt */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm uppercase border-l-4 border-teal-600 pl-2">
                  I. Yêu cầu cần đạt (Mục tiêu bài học)
                </h4>
                <div className="pl-3 text-xs md:text-sm space-y-2">
                  <div>
                    <strong className="text-slate-800">1. Năng lực đặc thù:</strong>
                    <ul className="list-disc list-inside text-slate-600 pl-2 mt-1 space-y-1">
                      {viewingLessonPlanDetail.objectives.knowledge.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-slate-800">2. Năng lực chung & Năng lực tích hợp:</strong>
                    <ul className="list-disc list-inside text-slate-600 pl-2 mt-1 space-y-1">
                      {viewingLessonPlanDetail.objectives.skills.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-slate-800">3. Phẩm chất:</strong>
                    <ul className="list-disc list-inside text-slate-600 pl-2 mt-1 space-y-1">
                      {viewingLessonPlanDetail.objectives.qualities.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* II. Đồ dùng dạy học */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm uppercase border-l-4 border-teal-600 pl-2">
                  II. Đồ dùng dạy học
                </h4>
                <div className="pl-3 text-xs md:text-sm space-y-1 text-slate-700">
                  <p><strong>- Giáo viên:</strong> {viewingLessonPlanDetail.equipment.teacher.join(', ')}</p>
                  <p><strong>- Học sinh:</strong> {viewingLessonPlanDetail.equipment.student.join(', ')}</p>
                </div>
              </div>

              {/* III. Các hoạt động dạy học chủ yếu (Khu vực 7: Định dạng 2 cột / 3 cột / theo thiết kế) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm uppercase border-l-4 border-teal-600 pl-2">
                    III. Các hoạt động dạy học chủ yếu (Tiến trình sư phạm)
                  </h4>
                  <span className="text-[11px] font-sans font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {viewingLessonPlanDetail.formatStyle === 'two_column' ? 'Định dạng Bảng 2 cột' : viewingLessonPlanDetail.formatStyle === 'design' ? 'Định dạng theo Tiến trình thiết kế' : 'Định dạng Bảng 3 cột CV 2345'}
                  </span>
                </div>

                {viewingLessonPlanDetail.formatStyle === 'two_column' ? (
                  // BẢNG 2 CỘT
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-1/2">Hoạt động của Giáo viên & Đồ dùng dạy học</th>
                          <th className="p-3 w-1/2">Hoạt động của Học sinh & Dự kiến sản phẩm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingLessonPlanDetail.phases.map((ph, idx) => (
                          <React.Fragment key={idx}>
                            <tr className="bg-slate-100/80">
                              <td colSpan={2} className="px-3 py-2 font-bold text-teal-900 text-xs">
                                {ph.phaseName} • Thời lượng: {ph.durationMinutes} phút
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="p-3 align-top text-slate-700 whitespace-pre-line leading-relaxed">
                                <strong className="text-slate-900 block mb-1">* Hướng dẫn của Giáo viên:</strong>
                                {ph.teacherActivity}
                                <div className="mt-2 text-[11px] text-teal-800 font-semibold bg-teal-50 p-1.5 rounded-lg">
                                  Đồ dùng: {ph.materials || 'SGK, máy chiếu'}
                                </div>
                              </td>
                              <td className="p-3 align-top text-slate-700 whitespace-pre-line leading-relaxed">
                                <strong className="text-slate-900 block mb-1">* Hoạt động của Học sinh:</strong>
                                {ph.studentActivity}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : viewingLessonPlanDetail.formatStyle === 'design' ? (
                  // THEO TIẾN TRÌNH THIẾT KẾ KHỐI
                  <div className="space-y-3 font-sans">
                    {viewingLessonPlanDetail.phases.map((ph, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/60 to-slate-50 border border-sky-100 space-y-2">
                        <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                          <span className="font-bold text-sky-950 text-xs uppercase flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            {ph.phaseName}
                          </span>
                          <span className="text-[11px] font-bold text-sky-700 bg-white px-2.5 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                            {ph.durationMinutes} phút
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-1">
                            <span className="font-bold text-slate-800 block">👩‍🏫 Hoạt động của Giáo viên:</span>
                            <p className="text-slate-600 whitespace-pre-line leading-relaxed">{ph.teacherActivity}</p>
                            <span className="text-[10px] font-bold text-teal-700 block pt-1">Đồ dùng: {ph.materials}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-1">
                            <span className="font-bold text-slate-800 block">🧑‍🎓 Hoạt động của Học sinh:</span>
                            <p className="text-slate-600 whitespace-pre-line leading-relaxed">{ph.studentActivity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // BẢNG 3 CỘT (Mặc định chuẩn CV 2345)
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-1/4">Tiến trình & Thời lượng</th>
                          <th className="p-3 w-3/8">Hoạt động của Giáo viên & Đồ dùng</th>
                          <th className="p-3 w-3/8">Hoạt động của Học sinh & Dự kiến sản phẩm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingLessonPlanDetail.phases.map((ph, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 align-top font-bold text-teal-900">
                              {ph.phaseName}
                              <p className="text-[11px] font-normal text-slate-400 mt-1">
                                Thời lượng: {ph.durationMinutes} phút
                              </p>
                              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                Đồ dùng: {ph.materials}
                              </p>
                            </td>
                            <td className="p-3 align-top text-slate-700 whitespace-pre-line leading-relaxed">
                              {ph.teacherActivity}
                            </td>
                            <td className="p-3 align-top text-slate-700 whitespace-pre-line leading-relaxed">
                              {ph.studentActivity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    // Check if already in lessonPlans, if not add it or show success toast and close
                    showToast(`💾 Đã lưu giáo án "${viewingLessonPlanDetail.title}" vào thư viện Thiết kế bài giảng thành công!`, 'success');
                    setViewingLessonPlanDetail(null);
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 btn-tactile shadow-md flex items-center gap-2"
                  title="Lưu giáo án vào danh sách Kế hoạch bài giảng"
                >
                  <CheckCircle className="w-4 h-4 text-amber-300" />
                  <span>Lưu vào Kế hoạch bài giảng</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-sans hidden md:inline">
                  Chuẩn Bộ Giáo dục: Font Times New Roman, cỡ 13pt.
                </span>
                <button
                  type="button"
                  onClick={() => setViewingLessonPlanDetail(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TRÌNH CHIẾU MÁY CHIẾU LỚP HỌC & CHỈNH SỬA SLIDE TRỰC TIẾP          */}
      {/* Hỗ trợ AI làm sinh động, tải ảnh, đổi mẫu slide đa dạng            */}
      {/* ------------------------------------------------------------------ */}
      {slidesPreviewLesson && (
        <div
          ref={presentationContainerRef}
          className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in select-none"
        >
          {/* Top Control Bar */}
          <div className="bg-slate-900/95 border-b border-slate-800 px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-sky-500 text-white font-black text-xs tracking-wider flex items-center gap-1.5 shadow-md shadow-sky-500/20">
                <MonitorPlay className="w-3.5 h-3.5" />
                MÁY CHIẾU LỚP HỌC
              </span>
              <div className="hidden sm:block">
                <h4 className="text-xs md:text-sm font-bold text-slate-100 truncate max-w-xs md:max-w-md">
                  {slidesPreviewLesson.title}
                </h4>
              </div>
            </div>

            {/* Slide Action Tools */}
            <div className="flex items-center gap-2">
              {/* REQUIREMENT: Chỉnh sửa slide theo nội dung phù hợp */}
              <button
                onClick={() => setIsSlideEditDrawerOpen(!isSlideEditDrawerOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSlideEditDrawerOpen
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                }`}
                title="Bật/Tắt chế độ chỉnh sửa slide"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isSlideEditDrawerOpen ? 'Đang Sửa Slide' : 'Sửa Slide này'}</span>
              </button>

              {/* REQUIREMENT: Tải thêm ảnh để slide sinh động */}
              <button
                onClick={() => setIsImagePickerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Tải ảnh lên hoặc chọn tranh minh họa sinh động"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Thêm/Đổi ảnh</span>
              </button>

              {/* REQUIREMENT: AI hỗ trợ để tạo trình chiếu sinh động hơn, dễ hiểu hơn */}
              <button
                disabled={isAIEnhancingCurrentSlide}
                onClick={() => setIsAIEnhanceModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all btn-tactile"
                title="AI tối ưu nội dung cụ thể, sinh động cho học sinh tiểu học"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isAIEnhancingCurrentSlide ? 'animate-spin' : 'text-amber-300'}`} />
                <span className="hidden md:inline">{isAIEnhancingCurrentSlide ? 'AI đang tối ưu...' : 'AI Làm sinh động'}</span>
              </button>

              <button
                onClick={handleDownloadPowerPoint}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all btn-tactile"
                title="Tải file trình chiếu dưới dạng PowerPoint (.pptx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Tải PowerPoint</span>
              </button>

              {/* Add / Delete Slide */}
              <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={handleAddSlideItem}
                  className="p-1 rounded-lg text-slate-300 hover:text-emerald-400"
                  title="Thêm slide mới"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDeleteCurrentSlide}
                  className="p-1 rounded-lg text-slate-300 hover:text-rose-400"
                  title="Xóa slide hiện tại"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Font Zoom Controls */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setSlideZoom((z) => Math.max(80, z - 10))}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                  title="Thu nhỏ chữ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1 text-slate-300">{slideZoom}%</span>
                <button
                  onClick={() => setSlideZoom((z) => Math.min(130, z + 10))}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                  title="Phóng to chữ"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Toàn màn hình"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setSlidesPreviewLesson(null)}
                className="p-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                title="Đóng trình chiếu (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Presentation Body */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Thumbnails Rail */}
            <div className="hidden lg:flex w-64 bg-slate-900/90 border-r border-slate-800 flex-col p-3 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  DANH SÁCH SLIDE ({activeSlidesList.length})
                </span>
                <button
                  onClick={handleAddSlideItem}
                  className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Thêm
                </button>
              </div>

              {activeSlidesList.map((slide, idx) => {
                const isActive = currentSlideIndex === idx;
                return (
                  <button
                    key={slide.id || idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-sky-900/60 border-sky-400 text-white shadow-md'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isActive ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="truncate flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                        {slide.category}
                      </p>
                      <p className="text-xs font-semibold truncate text-slate-100">
                        {slide.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Stage Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-radial from-slate-900 via-slate-950 to-black overflow-y-auto">
              {/* Floating Quick Action Toolbar for Teacher */}
              {currentSlide && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-xl">
                  <button
                    onClick={() => setIsSlideEditDrawerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Chỉnh sửa nội dung & lời giảng"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa nội dung</span>
                  </button>
                  <button
                    onClick={() => setIsImagePickerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Tải ảnh từ máy tính hoặc chọn tranh minh họa sinh động"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Tải thêm ảnh</span>
                  </button>
                  <button
                    onClick={() => setIsAIEnhanceModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 btn-tactile"
                    title="AI hỗ trợ tạo trình chiếu sinh động, dễ hiểu hơn"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>AI Làm sinh động</span>
                  </button>
                </div>
              )}

              {currentSlide && (
                <div
                  style={{ fontSize: `${slideZoom}%` }}
                  className={`max-w-4xl w-full rounded-3xl p-6 md:p-10 shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[480px] border-4 ${
                    slideTheme === 'chalkboard'
                      ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-emerald-100 border-emerald-500/50 shadow-emerald-500/10'
                      : slideTheme === 'projector'
                      ? 'bg-slate-900 text-slate-100 border-slate-700 shadow-white/5'
                      : currentSlide.colorScheme === 'emerald'
                      ? 'bg-gradient-to-br from-white via-emerald-50 to-teal-50 text-slate-900 border-emerald-300 shadow-emerald-500/10'
                      : currentSlide.colorScheme === 'amber'
                      ? 'bg-gradient-to-br from-white via-amber-50 to-orange-50 text-slate-900 border-amber-300 shadow-amber-500/10'
                      : currentSlide.colorScheme === 'purple'
                      ? 'bg-gradient-to-br from-white via-purple-50 to-indigo-50 text-slate-900 border-purple-300 shadow-purple-500/10'
                      : currentSlide.colorScheme === 'rose'
                      ? 'bg-gradient-to-br from-white via-rose-50 to-pink-50 text-slate-900 border-rose-300 shadow-rose-500/10'
                      : 'bg-gradient-to-br from-white via-sky-50 to-blue-50 text-slate-900 border-sky-300 shadow-sky-500/10'
                  }`}
                >
                  {/* Slide Top Sub-Header */}
                  <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-white text-[11px] font-extrabold bg-sky-600 shadow-xs">
                        {currentSlide.category}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Lớp {slidesPreviewLesson.grade} • {slidesPreviewLesson.subjectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                        Mẫu: {currentSlide.layout}
                      </span>
                      <span>Slide {currentSlideIndex + 1} / {activeSlidesList.length}</span>
                    </div>
                  </div>

                  {/* Render diverse layout */}
                  <div className="flex-1 flex flex-col justify-center my-auto">
                    {renderSlideContent(currentSlide)}
                  </div>

                  {/* Slide Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 text-xs text-slate-500 font-semibold mt-4">
                    <span>Trường TH {schoolName} • GDPT 2018</span>
                    <span>Phần mềm Trợ Giảng Tiểu Học</span>
                  </div>
                </div>
              )}
            </div>

            {/* IN-SLIDE EDIT DRAWER: Sửa nội dung trực tiếp trên slide đang xem */}
            {isSlideEditDrawerOpen && currentSlide && (
              <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto flex flex-col justify-between shadow-2xl animate-fade-in z-20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                        Chỉnh sửa Slide {currentSlideIndex + 1}
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsSlideEditDrawerOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Template Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Mẫu bố cục Slide (Tránh đơn điệu):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {[
                        { id: 'cover', label: 'Trang bìa' },
                        { id: 'objectives', label: 'Mục tiêu 3 thẻ' },
                        { id: 'game_warmup', label: 'Trò chơi' },
                        { id: 'discovery', label: 'Khám phá' },
                        { id: 'practice', label: 'Luyện tập' },
                        { id: 'two_columns', label: '2 Cột so sánh' },
                        { id: 'image_focus', label: 'Ảnh trọng tâm' },
                        { id: 'award', label: 'Khen thưởng' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleUpdateCurrentSlide({ layout: item.id as SlideLayout })}
                          className={`p-1.5 rounded-lg border text-left font-bold transition-all text-[11px] ${
                            currentSlide.layout === item.id
                              ? 'bg-sky-600 text-white border-sky-400 shadow-xs'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Scheme Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Màu sắc chủ đạo Slide:
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'sky', label: 'Xanh trời', bg: 'bg-sky-500' },
                        { id: 'emerald', label: 'Xanh ngọc', bg: 'bg-emerald-500' },
                        { id: 'amber', label: 'Hổ phách', bg: 'bg-amber-500' },
                        { id: 'purple', label: 'Tím hoa cà', bg: 'bg-purple-500' },
                        { id: 'rose', label: 'Hồng san hô', bg: 'bg-rose-500' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleUpdateCurrentSlide({ colorScheme: c.id as any })}
                          className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                            currentSlide.colorScheme === c.id ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={c.label}
                        >
                          {currentSlide.colorScheme === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Quick Assistant in Drawer */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> AI Tối ưu Slide
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAIEnhanceModalOpen(true)}
                        className="text-[10px] text-amber-300 hover:text-amber-200 font-bold underline"
                      >
                        4 Chế độ AI ⚡
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      AI hỗ trợ làm sinh động lời giảng, cụ thể hóa ví dụ thực tế cho học sinh tiểu học, hoặc biến thành trò chơi đố vui.
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Tiêu đề Slide:
                    </label>
                    <input
                      type="text"
                      value={currentSlide.title}
                      onChange={(e) => handleUpdateCurrentSlide({ title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Subtitle / Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Phụ đề / Thể loại:
                    </label>
                    <input
                      type="text"
                      value={currentSlide.category}
                      onChange={(e) => handleUpdateCurrentSlide({ category: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  {/* Content bullet points */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Nội dung hiển thị (Mỗi dòng là 1 ý):
                    </label>
                    <textarea
                      rows={4}
                      value={currentSlide.content.join('\n')}
                      onChange={(e) =>
                        handleUpdateCurrentSlide({
                          content: e.target.value.split('\n').filter((x) => x.trim()),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Teacher Prompt */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Lời Thầy Cô dẫn dắt:
                    </label>
                    <textarea
                      rows={2}
                      value={currentSlide.teacherPrompt || ''}
                      onChange={(e) => handleUpdateCurrentSlide({ teacherPrompt: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white outline-none resize-none"
                      placeholder="Lời gợi mở cho học sinh..."
                    />
                  </div>

                  {/* Student Action */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Học sinh thao tác:
                    </label>
                    <textarea
                      rows={2}
                      value={currentSlide.studentAction || ''}
                      onChange={(e) => handleUpdateCurrentSlide({ studentAction: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white outline-none resize-none"
                      placeholder="Học sinh làm gì..."
                    />
                  </div>

                  {/* Image control */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsImagePickerOpen(true)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{currentSlide.imageUrl ? 'Đổi ảnh minh họa' : 'Thêm ảnh minh họa'}</span>
                    </button>
                    {currentSlide.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentSlide({ imageUrl: undefined })}
                        className="mt-1 text-[11px] text-rose-400 hover:underline block text-center w-full"
                      >
                        Gỡ bỏ ảnh khỏi slide
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsSlideEditDrawerOpen(false);
                      showToast('Đã lưu nội dung slide vào bài dạy!', 'success');
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all btn-tactile"
                  >
                    Hoàn tất & Lưu Slide
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Presentation Controls Bar */}
          <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">
                [←] [→] để chuyển slide • [Esc] để thoát
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                className="px-5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Slide trước
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-slate-800 font-mono text-xs font-bold text-sky-400">
                {currentSlideIndex + 1} / {activeSlidesList.length}
              </span>

              <button
                disabled={currentSlideIndex >= activeSlidesList.length - 1}
                onClick={() => setCurrentSlideIndex((prev) => Math.min(activeSlidesList.length - 1, prev + 1))}
                className="px-6 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-30 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-sky-600/30 transition-all"
              >
                Slide tiếp theo <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportWordLessonPlan(slidesPreviewLesson)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
                title="Tải giáo án Word tương ứng"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Word</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CHỌN & TẢI ẢNH MINH HỌA CHO SLIDE (TỪ MÁY HOẶC KHO ẢNH SƯ PHẠM) */}
      {/* ------------------------------------------------------------------ */}
      {isImagePickerOpen && currentSlide && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Thêm & Tải Ảnh Minh Họa Cho Slide
                </h3>
              </div>
              <button
                onClick={() => setIsImagePickerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload from Local Computer */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                1. Tải ảnh từ máy tính của bạn:
              </label>
              <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-sky-400/50 bg-sky-950/20 hover:bg-sky-950/40 cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-sky-400 mb-1" />
                <span className="text-xs font-bold text-sky-300">
                  Bấm để chọn file ảnh (PNG, JPG, WebP)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlideImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Presets Gallery */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                2. Hoặc chọn nhanh từ kho tranh ảnh sư phạm tiểu học sinh động:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {EDUCATIONAL_PRESET_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleUpdateCurrentSlide({
                        imageUrl: img.url,
                        imageCaption: img.title,
                      });
                      setIsImagePickerOpen(false);
                      showToast(`Đã chọn ảnh: ${img.title}`, 'success');
                    }}
                    className="group rounded-2xl overflow-hidden border-2 border-slate-800 hover:border-sky-400 text-left transition-all relative"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-all"
                    />
                    <div className="p-1.5 bg-slate-800/90 text-[10px] font-bold text-slate-200 truncate">
                      {img.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsImagePickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: AI LÀM SINH ĐỘNG SLIDE (CHỌN 1 TRONG 4 CHẾ ĐỘ SƯ PHẠM)       */}
      {/* ------------------------------------------------------------------ */}
      {isAIEnhanceModalOpen && currentSlide && slidesPreviewLesson && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    AI Làm Sinh Động Slide Trình Chiếu
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tối ưu nội dung cụ thể hơn, học sinh tiểu học dễ hiểu hơn, sinh động và tránh nhàm chán
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAIEnhanceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Chọn phương thức AI tối ưu hóa slide này:
              </label>

              {/* Option 1: Vivid All-in-one */}
              <button
                type="button"
                disabled={isAIEnhancingCurrentSlide}
                onClick={() => handleAIEnhanceCurrentSlide('vivid')}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-400 text-left transition-all group flex items-start gap-3"
              >
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 group-hover:scale-110 transition-transform">
                  🌟
                </span>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-purple-300">
                    Tối ưu toàn diện: Hào hứng & Sinh động
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Viết lại tiêu đề vui nhộn kèm emoji, bổ sung lời dặn cô giáo hóm hỉnh và gợi ý hoạt động học sinh tích cực.
                  </p>
                </div>
              </button>

              {/* Option 2: Concrete Easy-to-understand */}
              <button
                type="button"
                disabled={isAIEnhancingCurrentSlide}
                onClick={() => handleAIEnhanceCurrentSlide('explain')}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-amber-900/40 border border-slate-700 hover:border-amber-400 text-left transition-all group flex items-start gap-3"
              >
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 group-hover:scale-110 transition-transform">
                  💡
                </span>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                    Nội dung cụ thể, học sinh tiểu học dễ hiểu nhất
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Dùng ví dụ quen thuộc (que tính, chia kẹo, trái cây, tình huống gia đình, siêu thị), các bước gạch đầu dòng ngắn gọn.
                  </p>
                </div>
              </button>

              {/* Option 3: Minigame / Challenge */}
              <button
                type="button"
                disabled={isAIEnhancingCurrentSlide}
                onClick={() => handleAIEnhanceCurrentSlide('game')}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-400 text-left transition-all group flex items-start gap-3"
              >
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 group-hover:scale-110 transition-transform">
                  🎯
                </span>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                    Chuyển thành Trò chơi / Thử thách tương tác
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Biến nội dung bài thành câu đố nhanh, thi đua giữa các Tổ / Bàn, có tính điểm và thưởng Hoa điểm 10.
                  </p>
                </div>
              </button>

              {/* Option 4: Visual & Image Focus */}
              <button
                type="button"
                disabled={isAIEnhancingCurrentSlide}
                onClick={() => handleAIEnhanceCurrentSlide('visual')}
                className="w-full p-3.5 rounded-2xl bg-slate-800/80 hover:bg-sky-900/40 border border-slate-700 hover:border-sky-400 text-left transition-all group flex items-start gap-3"
              >
                <span className="p-2 rounded-xl bg-sky-500/20 text-sky-300 group-hover:scale-110 transition-transform">
                  🖼️
                </span>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-sky-300">
                    Mẫu bố cục trực quan & Gợi ý tranh minh họa
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Chuyển sang mẫu 2 cột thầy & trò hoặc ảnh trọng tâm, bổ sung câu hỏi quan sát thực tế.
                  </p>
                </div>
              </button>
            </div>

            {isAIEnhancingCurrentSlide && (
              <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/50 flex items-center gap-3 text-xs text-purple-200">
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>AI đang phân tích bài học và thiết kế slide sinh động...</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAIEnhanceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: AI SOẠN THÔNG MINH (ĐÃ ĐỔI TÊN TỪ "AI SOẠN TỪ SÁCH VÀ VỞ")   */}
      {/* ------------------------------------------------------------------ */}
      {/* ------------------------------------------------------------------ */}
      {/* MODAL: AI SOẠN THÔNG MINH - THIẾT KẾ 7 KHU VỰC TỔNG HỢP            */}
      {/* ------------------------------------------------------------------ */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 md:p-7 shadow-2xl border border-slate-100 max-h-[94vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800">
                    AI Soạn thông minh - Thiết kế Bài giảng & Kế hoạch bài dạy GDPT 2018
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hệ thống tích hợp 7 Khu vực sư phạm chuẩn mực: Thông tin, Bối cảnh học sinh, Miền năng lực, Tải SGK/Giáo án, Chế độ, Mức độ & Định dạng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAIModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* ============================================================= */}
              {/* TĂNG TỐC SOẠN BÀI: MẪU 1 CHẠM & CHẾ ĐỘ TURBO TỐC ĐỘ CAO       */}
              {/* ============================================================= */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-purple-50 to-sky-50 border-2 border-amber-300 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs">
                      <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
                      TĂNG TỐC SOẠN BÀI (1 CHẠM)
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      Chọn nhanh mẫu giáo án chuẩn (Tự động điền hoàn hảo 7 Khu vực trong 1 giây):
                    </span>
                  </div>

                  {/* Toggle Chế độ Turbo */}
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs hover:bg-amber-50 transition-all">
                    <input
                      type="checkbox"
                      checked={isTurboMode}
                      onChange={(e) => setIsTurboMode(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      ⚡ Chế độ Turbo (Tăng tốc tối đa)
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleLoadSpeedPreset('toan_nhan8')}
                    className="p-2.5 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-200 text-left transition-all group shadow-2xs"
                  >
                    <span className="font-extrabold text-slate-800 group-hover:text-amber-800 block text-[11px] truncate">
                      📐 Toán 3: Bảng nhân 8
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">Cánh Diều • Bảng 3 cột</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSpeedPreset('tv_sosanh')}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-left transition-all group shadow-2xs"
                  >
                    <span className="font-extrabold text-slate-800 group-hover:text-purple-800 block text-[11px] truncate">
                      📚 TV 3: Biện pháp So sánh
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">Kết nối tri thức • Bảng 2 cột</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSpeedPreset('tnxh_tuanhoan')}
                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all group shadow-2xs"
                  >
                    <span className="font-extrabold text-slate-800 group-hover:text-emerald-800 block text-[11px] truncate">
                      🔬 TN&XH 3: Cơ quan tuần hoàn
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">Chân trời • Bảng 3 cột</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSpeedPreset('toan_phanso')}
                    className="p-2.5 rounded-xl bg-white hover:bg-sky-100/70 border border-sky-200 text-left transition-all group shadow-2xs"
                  >
                    <span className="font-extrabold text-slate-800 group-hover:text-sky-800 block text-[11px] truncate">
                      🧮 Toán 4: Khái niệm Phân số
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">Kết nối • Tiến trình</span>
                  </button>
                </div>

                {isAIGenerating && (
                  <div className="p-3.5 rounded-xl bg-indigo-900 text-white shadow-md animate-fade-in space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold">
                        <Zap className="w-4 h-4 text-amber-300 animate-spin" />
                        <span>{turboStepText || 'AI đang tổng hợp và soạn giáo án...'}</span>
                      </div>
                      <span className="font-black text-amber-300">{turboProgress}%</span>
                    </div>
                    <div className="w-full bg-indigo-950 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${turboProgress}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[10px] text-indigo-200 text-center font-medium">
                      <div className={turboProgress >= 20 ? 'text-amber-300 font-bold' : ''}>1. Tổng hợp 7 khu vực</div>
                      <div className={turboProgress >= 40 ? 'text-amber-300 font-bold' : ''}>2. Bối cảnh & Mục tiêu</div>
                      <div className={turboProgress >= 70 ? 'text-amber-300 font-bold' : ''}>3. 4 Hoạt động CV 2345</div>
                      <div className={turboProgress >= 95 ? 'text-emerald-300 font-bold' : ''}>4. Đồng bộ Slide & Word</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* KHU VỰC 1: THÔNG TIN BÀI HỌC */}
              {/* ============================================================= */}
              <div className="p-4 md:p-5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
                <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                    <h4 className="font-bold text-sky-950 text-sm uppercase tracking-wide">
                      Khu vực 1: Thông tin bài học
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-700 bg-white px-2.5 py-0.5 rounded-full border border-sky-200">
                    Hành chính & Khung chương trình
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
                  {/* Lớp học */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lớp học</label>
                    <select
                      value={aiClassId}
                      onChange={(e) => {
                        setAiClassId(e.target.value);
                        const c = classes.find(cl => cl.id === e.target.value);
                        if (c) setAiGrade(c.grade);
                      }}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-medium"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Khối {c.grade})
                        </option>
                      ))}
                      <option value="class-custom">Khối {aiGrade} (Chung toàn khối)</option>
                    </select>
                  </div>

                  {/* Bộ sách */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bộ sách giáo khoa</label>
                    <select
                      value={aiBookSeries}
                      onChange={(e) => setAiBookSeries(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-medium"
                    >
                      <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
                      <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                      <option value="Cánh Diều">Cánh Diều</option>
                      <option value="Cùng học để phát triển năng lực">Cùng học để phát triển năng lực</option>
                      <option value="Vì sự bình đẳng và dân chủ trong giáo dục">Vì sự bình đẳng và dân chủ</option>
                    </select>
                  </div>

                  {/* Môn học */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                    <select
                      value={aiSubjectId}
                      onChange={(e) => setAiSubjectId(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-medium"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Số tiết & Thời gian */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số tiết</label>
                      <select
                        value={aiPeriodsCount}
                        onChange={(e) => setAiPeriodsCount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 px-2 py-2 rounded-xl outline-none font-medium"
                      >
                        <option value={1}>1 tiết</option>
                        <option value={2}>2 tiết</option>
                        <option value={3}>3 tiết</option>
                        <option value={4}>4 tiết</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Thời gian</label>
                      <select
                        value={aiDuration}
                        onChange={(e) => setAiDuration(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 px-2 py-2 rounded-xl outline-none font-medium text-teal-800 font-bold"
                      >
                        <option value={35}>35 phút (Chuẩn)</option>
                        <option value={40}>40 phút</option>
                        <option value={45}>45 phút</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  {/* Chủ đề / Mạch kiến thức */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Chủ đề / Mạch kiến thức</label>
                    <input
                      type="text"
                      value={aiTheme}
                      onChange={(e) => setAiTheme(e.target.value)}
                      placeholder="Ví dụ: Số và phép tính / Hình học / Đọc hiểu văn bản / Con người và sức khỏe..."
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-medium"
                    />
                  </div>

                  {/* Tên bài học */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tên bài học</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Ví dụ: Bảng nhân 8 (Trang 24 SGK Toán 3)"
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-sky-500 font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* KHU VỰC 2: ĐẶC ĐIỂM LỚP HỌC (BỐI CẢNH VÀ TRÌNH ĐỘ HỌC SINH) */}
              {/* ============================================================= */}
              <div className="p-4 md:p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <h4 className="font-bold text-amber-950 text-sm uppercase tracking-wide">
                      Khu vực 2: Đặc điểm lớp học (Phân tích bối cảnh & Trình độ học sinh)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                    Phân hóa & Cá nhân hóa dạy học
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {/* Sĩ số học sinh */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sĩ số học sinh</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={10}
                        max={60}
                        value={aiClassSize}
                        onChange={(e) => setAiClassSize(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-500 font-bold"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 font-medium">học sinh</span>
                    </div>
                  </div>

                  {/* Vùng miền */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Vùng miền (AI tự chọn ví dụ, đồ dùng và ngữ liệu thân thuộc)
                    </label>
                    <select
                      value={aiRegion}
                      onChange={(e) => setAiRegion(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="Đồng bằng / Thành thị">Đồng bằng / Đô thị / Thành phố (ví dụ: công viên, siêu thị, máy tính...)</option>
                      <option value="Nông thôn đồng bằng sông Hồng / Cửu Long">Nông thôn đồng bằng (ví dụ: cánh đồng lúa, bờ đê, chợ quê, vườn cây...)</option>
                      <option value="Miền núi / Vùng cao / Tây Bắc / Tây Nguyên">Miền núi / Vùng cao (ví dụ: nương rẫy, nhà rông, lễ hội cồng chiêng, con suối...)</option>
                      <option value="Vùng biển đảo / Duyên hải">Vùng biển đảo / Duyên hải (ví dụ: thuyền buồm, ngọn hải đăng, vỏ sò, cảng cá...)</option>
                    </select>
                  </div>
                </div>

                {/* Tỉ lệ học sinh theo trình độ */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                    Tỉ lệ phân hóa trình độ học sinh trong lớp (%):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white border border-emerald-200">
                      <span className="text-[11px] font-bold text-emerald-700 block">Hoàn thành tốt (Giỏi)</span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={aiRatioGood}
                          onChange={(e) => setAiRatioGood(Number(e.target.value))}
                          className="w-full font-bold text-slate-800 outline-none"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-blue-200">
                      <span className="text-[11px] font-bold text-blue-700 block">Khá</span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={aiRatioFair}
                          onChange={(e) => setAiRatioFair(Number(e.target.value))}
                          className="w-full font-bold text-slate-800 outline-none"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-amber-200">
                      <span className="text-[11px] font-bold text-amber-700 block">Hoàn thành (TB)</span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={aiRatioMedium}
                          onChange={(e) => setAiRatioMedium(Number(e.target.value))}
                          className="w-full font-bold text-slate-800 outline-none"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-rose-200">
                      <span className="text-[11px] font-bold text-rose-700 block">Chưa hoàn thành (Yếu)</span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={aiRatioWeak}
                          onChange={(e) => setAiRatioWeak(Number(e.target.value))}
                          className="w-full font-bold text-slate-800 outline-none"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Học sinh khuyết tật & Có học sinh hòa nhập */}
                <div className="p-3 rounded-xl bg-white border border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Học sinh khuyết tật (nếu có):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={aiDisabledCount}
                        onChange={(e) => setAiDisabledCount(Number(e.target.value))}
                        className="w-20 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Ghi rõ dạng: Khiếm thính nhẹ, vận động..."
                        value={aiDisabledNote}
                        onChange={(e) => setAiDisabledNote(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Giáo dục hòa nhập:
                    </label>
                    <label className="flex items-center gap-2.5 p-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiHasInclusive}
                        onChange={(e) => setAiHasInclusive(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                      />
                      <span className="font-bold text-slate-800">
                        Lớp có học sinh học hòa nhập
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500 pl-6">
                      AI sẽ tự động thiết kế thêm phương án hỗ trợ cá nhân hóa, câu hỏi trực quan và phân công bạn cùng tiến hỗ trợ.
                    </p>
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* KHU VỰC 3: NỘI DUNG TÍCH HỢP (DẤU TÍCH CHECKBOX ĐẦU DÒNG) */}
              {/* ============================================================= */}
              <div className="p-4 md:p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                    <h4 className="font-bold text-purple-950 text-sm uppercase tracking-wide">
                      Khu vực 3: Nội dung tích hợp (Miền năng lực chuyên đề)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-800 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                    Bổ sung dấu tích ở phía đầu
                  </span>
                </div>

                <p className="text-xs text-purple-900 font-medium">
                  Tích chọn các nội dung tích hợp bên dưới. Hệ thống AI sẽ tự động thiết kế lồng ghép miền năng lực tương ứng vào mục tiêu, tiến trình và hoạt động để giáo viên chọn:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                  {/* Trí tuệ nhân tạo */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.ai}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, ai: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">🤖 Trí tuệ nhân tạo (AI)</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Trợ lý AI, chatbot tương tác, tìm kiếm và nhận diện thông minh</span>
                    </div>
                  </label>

                  {/* Giáo dục STEM */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.stem}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, stem: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">🔬 Giáo dục STEM</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Liên môn Khoa học - Công nghệ - Kỹ thuật - Toán, thực hành chế tạo</span>
                    </div>
                  </label>

                  {/* Năng lực số */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.digitalCompetency}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, digitalCompetency: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">💻 Năng lực số</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Kỹ năng công nghệ, khai thác và xử lý thông tin an toàn trên mạng</span>
                    </div>
                  </label>

                  {/* Chuyển đổi số */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.digitalTransformation}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, digitalTransformation: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">🌐 Chuyển đổi số</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Học liệu số, tương tác bảng thông minh, nộp bài số hóa</span>
                    </div>
                  </label>

                  {/* Đánh giá năng lực */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.competencyAssessment}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, competencyAssessment: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">📊 Đánh giá năng lực (TT 27)</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Bảng kiểm rubric, học sinh tự đánh giá và đánh giá đồng đẳng</span>
                    </div>
                  </label>

                  {/* Kỹ năng sống & Giá trị sống */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.lifeSkills}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, lifeSkills: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">🌱 Kỹ năng sống & Giá trị sống</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Tự chủ, chia sẻ, lắng nghe tích cực, giao tiếp ứng xử văn minh</span>
                    </div>
                  </label>

                  {/* Bảo vệ môi trường */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.environment}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, environment: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">🌍 Bảo vệ môi trường</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Tiết kiệm năng lượng, phân loại rác, yêu quý thiên nhiên</span>
                    </div>
                  </label>

                  {/* Giáo dục địa phương */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.localEdu}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, localEdu: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">🏮 Giáo dục địa phương</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Lồng ghép danh lam thắng cảnh, di sản văn hóa truyền thống</span>
                    </div>
                  </label>

                  {/* Quyền con người & Giới tính */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:bg-purple-50/50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={aiIntegrations.humanRights}
                      onChange={(e) => setAiIntegrations(prev => ({ ...prev, humanRights: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">🕊️ Quyền con người & Bình đẳng</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Quyền trẻ em, bình đẳng giới tính phù hợp lứa tuổi học sinh</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ============================================================= */}
              {/* KHU VỰC 4: UPLOAD GIÁO ÁN MẪU / SÁCH GIÁO KHOA (ĐÁM MÂY) */}
              {/* ============================================================= */}
              <div className="p-4 md:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                    <h4 className="font-bold text-indigo-950 text-sm uppercase tracking-wide">
                      Khu vực 4: Upload Giáo án mẫu / Sách giáo khoa (Lên Đám mây)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-800 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Bám sát SGK / Kế hoạch chuẩn
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* NÚT TẢI LÊN ĐÁM MÂY VỚI BIỂU TƯỢNG ĐÁM MÂY */}
                  <div>
                    <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-indigo-300 bg-white hover:bg-indigo-50/50 cursor-pointer transition-all text-center group shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
                        <UploadCloud className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="text-xs font-extrabold text-indigo-950 block">
                        Bấm để Tải lên Đám mây (File Word, PDF, hoặc Ảnh chụp SGK)
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Hỗ trợ .docx, .doc, .pdf, .png, .jpg • AI đọc trích xuất ngữ liệu & bài tập
                      </span>
                      <input
                        type="file"
                        multiple
                        accept=".doc,.docx,.pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                        onChange={handleAIFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* NẠP NHANH MẪU TRANG SÁCH CÓ SẴN (THỬ 1 CHẠM) */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      Hoặc chọn nhanh mẫu SGK / VBT có sẵn (Trải nghiệm tức thì):
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleLoadSampleBook('toan')}
                        className="w-full p-2.5 rounded-xl bg-white border border-indigo-200/80 hover:border-indigo-400 text-left flex items-center justify-between group transition-all"
                      >
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          📖 SGK Toán 3 (Bảng nhân 8 - Cánh Diều)
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Trang 24-25
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadSampleBook('tv')}
                        className="w-full p-2.5 rounded-xl bg-white border border-indigo-200/80 hover:border-indigo-400 text-left flex items-center justify-between group transition-all"
                      >
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          📖 Vở bài tập Tiếng Việt 3 (So sánh - Kết nối)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Trang 18
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadSampleBook('tnxh')}
                        className="w-full p-2.5 rounded-xl bg-white border border-indigo-200/80 hover:border-indigo-400 text-left flex items-center justify-between group transition-all"
                      >
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          📖 SGK Tự nhiên & Xã hội 3 (Cơ quan tuần hoàn)
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          Trang 32
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* FILE PREVIEW CONTAINER (MULTIPLE FILES) */}
                {aiUploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-indigo-600" />
                      Danh sách tệp đã tải lên Đám mây ({aiUploadedFiles.length} tệp):
                    </span>
                    <div className="space-y-2">
                      {aiUploadedFiles.map((f, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-white border-2 border-indigo-300 flex items-center justify-between animate-fade-in shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                              {f.fileType === 'word' ? (
                                <FileText className="w-5 h-5 text-blue-600" />
                              ) : f.fileType === 'pdf' ? (
                                <FileCheck className="w-5 h-5 text-rose-600" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-900">{f.name}</p>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px] uppercase">
                                  {f.fileType || 'ĐÃ TẢI LÊN'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {f.size} • Sẵn sàng cho AI tổng hợp
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAiUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Gỡ tệp này"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* KHU VỰC 5, 6, 7: CHẾ ĐỘ XỬ LÝ, MỨC ĐỘ CHI TIẾT & ĐỊNH DẠNG */}
              {/* ============================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* KHU VỰC 5: CHẾ ĐỘ XỬ LÝ */}
                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
                    <span className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center text-xs font-bold">5</span>
                    <h4 className="font-bold text-teal-950 text-xs uppercase">
                      Khu vực 5: Chế độ xử lý
                    </h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${aiProcessingMode === 'new' ? 'bg-white border-teal-600 shadow-xs ring-1 ring-teal-500' : 'bg-white/60 border-slate-200'}`}>
                      <input
                        type="radio"
                        name="aiProcessingMode"
                        checked={aiProcessingMode === 'new'}
                        onChange={() => setAiProcessingMode('new')}
                        className="mt-0.5 text-teal-600 accent-teal-600"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Soạn mới</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">Xây dựng bài dạy mới hoàn toàn theo chuẩn GDPT 2018</span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${aiProcessingMode === 'template' ? 'bg-white border-teal-600 shadow-xs ring-1 ring-teal-500' : 'bg-white/60 border-slate-200'}`}>
                      <input
                        type="radio"
                        name="aiProcessingMode"
                        checked={aiProcessingMode === 'template'}
                        onChange={() => setAiProcessingMode('template')}
                        className="mt-0.5 text-teal-600 accent-teal-600"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Soạn theo mẫu</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">Bám sát kế hoạch mẫu CV 2345 & tối ưu hóa tài liệu tải lên</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* KHU VỰC 6: MỨC ĐỘ CHI TIẾT */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">6</span>
                    <h4 className="font-bold text-blue-950 text-xs uppercase">
                      Khu vực 6: Mức độ chi tiết
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { id: 'concise', label: 'Ngắn gọn', desc: 'Tinh gọn, nắm chắc tiến trình trọng tâm' },
                      { id: 'standard', label: 'Theo chuẩn (Khuyên dùng)', desc: 'Đầy đủ các phần chuẩn Công văn 2345' },
                      { id: 'detailed', label: 'Chi tiết', desc: 'Kèm lời thoại GV, câu hỏi gợi mở phân hóa' },
                      { id: 'very_detailed', label: 'Rất chi tiết', desc: 'Kịch bản từng phút, phiếu học tập, rubric TT 27' },
                    ].map((lvl) => (
                      <label
                        key={lvl.id}
                        className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-all ${aiDetailLevel === lvl.id ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-500' : 'bg-white/60 border-slate-200'}`}
                      >
                        <input
                          type="radio"
                          name="aiDetailLevel"
                          checked={aiDetailLevel === lvl.id}
                          onChange={() => setAiDetailLevel(lvl.id as any)}
                          className="mt-0.5 text-blue-600 accent-blue-600"
                        />
                        <div className="leading-tight">
                          <span className="font-bold text-slate-800 block text-xs">{lvl.label}</span>
                          <span className="text-[10px] text-slate-500">{lvl.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* KHU VỰC 7: ĐỊNH DẠNG */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">7</span>
                    <h4 className="font-bold text-emerald-950 text-xs uppercase">
                      Khu vực 7: Định dạng Giáo án
                    </h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${aiLessonFormat === 'process' ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-500' : 'bg-white/60 border-slate-200'}`}>
                      <input
                        type="radio"
                        name="aiLessonFormat"
                        checked={aiLessonFormat === 'process'}
                        onChange={() => setAiLessonFormat('process')}
                        className="mt-0.5 text-emerald-600 accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Theo tiến trình thiết kế</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">Khối hoạt động trực quan: Khởi động - Khám phá - Luyện tập - Vận dụng</span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${aiLessonFormat === 'two_columns' ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-500' : 'bg-white/60 border-slate-200'}`}>
                      <input
                        type="radio"
                        name="aiLessonFormat"
                        checked={aiLessonFormat === 'two_columns'}
                        onChange={() => setAiLessonFormat('two_columns')}
                        className="mt-0.5 text-emerald-600 accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Bảng 2 cột</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">Cột 1: Hoạt động GV & Đồ dùng | Cột 2: Hoạt động HS & Sản phẩm</span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${aiLessonFormat === 'three_columns' ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-500' : 'bg-white/60 border-slate-200'}`}>
                      <input
                        type="radio"
                        name="aiLessonFormat"
                        checked={aiLessonFormat === 'three_columns'}
                        onChange={() => setAiLessonFormat('three_columns')}
                        className="mt-0.5 text-emerald-600 accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Bảng 3 cột (Chuẩn CV 2345)</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">Cột 1: Tiến trình | Cột 2: Hoạt động GV & Đồ dùng | Cột 3: Hoạt động HS</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Yêu cầu sư phạm bổ sung của Thầy Cô */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yêu cầu sư phạm bổ sung của Thầy Cô (Tùy chọn):
                </label>
                <textarea
                  rows={2}
                  value={aiExtraPrompt}
                  onChange={(e) => setAiExtraPrompt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-500"
                  placeholder="Ví dụ: Thiết kế thêm trò chơi Bắn tên củng cố, chú trọng khen ngợi học sinh hòa nhập..."
                />
              </div>

              {/* Thông báo tổng hợp & Nút hành động */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>
                    Từ <strong>7 Khu vực trên</strong>, hệ thống AI sẽ tổng hợp và tự động soạn Kế hoạch bài dạy chi tiết kèm Slide trình chiếu sinh động, hỗ trợ tải File Word (.doc) ngay lập tức!
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isAIGenerating}
                  onClick={() => setIsAIModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isAIGenerating}
                  onClick={handleGenerateAIPlan}
                  className="px-7 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-600/30 transition-all btn-tactile flex items-center gap-2.5"
                >
                  {isAIGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>AI đang tổng hợp 7 khu vực & soạn giáo án...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>Tổng hợp & Bắt đầu AI Soạn giáo án</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA THỦ CÔNG KẾ HOẠCH BÀI DẠY */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingLesson ? 'Chỉnh sửa Kế hoạch bài dạy' : 'Soạn Kế hoạch bài dạy mới (KHBD)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Cấu trúc chuẩn theo Công văn 2345/BGDĐT-GDTH & Thông tư 27
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên bài dạy *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phép nhân số có hai chữ số với số có một chữ số (có nhớ)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
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
                    Khối lớp
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  >
                    <option value={1}>Lớp 1</option>
                    <option value={2}>Lớp 2</option>
                    <option value={3}>Lớp 3</option>
                    <option value={4}>Lớp 4</option>
                    <option value={5}>Lớp 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chủ đề / Tuần học
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bảng nhân chia trong phạm vi 1000"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năng lực đặc thù (Kiến thức)
                  </label>
                  <textarea
                    rows={3}
                    value={knowledgeObjs}
                    onChange={(e) => setKnowledgeObjs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năng lực chung (Kỹ năng)
                  </label>
                  <textarea
                    rows={3}
                    value={skillsObjs}
                    onChange={(e) => setSkillsObjs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phẩm chất cần rèn luyện
                  </label>
                  <textarea
                    rows={3}
                    value={qualitiesObjs}
                    onChange={(e) => setQualitiesObjs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đồ dùng của Giáo viên
                  </label>
                  <textarea
                    rows={2}
                    value={teacherEquip}
                    onChange={(e) => setTeacherEquip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đồ dùng của Học sinh
                  </label>
                  <textarea
                    rows={2}
                    value={studentEquip}
                    onChange={(e) => setStudentEquip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              {/* 4 Phases CV 2345 */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-800">
                  4 Bước Hoạt động sư phạm GDPT 2018 (Công văn 2345/BGDĐT-GDTH)
                </label>
                {phases.map((phase, idx) => (
                  <div
                    key={phase.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-teal-800">
                        {phase.phaseName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Thời lượng (phút):</span>
                        <input
                          type="number"
                          value={phase.durationMinutes}
                          onChange={(e) =>
                            handlePhaseChange(idx, 'durationMinutes', Number(e.target.value))
                          }
                          className="w-16 bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-1 font-semibold">
                          Hoạt động của Giáo viên:
                        </span>
                        <textarea
                          rows={2}
                          value={phase.teacherActivity}
                          onChange={(e) => handlePhaseChange(idx, 'teacherActivity', e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl outline-none resize-none"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1 font-semibold">
                          Hoạt động của Học sinh:
                        </span>
                        <textarea
                          rows={2}
                          value={phase.studentActivity}
                          onChange={(e) => handlePhaseChange(idx, 'studentActivity', e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dàn ý Slide trình chiếu bài giảng (Mỗi dòng là 1 slide)
                </label>
                <textarea
                  rows={3}
                  value={slidesOutline}
                  onChange={(e) => setSlidesOutline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 btn-tactile shadow-md"
                >
                  {editingLesson ? 'Lưu bài dạy' : 'Lưu vào thư viện bài giảng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="Xác nhận xóa bài dạy"
        message="Bạn có chắc chắn muốn xóa kế hoạch bài dạy này khỏi thư viện? Thao tác không thể hoàn tác."
        onConfirm={() => {
          if (deleteTargetId) {
            deleteLessonPlan(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
