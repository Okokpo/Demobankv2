import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Landmark, ArrowRight, User, KeyRound, CheckCircle2, Copy, Check, Loader2, Sparkles } from 'lucide-react';

interface RegisterPageProps {
  onGoToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin, onRegisterSuccess }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ userId: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await register(name.trim(), password, confirmPassword);
      setSuccessInfo({ userId: res.user.userId, name: res.user.name });
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (!successInfo?.userId) return;
    navigator.clipboard.writeText(successInfo.userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="register-page" className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Dialog Modal after registration */}
          {successInfo ? (
            <div id="register-success-box" className="text-center space-y-5 py-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-white">Mở tài khoản thành công!</h2>
                <p className="text-xs text-slate-400">
                  Chào mừng <span className="text-emerald-400 font-semibold">{successInfo.name}</span> đến với DemoBank!
                </p>
              </div>

              {/* Unique ID presentation card */}
              <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 text-center space-y-2">
                <p className="text-xs text-slate-400">Mã tài khoản DemoBank duy nhất của bạn:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl font-extrabold text-emerald-400 tracking-wider">
                    {successInfo.userId}
                  </span>
                  <button
                    id="copy-new-user-id-btn"
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Sao chép mã ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Vui lòng lưu lại Mã người dùng này để đăng nhập và chia sẻ cho người khác chuyển tiền cho bạn.
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                <Sparkles className="w-4 h-4" />
                <span>Bạn nhận được quà tặng chào mừng: 100,000 DEMO</span>
              </div>

              <button
                id="enter-dashboard-after-register-btn"
                onClick={onRegisterSuccess}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all"
              >
                <span>Vào Dashboard ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Form Header */}
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-2">
                  <Landmark className="w-8 h-8 text-teal-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Mở tài khoản DemoBank</h1>
                <p className="text-xs text-slate-400">
                  Hệ thống tự động cấp phát Mã người dùng (User ID) duy nhất
                </p>
              </div>

              {errorMessage && (
                <div
                  id="register-error-alert"
                  className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-name-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Họ và tên (Full name)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-name-input"
                      type="text"
                      placeholder="Ví dụ: Nguyen Van A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mật khẩu (Tối thiểu 6 ký tự)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-password-input"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm-password-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-confirm-password-input"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-teal-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <span>Mở tài khoản ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-400">
                Đã có tài khoản?{' '}
                <button
                  id="switch-to-login-btn"
                  onClick={onGoToLogin}
                  className="font-semibold text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                >
                  Đăng nhập tại đây
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
