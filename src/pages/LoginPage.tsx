import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Landmark, ArrowRight, ShieldCheck, KeyRound, User, Loader2, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onGoToRegister: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGoToRegister, onLoginSuccess }) => {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Mã người dùng và Mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await login(userId.trim().toUpperCase(), password);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoId: string, demoPass: string) => {
    setUserId(demoId);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div id="login-page" className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
              <Landmark className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Đăng nhập DemoBank</h1>
            <p className="text-xs text-slate-400">
              Hệ thống thử nghiệm giao dịch tiền ảo đa người dùng
            </p>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5"
            >
              <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-userid-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mã người dùng (User ID)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-userid-input"
                  type="text"
                  placeholder="Ví dụ: DB123456"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang kiểm tra...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tài khoản mẫu để kiểm thử nhanh (Click chọn):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                id="quick-fill-alice-btn"
                type="button"
                onClick={() => handleQuickFill('DB123456', 'password123')}
                className="p-2 text-left rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 transition-colors text-xs"
              >
                <div className="font-semibold text-emerald-400">Alice</div>
                <div className="text-[11px] text-slate-400">DB123456</div>
                <div className="text-[10px] text-slate-500">500,000 DEMO</div>
              </button>

              <button
                id="quick-fill-bob-btn"
                type="button"
                onClick={() => handleQuickFill('DB654321', 'password123')}
                className="p-2 text-left rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 transition-colors text-xs"
              >
                <div className="font-semibold text-teal-400">Bob</div>
                <div className="text-[11px] text-slate-400">DB654321</div>
                <div className="text-[10px] text-slate-500">100,000 DEMO</div>
              </button>

              <button
                id="quick-fill-admin-btn"
                type="button"
                onClick={() => handleQuickFill('DB000001', 'admin123')}
                className="p-2 text-left rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500/50 transition-colors text-xs"
              >
                <div className="font-semibold text-amber-400">Admin</div>
                <div className="text-[11px] text-slate-400">DB000001</div>
                <div className="text-[10px] text-amber-500/80">Quản trị viên</div>
              </button>
            </div>
          </div>

          {/* Switch to Register */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Chưa có tài khoản?{' '}
            <button
              id="switch-to-register-btn"
              onClick={onGoToRegister}
              className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
            >
              Mở tài khoản mới ngay
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>Mật khẩu được mã hóa bcrypt an toàn • Tiền ảo Demo</span>
        </div>
      </div>
    </div>
  );
};
