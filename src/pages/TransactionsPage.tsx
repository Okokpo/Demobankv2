import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import type { Transaction } from '../types.ts';
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Search,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'transfer' | 'receive' | 'deposit'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.balance]);

  if (!user) return null;

  const filteredTransactions = transactions.filter((tx) => {
    const isOutgoing = tx.type === 'transfer' && tx.senderId === user.userId;
    const isIncoming = tx.type === 'receive' || (tx.type === 'transfer' && tx.receiverId === user.userId);
    const isDeposit = tx.type === 'deposit';

    if (filterType === 'transfer' && !isOutgoing) return false;
    if (filterType === 'receive' && !isIncoming) return false;
    if (filterType === 'deposit' && !isDeposit) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tx.senderName.toLowerCase().includes(q) || tx.receiverName.toLowerCase().includes(q);
      const matchId = tx.senderId.toLowerCase().includes(q) || tx.receiverId.toLowerCase().includes(q);
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      const matchTxId = tx.id.toLowerCase().includes(q);
      return matchName || matchId || matchNote || matchTxId;
    }

    return true;
  });

  return (
    <div id="transactions-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Lịch sử giao dịch</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Toàn bộ biến động số dư và giao dịch tiền ảo trên tài khoản của bạn
          </p>
        </div>

        <button
          id="refresh-transactions-btn"
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Type tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'transfer', label: 'Chuyển đi' },
            { id: 'receive', label: 'Nhận về' },
            { id: 'deposit', label: 'Nạp tiền' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`filter-tab-${tab.id}`}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            id="search-transactions-input"
            type="text"
            placeholder="Tìm theo tên, ID, lời nhắn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Đang tải lịch sử giao dịch...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Không tìm thấy giao dịch nào</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Chưa có giao dịch nào phù hợp với bộ lọc hiện tại.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden shadow-xl">
          {filteredTransactions.map((tx) => {
            const isOutgoing = tx.type === 'transfer' && tx.senderId === user.userId;
            const isIncoming = tx.type === 'receive' || (tx.type === 'transfer' && tx.receiverId === user.userId);
            const isDeposit = tx.type === 'deposit';

            return (
              <div
                key={tx.id}
                id={`tx-item-${tx.id}`}
                onClick={() => setSelectedTx(tx)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
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
                    <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {isDeposit
                        ? 'Nạp tiền vào tài khoản'
                        : isOutgoing
                        ? `Chuyển đến ${tx.receiverName}`
                        : `Nhận từ ${tx.senderName}`}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {isOutgoing
                        ? `Tài khoản nhận: ${tx.receiverId}`
                        : isIncoming
                        ? `Tài khoản gửi: ${tx.senderId}`
                        : 'Admin-approved deposit'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-md">
                      {tx.note || 'Không có lời nhắn'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-base sm:text-lg font-bold font-mono ${
                      isOutgoing ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isOutgoing ? '-' : '+'}
                    {tx.amount.toLocaleString('vi-VN')} DEMO
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">
                    {isDeposit ? 'Nạp tiền' : isOutgoing ? 'Tiền chuyển' : 'Tiền nhận'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {selectedTx && (
        <div
          id="transaction-receipt-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Biên lai giao dịch</h3>
              </div>
              <button
                id="close-tx-receipt-modal-btn"
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400 font-sans">
                <span>Mã giao dịch:</span>
                <span className="font-mono text-white text-[11px] select-all">{selectedTx.id}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 font-sans">
                <span>Loại giao dịch:</span>
                <span className="uppercase text-emerald-400 font-bold">{selectedTx.type}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 font-sans">
                <span>Người gửi:</span>
                <span className="text-white">{selectedTx.senderName} ({selectedTx.senderId})</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 font-sans">
                <span>Người nhận:</span>
                <span className="text-white">{selectedTx.receiverName} ({selectedTx.receiverId})</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-sans">
                <span className="text-slate-300 font-bold">Số tiền:</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {selectedTx.amount.toLocaleString('vi-VN')} DEMO
                </span>
              </div>

              <div className="flex justify-between items-start text-slate-400 font-sans pt-1">
                <span>Nội dung:</span>
                <span className="text-white text-right max-w-[200px] break-words">{selectedTx.note || '—'}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 font-sans">
                <span>Thời gian:</span>
                <span className="text-slate-300">{new Date(selectedTx.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 font-sans">
                <span>Trạng thái:</span>
                <span className="text-emerald-400 font-bold">Thành công (Completed)</span>
              </div>
            </div>

            <button
              id="dismiss-tx-receipt-btn"
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Đóng biên lai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
