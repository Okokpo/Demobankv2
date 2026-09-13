import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { api, getAdminPasscode } from '../api.ts';
import type { DepositRequest } from '../types.ts';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface DepositPageProps {
  onNavigate?: (tab: string) => void;
}

export const DepositPage: React.FC<DepositPageProps> = ({ onNavigate }) => {
  const { user, refreshProfile, setBalanceDirectly } = useAuth();
  const { showToast } = useToast();

  const hasAdminAccess = user?.role === 'admin' || getAdminPasscode() === '0944379685_vuok';

  const [amount, setAmount] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [latestDepositId, setLatestDepositId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchDeposits = async () => {
    try {
      const list = await api.getDeposits();
      setDeposits(list);
    } catch (err) {
      console.error('Failed to load deposits:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [user?.balance]);

  const handleQuickApprove = async (depId: string) => {
    setApprovingId(depId);
    try {
      const res = await api.quickApproveDeposit(depId);
      if (res.newBalance !== undefined) {
        setBalanceDirectly(res.newBalance);
      }
      await refreshProfile();
      await fetchDeposits();
      showToast(
        'success',
        'Đã duyệt nạp tiền thành công!',
        `+${Number(res.request.amount).toLocaleString('vi-VN')} DEMO đã được cộng trực tiếp vào số dư.`
      );
      if (latestDepositId === depId) {
        setSubmittedMessage('');
        setLatestDepositId(null);
      }
    } catch (err: any) {
      showToast('error', 'Không thể duyệt', err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0 || !Number.isInteger(num)) {
      showToast('error', 'Lỗi', 'Vui lòng nhập số tiền nạp hợp lệ.');
      return;
    }

    setSubmitting(true);
    setSubmittedMessage('');
    setLatestDepositId(null);
    try {
      const res = await api.createDeposit(num);
      const reqId = res.request?.id;
      setLatestDepositId(reqId);
      setSubmittedMessage(`Yêu cầu nạp +${num.toLocaleString('vi-VN')} DEMO đã được gửi vào tab Quản trị (Admin)!`);
      showToast('info', 'Yêu cầu nạp tiền đã gửi', `Đã chuyển vào hàng đợi tab Quản trị (Admin) để xét duyệt.`);
      setAmount('');
      await fetchDeposits();
    } catch (err: any) {
      showToast('error', 'Không thể gửi yêu cầu', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [10000, 50000, 100000, 500000, 1000000, 5000000];

  return (
    <div id="deposit-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-emerald-400" />
          <span>Yêu cầu nạp tiền ảo (DEMO)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Gửi yêu cầu cấp thêm tiền ảo DEMO để tiếp tục thử nghiệm tính năng chuyển tiền
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Quy trình xét duyệt</span>
            </div>
            <p className="leading-relaxed">
              Khi bạn gửi yêu cầu, lệnh nạp sẽ tự động gửi vào <strong>tab Quản trị (Admin)</strong>. Cần nhập mật khẩu quản trị (<code>0944379685_vuok</code>) để vào tab đó và duyệt nạp tiền.
            </p>
          </div>

          {submittedMessage && (
            <div
              id="deposit-submitted-success"
              className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">{submittedMessage}</div>
                  <div className="text-[11px] text-emerald-300/80 mt-0.5">
                    {hasAdminAccess
                      ? 'Bạn đã xác thực quyền Quản trị. Bạn có thể bấm nút duyệt ngay bên cạnh.'
                      : 'Yêu cầu đang nằm trong hàng đợi tab Quản trị (mật khẩu: 0944379685_vuok).'}
                  </div>
                </div>
              </div>
              {hasAdminAccess && latestDepositId ? (
                <button
                  id="btn-click-here-to-approve"
                  type="button"
                  onClick={() => handleQuickApprove(latestDepositId)}
                  disabled={approvingId === latestDepositId}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 shrink-0 transition-transform active:scale-95"
                  title="Duyệt với tư cách Quản trị viên"
                >
                  {approvingId === latestDepositId ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  )}
                  <span>Bấm vào đây để duyệt</span>
                </button>
              ) : (
                onNavigate && (
                  <button
                    id="btn-go-to-admin-tab"
                    type="button"
                    onClick={() => onNavigate('admin')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 transition-transform active:scale-95 whitespace-nowrap"
                  >
                    <span>Vào tab Quản trị để duyệt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="deposit-amount-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Số tiền muốn nạp (DEMO)
              </label>
              <div className="relative">
                <input
                  id="deposit-amount-input"
                  type="number"
                  min="1000"
                  step="1000"
                  placeholder="Ví dụ: 500,000"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    setAmount(v);
                  }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-base text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-emerald-400 font-mono">
                  DEMO
                </span>
              </div>
            </div>

            {/* Quick Pick Buttons */}
            <div>
              <div className="text-[11px] text-slate-400 font-semibold mb-2">Chọn nhanh số tiền:</div>
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 200000, 500000, 1000000, 2000000].map((val) => (
                  <button
                    key={val}
                    id={`quick-deposit-amt-${val}-btn`}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="p-2 text-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-mono transition-colors"
                  >
                    {val.toLocaleString('vi-VN')}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="request-deposit-submit-btn"
              type="submit"
              disabled={submitting || !amount}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                <>
                  <span>Gửi yêu cầu nạp tiền</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Quy trình duyệt nạp tiền</span>
            </div>
            <ol className="space-y-2 text-xs text-slate-400 list-decimal list-inside leading-relaxed">
              <li>Bạn gửi yêu cầu số tiền nạp.</li>
              <li>Hệ thống lưu trạng thái <strong className="text-amber-400">Chờ duyệt (Pending)</strong>.</li>
              <li>Admin đăng nhập bảng điều khiển và kiểm tra yêu cầu.</li>
              <li>Admin bấm <strong className="text-emerald-400">Duyệt (Approve)</strong>.</li>
              <li>Số tiền được cộng chính xác vào số dư của bạn qua cơ chế cập nhật nguyên tử (Atomic transaction).</li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Tài khoản Admin có sẵn:</span>
            <div className="mt-1 font-mono text-amber-400">ID: DB000001 | Pass: admin123</div>
          </div>
        </div>
      </div>

      {/* Deposit Requests History Table */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">Lịch sử yêu cầu nạp tiền của bạn</h2>
          <button
            id="refresh-deposit-list-btn"
            onClick={fetchDeposits}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cập nhật</span>
          </button>
        </div>

        {loadingList ? (
          <div className="p-6 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400">
            Đang tải danh sách...
          </div>
        ) : deposits.length === 0 ? (
          <div className="p-6 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
            Bạn chưa gửi yêu cầu nạp tiền nào.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Mã yêu cầu</th>
                    <th className="p-3.5">Số tiền</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5">Thời gian gửi</th>
                    <th className="p-3.5">Ghi chú duyệt</th>
                    <th className="p-3.5 text-right">Thao tác duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {deposits.map((dep) => (
                    <tr key={dep.id} id={`deposit-row-${dep.id}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-slate-400 text-[11px]">{dep.id}</td>
                      <td className="p-3.5 font-bold text-white text-sm">
                        +{dep.amount.toLocaleString('vi-VN')} DEMO
                      </td>
                      <td className="p-3.5">
                        {dep.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-sans font-medium">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Chờ duyệt</span>
                          </span>
                        )}
                        {dep.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-sans font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Đã duyệt</span>
                          </span>
                        )}
                        {dep.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-sans font-medium">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Bị từ chối</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px] font-sans">
                        {new Date(dep.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3.5 text-slate-400 text-xs font-sans">
                        {dep.reason ? dep.reason : dep.reviewedBy ? `Duyệt bởi Admin (${dep.reviewedBy})` : '—'}
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        {dep.status === 'pending' ? (
                          hasAdminAccess ? (
                            <button
                              id={`btn-click-here-to-approve-row-${dep.id}`}
                              type="button"
                              onClick={() => handleQuickApprove(dep.id)}
                              disabled={approvingId === dep.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-emerald-950/50 transition-all active:scale-95 whitespace-nowrap"
                              title="Bấm vào đây để duyệt yêu cầu nạp tiền này (Quyền Admin)"
                            >
                              {approvingId === dep.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Bấm vào đây để duyệt</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium whitespace-nowrap">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Chờ duyệt</span>
                              </span>
                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => onNavigate('admin')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-medium transition-colors border border-slate-700"
                                  title="Mở tab Quản trị (mật khẩu: 0944379685_vuok) để duyệt"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Tab Admin</span>
                                </button>
                              )}
                            </div>
                          )
                        ) : dep.status === 'approved' ? (
                          <span className="text-emerald-400 text-[11px] font-medium">Đã hoàn thành</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Đã kết thúc</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
