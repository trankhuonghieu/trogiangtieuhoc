import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, schoolName } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc email được cấp!');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu truy cập!');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.message);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50/40 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header Logo & Dynamic School Name */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-emerald-500 p-0.5 shadow-md shadow-sky-600/20 flex-shrink-0">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <div>
            <h1 className="text-xs sm:text-sm lg:text-base font-extrabold text-slate-800 tracking-tight uppercase leading-snug">
              TRỢ GIẢNG TIỂU HỌC – NỀN TẢNG HỖ TRỢ GIÁO VIÊN TRONG DẠY HỌC
            </h1>
            <p className="text-[11px] text-sky-700 font-bold">
              {schoolName || 'Trường Tiểu học Vân Nham'} • BGD&ĐT GDPT 2018
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Chuẩn GDPT 2018
          </span>
        </div>
      </div>

      {/* Main Login Center Container */}
      <div className="max-w-5xl mx-auto w-full my-auto py-4 space-y-6">
        {/* Softly Rounded Center Emblem Logo Section */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            {/* Soft Glowing Aura Rings */}
            <div className="absolute -inset-3 bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 rounded-full blur-xl opacity-45 group-hover:opacity-75 transition duration-500" />
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 via-emerald-400 to-blue-600 rounded-full blur-sm opacity-60" />
            
            <div className="relative p-4 sm:p-5 bg-white rounded-full border-4 border-sky-100/90 shadow-2xl flex items-center justify-center backdrop-blur-md overflow-hidden">
              <img
                src="/assets/aistudio/image_d2555e7a.png"
                alt="Logo Trường Tiểu học Vân Nham Chính Giữa"
                className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 object-contain rounded-full hover:scale-105 transition-transform duration-300 filter drop-shadow-md"
              />
            </div>
          </div>

          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase mt-4">
            TRƯỜNG TIỂU HỌC VÂN NHAM
          </h2>
          <p className="text-xs sm:text-sm font-extrabold text-sky-700 mt-1 bg-sky-100/60 px-4 py-1 rounded-full border border-sky-200/60 inline-block shadow-xs">
            XÃ VÂN NHAM, TỈNH LẠNG SƠN • NĂM HỌC 2025 - 2026
          </p>
        </div>

        {/* Main Login Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
          {/* Left Hero Brand Panel (5 cols - Blue/Green Panel with Perfectly Centered Submerged Logo) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-sky-600 via-blue-600 to-emerald-600 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Perfectly Centered Submerged Watermark Logo (Logo Chìm Cân Đối) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none select-none z-0 p-6">
              <img
                src="/assets/aistudio/image_d2555e7a.png"
                alt="Logo Chìm Màn Hình Bảng Xanh Cân Đối"
                className="w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 object-contain filter drop-shadow-2xl brightness-125 saturate-125"
              />
            </div>

            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                <ShieldCheck className="w-4 h-4 text-emerald-300" /> Cổng Xác thực Nội bộ
              </span>

              <h2 className="text-xl sm:text-2xl font-black leading-snug">
                TRỢ GIẢNG TIỂU HỌC – NỀN TẢNG HỖ TRỢ GIÁO VIÊN TRONG DẠY HỌC
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 leading-relaxed font-normal">
                Hệ thống chuyên môn số hóa toàn diện quy trình chuẩn bị bài dạy, quản lý lớp học, tổ chức hoạt động học tập tương tác, kiểm tra đánh giá theo Thông tư 27 và phối hợp với phụ huynh.
              </p>
            </div>

            <div className="relative z-10 pt-8 space-y-3">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-200">
                  <Lock className="w-3.5 h-3.5" /> Quy định bảo mật & phân quyền:
                </p>
                <p className="text-[11px] text-sky-100 leading-relaxed font-normal">
                  Các tài khoản khác muốn vào hệ thống phải được <strong>Quản trị viên</strong> phân quyền cấp tài khoản mới và mật khẩu. Người dùng chỉ truy cập đúng phạm vi công việc được giao.
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-sky-200 font-semibold">
                <span>{schoolName}</span>
                <span>Bảo mật dữ liệu GDPT 2018</span>
              </div>
            </div>

            {/* Glowing background circles */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Right Form Panel (7 cols) */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    ĐĂNG NHẬP HỆ THỐNG
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Nhập tên đăng nhập và mật khẩu được Quản trị viên cấp quyền
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs border border-sky-100">
                  <Lock className="w-6 h-6" />
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed font-semibold">
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Clean Form without prefilled values and no quick login / default passwords displayed */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Tên đăng nhập hoặc Email *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên đăng nhập hoặc email được cấp..."
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Mật khẩu truy cập *
                    </label>
                    <span className="text-[11px] text-sky-600 font-semibold cursor-pointer hover:underline">
                      Quên mật khẩu?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu bảo mật..."
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 pl-11 pr-12 py-3.5 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    Ghi nhớ phiên đăng nhập trên thiết bị này
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold text-sm shadow-xl shadow-sky-600/25 btn-tactile flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <span>Đang kiểm tra thông tin tài khoản...</span>
                  ) : (
                    <>
                      <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Administrative policy reminder without password/quick login leaks */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500">
                <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Hệ thống yêu cầu xác thực bảo mật. Vui lòng sử dụng tài khoản được Ban giám hiệu hoặc Quản trị viên cấp để đăng nhập.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-slate-400 py-2">
        <p>© 2026 TRỢ GIẢNG TIỂU HỌC – NỀN TẢNG HỖ TRỢ GIÁO VIÊN TRONG DẠY HỌC • {schoolName}</p>
      </div>
    </div>
  );
};
