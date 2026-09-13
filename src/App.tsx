import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { DisclaimerBanner } from './components/DisclaimerBanner.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { TransferPage } from './pages/TransferPage.tsx';
import { DepositPage } from './pages/DepositPage.tsx';
import { TransactionsPage } from './pages/TransactionsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { Loader2, Landmark } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div id="app-loading-screen" className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Landmark className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Đang khởi động DemoBank...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render view depending on authentication and active tab
  const renderContent = () => {
    if (!user) {
      if (activeTab === 'register') {
        return (
          <RegisterPage
            onGoToLogin={() => setActiveTab('login')}
            onRegisterSuccess={() => setActiveTab('dashboard')}
          />
        );
      }
      return (
        <LoginPage
          onGoToRegister={() => setActiveTab('register')}
          onLoginSuccess={() => setActiveTab('dashboard')}
        />
      );
    }

    switch (activeTab) {
      case 'transfer':
        return <TransferPage onTransferSuccess={() => setActiveTab('dashboard')} />;
      case 'deposit':
        return <DepositPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'transactions':
        return <TransactionsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminPage />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      <DisclaimerBanner />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full pb-16">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer id="main-footer" className="bg-slate-900/60 border-t border-slate-800/80 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-medium text-slate-400">
            <span>DemoBank • Môi trường thử nghiệm tiền ảo số hóa</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Multi-User Shared Database</span>
          </div>
          <p className="text-[11px] text-slate-600 max-w-xl mx-auto">
            Hệ thống sử dụng cơ sở dữ liệu SQLite máy chủ với giao dịch nguyên tử ACID (Atomic Transactions), hỗ trợ Server-Sent Events (SSE) cập nhật số dư thời gian thực đa thiết bị.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
