import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { api } from '../api.ts';
import type { PublicUser } from '../types.ts';
import {
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  X,
  Sparkles,
} from 'lucide-react';

interface TransferPageProps {
  onTransferSuccess?: () => void;
}

export const TransferPage: React.FC<TransferPageProps> = ({ onTransferSuccess }) => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [recipientIdInput, setRecipientIdInput] = useState('');
  const [searchingRecipient, setSearchingRecipient] = useState(false);
  const [recipient, setRecipient] = useState<PublicUser | null>(null);
  const [recipientError, setRecipientError] = useState('');

  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Search recipient from backend database
  const handleFindRecipient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = recipientIdInput.trim().toUpperCase();
    if (!cleanId) {
      setRecipientError('Vui lòng nhập Mã người nhận (User ID).');
      setRecipient(null);
      return;
    }

    if (user && cleanId === user.userId) {
      setRecipientError('Bạn không thể chuyển tiền cho chính mình.');
      setRecipient(null);
      return;
    }

    setSearchingRecipient(true);
    setRecipientError('');
    setRecipient(null);

    try {
      const found = await api.searchUser(cleanId);
      setRecipient(found);
      setRecipientError('');
    } catch (err: any) {
      setRecipient(null);
      setRecipientError(err.message || 'Không tìm thấy người nhận.');
    } finally {
      setSearchingRecipient(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setFormError('');
  };

  const handleMaxAmount = () => {
    if (user) {
      setAmount(user.balance);
      setFormError('');
    }
  };

  // Open confirmation modal
  const handleReviewTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!recipient) {
      setFormError('Vui lòng tìm và chọn người nhận trước.');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setFormError('Số tiền không hợp lệ. Vui lòng nhập số lớn hơn 0.');
      return;
    }

    if (!Number.isInteger(numAmount)) {
      setFormError('Số tiền phải là số nguyên.');
      return;
    }

    if (user && numAmount > user.balance) {
      setFormError(`Số dư không đủ. Bạn hiện có ${user.balance.toLocaleString('vi-VN')} DEMO.`);
      return;
    }

    // Generate unique idempotency key for this transfer attempt
    setIdempotencyKey(`IDEM_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
    setShowConfirmModal(true);
  };

  // Execute transfer in backend
  const handleConfirmTransfer = async () => {
    if (!recipient || !amount) return;
    setTransferring(true);
    try {
      const res = await api.transfer(
        recipient.userId,
        Number(amount),
        note.trim() || 'Chuyển tiền DEMO',
        idempotencyKey
      );

      setShowConfirmModal(false);
      showToast(
        'success',
        'Chuyển tiền thành công!',
        `Đã chuyển ${Number(amount).toLocaleString('vi-VN')} DEMO đến ${recipient.name} (${recipient.userId})`
      );

      // Reset form
      setAmount('');
      setNote('');
      setRecipient(null);
      setRecipientIdInput('');
      await refreshProfile();

      if (onTransferSuccess) {
        onTransferSuccess();
      }
    } catch (err: any) {
      showToast('error', 'Chuyển tiền thất bại', err.message);
      setShowConfirmModal(false);
    } finally {
      setTransferring(false);
    }
  };

  if (!user) return null;

  return (
    <div id="transfer-page" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Send className="w-6 h-6 text-emerald-400" />
          <span>Chuyển tiền DEMO</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chuyển tiền ảo an toàn, tức thì đến bất kỳ tài khoản DemoBank nào trong hệ thống
        </p>
      </div>

      {/* Sender balance reminder */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Số dư khả dụng của bạn:</span>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
            {user.balance.toLocaleString('vi-VN')} DEMO
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Mã gửi:</span>
          <div className="font-mono text-sm text-slate-200">{user.userId}</div>
        </div>
      </div>

      {/* Main Transfer Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Step 1: Find Recipient */}
        <div className="space-y-3">
          <label htmlFor="transfer-recipient-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Tìm người nhận (Recipient ID)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="transfer-recipient-input"
                type="text"
                placeholder="Nhập Mã người nhận (Ví dụ: DB654321)"
                value={recipientIdInput}
                onChange={(e) => {
                  setRecipientIdInput(e.target.value.toUpperCase());
                  setRecipient(null);
                  setRecipientError('');
                }}
                className="w-full pl-3.5 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              id="find-recipient-btn"
              type="button"
              onClick={handleFindRecipient}
              disabled={searchingRecipient || !recipientIdInput.trim()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {searchingRecipient ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Đang tìm...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Tìm người nhận</span>
                </>
              )}
            </button>
          </div>

          {/* Quick test buttons for recipient */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span>Thử nhanh:</span>
            {user.userId !== 'DB654321' && (
              <button
                id="quick-fill-recipient-bob-btn"
                type="button"
                onClick={() => {
                  setRecipientIdInput('DB654321');
                  setRecipient(null);
                  setRecipientError('');
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono text-[11px] border border-slate-700"
              >
                Bob (DB654321)
              </button>
            )}
            {user.userId !== 'DB123456' && (
              <button
                id="quick-fill-recipient-alice-btn"
                type="button"
                onClick={() => {
                  setRecipientIdInput('DB123456');
                  setRecipient(null);
                  setRecipientError('');
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[11px] border border-slate-700"
              >
                Alice (DB123456)
              </button>
            )}
          </div>

          {/* Recipient Found Display Card */}
          {recipient && (
            <div
              id="recipient-found-box"
              className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã tìm thấy người nhận</span>
                  </div>
                  <div className="text-base font-bold text-white">{recipient.name}</div>
                  <div className="text-xs text-slate-400 font-mono">ID: {recipient.userId}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recipient Error Display */}
          {recipientError && (
            <div
              id="recipient-error-box"
              className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{recipientError}</span>
            </div>
          )}
        </div>

        {/* Step 2: Transfer Form */}
        <form onSubmit={handleReviewTransfer} className="space-y-5 pt-4 border-t border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="transfer-amount-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Số tiền chuyển (DEMO)
              </label>
              <button
                id="transfer-max-amount-btn"
                type="button"
                onClick={handleMaxAmount}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Chuyển tất cả ({user.balance.toLocaleString('vi-VN')})
              </button>
            </div>

            <div className="relative">
              <input
                id="transfer-amount-input"
                type="number"
                min="1"
                step="1"
                placeholder="Nhập số tiền (ví dụ: 150,000)"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setAmount(val);
                  setFormError('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-base text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-emerald-400 font-mono pt-0.5">
                DEMO
              </span>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[50000, 100000, 150000, 200000, 500000].map((val) => (
                <button
                  key={val}
                  id={`quick-amt-${val}-btn`}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-mono transition-colors"
                >
                  +{val.toLocaleString('vi-VN')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="transfer-note-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              3. Lời nhắn / Nội dung chuyển tiền
            </label>
            <input
              id="transfer-note-input"
              type="text"
              placeholder="Ví dụ: Tặng bạn, Trả tiền ăn trưa..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {formError && (
            <div
              id="transfer-form-error"
              className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <button
            id="review-transfer-btn"
            type="submit"
            disabled={!recipient || !amount}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all"
          >
            <span>Chuyển tiền DEMO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && recipient && amount && (
        <div
          id="transfer-confirm-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            id="transfer-confirm-modal"
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Xác nhận chuyển tiền</span>
              </h3>
              <button
                id="close-confirm-modal-btn"
                onClick={() => !transferring && setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white"
                disabled={transferring}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Người gửi:</span>
                  <span className="font-semibold text-white">
                    {user.name} ({user.userId})
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Người nhận:</span>
                  <span className="font-semibold text-emerald-400 text-sm">
                    {recipient.name}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Mã người nhận (ID):</span>
                  <span className="font-mono font-bold text-slate-200">
                    {recipient.userId}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Số tiền:</span>
                  <span className="font-mono text-xl font-extrabold text-emerald-400">
                    {Number(amount).toLocaleString('vi-VN')} DEMO
                  </span>
                </div>

                <div className="flex justify-between items-start text-xs pt-1">
                  <span className="text-slate-400">Nội dung:</span>
                  <span className="text-slate-200 text-right max-w-[200px] break-words">
                    {note.trim() || 'Chuyển tiền DEMO'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Số tiền ảo sẽ được trừ trực tiếp từ số dư của bạn và cộng ngay cho người nhận trên cơ sở dữ liệu dùng chung.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="cancel-transfer-btn"
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={transferring}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                id="confirm-transfer-submit-btn"
                type="button"
                onClick={handleConfirmTransfer}
                disabled={transferring}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all"
              >
                {transferring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang chuyển tiền...</span>
                  </>
                ) : (
                  <span>Xác nhận chuyển</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
