import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  Landmark,
  Send,
  PlusCircle,
  History,
  User,
  ShieldAlert,
  LogOut,
  Copy,
  Check,
  Menu,
  X,
  Radio,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, isConnected } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCopyId = () => {
    if (!user?.userId) return;
    navigator.clipboard.writeText(user.userId);
    setCopied(true);
    showToast('info', 'Đã sao chép mã tài khoản', user.userId);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Landmark },
    { id: 'transfer', label: 'Chuyển tiền', icon: Send },
    { id: 'deposit', label: 'Nạp tiền', icon: PlusCircle },
    { id: 'transactions', label: 'Lịch sử', icon: History },
    { id: 'profile', label: 'Hồ sơ', icon: User },
    { id: 'admin', label: 'Quản trị (Admin)', icon: ShieldAlert, isProtected: true },
  ];

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Landmark className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    DemoBank
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    DEMO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">Mô phỏng ngân hàng số</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isAdmin = item.id === 'admin';
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? isAdmin
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : isAdmin
                        ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.isProtected && (
                      <span className="p-0.5 rounded bg-amber-500/20 text-amber-400" title="Yêu cầu mật khẩu để vào">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* User ID & Actions */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Realtime Live Pulse indicator */}
              <div
                id="realtime-status-badge"
                title={isConnected ? 'Kết nối Realtime hoạt động' : 'Đang kết nối lại...'}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs"
              >
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[11px] text-slate-300">{isConnected ? 'Trực tiếp' : 'Đang nối'}</span>
              </div>

              {/* User ID chip with copy button */}
              <button
                id="header-copy-id-btn"
                onClick={handleCopyId}
                title="Bấm để sao chép mã tài khoản"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 transition-colors"
              >
                <span className="text-slate-400 text-[11px]">ID:</span>
                <span className="font-mono font-semibold text-emerald-400">{user.userId}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {/* Balance Badge */}
              <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/50 text-xs font-semibold text-emerald-300">
                <span>{user.balance.toLocaleString('vi-VN')} DEMO</span>
              </div>

              {/* Logout button */}
              <button
                id="header-logout-btn"
                onClick={logout}
                title="Đăng xuất"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile menu toggle */}
              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Menu di động"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-login-tab-btn"
                onClick={() => setActiveTab('login')}
                className="text-sm px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Đăng nhập
              </button>
              <button
                id="header-register-tab-btn"
                onClick={() => setActiveTab('register')}
                className="text-sm px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white shadow-sm transition-colors"
              >
                Mở tài khoản
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && user && (
        <div id="mobile-nav-dropdown" className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 px-3 mb-2 rounded-lg bg-slate-800/50 flex items-center justify-between text-xs">
            <span className="text-slate-400">Số dư hiện tại:</span>
            <span className="font-bold text-emerald-400 text-sm">{user.balance.toLocaleString('vi-VN')} DEMO</span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.isProtected && (
                  <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
          <button
            id="mobile-nav-logout-btn"
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất ({user.userId})</span>
          </button>
        </div>
      )}
    </header>
  );
};
