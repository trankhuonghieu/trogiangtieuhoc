import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LearningMaterial } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  FolderArchive,
  Plus,
  Filter,
  Search,
  Download,
  Trash2,
  FileText,
  Presentation,
  Video,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  Share2,
  Eye,
  BookOpen,
  User,
  ExternalLink,
  Calendar,
  Layers,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

export const LearningMaterialsModule: React.FC = () => {
  const {
    learningMaterials,
    subjects,
    currentUser,
    addLearningMaterial,
    deleteLearningMaterial,
    showToast,
  } = useApp();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'document' | 'slide' | 'image' | 'video' | 'worksheet'>('slide');
  const [subjectId, setSubjectId] = useState('subj-toan');
  const [grade, setGrade] = useState(currentUser.grade || 3);
  const [topic, setTopic] = useState('');
  const [sourceName, setSourceName] = useState('Cổng học liệu số Quốc gia & Bộ GD&ĐT');
  const [uploaderName, setUploaderName] = useState(currentUser.name || 'Cô Lê Thị Hương');
  const [description, setDescription] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('3.5 MB');

  // Auto sync grade and uploaderName whenever currentUser changes
  React.useEffect(() => {
    if (currentUser.grade) {
      setGrade(currentUser.grade);
    }
    if (currentUser.name) {
      setUploaderName(currentUser.name);
    }
  }, [currentUser.grade, currentUser.name]);

  // Filtered materials
  const filteredMaterials = learningMaterials.filter((m) => {
    const matchType = selectedType === 'all' || m.type === selectedType;
    const matchSubj = selectedSubject === 'all' || m.subjectId === selectedSubject;
    const matchGrade = selectedGrade === 0 || m.grade === selectedGrade;
    const matchSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSubj && matchGrade && matchSearch;
  });

  // CLOUD UPLOAD HANDLER: Tải tệp từ máy tính lên đám mây
  const handleCloudFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeMB} MB`;
    setUploadedFileName(file.name);
    setUploadedFileSize(sizeStr);

    // Tự động nhận diện tên tài liệu
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (!title) {
      setTitle(cleanName);
    }

    // Tự động nhận diện định dạng
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) {
      setType('slide');
    } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      setType('worksheet');
    } else if (lowerName.endsWith('.pdf')) {
      setType('document');
    } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      setType('worksheet');
    } else if (file.type.startsWith('video') || lowerName.endsWith('.mp4')) {
      setType('video');
    } else if (file.type.startsWith('image') || lowerName.endsWith('.png') || lowerName.endsWith('.jpg')) {
      setType('image');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFileData(reader.result as string);
      showToast(`Đã nhận tệp "${file.name}" (${sizeStr}) sẵn sàng tải lên đám mây!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tên tài liệu!', 'error');
      return;
    }

    addLearningMaterial({
      title,
      type,
      subjectId,
      grade,
      topic: topic || 'Học liệu bổ trợ',
      fileSize: uploadedFileSize || '3.5 MB',
      uploaderName: uploaderName || currentUser.name || 'Cô Lê Thị Hương',
      sourceName: sourceName || 'Cổng học liệu số Quốc gia & Bộ GD&ĐT',
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
      description,
      fileName: uploadedFileName || `${title}.${type === 'slide' ? 'pptx' : type === 'worksheet' ? 'docx' : 'pdf'}`,
      fileData: uploadedFileData || undefined,
    });

    setIsUploadModalOpen(false);
    setTitle('');
    setDescription('');
    setUploadedFileName(null);
    setUploadedFileData(null);
    showToast('Tải lên học liệu số mới lên đám mây thành công!', 'success');
  };

  // REAL FILE DOWNLOAD HANDLER: Cho phép tải nguyên tệp về máy tính
  const handleDownloadMaterial = (m: LearningMaterial) => {
    try {
      let downloadFileName = m.fileName || `${m.title.replace(/[\\/:*?"<>|]/g, '_')}.${
        m.type === 'slide' ? 'pptx' : m.type === 'worksheet' ? 'docx' : m.type === 'video' ? 'mp4' : m.type === 'image' ? 'png' : 'doc'
      }`;

      // Nếu đã có dataUrl do giáo viên tải lên
      if (m.fileData && m.fileData.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = m.fileData;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Tạo nguyên tệp tài liệu chuẩn (.doc) tương thích 100% với Microsoft Word / Google Docs
        const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${m.title}</title>
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
    body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #1e293b; margin: 30px; }
    .header-table { width: 100%; border-bottom: 2px solid #0f172a; margin-bottom: 20px; }
    h1 { font-size: 16pt; color: #0369a1; text-align: center; text-transform: uppercase; margin-top: 15px; margin-bottom: 5px; }
    .subtitle { text-align: center; font-style: italic; font-size: 11pt; color: #64748b; margin-bottom: 20px; }
    .box { border: 1.5px solid #cbd5e1; padding: 14px; background-color: #f8fafc; border-radius: 8px; margin: 15px 0; }
    h2 { font-size: 13.5pt; color: #c2410c; margin-top: 20px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 5px; }
    table.content-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    table.content-table th, table.content-table td { border: 1px solid #94a3b8; padding: 8px 12px; }
    table.content-table th { background-color: #f1f5f9; font-weight: bold; }
    .footer { margin-top: 30px; text-align: right; font-style: italic; font-size: 11pt; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="text-align: left; vertical-align: top;">
        <strong>TRƯỜNG TIỂU HỌC LÊ QUÝ ĐÔN</strong><br/>
        <em>Kho dữ liệu học liệu số GDPT 2018</em>
      </td>
      <td style="text-align: right; vertical-align: top;">
        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
        <em>Độc lập - Tự do - Hạnh phúc</em>
      </td>
    </tr>
  </table>

  <h1>${m.title}</h1>
  <div class="subtitle">
    Khối lớp: Lớp ${m.grade} • Định dạng: ${m.type.toUpperCase()} • Nguồn: ${m.sourceName || 'Cổng học liệu số Quốc gia'}
  </div>

  <div class="box">
    <strong>THÔNG TIN TÀI NGUYÊN HỌC LIỆU SỐ:</strong><br/>
    • <strong>Người tải lên:</strong> ${m.uploaderName}<br/>
    • <strong>Ngày phát hành:</strong> ${m.uploadDate}<br/>
    • <strong>Kích thước tệp:</strong> ${m.fileSize}<br/>
    • <strong>Nội dung tóm tắt:</strong> ${m.description || 'Học liệu số phục vụ chuẩn bị bài dạy và tổ chức hoạt động học tập.'}
  </div>

  <h2>1. MỤC TIÊU VÀ ĐỊNH HƯỚNG PHÁT TRIỂN NĂNG LỰC</h2>
  <p>Tài liệu này được biên soạn và chuẩn hóa phục vụ trực tiếp cho quá trình dạy học của giáo viên và rèn luyện của học sinh theo Chương trình GDPT 2018 và Thông tư 27/2020/TT-BGDĐT:</p>
  <ul>
    <li><strong>Năng lực đặc thù:</strong> Hình thành và củng cố tri thức, kỹ năng giải quyết tình huống bài học.</li>
    <li><strong>Năng lực chung:</strong> Tự chủ tự học, giao tiếp hợp tác và tư duy giải quyết vấn đề.</li>
    <li><strong>Phẩm chất:</strong> Chăm chỉ, trung thực và có trách nhiệm trong học tập.</li>
  </ul>

  <h2>2. NỘI DUNG VÀ HƯỚNG DẪN TRIỂN KHAI TRONG TIẾT HỌC</h2>
  <table class="content-table">
    <thead>
      <tr>
        <th style="width: 25%;">Tiến trình</th>
        <th style="width: 45%;">Nội dung hoạt động</th>
        <th style="width: 30%;">Phương pháp & Thiết bị</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Khởi động</strong></td>
        <td>Giới thiệu vấn đề, kết nối tâm thế học sinh qua trò chơi hoặc tình huống thực tế.</td>
        <td>Slide máy chiếu, câu hỏi gợi mở</td>
      </tr>
      <tr>
        <td><strong>Khám phá</strong></td>
        <td>Quan sát ngữ liệu, phân tích tranh ảnh / tài liệu để rút ra kiến thức cốt lõi.</td>
        <td>Tài liệu số ${m.title}, bảng phụ</td>
      </tr>
      <tr>
        <td><strong>Luyện tập</strong></td>
        <td>Thực hành cá nhân và thảo luận nhóm giải quyết các câu hỏi, bài tập kèm theo.</td>
        <td>Phiếu bài tập, bảng con</td>
      </tr>
      <tr>
        <td><strong>Vận dụng</strong></td>
        <td>Liên hệ thực tiễn đời sống gia đình, nhà trường và xã hội.</td>
        <td>Tình huống thực tiễn</td>
      </tr>
    </tbody>
  </table>

  <h2>3. PHẦN BÀI TẬP VÀ GỢI Ý ĐÁP ÁN</h2>
  <p><em>(Dành cho giáo viên tổ chức đánh giá thường xuyên theo Thông tư 27)</em></p>
  <p><strong>Câu 1:</strong> Nêu ý nghĩa hoặc quy tắc trọng tâm của bài học và cho ví dụ minh họa.</p>
  <p><strong>Câu 2:</strong> Vận dụng kiến thức đã học để giải bài tập thực hành tương tự trong thực tế.</p>

  <div class="footer">
    Ngày tải tệp: ${new Date().toLocaleDateString('vi-VN')}<br/>
    <strong>HỆ THỐNG TRỢ GIẢNG TIỂU HỌC</strong>
  </div>
</body>
</html>`;

        if (!downloadFileName.endsWith('.doc') && !downloadFileName.endsWith('.docx')) {
          downloadFileName = `${m.title.replace(/[\\/:*?"<>|]/g, '_')}.doc`;
        }

        const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      showToast(`🎉 Đã tải nguyên tệp "${downloadFileName}" về máy tính thành công!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi khi tải tệp về máy tính!', 'error');
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'slide':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'worksheet':
        return <FileSpreadsheet className="w-5 h-5 text-sky-500" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <FolderArchive className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800">
              Quản lý Học liệu Số & Tài nguyên Dạy học
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kho lưu trữ slide trình chiếu, phiếu bài tập, tranh ảnh trực quan và video minh họa phân loại theo khối lớp & môn học.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition-all btn-tactile"
          >
            <Plus className="w-4 h-4" />
            <span>Tải lên học liệu mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Format Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tất cả định dạng</option>
            <option value="slide">Bài giảng Slide (PPTX)</option>
            <option value="worksheet">Phiếu bài tập (Word/PDF)</option>
            <option value="video">Video khoa học minh họa</option>
            <option value="document">Tài liệu & Ma trận đề</option>
            <option value="image">Tranh ảnh trực quan</option>
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tất cả môn học</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none"
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
            placeholder="Tìm theo tên học liệu hoặc chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 px-4 py-1.5 rounded-xl text-xs text-slate-700 outline-none w-56"
          />
        </div>

        <span className="text-xs font-bold text-slate-400">
          {filteredMaterials.length} tài nguyên số
        </span>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMaterials.map((material) => (
          <div
            key={material.id}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between card-hover"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                  {getTypeIcon(material.type)}
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {material.fileSize}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-800 mt-3 line-clamp-2 leading-snug">
                {material.title}
              </h3>

              <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                {material.description}
              </p>

              {/* Tên nguồn tài liệu */}
              <div className="mt-2.5 p-2 rounded-xl bg-orange-50/70 border border-orange-100 text-[11px] text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="truncate">
                  <strong>Nguồn:</strong> {material.sourceName || 'Cổng học liệu số Quốc gia & Bộ GD&ĐT'}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span>Khối {material.grade}</span>
                <span>Tải lên: {material.uploadDate}</span>
                <span>{material.downloadsCount} lượt tải</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate max-w-[130px]" title={`Giáo viên tải lên: ${material.uploaderName}`}>
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{material.uploaderName}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* NÚT CON MẮT XEM TÀI LIỆU */}
                <button
                  onClick={() => setViewingMaterial(material)}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Xem trước nội dung học liệu"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem</span>
                </button>

                <button
                  onClick={() => handleDownloadMaterial(material)}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Tải nguyên tệp về máy tính"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải tệp</span>
                </button>

                <button
                  onClick={() => setDeleteTargetId(material.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Material Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-800">Tải lên học liệu số (Lên Đám mây)</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* CLOUD UPLOAD DROPZONE */}
              <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-100/60 cursor-pointer transition-all text-center">
                <UploadCloud className="w-8 h-8 text-orange-600 mb-1.5 animate-bounce" />
                <span className="text-xs font-bold text-orange-950">
                  {uploadedFileName ? `Đã chọn: ${uploadedFileName} (${uploadedFileSize})` : 'Bấm để Tải tệp lên Đám mây từ máy tính'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Hỗ trợ Word (.docx, .doc), PowerPoint (.pptx), PDF, Excel, Video, Hình ảnh
                </span>
                <input
                  type="file"
                  onChange={handleCloudFileInput}
                  className="hidden"
                />
              </label>

              {uploadedFileName && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold truncate">{uploadedFileName} ({uploadedFileSize})</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600">Sẵn sàng lưu trữ đám mây</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tài liệu / bài học *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Slide bài giảng Toán 3 - Bảng nhân 8"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Định dạng
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                  >
                    <option value="slide">Slide trình chiếu (PowerPoint)</option>
                    <option value="worksheet">Phiếu bài tập (Word/PDF)</option>
                    <option value="video">Video bài giảng</option>
                    <option value="image">Hình ảnh minh họa</option>
                    <option value="document">Tài liệu khác</option>
                  </select>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên nguồn tài liệu / NXB *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cổng học liệu số Bộ GD&ĐT, NXB Giáo dục..."
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giáo viên tải lên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tên giáo viên"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-orange-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả nội dung tóm tắt
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú đối tượng học sinh, cách sử dụng trong tiết học..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 btn-tactile shadow-md"
                >
                  Thêm vào kho học liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="Xác nhận xóa học liệu"
        message="Bạn có chắc chắn muốn xóa tài liệu này khỏi kho lưu trữ?"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteLearningMaterial(deleteTargetId);
            setDeleteTargetId(null);
            showToast('Đã xóa học liệu khỏi kho!', 'info');
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* ============================================================== */}
      {/* MODAL: XEM TRƯỚC HỌC LIỆU SỐ (CON MẮT) */}
      {/* ============================================================== */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-orange-50">
                  {getTypeIcon(viewingMaterial.type)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 leading-snug">
                    {viewingMaterial.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Khối {viewingMaterial.grade}</span>
                    <span>•</span>
                    <span>Chủ đề: {viewingMaterial.topic}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingMaterial(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source & Uploader Highlight Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-orange-50/80 border border-orange-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="text-slate-700">
                  Tên nguồn tài liệu: <strong className="text-orange-900 text-sm font-black">{viewingMaterial.sourceName || 'Cổng học liệu số Quốc gia & Bộ GD&ĐT'}</strong>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-orange-200/60 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Giáo viên tải lên: <strong className="text-slate-800">{viewingMaterial.uploaderName}</strong></span>
                </div>
                <span>Ngày đăng: <strong>{viewingMaterial.uploadDate}</strong> • Dung lượng: <strong>{viewingMaterial.fileSize}</strong></span>
              </div>
            </div>

            {/* Document Content Interactive Preview */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
              <span className="text-xs font-black uppercase text-slate-400 block tracking-wider">
                Nội dung xem trước học liệu
              </span>

              {viewingMaterial.type === 'slide' && (
                <div className="space-y-3">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase">
                      Slide 1: Khởi động & Giới thiệu bài học
                    </span>
                    <h4 className="text-lg font-black text-slate-800 mt-2">{viewingMaterial.title}</h4>
                    <p className="text-xs text-slate-500 italic max-w-md mx-auto">
                      &quot;Chào mừng các em học sinh thân yêu đến với tiết học sôi nổi và hào hứng hôm nay!&quot;
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">Slide 2: Khám phá kiến thức mới</span>
                      <p className="text-[11px] text-slate-400 mt-1">Hình ảnh trực quan và sơ đồ tư duy minh họa</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">Slide 3: Trò chơi luyện tập tương tác</span>
                      <p className="text-[11px] text-slate-400 mt-1">Hái hoa dân chủ & Bắn tên trả lời nhanh</p>
                    </div>
                  </div>
                </div>
              )}

              {viewingMaterial.type === 'worksheet' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-100 text-[11px] font-bold text-slate-600">
                    <span>Trường TH Lê Quý Đôn</span>
                    <span>PHIẾU HỌC TẬP & ÔN TẬP</span>
                  </div>
                  <div className="text-slate-800 font-bold text-sm text-center uppercase py-1">
                    {viewingMaterial.title}
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {viewingMaterial.description}
                  </p>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
                    <div><strong>Bài 1:</strong> Đọc kỹ yêu cầu và khoanh tròn vào chữ cái đặt trước câu trả lời đúng.</div>
                    <div><strong>Bài 2:</strong> Vận dụng kiến thức thực tế để giải bài toán có lời văn.</div>
                  </div>
                </div>
              )}

              {viewingMaterial.type === 'video' && (
                <div className="bg-slate-900 rounded-2xl p-8 text-center text-white space-y-3 relative overflow-hidden">
                  <Video className="w-12 h-12 text-pink-500 mx-auto animate-pulse" />
                  <h4 className="font-black text-sm">{viewingMaterial.title}</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Video bài giảng khoa học trực quan sinh động chuẩn khung chương trình GDPT 2018.
                  </p>
                  <button
                    type="button"
                    onClick={() => showToast('Đang mở trình chiếu video học liệu...', 'info')}
                    className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md"
                  >
                    Bắt đầu phát video
                  </button>
                </div>
              )}

              {viewingMaterial.type !== 'slide' && viewingMaterial.type !== 'worksheet' && viewingMaterial.type !== 'video' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-800">{viewingMaterial.title}</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {viewingMaterial.description}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
              <strong>Ghi chú sư phạm:</strong> {viewingMaterial.description || 'Học liệu chuẩn phục vụ kế hoạch bài dạy theo Thông tư 27.'}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Lượt tải: <strong>{viewingMaterial.downloadsCount}</strong> lần
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadMaterial(viewingMaterial);
                  }}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 btn-tactile"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải tệp ({viewingMaterial.fileSize})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
