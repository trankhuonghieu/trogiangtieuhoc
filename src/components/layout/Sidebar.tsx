import React from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users2,
  CalendarDays,
  FileSpreadsheet,
  Gamepad2,
  Award,
  Sparkles,
  MessageCircle,
  BarChart3,
  FolderArchive,
  Camera,
  Settings,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, currentUser, teachingPlans, notifications, mediaEvidence, schoolName } = useApp();

  const isParent = currentUser.role === 'parent_student';

  const allNavItems: {
    id: ActiveTab;
    label: string;
    sublabel: string;
    icon: any;
    badge?: string | number;
    color: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      sublabel: 'Thông tin chung & kết quả của con',
      icon: LayoutDashboard,
      color: 'text-sky-600',
    },
    {
      id: 'classes_students',
      label: 'Quản lý Lớp & Học sinh',
      sublabel: 'Danh sách, chuyên cần & hồ sơ',
      icon: Users2,
      color: 'text-blue-600',
    },
    {
      id: 'teaching_plans',
      label: 'Kế hoạch & Thời khóa biểu',
      sublabel: 'Năm, kỳ, tháng, tuần & TKB',
      icon: CalendarDays,
      badge: teachingPlans.filter(p => p.status === 'in_progress').length,
      color: 'text-emerald-600',
    },
    {
      id: 'lesson_design',
      label: 'Thiết kế Bài giảng (KHBD)',
      sublabel: 'Soạn giáo án chuẩn GDPT 2018',
      icon: FileSpreadsheet,
      color: 'text-teal-600',
    },
    {
      id: 'interactive_activities',
      label: 'Hoạt động & Trò chơi',
      sublabel: 'Vòng quay, trắc nghiệm, ghép đôi',
      icon: Gamepad2,
      color: 'text-amber-500',
    },
    {
      id: 'assessment',
      label: 'Kiểm tra & Đánh giá TT27',
      sublabel: 'Ngân hàng câu hỏi & sổ nhận xét',
      icon: Award,
      color: 'text-rose-500',
    },
    {
      id: 'ai_assistant',
      label: 'Trợ lý AI Giáo viên',
      sublabel: 'Soạn giáo án, đề thi & slide',
      icon: Sparkles,
      badge: 'AI Smart',
      color: 'text-purple-600',
    },
    {
      id: 'parent_communication',
      label: 'Giao tiếp với Phụ huynh',
      sublabel: 'Thông báo & kết quả học tập con',
      icon: MessageCircle,
      badge: notifications.length,
      color: 'text-cyan-600',
    },
    {
      id: 'reports',
      label: 'Báo cáo & Thống kê',
      sublabel: 'Chuyên cần, học lực & tiến độ',
      icon: BarChart3,
      color: 'text-indigo-600',
    },
    {
      id: 'learning_materials',
      label: 'Kho Học liệu Số',
      sublabel: 'Slide, phiếu bài tập & video',
      icon: FolderArchive,
      color: 'text-orange-500',
    },
    {
      id: 'media_evidence',
      label: 'Hình ảnh & Minh chứng',
      sublabel: 'Quản lý ảnh, video theo chủ đề',
      icon: Camera,
      badge: mediaEvidence.length,
      color: 'text-pink-600',
    },
    {
      id: 'settings',
      label: 'Tài khoản & Hệ thống',
      sublabel: 'Phân quyền, sao lưu & nhật ký',
      icon: Settings,
      color: 'text-slate-600',
    },
  ];

  const navItems = isParent
    ? allNavItems.filter((item) =>
        ['dashboard', 'teaching_plans', 'assessment', 'parent_communication', 'media_evidence'].includes(item.id)
      ).map((item) => {
        if (item.id === 'teaching_plans') {
          return { ...item, label: 'Thời khóa biểu', sublabel: 'Lịch học trong tuần của lớp' };
        }
        if (item.id === 'assessment') {
          return { ...item, label: 'Thi thử & Thi chính thức', sublabel: 'Làm bài kiểm tra & thi trực tuyến' };
        }
        if (item.id === 'parent_communication') {
          return { ...item, label: 'Giao tiếp Giáo viên & Phụ huynh', sublabel: 'Kết quả học tập của con' };
        }
        if (item.id === 'media_evidence') {
          return { ...item, label: 'Hình ảnh & Minh chứng', sublabel: 'Ảnh hoạt động lớp của con' };
        }
        return item;
      })
    : allNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 h-full lg:h-[calc(100vh-61px)] w-72 bg-white border-r border-slate-200/80 p-3.5 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 lg:hidden">
            <span className="font-extrabold text-slate-800 text-sm">MENU ĐIỀU HƯỚNG</span>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between transition-all duration-200 btn-tactile ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-50 to-blue-50/70 text-sky-900 shadow-xs border border-sky-200/80 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                          : `bg-slate-100 ${item.color} group-hover:scale-105`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs truncate font-bold">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate font-normal">
                        {item.sublabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          typeof item.badge === 'string'
                            ? 'bg-purple-100 text-purple-700 animate-pulse'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-sky-600 ml-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Educational Tip / System Status */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50/70 to-emerald-50/70 border border-sky-100/60">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-bold text-sky-900 truncate">{schoolName || 'Chuẩn GDPT 2018'}</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Số hóa quy trình dạy học & đánh giá định lượng theo TT 27/2020.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
