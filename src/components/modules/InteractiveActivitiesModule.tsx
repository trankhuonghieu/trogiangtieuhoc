import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InteractiveGame } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  Gamepad2,
  Play,
  RotateCw,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  Shuffle,
  Users,
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  HelpCircle,
  Wand2,
  RotateCcw,
  Star,
  Award,
  Zap,
  Volume2,
  VolumeX,
  Music,
  Disc,
  PlusCircle,
  Layers,
  Download
} from 'lucide-react';
import { gameAudio, GAME_TRACKS, GameMusicTrack } from '../../utils/gameAudio';

export const InteractiveActivitiesModule: React.FC = () => {
  const {
    interactiveGames,
    subjects,
    students,
    addInteractiveGame,
    updateInteractiveGame,
    deleteInteractiveGame,
    showToast,
  } = useApp();

  const [activeGameId, setActiveGameId] = useState<string>(
    interactiveGames[0]?.id || 'game-wheel-01'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Game Audio & Music State
  const [isBgmOn, setIsBgmOn] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<GameMusicTrack>('cheerful');
  const [bgmVolume, setBgmVolume] = useState<number>(0.45);
  const [isBgmMuted, setIsBgmMuted] = useState<boolean>(false);
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(false);

  // Stop BGM when leaving activities module
  useEffect(() => {
    return () => {
      gameAudio.stopBGM();
    };
  }, []);

  // Wheel state
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [wheelChallenge, setWheelChallenge] = useState<string | null>(null);

  // Speed Quiz / True-False state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizTimer, setQuizTimer] = useState(20);

  // Matching game state
  const [matchPairs, setMatchPairs] = useState<
    { id: string; text: string; side: 'left' | 'right'; matched: boolean }[]
  >([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState(0);

  // Modals state
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);

  // AI Game Creator Form State
  const [aiGameTitle, setAiGameTitle] = useState('Đấu Trường Siêu Nhí: Chinh Phục Kiến Thức 🚀');
  const [aiGameType, setAiGameType] = useState<'quiz' | 'wheel' | 'matching' | 'true_false'>('quiz');
  const [aiSubjectId, setAiSubjectId] = useState('subj-toan');
  const [aiGrade, setAiGrade] = useState(3);
  const [aiTopic, setAiTopic] = useState('Bảng nhân chia trong phạm vi 1000');
  const [aiDuration, setAiDuration] = useState(10);
  const [aiDescription, setAiDescription] = useState(
    'Thiết kế 4 câu hỏi trắc nghiệm vui nhộn về phép nhân số có hai chữ số, có điểm thưởng, kèm giải thích dễ hiểu cho học sinh tiểu học.'
  );
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // Manual Editor Form State
  const [editingGame, setEditingGame] = useState<InteractiveGame | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<'quiz' | 'wheel' | 'matching' | 'true_false'>('quiz');
  const [editSubjectId, setEditSubjectId] = useState('subj-toan');
  const [editGrade, setEditGrade] = useState(3);
  const [editTopic, setEditTopic] = useState('');
  const [editDuration, setEditDuration] = useState(10);
  const [editData, setEditData] = useState<any>({});

  const currentGame =
    interactiveGames.find((g) => g.id === activeGameId) || interactiveGames[0];

  // Initialize matching game or reset quiz when switching game
  useEffect(() => {
    if (!currentGame) return;
    setHasGameStarted(false);

    if (currentGame.type === 'matching' && currentGame.data?.pairs) {
      const items: { id: string; text: string; side: 'left' | 'right'; matched: boolean }[] = [];
      currentGame.data.pairs.forEach((p: any, idx: number) => {
        items.push({ id: `l-${idx}`, text: p.left, side: 'left', matched: false });
        items.push({ id: `r-${idx}`, text: p.right, side: 'right', matched: false });
      });
      items.sort(() => Math.random() - 0.5);
      setMatchPairs(items);
      setMatchScore(0);
      setSelectedLeft(null);
      setSelectedRight(null);
    }

    setQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizTimer(20);
    setSelectedStudent(null);
    setWheelChallenge(null);

    let track: GameMusicTrack = 'cheerful';
    if (currentGame.type === 'wheel') track = 'carnival';
    else if (currentGame.type === 'quiz') track = 'fast';
    else if (currentGame.type === 'matching') track = 'gentle';
    setCurrentTrack(track);
    gameAudio.setTrack(track);
  }, [activeGameId, currentGame]);

  const handleDownloadGame = () => {
    if (!currentGame) return;
    const subjName = subjects.find((s) => s.id === currentGame.subjectId)?.name || 'Môn học';
    const gameHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>${currentGame.title}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 25px; color: #1e293b; background: #f8fafc; }
          h1 { color: #0284c7; text-align: center; }
          .card { background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <h1>${currentGame.title}</h1>
        <p><strong>Môn học:</strong> ${subjName} | <strong>Khối lớp:</strong> Khối ${currentGame.grade}</p>
        <p><strong>Chủ đề:</strong> ${currentGame.topic}</p>
        <hr/>
        <h3>Nội dung trò chơi & Câu hỏi thử thách:</h3>
        <pre style="white-space: pre-wrap; font-family: sans-serif; background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">${JSON.stringify(currentGame.data, null, 2)}</pre>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + gameHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentGame.title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống trò chơi phục vụ giảng dạy thành công!', 'success');
  };

  // Quiz countdown timer with audio tick-tock in final seconds
  useEffect(() => {
    let interval: any;
    if (
      hasGameStarted &&
      (currentGame?.type === 'quiz' || currentGame?.type === 'true_false') &&
      quizTimer > 0 &&
      selectedAnswer === null
    ) {
      interval = setInterval(() => {
        setQuizTimer((t) => {
          const next = t - 1;
          if (next <= 5 && next > 0) {
            gameAudio.playCountdown(next <= 3);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasGameStarted, currentGame?.type, quizTimer, selectedAnswer]);

  // Audio control handlers
  const handleToggleBgm = () => {
    const next = gameAudio.toggleBGM();
    setIsBgmOn(next);
    if (next) {
      showToast(`🎵 Đang phát nhạc nền: ${GAME_TRACKS.find((t) => t.id === currentTrack)?.name}`, 'info');
    }
  };

  const handleChangeTrack = (track: GameMusicTrack) => {
    setCurrentTrack(track);
    gameAudio.setTrack(track);
    if (!isBgmOn) {
      setIsBgmOn(true);
      gameAudio.startBGM(track);
    }
    showToast(`Đã đổi sang giai điệu: ${GAME_TRACKS.find((t) => t.id === track)?.name}`, 'info');
  };

  const handleVolumeChange = (vol: number) => {
    setBgmVolume(vol);
    gameAudio.setBgmVolume(vol);
  };

  const handleToggleBgmMute = () => {
    const isMuted = gameAudio.toggleBgmMute();
    setIsBgmMuted(isMuted);
  };

  const handleToggleSfxMute = () => {
    const isMuted = gameAudio.toggleSfxMute();
    setIsSfxMuted(isMuted);
    showToast(isMuted ? 'Đã tắt hiệu ứng âm thanh' : 'Đã bật hiệu ứng âm thanh', 'info');
  };

  // Spin Wheel action with realistic ticking & victory fanfare
  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setSelectedStudent(null);
    setWheelChallenge(null);
    gameAudio.playClick();

    // Sound effect: accelerated and decelerating clicks
    let tickCount = 0;
    const maxTicks = 24;
    const tickInterval = setInterval(() => {
      tickCount++;
      const pitch = Math.max(0.7, 1.4 - (tickCount / maxTicks) * 0.7);
      gameAudio.playSpinTick(pitch);
      if (tickCount >= maxTicks) {
        clearInterval(tickInterval);
      }
    }, 130);

    const segments = currentGame.data?.segments || [];
    const randomAngle = 1440 + Math.floor(Math.random() * 360);
    const newRotation = wheelRotation + randomAngle;
    setWheelRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const chosen = segments[Math.floor(Math.random() * segments.length)];
      if (chosen) {
        setSelectedStudent(chosen.label);
        setWheelChallenge(
          `${chosen.question || 'Trả lời câu hỏi của cô'} (Điểm thưởng: +${chosen.points || 10})`
        );
        gameAudio.playWinnerFanfare();
        showToast(`Chúc mừng em ${chosen.label} đã trúng lượt trả lời!`, 'success');
      }
    }, 3500);
  };

  // Speed Quiz answer pick with rewards
  const handleAnswerPick = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    const currentQ = currentGame.data?.questions[quizIndex];
    if (index === currentQ?.correctIndex) {
      gameAudio.playCorrect();
      setQuizScore((s) => s + 10);
      showToast('Chính xác! +10 điểm ⭐', 'success');
    } else {
      gameAudio.playWrong();
      showToast('Chưa chính xác, cùng xem giải thích nhé!', 'info');
    }
  };

  // True/False answer pick with sounds
  const handleTrueFalsePick = (val: boolean) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(val);
    setShowExplanation(true);
    const currentQ = currentGame.data?.questions[quizIndex];
    if (val === currentQ?.isTrue) {
      gameAudio.playCorrect();
      setQuizScore((s) => s + 10);
      showToast('Chính xác! +10 điểm ⭐', 'success');
    } else {
      gameAudio.playWrong();
      showToast('Chưa chính xác, cùng xem giải thích nhé!', 'info');
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizTimer(20);
    const totalQ = currentGame.data?.questions?.length || 0;
    if (quizIndex < totalQ - 1) {
      gameAudio.playClick();
      setQuizIndex((prev) => prev + 1);
    } else {
      gameAudio.playWinnerFanfare();
      showToast(`Hoàn thành xuất sắc thử thách! Tổng điểm: ${quizScore + 10} điểm 🏆`, 'success');
    }
  };

  const handleRestartGame = () => {
    gameAudio.playClick();
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizTimer(20);
    setSelectedStudent(null);
    setWheelChallenge(null);

    if (currentGame.type === 'matching' && currentGame.data?.pairs) {
      const items: { id: string; text: string; side: 'left' | 'right'; matched: boolean }[] = [];
      currentGame.data.pairs.forEach((p: any, idx: number) => {
        items.push({ id: `l-${idx}`, text: p.left, side: 'left', matched: false });
        items.push({ id: `r-${idx}`, text: p.right, side: 'right', matched: false });
      });
      items.sort(() => Math.random() - 0.5);
      setMatchPairs(items);
      setMatchScore(0);
      setSelectedLeft(null);
      setSelectedRight(null);
    }

    showToast('Đã bắt đầu lại trò chơi từ đầu!', 'info');
  };

  // Matching game pick with pop sound
  const handlePickMatchItem = (item: { id: string; text: string; side: 'left' | 'right'; matched: boolean }) => {
    if (item.matched) return;
    gameAudio.playClick();
    if (item.side === 'left') {
      setSelectedLeft(item.id);
      if (selectedRight) {
        checkMatch(item.id, selectedRight);
      }
    } else {
      setSelectedRight(item.id);
      if (selectedLeft) {
        checkMatch(selectedLeft, item.id);
      }
    }
  };

  const checkMatch = (lId: string, rId: string) => {
    const lIndex = lId.replace('l-', '');
    const rIndex = rId.replace('r-', '');
    if (lIndex === rIndex) {
      gameAudio.playMatch();
      const updated = matchPairs.map((p) => (p.id === lId || p.id === rId ? { ...p, matched: true } : p));
      setMatchPairs(updated);
      setMatchScore((s) => s + 10);
      showToast('Ghép đôi chính xác! 🎯 (+10 điểm)', 'success');
      const allDone = updated.every((p) => p.matched);
      if (allDone) {
        setTimeout(() => {
          gameAudio.playWinnerFanfare();
          showToast('🎉 Chúc mừng cả lớp đã hoàn thành tất cả các cặp ghép đôi!', 'success');
        }, 400);
      }
    } else {
      gameAudio.playWrong();
      showToast('Chưa khớp, hãy thử lại nhé!', 'warning');
    }
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  // -------------------------------------------------------------
  // AI GAME GENERATOR: Tạo trò chơi theo mô tả của người dùng
  // -------------------------------------------------------------
  const handleSelectAIPreset = (presetKey: 'quiz_math' | 'wheel_tv' | 'match_sci' | 'tf_ethics') => {
    if (presetKey === 'quiz_math') {
      setAiGameTitle('Đấu Trường Siêu Nhí: Phép Nhân Chia Lớp 3 🚀');
      setAiGameType('quiz');
      setAiSubjectId('subj-toan');
      setAiGrade(3);
      setAiTopic('Bảng nhân 7 và bảng nhân 8');
      setAiDescription(
        'Tạo 4 câu hỏi trắc nghiệm 4 lựa chọn có thời gian đếm ngược, lồng ghép ví dụ thực tế que tính, bài toán mua đồ dùng học tập và giải thích dễ hiểu.'
      );
    } else if (presetKey === 'wheel_tv') {
      setAiGameTitle('Vòng Quay May Mắn: Thử Tài Từ Đồng Nghĩa 🎡');
      setAiGameType('wheel');
      setAiSubjectId('subj-tv');
      setAiGrade(3);
      setAiTopic('Mở rộng vốn từ: Bạn bè và Trường học');
      setAiDescription(
        'Vòng quay gồm 8 ô với tên học sinh và các thử thách: tìm từ đồng nghĩa, đặt câu so sánh, đọc 1 câu thơ và giải câu đố vui.'
      );
    } else if (presetKey === 'match_sci') {
      setAiGameTitle('Ghép Đôi Tri Thức: Cơ Quan Tuần Hoàn & Hô Hấp 🧩');
      setAiGameType('matching');
      setAiSubjectId('subj-tnxh');
      setAiGrade(3);
      setAiTopic('Cơ thể người và sức khỏe');
      setAiDescription(
        'Tạo 5 cặp ghép đôi giữa tên bộ phận (Tim, Mạch máu, Phổi, Khí quản, Mũi) và chức năng sinh học tương ứng.'
      );
    } else {
      setAiGameTitle('Thử Tài Tinh Mắt: Đúng Hay Sai Về An Toàn Giao Thông ⚡');
      setAiGameType('true_false');
      setAiSubjectId('subj-dd');
      setAiGrade(3);
      setAiTopic('Kỹ năng sống và đạo đức học đường');
      setAiDescription(
        'Tạo 4 câu hỏi Đúng/Sai về quy tắc đi bộ qua đường, đội mũ bảo hiểm và giúp đỡ bạn bè trong lớp.'
      );
    }
  };

  const handleGenerateGameByAI = async () => {
    setIsAIGenerating(true);

    const promptText = `Bạn là chuyên gia thiết kế trò chơi giáo dục tiểu học tại Việt Nam. Hãy tạo 1 trò chơi học tập tương tác hoàn chỉnh:
- Tên trò chơi: ${aiGameTitle}
- Thể loại: ${aiGameType} (quiz, wheel, matching, hoặc true_false)
- Môn học: ${subjects.find((s) => s.id === aiSubjectId)?.name || 'Toán học'} - Khối Lớp: ${aiGrade}
- Chủ đề: ${aiTopic}
- Thời lượng: ${aiDuration} phút
- Mô tả cách thức và luật chơi của Thầy/Cô: ${aiDescription}

Hãy trả về định dạng JSON hợp lệ để hệ thống hiển thị trực tiếp cho học sinh chơi:
Nếu quiz: { "title": "...", "questions": [{ "id": "q1", "question": "...", "options": ["A...", "B...", "C...", "D..."], "correctIndex": 0, "explanation": "..." }] }
Nếu wheel: { "title": "...", "segments": [{ "label": "Em...", "question": "...", "points": 10 }] }
Nếu matching: { "title": "...", "pairs": [{ "left": "...", "right": "..." }] }
Nếu true_false: { "title": "...", "questions": [{ "id": "tf1", "question": "...", "isTrue": true, "explanation": "..." }] }`;

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          type: 'generate_game',
        }),
      });

      const resData = await response.json();
      let parsedGameData: any = null;
      try {
        parsedGameData = JSON.parse(resData.content);
      } catch {
        // Fallback simulated game data if JSON parse fails
      }

      let finalData: any = {};
      if (parsedGameData && parsedGameData.data) {
        finalData = parsedGameData.data;
      } else if (parsedGameData && (parsedGameData.questions || parsedGameData.segments || parsedGameData.pairs)) {
        finalData = parsedGameData;
      } else {
        // Fallback default according to type
        if (aiGameType === 'quiz') {
          finalData = {
            questions: [
              {
                id: 'q_gen_1',
                question: `[${aiTopic}] Câu hỏi 1: Đố em kết quả chính xác của phép tính là bao nhiêu?`,
                options: ['A. 24', 'B. 32', 'C. 40', 'D. 48'],
                correctIndex: 1,
                explanation: 'Đáp án B là đáp án chính xác theo quy tắc bài học.',
              },
              {
                id: 'q_gen_2',
                question: 'Câu hỏi 2: Quan sát tình huống thực tế và chọn phát biểu đúng nhất:',
                options: ['A. Lựa chọn 1', 'B. Lựa chọn đúng', 'C. Lựa chọn 3', 'D. Lựa chọn 4'],
                correctIndex: 1,
                explanation: 'Rất chính xác, em ghi thêm được 10 điểm thưởng!',
              },
              {
                id: 'q_gen_3',
                question: 'Câu hỏi 3: Tìm số thích hợp để điền vào chỗ chấm:',
                options: ['A. Số 15', 'B. Số 25', 'C. Số 35', 'D. Số 45'],
                correctIndex: 2,
                explanation: 'Chúc mừng em đã hoàn thành xuất sắc câu hỏi.',
              },
            ],
          };
        } else if (aiGameType === 'wheel') {
          finalData = {
            segments: [
              { label: 'Nguyễn Minh Khang', question: `Nêu 1 ví dụ về ${aiTopic}`, points: 20 },
              { label: 'Trần Bảo Anh', question: 'Giải nhanh bài toán đố của cô', points: 20 },
              { label: 'Lê Gia Huy', question: 'Đọc to quy tắc ghi nhớ', points: 15 },
              { label: 'Hoàng Thùy Chi', question: 'Tìm 1 từ ngữ / phép tính tương tự', points: 20 },
              { label: 'Phạm Đức Duy', question: 'Đố bạn bên cạnh 1 câu hỏi', points: 15 },
              { label: 'Vũ Hải Đăng', question: 'Nhận ngay hoa điểm 10 may mắn!', points: 50 },
            ],
          };
        } else if (aiGameType === 'matching') {
          finalData = {
            pairs: [
              { left: '7 x 4', right: '28' },
              { left: '8 x 5', right: '40' },
              { left: '9 x 6', right: '54' },
              { left: '6 x 7', right: '42' },
            ],
          };
        } else {
          finalData = {
            questions: [
              {
                id: 'tf_1',
                question: '8 x 7 có kết quả bằng 56, đúng hay sai?',
                isTrue: true,
                explanation: 'Chính xác! 8 x 7 = 56.',
              },
              {
                id: 'tf_2',
                question: 'Khi thực hiện phép tính nhân có nhớ, ta cộng số nhớ vào hàng đơn vị, đúng hay sai?',
                isTrue: false,
                explanation: 'Sai! Ta phải cộng số nhớ vào hàng chục (hàng liền trước).',
              },
            ],
          };
        }
      }

      const newGame: Omit<InteractiveGame, 'id'> = {
        title: aiGameTitle,
        type: aiGameType,
        subjectId: aiSubjectId,
        grade: aiGrade,
        topic: aiTopic,
        durationMinutes: aiDuration,
        data: finalData,
      };

      addInteractiveGame(newGame);
      setIsAICreatorOpen(false);
      showToast('🎉 AI đã tạo trò chơi học tập mới thành công! Sẵn sàng chơi ngay.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi khi tạo trò chơi bằng AI', 'error');
    } finally {
      setIsAIGenerating(false);
    }
  };

  // -------------------------------------------------------------
  // GAME EDITOR: Chỉnh sửa trò chơi cho phù hợp
  // -------------------------------------------------------------
  const handleOpenEditModal = (game: InteractiveGame) => {
    setEditingGame(game);
    setEditTitle(game.title);
    setEditType(game.type);
    setEditSubjectId(game.subjectId);
    setEditGrade(game.grade);
    setEditTopic(game.topic);
    setEditDuration(game.durationMinutes);
    setEditData(JSON.parse(JSON.stringify(game.data || {})));
    setIsEditorOpen(true);
  };

  const handleSaveEditedGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame || !editTitle.trim()) {
      showToast('Vui lòng nhập tên trò chơi!', 'error');
      return;
    }

    updateInteractiveGame(editingGame.id, {
      title: editTitle,
      type: editType,
      subjectId: editSubjectId,
      grade: editGrade,
      topic: editTopic,
      durationMinutes: editDuration,
      data: editData,
    });

    setIsEditorOpen(false);
    showToast('Đã lưu chỉnh sửa trò chơi thành công!', 'success');
  };

  // Helpers for editing game content
  const handleAddQuestionToQuiz = () => {
    const questions = editData.questions || [];
    const newQ = {
      id: 'q_' + Date.now(),
      question: 'Câu hỏi mới cần trả lời...',
      options: ['A. Lựa chọn 1', 'B. Lựa chọn 2', 'C. Lựa chọn 3', 'D. Lựa chọn 4'],
      correctIndex: 0,
      explanation: 'Giải thích chi tiết cho đáp án đúng.',
    };
    setEditData({ ...editData, questions: [...questions, newQ] });
  };

  const handleDeleteQuestionFromQuiz = (idx: number) => {
    const questions = (editData.questions || []).filter((_: any, i: number) => i !== idx);
    setEditData({ ...editData, questions });
  };

  const handleAddSegmentToWheel = () => {
    const segments = editData.segments || [];
    const newSeg = {
      label: 'Học sinh mới',
      question: 'Trả lời câu hỏi thử thách của Thầy/Cô',
      points: 10,
    };
    setEditData({ ...editData, segments: [...segments, newSeg] });
  };

  const handleDeleteSegmentFromWheel = (idx: number) => {
    const segments = (editData.segments || []).filter((_: any, i: number) => i !== idx);
    setEditData({ ...editData, segments });
  };

  const handleAddPairToMatching = () => {
    const pairs = editData.pairs || [];
    const newPair = { left: 'Vế A', right: 'Vế B tương ứng' };
    setEditData({ ...editData, pairs: [...pairs, newPair] });
  };

  const handleDeletePairFromMatching = (idx: number) => {
    const pairs = (editData.pairs || []).filter((_: any, i: number) => i !== idx);
    setEditData({ ...editData, pairs });
  };

  return (
    <div
      className={`space-y-6 animate-fade-in font-sans ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-6 overflow-y-auto' : ''
      }`}
    >
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Gamepad2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">
                Tổ chức Hoạt động & Trò chơi Lớp học
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xây dựng nhiều trò chơi bằng AI, mô tả cách thức trò chơi và tùy chỉnh linh hoạt phù hợp với học sinh.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* REQUIREMENT: Người dùng có thể tạo thêm nhiều trò chơi bằng AI */}
          <button
            onClick={() => setIsAICreatorOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all btn-tactile"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI Tạo Trò Chơi Học Tập</span>
          </button>

          {/* Nút Chỉnh sửa trò chơi đang chọn */}
          {currentGame && (
            <>
              <button
                onClick={() => handleOpenEditModal(currentGame)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all btn-tactile"
                title="Chỉnh sửa nội dung, câu hỏi và đáp án trò chơi"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Sửa trò chơi</span>
              </button>
              <button
                onClick={handleDownloadGame}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all btn-tactile"
                title="Tải xuống tệp trò chơi phục vụ giảng dạy"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải trò chơi</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all btn-tactile"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình máy chiếu'}</span>
          </button>
        </div>
      </div>

      {/* Game Selector Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {interactiveGames.map((game) => {
            const isCurrent = activeGameId === game.id;
            let iconBadge = '🎮';
            if (game.type === 'wheel') iconBadge = '🎡';
            if (game.type === 'quiz') iconBadge = '⏱️';
            if (game.type === 'matching') iconBadge = '🧩';
            if (game.type === 'true_false') iconBadge = '⚡';

            return (
              <div key={game.id} className="relative group">
                <button
                  onClick={() => {
                    setActiveGameId(game.id);
                    setIsPlaying(false);
                    setQuizIndex(0);
                    setQuizScore(0);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all btn-tactile flex items-center gap-2 border ${
                    isCurrent
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-md shadow-amber-500/25'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{iconBadge}</span>
                  <span className="truncate max-w-[200px]">{game.title}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Delete current game button */}
        {interactiveGames.length > 1 && (
          <button
            onClick={() => setDeleteTargetId(currentGame.id)}
            className="text-xs text-rose-600 hover:underline flex items-center gap-1 p-1 font-semibold"
            title="Xóa trò chơi này"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa trò chơi</span>
          </button>
        )}
      </div>

      {/* Main Interactive Stage */}
      <div
        className={`rounded-3xl border border-slate-100 shadow-sm min-h-[520px] flex flex-col justify-between relative overflow-hidden transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none p-6 md:p-8 bg-white shadow-2xl' : 'bg-white p-6 md:p-8'
        }`}
      >
        {!hasGameStarted && (
          <div className="absolute inset-0 z-20 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <h3 className="text-xl font-black text-white">{currentGame.title}</h3>
            <p className="text-xs text-slate-300 max-w-md mt-2 mb-6">
              Môn học: {subjects.find((s) => s.id === currentGame.subjectId)?.name || 'Môn học'} • Khối {currentGame.grade} • Thời gian: {currentGame.durationMinutes || 10} phút. Nhấn nút bên dưới để bắt đầu tính giờ và tham gia trò chơi!
            </p>
            <button
              onClick={() => {
                setHasGameStarted(true);
                gameAudio.playClick();
                showToast('Trò chơi đã bắt đầu! Chúc các em ghi thật nhiều điểm 🚀', 'success');
              }}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/30 btn-tactile flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>BẮT ĐẦU TRÒ CHƠI 🚀</span>
            </button>
          </div>
        )}
        {/* Top Game Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              {currentGame.type === 'wheel'
                ? 'Vòng quay may mắn'
                : currentGame.type === 'quiz'
                ? 'Đấu trường trắc nghiệm'
                : currentGame.type === 'matching'
                ? 'Ghép đôi tri thức'
                : 'Thử tài Đúng/Sai'}
            </span>
            <span className="text-xs text-slate-500">
              Chủ đề: <strong>{currentGame.topic}</strong> (Lớp {currentGame.grade})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestartGame}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Chơi lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(currentGame)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 border border-amber-200 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Chỉnh sửa nội dung</span>
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* AUDIO CONTROL BAR (NHẠC NỀN & HIỆU ỨNG ÂM THANH TRÒ CHƠI)          */}
        {/* =================================================================== */}
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          {/* BGM Toggle & Equalizer Animation */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleToggleBgm}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all btn-tactile ${
                isBgmOn
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
              title="Bật/Tắt nhạc nền vui nhộn cho trò chơi"
            >
              <Music className={`w-4 h-4 ${isBgmOn ? 'animate-bounce text-white' : 'text-amber-500'}`} />
              <span>{isBgmOn ? 'Đang phát Nhạc nền 🎵' : 'Bật Nhạc nền 🎵'}</span>
              {/* Equalizer bars animation when playing */}
              {isBgmOn && (
                <div className="flex items-end gap-0.5 h-3.5 ml-1">
                  <span className="w-1 bg-white rounded-full animate-pulse h-2"></span>
                  <span className="w-1 bg-white rounded-full animate-pulse h-3.5"></span>
                  <span className="w-1 bg-white rounded-full animate-pulse h-2.5"></span>
                </div>
              )}
            </button>

            {/* Track Selector */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
              <Disc className={`w-3.5 h-3.5 text-amber-500 ${isBgmOn ? 'animate-spin' : ''}`} />
              <select
                value={currentTrack}
                onChange={(e) => handleChangeTrack(e.target.value as GameMusicTrack)}
                className="bg-transparent font-semibold text-slate-700 outline-none text-xs cursor-pointer"
                title="Chọn giai điệu nhạc nền"
              >
                {GAME_TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Volume & SFX Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Volume slider */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={handleToggleBgmMute}
                className="text-slate-500 hover:text-amber-600 transition-colors"
                title={isBgmMuted ? 'Bật âm lượng' : 'Tắt tiếng'}
              >
                {isBgmMuted || bgmVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-600" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isBgmMuted ? 0 : bgmVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                title="Âm lượng nhạc nền"
              />
              <span className="text-[10px] font-mono text-slate-400 w-6">
                {isBgmMuted ? '0%' : `${Math.round(bgmVolume * 100)}%`}
              </span>
            </div>

            {/* SFX Mute Toggle */}
            <button
              onClick={handleToggleSfxMute}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all ${
                isSfxMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Bật/Tắt hiệu ứng âm thanh trả lời, vòng quay, chuông reo"
            >
              <span>{isSfxMuted ? '🔇 Tắt FX' : '🔔 Hiệu ứng: Bật'}</span>
            </button>

            {/* Teacher Fast SFX Praise buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playApplause();
                  showToast('👏 Cả lớp cùng vỗ tay khen ngợi bạn nào!', 'success');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                title="Phát tiếng vỗ tay khen ngợi cả lớp"
              >
                <span>👏 Vỗ tay</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playWinnerFanfare();
                  showToast('🏆 Tuyên dương chiến thắng xuất sắc!', 'success');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                title="Phát nhạc tuyên dương chiến thắng"
              >
                <span>🏆 Vinh danh</span>
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- GAME 1: VÒNG QUAY MAY MẮN ---------------- */}
        {currentGame.type === 'wheel' && (
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-6 my-auto">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              <div className="absolute -top-3 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-rose-600 drop-shadow-md" />

              <div
                className="w-full h-full rounded-full border-8 border-amber-300 shadow-2xl relative overflow-hidden transition-transform duration-[3500ms] ease-out flex items-center justify-center"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  background:
                    'conic-gradient(#38bdf8 0deg 45deg, #fbbf24 45deg 90deg, #34d399 90deg 135deg, #f472b6 135deg 180deg, #a78bfa 180deg 225deg, #fb923c 225deg 270deg, #60a5fa 270deg 315deg, #a3e635 315deg 360deg)',
                }}
              >
                <div className="w-20 h-20 rounded-full bg-white shadow-inner border-4 border-amber-200 flex items-center justify-center text-xs font-black text-amber-700">
                  MAY MẮN
                </div>
              </div>
            </div>

            {selectedStudent && (
              <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 max-w-md w-full animate-scale-up">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest block">
                  Người được gọi tên:
                </span>
                <h3 className="text-xl font-black text-slate-800 mt-1">
                  🌟 {selectedStudent}
                </h3>
                <p className="text-xs font-semibold text-amber-900 mt-2 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  Thử thách: {wheelChallenge}
                </p>
              </div>
            )}

            <button
              disabled={spinning}
              onClick={handleSpinWheel}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-amber-500/25 btn-tactile flex items-center gap-2"
            >
              <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
              <span>{spinning ? 'VÒNG QUAY ĐANG QUAY...' : 'QUAY NGAY!'}</span>
            </button>
          </div>
        )}

        {/* ---------------- GAME 2: SPEED QUIZ ---------------- */}
        {currentGame.type === 'quiz' && (
          <div className="max-w-2xl mx-auto w-full py-2 space-y-5 my-auto">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-600">
                Câu hỏi {quizIndex + 1} / {currentGame.data?.questions?.length || 3}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  <Clock className="w-3.5 h-3.5" /> {quizTimer}s
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Trophy className="w-3.5 h-3.5" /> Điểm: {quizScore}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-sky-50/90 border-2 border-sky-200 text-center shadow-xs">
              <h3 className="text-base sm:text-lg font-extrabold text-sky-950">
                {currentGame.data?.questions[quizIndex]?.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentGame.data?.questions[quizIndex]?.options.map((opt: string, idx: number) => {
                const isPicked = selectedAnswer === idx;
                const isCorrect = idx === currentGame.data?.questions[quizIndex]?.correctIndex;

                let btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
                if (selectedAnswer !== null) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs';
                  } else if (isPicked) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswerPick(idx)}
                    className={`p-4 rounded-2xl border text-left text-xs font-bold transition-all btn-tactile ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 animate-fade-in flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold block mb-1">💡 Giải thích đáp án:</span>
                  <p>{currentGame.data?.questions[quizIndex]?.explanation}</p>
                </div>
                <button
                  onClick={handleNextQuizQuestion}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap btn-tactile shadow-md shrink-0"
                >
                  {quizIndex < (currentGame.data?.questions?.length || 0) - 1 ? 'Câu tiếp theo →' : 'Xem tổng kết 🏆'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- GAME 3: MATCHING ---------------- */}
        {currentGame.type === 'matching' && (
          <div className="max-w-xl mx-auto w-full py-2 space-y-5 my-auto">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
              <span className="font-bold text-amber-900">
                Nhấp vào 1 ô bên Cột A và 1 ô bên Cột B để nối cặp đúng
              </span>
              <span className="font-bold text-amber-700 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Điểm: {matchScore}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Cột A
                </span>
                {matchPairs
                  .filter((p) => p.side === 'left')
                  .map((item) => (
                    <button
                      key={item.id}
                      disabled={item.matched}
                      onClick={() => handlePickMatchItem(item)}
                      className={`w-full p-3.5 rounded-2xl border text-xs font-bold transition-all btn-tactile ${
                        item.matched
                          ? 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
                          : selectedLeft === item.id
                          ? 'bg-sky-500 text-white border-sky-600 shadow-md scale-102'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-sky-50'
                      }`}
                    >
                      {item.text}
                    </button>
                  ))}
              </div>

              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Cột B
                </span>
                {matchPairs
                  .filter((p) => p.side === 'right')
                  .map((item) => (
                    <button
                      key={item.id}
                      disabled={item.matched}
                      onClick={() => handlePickMatchItem(item)}
                      className={`w-full p-3.5 rounded-2xl border text-xs font-bold transition-all btn-tactile ${
                        item.matched
                          ? 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
                          : selectedRight === item.id
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-102'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-amber-50'
                      }`}
                    >
                      {item.text}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- GAME 4: TRUE / FALSE ---------------- */}
        {currentGame.type === 'true_false' && (
          <div className="max-w-xl mx-auto w-full py-4 space-y-6 my-auto text-center">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-600">
                Câu hỏi {quizIndex + 1} / {currentGame.data?.questions?.length || 2}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Trophy className="w-3.5 h-3.5" /> Điểm: {quizScore}
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-amber-50/80 border-3 border-amber-200 shadow-xs">
              <span className="text-3xl block mb-3">🤔</span>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-800">
                "{currentGame.data?.questions[quizIndex]?.question}"
              </h3>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                disabled={selectedAnswer !== null}
                onClick={() => handleTrueFalsePick(true)}
                className={`flex-1 py-4 px-6 rounded-2xl font-black text-sm border-2 transition-all btn-tactile flex items-center justify-center gap-2 ${
                  selectedAnswer !== null
                    ? currentGame.data?.questions[quizIndex]?.isTrue
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                <Check className="w-5 h-5" />
                <span>ĐÚNG</span>
              </button>

              <button
                disabled={selectedAnswer !== null}
                onClick={() => handleTrueFalsePick(false)}
                className={`flex-1 py-4 px-6 rounded-2xl font-black text-sm border-2 transition-all btn-tactile flex items-center justify-center gap-2 ${
                  selectedAnswer !== null
                    ? !currentGame.data?.questions[quizIndex]?.isTrue
                      ? 'bg-rose-500 text-white border-rose-600 shadow-lg'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                <X className="w-5 h-5" />
                <span>SAI</span>
              </button>
            </div>

            {showExplanation && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 text-left animate-fade-in flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold block mb-1">💡 Giải thích:</span>
                  <p>{currentGame.data?.questions[quizIndex]?.explanation}</p>
                </div>
                <button
                  onClick={handleNextQuizQuestion}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs whitespace-nowrap btn-tactile shadow-md shrink-0"
                >
                  {quizIndex < (currentGame.data?.questions?.length || 0) - 1 ? 'Câu tiếp theo →' : 'Xem tổng kết 🏆'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-4">
          <span>GDPT 2018 • Phát triển tinh thần thi đua tích cực cho học sinh</span>
          <span>Phần mềm Trợ Giảng Tiểu Học</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: AI TẠO TRÒ CHƠI HỌC TẬP (MÔ TẢ CÁCH THỨC VÀ Ý TƯỞNG) */}
      {/* ------------------------------------------------------------- */}
      {isAICreatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </span>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800">
                    AI Hỗ trợ Xây dựng Trò chơi Học tập
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mô tả cách thức và ý tưởng trò chơi, AI sẽ tự động thiết kế hoàn chỉnh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAICreatorOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Quick Preset Ideas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Gợi ý ý tưởng trò chơi 1-chạm (Bấm thử ngay):
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAIPreset('quiz_math')}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 hover:bg-blue-100 transition-colors"
                  >
                    🎯 Rung chuông vàng Toán 3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAIPreset('wheel_tv')}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-semibold border border-purple-200/80 hover:bg-purple-100 transition-colors"
                  >
                    🎡 Vòng quay thử thách Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAIPreset('match_sci')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
                  >
                    🧩 Nối cặp cơ thể người TN&XH
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAIPreset('tf_ethics')}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-semibold border border-amber-200/80 hover:bg-amber-100 transition-colors"
                  >
                    ⚡ Đúng hay Sai: An toàn giao thông
                  </button>
                </div>
              </div>

              {/* Game Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Thể loại trò chơi:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'quiz', label: '⏱️ Trắc nghiệm', desc: 'Thi đấu tốc độ' },
                    { id: 'wheel', label: '🎡 Vòng quay', desc: 'Gọi tên thử thách' },
                    { id: 'matching', label: '🧩 Ghép đôi', desc: 'Nối thẻ tương ứng' },
                    { id: 'true_false', label: '⚡ Đúng / Sai', desc: 'Thử tài tinh mắt' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAiGameType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        aiGameType === t.id
                          ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-bold">{t.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên trò chơi:</label>
                  <input
                    type="text"
                    value={aiGameTitle}
                    onChange={(e) => setAiGameTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-purple-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối lớp:</label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none text-xs"
                  >
                    <option value={1}>Lớp 1</option>
                    <option value={2}>Lớp 2</option>
                    <option value={3}>Lớp 3</option>
                    <option value={4}>Lớp 4</option>
                    <option value={5}>Lớp 5</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học:</label>
                  <select
                    value={aiSubjectId}
                    onChange={(e) => setAiSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none text-xs"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chủ đề bài học:</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none text-xs"
                  />
                </div>
              </div>

              {/* REQUIREMENT: Người dùng có thể mô tả cách thức trò chơi để AI hỗ trợ xây dựng */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả cách thức & luật chơi của Thầy Cô (AI sẽ xây dựng theo đúng ý tưởng này):
                </label>
                <textarea
                  rows={4}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Ví dụ: Tạo trò chơi giải cứu rừng xanh cho môn Khoa học lớp 4, gồm 4 câu hỏi trắc nghiệm về chuỗi thức ăn, có câu hỏi hình ảnh và điểm thưởng..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-purple-500 text-xs leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Sau khi AI tạo xong, Thầy/Cô có thể <strong>chỉnh sửa câu hỏi, đáp án hoặc thể lệ</strong> bất kỳ lúc nào để hoàn toàn phù hợp với tiết dạy thực tế!
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isAIGenerating}
                  onClick={() => setIsAICreatorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isAIGenerating}
                  onClick={handleGenerateGameByAI}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all btn-tactile flex items-center gap-2"
                >
                  {isAIGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>AI đang thiết kế trò chơi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Bắt đầu Tạo trò chơi với AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: CHỈNH SỬA TRÒ CHƠI CHO PHÙ HỢP                         */}
      {/* ------------------------------------------------------------- */}
      {isEditorOpen && editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base md:text-lg font-bold text-slate-800">
                  Chỉnh Sửa Trò Chơi Cho Phù Hợp Tiết Dạy
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedGame} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên trò chơi:</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chủ đề:</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Editing Content specifically for quiz / true_false */}
              {(editType === 'quiz' || editType === 'true_false') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Danh sách câu hỏi ({editData.questions?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddQuestionToQuiz}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm câu hỏi</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editData.questions || []).map((q: any, qIdx: number) => (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">
                            Câu {qIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestionFromQuiz(qIdx)}
                            className="text-slate-400 hover:text-rose-600"
                            title="Xóa câu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-1 font-semibold">Nội dung câu hỏi:</label>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => {
                              const qs = [...editData.questions];
                              qs[qIdx].question = e.target.value;
                              setEditData({ ...editData, questions: qs });
                            }}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl outline-none font-medium"
                          />
                        </div>

                        {editType === 'quiz' ? (
                          <div className="space-y-2">
                            <label className="block text-slate-600 font-semibold">
                              Các lựa chọn (Tích chọn đáp án đúng):
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(q.options || []).map((opt: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct_${qIdx}`}
                                    checked={q.correctIndex === optIdx}
                                    onChange={() => {
                                      const qs = [...editData.questions];
                                      qs[qIdx].correctIndex = optIdx;
                                      setEditData({ ...editData, questions: qs });
                                    }}
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const qs = [...editData.questions];
                                      qs[qIdx].options[optIdx] = e.target.value;
                                      setEditData({ ...editData, questions: qs });
                                    }}
                                    className="flex-1 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-slate-600">Đáp án chuẩn:</span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`tf_${qIdx}`}
                                checked={q.isTrue === true}
                                onChange={() => {
                                  const qs = [...editData.questions];
                                  qs[qIdx].isTrue = true;
                                  setEditData({ ...editData, questions: qs });
                                }}
                              />
                              <span className="font-bold text-emerald-700">ĐÚNG</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`tf_${qIdx}`}
                                checked={q.isTrue === false}
                                onChange={() => {
                                  const qs = [...editData.questions];
                                  qs[qIdx].isTrue = false;
                                  setEditData({ ...editData, questions: qs });
                                }}
                              />
                              <span className="font-bold text-rose-700">SAI</span>
                            </label>
                          </div>
                        )}

                        <div>
                          <label className="block text-slate-600 mb-1 font-semibold">Lời giải thích đáp án:</label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => {
                              const qs = [...editData.questions];
                              qs[qIdx].explanation = e.target.value;
                              setEditData({ ...editData, questions: qs });
                            }}
                            className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl outline-none text-slate-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editing for Wheel */}
              {editType === 'wheel' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Các ô trên Vòng quay ({editData.segments?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSegmentToWheel}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm ô vòng quay</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(editData.segments || []).map((seg: any, segIdx: number) => (
                      <div
                        key={segIdx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3"
                      >
                        <div className="w-1/4">
                          <label className="block text-[10px] text-slate-500 font-bold">Tên hiển thị:</label>
                          <input
                            type="text"
                            value={seg.label}
                            onChange={(e) => {
                              const segs = [...editData.segments];
                              segs[segIdx].label = e.target.value;
                              setEditData({ ...editData, segments: segs });
                            }}
                            className="w-full bg-white border border-slate-200 px-2 py-1 rounded-xl text-xs"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 font-bold">Thử thách:</label>
                          <input
                            type="text"
                            value={seg.question || ''}
                            onChange={(e) => {
                              const segs = [...editData.segments];
                              segs[segIdx].question = e.target.value;
                              setEditData({ ...editData, segments: segs });
                            }}
                            className="w-full bg-white border border-slate-200 px-2 py-1 rounded-xl text-xs"
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-[10px] text-slate-500 font-bold">Điểm:</label>
                          <input
                            type="number"
                            value={seg.points || 10}
                            onChange={(e) => {
                              const segs = [...editData.segments];
                              segs[segIdx].points = Number(e.target.value);
                              setEditData({ ...editData, segments: segs });
                            }}
                            className="w-full bg-white border border-slate-200 px-2 py-1 rounded-xl text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSegmentFromWheel(segIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 mt-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editing for Matching */}
              {editType === 'matching' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Các cặp ghép nối ({editData.pairs?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPairToMatching}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm cặp ghép</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(editData.pairs || []).map((pair: any, pIdx: number) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 font-bold">Cột A:</label>
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => {
                              const ps = [...editData.pairs];
                              ps[pIdx].left = e.target.value;
                              setEditData({ ...editData, pairs: ps });
                            }}
                            className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <span className="text-slate-400 mt-3 font-bold">🔗</span>
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 font-bold">Cột B (Khớp với A):</label>
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => {
                              const ps = [...editData.pairs];
                              ps[pIdx].right = e.target.value;
                              setEditData({ ...editData, pairs: ps });
                            }}
                            className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePairFromMatching(pIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 mt-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 btn-tactile shadow-md"
                >
                  Lưu thay đổi trò chơi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="Xác nhận xóa trò chơi"
        message="Bạn có chắc chắn muốn xóa trò chơi học tập này? Thao tác không thể hoàn tác."
        onConfirm={() => {
          if (deleteTargetId) {
            deleteInteractiveGame(deleteTargetId);
            setDeleteTargetId(null);
            // Select first available game
            const remain = interactiveGames.filter((g) => g.id !== deleteTargetId);
            if (remain.length > 0) {
              setActiveGameId(remain[0].id);
            }
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
