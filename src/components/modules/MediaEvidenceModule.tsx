import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MediaEvidence, MediaItem } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  Camera,
  Video,
  Image as ImageIcon,
  Plus,
  Filter,
  Search,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  X,
  Sparkles,
  Tag,
  User,
  ExternalLink,
  Layers,
  FolderOpen,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Upload
} from 'lucide-react';

export const MediaEvidenceModule: React.FC = () => {
  const {
    mediaEvidence,
    classes,
    students,
    currentUser,
    addMediaEvidence,
    updateMediaEvidence,
    deleteMediaEvidence,
    showToast,
  } = useApp();

  const isParent = currentUser.role === 'parent_student';
  const linkedStudent = isParent ? students.find((s) => s.id === currentUser.linkedStudentId) : null;
  const parentClassId = linkedStudent ? linkedStudent.classId : classes[0].id;

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(isParent ? parentClassId : 'all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaEvidence | null>(null);
  const [viewingItem, setViewingItem] = useState<MediaEvidence | null>(null);
  const [activeViewingIndex, setActiveViewingIndex] = useState<number>(0);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'image' | 'video'>('image');
  const [formTopic, setFormTopic] = useState('Trải nghiệm sáng tạo & STEM');
  const [formClassId, setFormClassId] = useState(currentUser.homeroomClassId || 'class-3a1');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formDate, setFormDate] = useState('2026-10-18');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('STEM, Thực hành');
  // MULTIPLE MEDIA ITEMS IN ONE EVIDENCE
  const [formMediaList, setFormMediaList] = useState<MediaItem[]>([]);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);

  // Auto sync formClassId whenever currentUser changes
  React.useEffect(() => {
    if (currentUser.homeroomClassId) {
      setFormClassId(currentUser.homeroomClassId);
    }
  }, [currentUser.homeroomClassId]);

  // Topics preset
  const topicsList = [
    'Trải nghiệm sáng tạo & STEM',
    'Hoạt động học tập',
    'Văn nghệ & Thể thao',
    'Tham quan dã ngoại',
    'Hồ sơ minh chứng chuyên môn'
  ];

  // Sample quick images
  const sampleImages = [
    { label: 'STEM Thực hành', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1000&auto=format&fit=crop&q=80' },
    { label: 'Lớp 1A1 Rèn chữ', url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=1000&auto=format&fit=crop&q=80' },
    { label: 'Dã ngoại Bảo tàng', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1000&auto=format&fit=crop&q=80' },
    { label: 'Thao giảng chuyên môn', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1000&auto=format&fit=crop&q=80' },
    { label: 'Hội khỏe Phù Đổng', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&auto=format&fit=crop&q=80' },
    { label: 'Tiết học Tiếng Anh', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1000&auto=format&fit=crop&q=80' },
  ];

  // Filtered evidence items
  const filteredEvidence = useMemo(() => {
    return mediaEvidence.filter((item) => {
      const matchClass = isParent
        ? (item.classId === parentClassId || item.classId === 'all')
        : (selectedClassId === 'all' || item.classId === selectedClassId || item.classId === 'all');
      const matchTopic = selectedTopic === 'all' || item.topic === selectedTopic;
      const matchType = selectedType === 'all' || item.type === selectedType;
      const matchSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchClass && matchTopic && matchType && matchSearch;
    });
  }, [mediaEvidence, selectedClassId, selectedTopic, selectedType, searchQuery, isParent, parentClassId]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormType('image');
    setFormTopic('Trải nghiệm sáng tạo & STEM');
    setFormClassId('class-3a1');
    const defaultUrl = sampleImages[0].url;
    setFormMediaUrl(defaultUrl);
    setFormMediaList([
      { id: 'm-' + Date.now(), url: defaultUrl, type: 'image', caption: 'Ảnh chính minh chứng' }
    ]);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormTags('STEM, Nhóm');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: MediaEvidence) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormType(item.type);
    setFormTopic(item.topic);
    setFormClassId(item.classId);
    setFormMediaUrl(item.mediaUrl);
    const existingList = (item.mediaList && item.mediaList.length > 0)
      ? item.mediaList
      : [{ id: 'm-1', url: item.mediaUrl, type: item.type, caption: item.title }];
    setFormMediaList(existingList);
    setFormDate(item.date);
    setFormDescription(item.description);
    setFormTags(item.tags?.join(', ') || '');
    setIsAddModalOpen(true);
  };

  // Upload multiple files via Cloud upload button
  const handleCloudFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingCloud(true);
    const newItems: MediaItem[] = [];
    let loadedCount = 0;
    const total = files.length;

    Array.from(files).forEach((file, index) => {
      const isVid = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = () => {
        const resultUrl = reader.result as string;
        newItems.push({
          id: `media-file-${Date.now()}-${index}`,
          url: resultUrl,
          type: isVid ? 'video' : 'image',
          caption: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
        });
        loadedCount++;
        if (loadedCount === total) {
          setFormMediaList((prev) => [...prev, ...newItems]);
          if (!formMediaUrl && newItems.length > 0) {
            setFormMediaUrl(newItems[0].url);
            setFormType(newItems[0].type);
          }
          setIsUploadingCloud(false);
          showToast(`Đã tải lên thành công ${total} tệp (ảnh/video) vào minh chứng!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddMediaUrlToList = () => {
    if (!formMediaUrl.trim()) {
      showToast('Vui lòng nhập đường dẫn liên kết hình ảnh hoặc video!', 'warning');
      return;
    }
    const newItem: MediaItem = {
      id: 'm-url-' + Date.now(),
      url: formMediaUrl.trim(),
      type: formType,
      caption: `Tư liệu ${formMediaList.length + 1}`,
    };
    setFormMediaList((prev) => [...prev, newItem]);
    showToast('Đã thêm tư liệu vào danh sách minh chứng!', 'success');
  };

  const handleRemoveMediaItem = (id: string) => {
    if (formMediaList.length <= 1) {
      showToast('Mỗi minh chứng cần có ít nhất 1 ảnh hoặc video!', 'warning');
      return;
    }
    setFormMediaList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề minh chứng!', 'error');
      return;
    }

    if (formMediaList.length === 0 && !formMediaUrl.trim()) {
      showToast('Vui lòng tải lên ít nhất 1 hình ảnh hoặc video minh chứng!', 'error');
      return;
    }

    const effectiveMediaList = formMediaList.length > 0
      ? formMediaList
      : [{ id: 'm-init', url: formMediaUrl, type: formType, caption: formTitle }];

    const primaryMedia = effectiveMediaList[0];
    const cls = classes.find((c) => c.id === formClassId);
    const className = cls ? `Lớp ${cls.name}` : 'Toàn trường';
    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingItem) {
      updateMediaEvidence(editingItem.id, {
        title: formTitle,
        type: primaryMedia.type,
        topic: formTopic,
        classId: formClassId,
        className,
        mediaUrl: primaryMedia.url,
        mediaList: effectiveMediaList,
        date: formDate,
        description: formDescription,
        tags: parsedTags,
      });
      showToast('Đã cập nhật minh chứng lớp học thành công!', 'success');
    } else {
      addMediaEvidence({
        title: formTitle,
        type: primaryMedia.type,
        topic: formTopic,
        classId: formClassId,
        className,
        mediaUrl: primaryMedia.url,
        mediaList: effectiveMediaList,
        date: formDate,
        uploaderName: currentUser.name,
        uploaderRole: currentUser.role === 'homeroom_teacher' ? `GVCN ${currentUser.homeroomClassName || 'Lớp'}` : 'Ban giám hiệu',
        description: formDescription,
        tags: parsedTags,
      });
      showToast('Đã thêm minh chứng mới với đầy đủ ảnh/video thành công!', 'success');
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-pink-50 text-pink-600">
              <Camera className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              Quản lý Hình ảnh & Minh chứng Lớp học
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lưu trữ, phân loại ảnh và video hoạt động giáo dục, trải nghiệm sáng tạo và hồ sơ minh chứng đánh giá học sinh theo chủ đề.
          </p>
        </div>

        {!isParent && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md transition-all btn-tactile"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm hình ảnh / Video mới</span>
          </button>
        )}
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-pink-50 text-pink-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Tổng minh chứng</span>
            <span className="text-lg font-black text-slate-800">{mediaEvidence.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Hình ảnh lớp học</span>
            <span className="text-lg font-black text-slate-800">
              {mediaEvidence.filter((m) => m.type === 'image').length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Video hoạt động</span>
            <span className="text-lg font-black text-slate-800">
              {mediaEvidence.filter((m) => m.type === 'video').length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Chủ đề phân loại</span>
            <span className="text-lg font-black text-slate-800">{topicsList.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          {!isParent ? (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} ({c.homeroomTeacherName})
                </option>
              ))}
            </select>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-900 text-xs font-bold">
              <span>Lớp của con: Lớp {classes.find(c => c.id === parentClassId)?.name || '3A1'}</span>
            </div>
          )}

          {/* Topic Filter */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">Tất cả chủ đề</option>
            {topicsList.map((t, idx) => (
              <option key={idx} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">Tất cả định dạng</option>
            <option value="image">Chỉ hình ảnh</option>
            <option value="video">Chỉ video clip</option>
          </select>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, người đăng, mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none w-56 font-medium"
            />
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400">
          Hiển thị <span className="text-pink-600 font-extrabold">{filteredEvidence.length}</span> minh chứng
        </span>
      </div>

      {/* Media Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvidence.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            {/* Thumbnail Header */}
            <div>
              <div
                className="relative h-48 w-full bg-slate-100 overflow-hidden cursor-pointer"
                onClick={() => {
                  setViewingItem(item);
                  setActiveViewingIndex(0);
                }}
              >
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge Type */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-[10px] font-extrabold flex items-center gap-1">
                    {item.type === 'video' ? (
                      <>
                        <Video className="w-3 h-3 text-pink-400" />
                        <span>Video Clip</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 text-sky-400" />
                        <span>Hình ảnh</span>
                      </>
                    )}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-pink-600/90 text-white text-[10px] font-extrabold backdrop-blur-xs">
                    {item.className}
                  </span>
                </div>

                {/* Count Badge if multiple images/videos */}
                {item.mediaList && item.mediaList.length > 1 && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-black/65 text-amber-300 border border-amber-300/30 text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 shadow-sm">
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>{item.mediaList.length} tệp (ảnh/video)</span>
                  </div>
                )}

                {/* Date Badge */}
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/50 text-white text-[10px] backdrop-blur-xs">
                  {item.date}
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-600">
                  <Tag className="w-3 h-3" />
                  <span>{item.topic}</span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-800 line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer with Buttons */}
            <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                {item.uploaderName}
              </div>

              <div className="flex items-center gap-1.5">
                {/* NÚT XEM */}
                <button
                  type="button"
                  onClick={() => setViewingItem(item)}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Xem chi tiết minh chứng"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem</span>
                </button>

                {/* NÚT CHỈNH SỬA */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                  title="Chỉnh sửa thông tin"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* NÚT XÓA */}
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(item.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Xóa minh chứng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvidence.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <Camera className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">Chưa có minh chứng nào phù hợp</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Thầy/Cô có thể bấm nút &quot;Thêm hình ảnh / Video mới&quot; để bổ sung tư liệu hoạt động lớp học.
          </p>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: XEM MINH CHỨNG (LIGHTBOX & PLAYER CHI TIẾT) */}
      {/* ============================================================== */}
      {viewingItem && (() => {
        const viewingMediaList: MediaItem[] = (viewingItem.mediaList && viewingItem.mediaList.length > 0)
          ? viewingItem.mediaList
          : [{ id: 'm-single', url: viewingItem.mediaUrl, type: viewingItem.type, caption: viewingItem.title }];
        
        const currentIndex = Math.max(0, Math.min(activeViewingIndex, viewingMediaList.length - 1));
        const currentMedia = viewingMediaList[currentIndex];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-pink-50 text-pink-600">
                    {currentMedia.type === 'video' ? <Video className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{viewingItem.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{viewingItem.topic} • {viewingItem.className}</span>
                      {viewingMediaList.length > 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-extrabold text-[10px]">
                          Tư liệu {currentIndex + 1} / {viewingMediaList.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Media Viewer with Carousel Prev / Next */}
              <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center relative min-h-[360px] max-h-[480px]">
                {currentMedia.type === 'video' ? (
                  <div className="relative w-full h-full flex items-center justify-center min-h-[360px]">
                    <img
                      src={currentMedia.url}
                      alt={currentMedia.caption || viewingItem.title}
                      className="max-h-[440px] w-auto object-contain mx-auto opacity-75"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <div className="w-16 h-16 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                        <Video className="w-8 h-8 ml-0.5" />
                      </div>
                      <span className="mt-3 text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full">
                        {currentMedia.caption || 'Video ghi hình hoạt động'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={currentMedia.url}
                    alt={currentMedia.caption || viewingItem.title}
                    className="max-h-[440px] w-auto object-contain mx-auto"
                  />
                )}

                {/* Left Arrow */}
                {viewingMediaList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveViewingIndex((prev) => (prev > 0 ? prev - 1 : viewingMediaList.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-lg backdrop-blur-xs"
                    title="Xem ảnh/video trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Right Arrow */}
                {viewingMediaList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveViewingIndex((prev) => (prev < viewingMediaList.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-lg backdrop-blur-xs"
                    title="Xem ảnh/video tiếp theo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Caption overlay */}
                {currentMedia.caption && (
                  <div className="absolute bottom-3 inset-x-3 text-center">
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-medium backdrop-blur-xs">
                      {currentMedia.caption}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip Gallery (if multiple items) */}
              {viewingMediaList.length > 1 && (
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0 px-1">
                    Bộ sưu tập ({viewingMediaList.length}):
                  </span>
                  {viewingMediaList.map((m, idx) => (
                    <button
                      key={m.id || idx}
                      type="button"
                      onClick={() => setActiveViewingIndex(idx)}
                      className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        currentIndex === idx
                          ? 'border-pink-600 ring-2 ring-pink-400 scale-105'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={m.url} alt={m.caption || ''} className="w-full h-full object-cover" />
                      {m.type === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Metadata Info */}
              <div className="p-4 rounded-2xl bg-slate-50 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700">
                    Người đăng tải: <strong className="text-slate-900">{viewingItem.uploaderName}</strong> ({viewingItem.uploaderRole})
                  </span>
                  <span className="text-slate-500">Ngày ghi hình/chụp: <strong>{viewingItem.date}</strong></span>
                </div>
                <p className="text-slate-600 leading-relaxed pt-1">
                  <strong>Mô tả minh chứng đánh giá:</strong> {viewingItem.description}
                </p>
                {viewingItem.tags && viewingItem.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="font-bold text-slate-500">Từ khóa:</span>
                    {viewingItem.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* MODAL: THÊM & CHỈNH SỬA MINH CHỨNG */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingItem ? 'Chỉnh sửa Minh chứng Lớp học' : 'Thêm Hình ảnh / Video Minh chứng Mới'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề minh chứng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiết học trải nghiệm STEM - Lắp ghép mô hình xe gió"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Định dạng</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  >
                    <option value="image">Hình ảnh (Ảnh chụp)</option>
                    <option value="video">Video clip ngắn</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lớp học áp dụng</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  >
                    <option value="all">Toàn trường</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Lớp {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chủ đề phân loại</label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none cursor-pointer"
                  >
                    {topicsList.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày diễn ra</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* KHU VỰC TẢI LÊN ĐÁM MÂY & QUẢN LÝ NHIỀU ẢNH / VIDEO TRONG 1 MINH CHỨNG */}
              {/* ------------------------------------------------------------- */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/70 via-rose-50/30 to-purple-50/50 border border-pink-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-pink-600" />
                    Tải lên Đám mây & Danh sách Ảnh/Video ({formMediaList.length} tệp)
                  </span>
                  <span className="text-[11px] text-pink-700 font-medium">
                    Mỗi minh chứng có thể có nhiều ảnh, video
                  </span>
                </div>

                {/* NÚT TẢI LÊN ĐÁM MÂY */}
                <label className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-2xl cursor-pointer font-bold text-xs shadow-md transition-all">
                  <UploadCloud className="w-4 h-4 text-white animate-pulse" />
                  <span>{isUploadingCloud ? 'Đang đọc và tải tệp lên đám mây...' : 'Bấm để Tải ảnh / Video từ máy tính lên Đám mây (chọn nhiều tệp)'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleCloudFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Hoặc thêm bằng link URL trực tiếp */}
                <div className="pt-2 border-t border-pink-100 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Hoặc dán đường dẫn ảnh / video (URL)..."
                    value={formMediaUrl}
                    onChange={(e) => setFormMediaUrl(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-pink-500 font-mono text-[11px]"
                  />
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="bg-white border border-slate-200 px-2.5 py-2 rounded-xl text-xs outline-none"
                  >
                    <option value="image">Ảnh</option>
                    <option value="video">Video</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMediaUrlToList}
                    className="px-3 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold shrink-0 transition-colors"
                  >
                    + Thêm tệp
                  </button>
                </div>

                {/* Chọn ảnh mẫu có sẵn */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Ảnh mẫu có sẵn:</span>
                  {sampleImages.slice(0, 4).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormMediaList((prev) => [
                          ...prev,
                          { id: 'sample-' + Date.now() + '-' + idx, url: s.url, type: 'image', caption: s.label }
                        ]);
                        showToast(`Đã thêm ảnh mẫu "${s.label}" vào minh chứng!`, 'info');
                      }}
                      className="px-2 py-0.5 rounded-md bg-white border border-pink-200 hover:bg-pink-50 text-slate-600 text-[10px] font-medium"
                    >
                      + {s.label}
                    </button>
                  ))}
                </div>

                {/* Danh sách các ảnh / video đã được thêm vào minh chứng này */}
                {formMediaList.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[11px] font-bold text-slate-700">
                      Các ảnh / video đã có trong minh chứng này:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {formMediaList.map((mediaItem, idx) => (
                        <div
                          key={mediaItem.id || idx}
                          className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                              <img src={mediaItem.url} alt="" className="w-full h-full object-cover" />
                              {mediaItem.type === 'video' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Video className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <input
                                type="text"
                                value={mediaItem.caption || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormMediaList((prev) =>
                                    prev.map((item) =>
                                      item.id === mediaItem.id ? { ...item, caption: val } : item
                                    )
                                  );
                                }}
                                placeholder="Ghi chú ảnh/video..."
                                className="w-full text-[11px] font-bold text-slate-800 bg-transparent outline-none truncate border-b border-transparent hover:border-slate-300 focus:border-pink-500"
                              />
                              <span className="text-[9px] text-slate-400">
                                {mediaItem.type === 'video' ? 'Video' : 'Ảnh'} #{idx + 1}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaItem(mediaItem.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 shrink-0"
                            title="Xóa tệp này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả minh chứng chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú hoạt động của học sinh, phương pháp giảng dạy, đánh giá mức độ đạt được..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thẻ phân loại (ngăn cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="STEM, Toán học, Nhóm, Hoạt động ngoại khóa"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold transition-all shadow-md btn-tactile"
                >
                  {editingItem ? 'Lưu cập nhật' : 'Thêm minh chứng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetId)}
        title="Xóa minh chứng này"
        message="Thầy/Cô có chắc chắn muốn xóa tư liệu hình ảnh / video minh chứng này? Dữ liệu đã xóa sẽ không thể phục hồi."
        confirmLabel="Xác nhận xóa"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMediaEvidence(deleteTargetId);
            setDeleteTargetId(null);
            showToast('Đã xóa minh chứng thành công!', 'info');
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
