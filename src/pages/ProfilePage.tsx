import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  User,
  Copy,
  Check,
  ShieldCheck,
  LogOut,
  Calendar,
  Wallet,
  Landmark,
  Radio,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout, isConnected } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.userId);
    setCopied(true);
    showToast('info', 'Đã sao chép User ID', user.userId);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="profile-page" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-400" />
          <span>Thông tin tài khoản</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chi tiết định danh cá nhân và thông số tài khoản DemoBank
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* User Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-emerald-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-sm font-semibold text-emerald-400">{user.userId}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400 capitalize">
                  {user.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng chuẩn (User)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="profile-copy-id-btn"
              onClick={handleCopyId}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã chép ID' : 'Sao chép ID'}</span>
            </button>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Số dư khả dụng</span>
            </div>
            <div className="font-mono text-xl font-bold text-emerald-400">
              {user.balance.toLocaleString('vi-VN')} DEMO
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Ngày mở tài khoản</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {new Date(user.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>Trạng thái kết nối Server</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isConnected ? 'Realtime hoạt động (SSE)' : 'Đang kết nối lại'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảo mật tài khoản</span>
            </div>
            <div className="text-sm font-semibold text-emerald-400">
              Đã mã hóa mật khẩu (Bcrypt)
            </div>
          </div>
        </div>

        {/* Security & Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
          <span className="font-bold">Nhắc nhở:</span> Tài khoản này thuộc môi trường thử nghiệm DemoBank. Tiền ảo DEMO chỉ có giá trị mô phỏng tính năng chuyển tiền và quản trị nạp tiền, hoàn toàn không có giá trị thanh toán thực tế.
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            id="profile-logout-btn"
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất khỏi tài khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};
