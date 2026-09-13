import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { api, getAdminPasscode } from '../api.ts';
import type { Transaction, DepositRequest } from '../types.ts';
import {
  Send,
  PlusCircle,
  History,
  Copy,
  Check,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, refreshProfile, setBalanceDirectly, isConnected } = useAuth();
  const { showToast } = useToast();
  const hasAdminAccess = user?.role === 'admin' || getAdminPasscode() === '0944379685_vuok';

  const [copied, setCopied] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loadingTx, setLoadingTx] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    try {
      const txs = await api.getTransactions();
      setTransactions(txs.slice(0, 5)); // show recent 5
    } catch (err) {
      console.error('Failed to load recent transactions:', err);
    } finally {
      setLoadingTx(false);
      setRefreshing(false);
    }
  };

  const fetchPendingDeposits = async () => {
    try {
      if (user?.role === 'admin') {
        const deps = await api.getAdminDeposits('pending');
        setPendingDeposits(deps);
      } else {
        const deps = await api.getDeposits();
        setPendingDeposits(deps.filter((d) => d.status === 'pending'));
      }
    } catch (err) {
      console.error('Failed to load pending deposits:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchPendingDeposits();
  }, [user?.balance, user?.role]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchTransactions();
    await fetchPendingDeposits();
  };

  const handleQuickApprove = async (depId: string) => {
    setApprovingId(depId);
    try {
      const res = await api.quickApproveDeposit(depId);
      if (res.newBalance !== undefined) {
        setBalanceDirectly(res.newBalance);
      }
      await refreshProfile();
      await fetchPendingDeposits();
      await fetchTransactions();
      showToast(
        'success',
        'Đã duyệt nạp tiền thành công!',
        `+${Number(res.request.amount).toLocaleString('vi-VN')} DEMO đã được cộng vào tài khoản.`
      );
    } catch (err: any) {
      showToast('error', 'Không thể duyệt', err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleCopyId = () => {
    if (!user?.userId) return;
    navigator.clipboard.writeText(user.userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div id="dashboard-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Xin chào, {user.name}</span>
            {user.role === 'admin' && (
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Mã định danh tài khoản cá nhân của bạn: <span className="font-mono text-emerald-400 font-semibold">{user.userId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="dashboard-refresh-btn"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
            title="Làm mới số dư và giao dịch"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Pending Deposit Notification Banner */}
      {pendingDeposits.length > 0 && (
        <div
          id="dashboard-pending-deposit-alert"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>
                  {hasAdminAccess
                    ? `Có ${pendingDeposits.length} yêu cầu nạp tiền đang chờ duyệt`
                    : `Có ${pendingDeposits.length} yêu cầu nạp tiền đang chờ duyệt trong tab Quản trị`}
                </span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm">
                  (+{pendingDeposits.reduce((acc, d) => acc + d.amount, 0).toLocaleString('vi-VN')} DEMO)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasAdminAccess
                  ? 'Bấm nút duyệt bên cạnh để xử lý ngay yêu cầu nạp tiền mới nhất.'
                  : 'Yêu cầu được chuyển vào tab Quản trị (Admin). Mở tab Quản trị (mật khẩu: 0944379685_vuok) để duyệt.'}
              </p>
            </div>
          </div>

          {hasAdminAccess ? (
            <button
              id="dashboard-click-here-to-approve-btn"
              type="button"
              onClick={() => handleQuickApprove(pendingDeposits[0].id)}
              disabled={approvingId === pendingDeposits[0].id}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 transition-transform active:scale-95 whitespace-nowrap self-start sm:self-auto"
              title="Bấm vào đây để duyệt yêu cầu nạp tiền"
            >
              {approvingId === pendingDeposits[0].id ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
              )}
              <span>Bấm vào đây để duyệt</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                id="dashboard-go-to-admin-tab-btn"
                type="button"
                onClick={() => onNavigate('admin')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
                title="Vào tab Quản trị (mật khẩu: 0944379685_vuok) để duyệt"
              >
                <span>Vào tab Quản trị để duyệt</span>
              </button>
              <button
                id="dashboard-view-pending-deposit-btn"
                type="button"
                onClick={() => onNavigate('deposit')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs border border-slate-700 transition-colors whitespace-nowrap"
              >
                Chi tiết
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Balance Card & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Số dư khả dụng (DEMO)
                  </span>
                  <button
                    id="toggle-balance-visibility-btn"
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-slate-400 hover:text-white transition-colors"
                    aria-label={showBalance ? 'Ẩn số dư' : 'Hiện số dư'}
                  >
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-baseline gap-2 pt-2">
                  {showBalance ? (
                    <>
                      <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                        {user.balance.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-lg sm:text-2xl font-bold text-emerald-400">DEMO</span>
                    </>
                  ) : (
                    <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-500 font-mono">
                      ••••••••••
                    </span>
                  )}
                </div>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isConnected ? 'Realtime đồng bộ' : 'Đang kết nối'}</span>
              </div>
            </div>

            {/* Account Card Details */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Mã tài khoản (User ID)</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-emerald-400">{user.userId}</span>
                    <button
                      id="dash-copy-user-id-btn"
                      onClick={handleCopyId}
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Sao chép ID"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Loại tài khoản</div>
                <div className="text-xs font-semibold text-slate-200">
                  {user.role === 'admin' ? 'Tài khoản Quản trị viên' : 'Tài khoản Cá nhân (Demo)'}
                </div>
              </div>
            </div>

            {/* Action Buttons as requested: Transfer, Deposit, Transaction history */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
              <button
                id="dash-action-transfer-btn"
                onClick={() => onNavigate('transfer')}
                className="flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Chuyển tiền</span>
              </button>

              <button
                id="dash-action-deposit-btn"
                onClick={() => onNavigate('deposit')}
                className="flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-white text-xs sm:text-sm border border-slate-700 transition-all hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Nạp tiền</span>
              </button>

              <button
                id="dash-action-history-btn"
                onClick={() => onNavigate('transactions')}
                className="flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-white text-xs sm:text-sm border border-slate-700 transition-all hover:scale-[1.02]"
              >
                <History className="w-4 h-4 text-teal-400" />
                <span>Lịch sử</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Instructions / Share ID Box */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Cách nhận tiền từ người khác</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Để người dùng khác chuyển tiền ảo DEMO cho bạn, hãy gửi cho họ Mã người dùng bên dưới:
            </p>

            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-emerald-400">{user.userId}</span>
              <button
                id="copy-share-id-btn"
                onClick={handleCopyId}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
            <strong>Gợi ý kiểm thử:</strong> Mở trình duyệt ẩn danh (Incognito) hoặc thiết bị khác, đăng nhập tài khoản Bob (DB654321) và chuyển tiền đến ID của bạn để thấy số dư tăng ngay lập tức trong thời gian thực!
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Giao dịch tức thì • Toàn vẹn ACID cơ sở dữ liệu</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Giao dịch gần đây</h2>
            <p className="text-xs text-slate-400">5 giao dịch mới nhất trên tài khoản của bạn</p>
          </div>
          <button
            id="see-all-transactions-btn"
            onClick={() => onNavigate('transactions')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Xem tất cả</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingTx ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Đang tải lịch sử giao dịch...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-1" />
            <p className="text-sm font-semibold text-slate-300">Chưa có giao dịch nào</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hãy thử thực hiện lệnh chuyển tiền đến bạn bè hoặc yêu cầu nạp tiền để bắt đầu trải nghiệm!
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden shadow-lg">
            {transactions.map((tx) => {
              const isOutgoing = tx.type === 'transfer' && tx.senderId === user.userId;
              const isIncoming = tx.type === 'receive' || (tx.type === 'transfer' && tx.receiverId === user.userId);
              const isDeposit = tx.type === 'deposit';

              return (
                <div
                  key={tx.id}
                  id={`recent-tx-${tx.id}`}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDeposit
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : isOutgoing
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isDeposit ? (
                        <PlusCircle className="w-5 h-5" />
                      ) : isOutgoing ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {isDeposit
                          ? 'Nạp tiền vào tài khoản'
                          : isOutgoing
                          ? `Chuyển đến: ${tx.receiverName} (${tx.receiverId})`
                          : `Nhận từ: ${tx.senderName} (${tx.senderId})`}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {tx.note ? tx.note : 'Không có lời nhắn'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm sm:text-base font-bold font-mono ${
                        isOutgoing ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isOutgoing ? '-' : '+'}
                      {tx.amount.toLocaleString('vi-VN')} DEMO
                    </div>
                    <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60 mt-1">
                      {isDeposit ? 'Nạp tiền Admin' : isOutgoing ? 'Đã chuyển' : 'Đã nhận'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
