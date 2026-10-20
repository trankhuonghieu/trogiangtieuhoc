import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { AIChatBubble } from './components/common/AIChatBubble';
import { LoginScreen } from './components/auth/LoginScreen';

// Modules
import { Dashboard } from './components/dashboard/Dashboard';
import { ClassStudentManagement } from './components/modules/ClassStudentManagement';
import { TeachingPlansModule } from './components/modules/TeachingPlansModule';
import { LessonPlansModule } from './components/modules/LessonPlansModule';
import { InteractiveActivitiesModule } from './components/modules/InteractiveActivitiesModule';
import { AssessmentModule } from './components/modules/AssessmentModule';
import { AIAssistantModule } from './components/modules/AIAssistantModule';
import { ParentCommunicationModule } from './components/modules/ParentCommunicationModule';
import { ReportsAnalyticsModule } from './components/modules/ReportsAnalyticsModule';
import { LearningMaterialsModule } from './components/modules/LearningMaterialsModule';
import { MediaEvidenceModule } from './components/modules/MediaEvidenceModule';
import { SettingsSystemModule } from './components/modules/SettingsSystemModule';

const MainLayout: React.FC = () => {
  const { isAuthenticated, activeTab, darkMode } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If not authenticated, render dedicated LoginScreen first
  if (!isAuthenticated) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <LoginScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-800'}`}>
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'classes_students' && <ClassStudentManagement />}
          {activeTab === 'teaching_plans' && <TeachingPlansModule />}
          {activeTab === 'lesson_design' && <LessonPlansModule />}
          {activeTab === 'interactive_activities' && <InteractiveActivitiesModule />}
          {activeTab === 'assessment' && <AssessmentModule />}
          {activeTab === 'ai_assistant' && <AIAssistantModule />}
          {activeTab === 'parent_communication' && <ParentCommunicationModule />}
          {activeTab === 'reports' && <ReportsAnalyticsModule />}
          {activeTab === 'learning_materials' && <LearningMaterialsModule />}
          {activeTab === 'media_evidence' && <MediaEvidenceModule />}
          {activeTab === 'settings' && <SettingsSystemModule />}
        </main>
      </div>

      {/* Global Interactive Elements */}
      <ToastContainer />
      <AIChatBubble />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lỗi giao diện:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('trogiang_tieuhoc_state_v3');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              Đang làm mới dữ liệu hệ thống
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trình duyệt có thể đang lưu bản cache cũ hoặc phiên làm việc trước đó. Vui lòng bấm nút bên dưới để khôi phục và tiếp tục sử dụng.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Tải lại trang
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Khôi phục dữ liệu gốc
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
