import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { api, getAdminPasscode, clearAdminPasscode } from '../api.ts';
import type { DepositRequest, UserProfile, Transaction, AdminStats } from '../types.ts';
import {
  ShieldAlert,
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  RotateCcw,
  Search,
  Check,
  X,
  Loader2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Admin passcode lock state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (user?.role === 'admin') return true;
    return getAdminPasscode() === '0944379685_vuok';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [verifyingPasscode, setVerifyingPasscode] = useState(false);
  const [showPasscodeText, setShowPasscodeText] = useState(false);

  const [activeTab, setActiveTab] = useState<'deposits' | 'users' | 'transactions' | 'test_scenario'>('deposits');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalDep, setRejectModalDep] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Balance adjust modal
  const [adjustUser, setAdjustUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Search filter
  const [userSearch, setUserSearch] = useState('');

  // Reset seed
  const [resettingSeed, setResettingSeed] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [s, deps, usrs, txs] = await Promise.all([
        api.getAdminStats(),
        api.getAdminDeposits(),
        api.getAdminUsers(),
        api.getAdminTransactions(),
      ]);
      setStats(s);
      setDeposits(deps);
      setUsers(usrs);
      setTransactions(txs);
    } catch (err: any) {
      showToast('error', 'Không thể tải dữ liệu quản trị', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminUnlocked) {
      fetchAdminData();
    }
  }, [isAdminUnlocked, user]);

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    const trimmed = passcodeInput.trim();
    if (!trimmed) {
      setPasscodeError('Vui lòng nhập mật khẩu quản trị.');
      return;
    }
    setVerifyingPasscode(true);
    try {
      await api.verifyAdminPasscode(trimmed);
      setIsAdminUnlocked(true);
      showToast('success', 'Xác thực thành công!', 'Bạn đã mở khóa tab Quản trị (Admin).');
      await fetchAdminData();
    } catch (err: any) {
      setPasscodeError(err.message || 'Mật khẩu quản trị không chính xác. Vui lòng kiểm tra lại.');
      showToast('error', 'Sai mật khẩu', 'Mật khẩu quản trị không chính xác.');
    } finally {
      setVerifyingPasscode(false);
    }
  };

  const handleLockAdmin = () => {
    clearAdminPasscode();
    setIsAdminUnlocked(false);
    setPasscodeInput('');
    showToast('info', 'Đã khóa tab Quản trị', 'Bạn cần nhập lại mật khẩu quản trị để vào lại.');
  };

  // If not unlocked, display the Admin Password Gate
  if (!isAdminUnlocked) {
    return (
      <div id="admin-password-gate" className="max-w-md mx-auto my-12 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Cổng Quản Trị Hệ Thống</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                Bảo vệ bằng mật khẩu
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tab Quản trị cần mật khẩu để vào. Vui lòng nhập mật khẩu quản trị để xem và duyệt các yêu cầu nạp tiền gửi vào tab này.
            </p>
          </div>

          <form onSubmit={handleUnlockAdmin} className="space-y-4">
            <div>
              <label htmlFor="admin-passcode-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Mật khẩu Quản trị
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-passcode-input"
                  type={showPasscodeText ? 'text' : 'password'}
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    if (passcodeError) setPasscodeError('');
                  }}
                  placeholder="Nhập mật khẩu quản trị..."
                  autoFocus
                  className="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-white text-sm placeholder-slate-500 transition-all font-mono"
                />
                <button
                  type="button"
                  id="toggle-admin-passcode-visibility-btn"
                  onClick={() => setShowPasscodeText(!showPasscodeText)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPasscodeText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passcodeError && (
                <div id="admin-passcode-error" className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passcodeError}</span>
                </div>
              )}
            </div>

            <button
              id="btn-submit-admin-passcode"
              type="submit"
              disabled={verifyingPasscode}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyingPasscode ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-slate-950" />
              )}
              <span>Xác nhận & Vào tab Quản trị</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500">
              DemoBank Admin Portal • Mật khẩu: <span className="font-mono text-slate-400 select-all">0944379685_vuok</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Handle Approve Deposit
  const handleApproveDeposit = async (dep: DepositRequest) => {
    setProcessingId(dep.id);
    try {
      await api.approveDeposit(dep.id);
      showToast(
        'success',
        'Đã duyệt nạp tiền!',
        `Đã cộng +${dep.amount.toLocaleString('vi-VN')} DEMO cho ${dep.userName} (${dep.userId})`
      );
      await fetchAdminData();
    } catch (err: any) {
      showToast('error', 'Không thể duyệt', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Approve All Pending Deposits
  const [approvingAll, setApprovingAll] = useState(false);
  const handleApproveAll = async () => {
    setApprovingAll(true);
    try {
      const res = await api.approveAllDeposits();
      showToast('success', 'Đã duyệt tất cả!', res.message);
      await fetchAdminData();
    } catch (err: any) {
      showToast('error', 'Lỗi duyệt tất cả', err.message);
    } finally {
      setApprovingAll(false);
    }
  };

  // Handle Reject Deposit
  const handleConfirmReject = async () => {
    if (!rejectModalDep) return;
    setProcessingId(rejectModalDep.id);
    try {
      await api.rejectDeposit(rejectModalDep.id, rejectReason.trim() || 'Không hợp lệ');
      showToast('info', 'Đã từ chối yêu cầu', `Yêu cầu của ${rejectModalDep.userName} đã bị từ chối.`);
      setRejectModalDep(null);
      setRejectReason('');
      await fetchAdminData();
    } catch (err: any) {
      showToast('error', 'Lỗi từ chối', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Adjust Balance
  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUser || adjustAmount === '') return;
    setAdjusting(true);
    try {
      const res = await api.adminAdjustBalance(
        adjustUser.userId,
        Number(adjustAmount),
        adjustReason.trim() || 'Điều chỉnh kiểm thử'
      );
      showToast(
        'success',
        'Đã cập nhật số dư!',
        `Số dư mới của ${adjustUser.name}: ${res.newBalance.toLocaleString('vi-VN')} DEMO`
      );
      setAdjustUser(null);
      setAdjustAmount('');
      setAdjustReason('');
      await fetchAdminData();
    } catch (err: any) {
      showToast('error', 'Không thể điều chỉnh số dư', err.message);
    } finally {
      setAdjusting(false);
    }
  };

  // Handle Reset Seed
  const handleResetSeed = async () => {
    setResettingSeed(true);
    try {
      const res = await api.resetSeedData();
      showToast('success', 'Đã khôi phục dữ liệu mẫu', res.message);
      await fetchAdminData();
    } catch (err: any) {
      showToast('error', 'Lỗi khôi phục', err.message);
    } finally {
      setResettingSeed(false);
    }
  };

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pastDeposits = deposits.filter((d) => d.status !== 'pending');

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q);
  });

  return (
    <div id="admin-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <span>Bảng điều khiển Quản trị viên (Admin Panel)</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Đã xác thực quản trị</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Nơi tiếp nhận và xét duyệt các yêu cầu nạp tiền, quản lý tài khoản và giám sát toàn bộ giao dịch hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            id="admin-refresh-data-btn"
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </button>

          <button
            id="admin-lock-tab-btn"
            type="button"
            onClick={handleLockAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs transition-colors border border-rose-500/30 font-medium"
            title="Khóa tab quản trị (Cần nhập lại mật khẩu 0944379685_vuok để vào lại)"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Khóa tab Admin</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold uppercase">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Tổng người dùng</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{stats.totalUsers}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold uppercase">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tiền DEMO lưu hành</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {stats.totalBalanceInCirculation.toLocaleString('vi-VN')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold uppercase">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Nạp chờ duyệt</span>
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono">{stats.pendingDepositsCount}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold uppercase">
              <History className="w-3.5 h-3.5 text-teal-400" />
              <span>Tổng giao dịch</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{stats.totalTransactionsCount}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          id="admin-tab-deposits"
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'deposits'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Duyệt nạp tiền</span>
          {pendingDeposits.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
              {pendingDeposits.length}
            </span>
          )}
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Quản lý người dùng</span>
        </button>

        <button
          id="admin-tab-transactions"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Tất cả giao dịch ({transactions.length})</span>
        </button>

        <button
          id="admin-tab-test-scenario"
          onClick={() => setActiveTab('test_scenario')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'test_scenario'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kịch bản kiểm thử (Alice & Bob)</span>
        </button>
      </div>

      {/* TAB 1: DEPOSITS APPROVAL */}
      {activeTab === 'deposits' && (
        <div className="space-y-6">
          {/* Pending Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Yêu cầu đang chờ duyệt ({pendingDeposits.length})</span>
              </h3>

              {pendingDeposits.length > 0 && (
                <button
                  id="btn-click-here-to-approve-all"
                  onClick={handleApproveAll}
                  disabled={approvingAll}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95"
                >
                  {approvingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Bấm vào đây để duyệt tất cả ({pendingDeposits.length})</span>
                </button>
              )}
            </div>

            {pendingDeposits.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
                Không có yêu cầu nạp tiền nào đang chờ duyệt.
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Mã YC</th>
                        <th className="p-3.5">Người yêu cầu</th>
                        <th className="p-3.5">Số tiền</th>
                        <th className="p-3.5">Thời gian gửi</th>
                        <th className="p-3.5 text-right">Thao tác duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {pendingDeposits.map((dep) => (
                        <tr key={dep.id} id={`admin-pending-dep-${dep.id}`} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">{dep.id}</td>
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{dep.userName}</div>
                            <div className="font-mono text-[11px] text-slate-400">ID: {dep.userId}</div>
                          </td>
                          <td className="p-3.5 font-mono text-base font-bold text-emerald-400">
                            +{dep.amount.toLocaleString('vi-VN')} DEMO
                          </td>
                          <td className="p-3.5 text-slate-400 text-xs">
                            {new Date(dep.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                id={`approve-deposit-btn-${dep.id}`}
                                onClick={() => handleApproveDeposit(dep)}
                                disabled={processingId === dep.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                                title="Bấm vào đây để duyệt yêu cầu này"
                              >
                                {processingId === dep.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Bấm vào đây để duyệt</span>
                              </button>

                              <button
                                id={`reject-deposit-btn-${dep.id}`}
                                onClick={() => setRejectModalDep(dep)}
                                disabled={processingId === dep.id}
                                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Past / Processed Section */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-400">
              Yêu cầu đã xử lý ({pastDeposits.length})
            </h3>
            {pastDeposits.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Mã YC</th>
                        <th className="p-3">Người yêu cầu</th>
                        <th className="p-3">Số tiền</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3">Người duyệt</th>
                        <th className="p-3">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-400">
                      {pastDeposits.map((dep) => (
                        <tr key={dep.id}>
                          <td className="p-3 font-mono text-[11px]">{dep.id}</td>
                          <td className="p-3 text-white font-medium">{dep.userName} ({dep.userId})</td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">
                            {dep.amount.toLocaleString('vi-VN')} DEMO
                          </td>
                          <td className="p-3">
                            {dep.status === 'approved' ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã duyệt
                              </span>
                            ) : (
                              <span className="text-rose-400 font-semibold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                Bị từ chối
                              </span>
                            )}
                          </td>
                          <td className="p-3">{dep.reviewedBy || '—'}</td>
                          <td className="p-3 text-[11px]">{dep.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                id="search-admin-users-input"
                type="text"
                placeholder="Tìm người dùng theo Tên hoặc Mã ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Tổng cộng: <strong className="text-white">{filteredUsers.length}</strong> tài khoản
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Mã tài khoản (User ID)</th>
                    <th className="p-3.5">Họ và tên</th>
                    <th className="p-3.5">Vai trò</th>
                    <th className="p-3.5">Số dư khả dụng</th>
                    <th className="p-3.5">Ngày tạo</th>
                    <th className="p-3.5 text-right">Điều chỉnh số dư</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.userId} id={`admin-user-row-${u.userId}`} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-emerald-400 text-sm">{u.userId}</td>
                      <td className="p-3.5 font-semibold text-white">{u.name}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-sm font-bold text-white">
                        {u.balance.toLocaleString('vi-VN')} DEMO
                      </td>
                      <td className="p-3.5 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          id={`adjust-user-btn-${u.userId}`}
                          onClick={() => {
                            setAdjustUser(u);
                            setAdjustAmount(u.balance);
                            setAdjustReason('Kiểm thử cân bằng số dư');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Sửa số dư
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS AUDIT LOG */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Toàn bộ giao dịch trên cơ sở dữ liệu ({transactions.length} giao dịch gần nhất)</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Mã TX</th>
                    <th className="p-3">Loại</th>
                    <th className="p-3">Người gửi</th>
                    <th className="p-3">Người nhận</th>
                    <th className="p-3">Số tiền</th>
                    <th className="p-3">Nội dung</th>
                    <th className="p-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-[11px] text-slate-400">{tx.id}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            tx.type === 'deposit'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-sans">
                        {tx.senderName} ({tx.senderId})
                      </td>
                      <td className="p-3 text-slate-300 font-sans">
                        {tx.receiverName} ({tx.receiverId})
                      </td>
                      <td className="p-3 font-bold text-white font-mono">
                        {tx.amount.toLocaleString('vi-VN')} DEMO
                      </td>
                      <td className="p-3 text-slate-400 font-sans max-w-[160px] truncate">
                        {tx.note || '—'}
                      </td>
                      <td className="p-3 text-slate-500 font-sans text-[11px]">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEST SCENARIO (ALICE & BOB) */}
      {activeTab === 'test_scenario' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Kịch bản kiểm thử quy chuẩn (Testing Scenario)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Theo quy định, hệ thống duy trì kịch bản kiểm tra chuyển tiền hai chiều giữa Alice và Bob trên cơ sở dữ liệu dùng chung.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alice card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">User A: Alice</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  DB123456
                </span>
              </div>
              <div className="text-xs text-slate-400">Mật khẩu: <span className="font-mono text-slate-200">password123</span></div>
              <div className="text-sm font-bold text-emerald-400 font-mono">Số dư khởi tạo: 500,000 DEMO</div>
            </div>

            {/* Bob card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">User B: Bob</span>
                <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                  DB654321
                </span>
              </div>
              <div className="text-xs text-slate-400">Mật khẩu: <span className="font-mono text-slate-200">password123</span></div>
              <div className="text-sm font-bold text-teal-400 font-mono">Số dư khởi tạo: 100,000 DEMO</div>
            </div>
          </div>

          {/* Test instructions */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white">Cách kiểm thử tính năng Core Requirement:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed">
              <li>Bấm nút <strong className="text-emerald-400">"Khôi phục số dư gốc"</strong> bên dưới để đưa Alice về 500,000 DEMO và Bob về 100,000 DEMO.</li>
              <li>Mở 1 tab thông thường đăng nhập <strong className="text-emerald-300">Alice (DB123456)</strong>.</li>
              <li>Mở 1 tab Ẩn danh (Incognito) hoặc trình duyệt/thiết bị khác đăng nhập <strong className="text-teal-300">Bob (DB654321)</strong>.</li>
              <li>Tại tab Alice, nhập người nhận <strong className="text-white font-mono">DB654321</strong> và chuyển <strong className="text-white">150,000 DEMO</strong>.</li>
              <li>Quan sát tab Bob: Ngay lập tức nhận được thông báo biến động số dư qua SSE và số dư nhảy lên <strong className="text-emerald-400 font-bold font-mono">250,000 DEMO</strong> mà không cần tải lại trang.</li>
              <li>Tab Alice giảm xuống còn <strong className="text-emerald-400 font-bold font-mono">350,000 DEMO</strong>. F5 tải lại trang cả hai bên dữ liệu vẫn giữ nguyên!</li>
            </ol>
          </div>

          <div className="pt-2">
            <button
              id="reset-seed-data-btn"
              onClick={handleResetSeed}
              disabled={resettingSeed}
              className="py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
            >
              {resettingSeed ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khôi phục...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Khôi phục số dư gốc (Alice: 500k, Bob: 100k)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalDep && (
        <div
          id="reject-deposit-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Từ chối yêu cầu nạp tiền</h3>
              <button
                id="close-reject-modal-btn"
                onClick={() => setRejectModalDep(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Từ chối yêu cầu <span className="font-mono text-emerald-400 font-bold">+{rejectModalDep.amount.toLocaleString('vi-VN')} DEMO</span> của{' '}
              <span className="text-white font-bold">{rejectModalDep.userName}</span> ({rejectModalDep.userId}).
            </p>

            <div>
              <label htmlFor="reject-reason-input" className="block text-xs font-semibold text-slate-400 mb-1">
                Lý do từ chối (Gửi đến người dùng):
              </label>
              <input
                id="reject-reason-input"
                type="text"
                placeholder="Ví dụ: Vượt hạn mức thử nghiệm hàng ngày"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                id="cancel-reject-modal-btn"
                onClick={() => setRejectModalDep(null)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                id="confirm-reject-deposit-btn"
                onClick={handleConfirmReject}
                disabled={processingId === rejectModalDep.id}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                {processingId === rejectModalDep.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Xác nhận từ chối</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustUser && (
        <div
          id="adjust-balance-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Điều chỉnh số dư người dùng</h3>
              <button
                id="close-adjust-modal-btn"
                onClick={() => setAdjustUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Tài khoản: <strong className="text-white">{adjustUser.name}</strong> ({adjustUser.userId})
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-3">
              <div>
                <label htmlFor="adjust-amount-input" className="block text-xs font-semibold text-slate-400 mb-1">
                  Số dư mới (DEMO):
                </label>
                <input
                  id="adjust-amount-input"
                  type="number"
                  min="0"
                  step="1000"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="adjust-reason-input" className="block text-xs font-semibold text-slate-400 mb-1">
                  Lý do điều chỉnh:
                </label>
                <input
                  id="adjust-reason-input"
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  id="cancel-adjust-modal-btn"
                  type="button"
                  onClick={() => setAdjustUser(null)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  id="confirm-adjust-balance-btn"
                  type="submit"
                  disabled={adjusting}
                  className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  {adjusting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Lưu số dư mới</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
