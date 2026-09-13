import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, getStoredToken, clearStoredToken } from '../api.ts';
import type { UserProfile } from '../types.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isConnected: boolean;
  login: (userId: string, passwordPlain: string) => Promise<UserProfile>;
  register: (name: string, passwordPlain: string, confirmPasswordPlain: string) => Promise<{ user: UserProfile; token: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  setBalanceDirectly: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { showToast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return null;
    }
    try {
      const profile = await api.getMe();
      setUser(profile);
      return profile;
    } catch {
      setUser(null);
      clearStoredToken();
      setToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Real-time SSE Connection
  useEffect(() => {
    if (!token || !user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const sseUrl = `/api/realtime/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setIsConnected(true);
    });

    es.addEventListener('balance_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (typeof data.balance === 'number') {
          setUser((prev) => (prev ? { ...prev, balance: data.balance } : null));
        }

        if (data.role === 'receiver') {
          const amt = Number(data.transaction?.amount || 0).toLocaleString('vi-VN');
          showToast(
            'success',
            'Nhận tiền thành công!',
            `+${amt} DEMO từ ${data.transaction?.senderName || 'Người gửi'}`
          );
        } else if (data.note) {
          showToast('info', 'Thông báo số dư', data.note);
        }
      } catch (err) {
        console.error('SSE balance_update parse error:', err);
      }
    });

    es.addEventListener('deposit_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.balance !== undefined) {
          setUser((prev) => (prev ? { ...prev, balance: data.balance } : null));
        }
        if (data.request?.status === 'approved') {
          const amt = Number(data.request?.amount || 0).toLocaleString('vi-VN');
          showToast('success', 'Yêu cầu nạp tiền đã được duyệt!', `Đã cộng +${amt} DEMO vào tài khoản.`);
        } else if (data.request?.status === 'rejected') {
          showToast('error', 'Yêu cầu nạp tiền bị từ chối', data.request?.reason || 'Không đạt điều kiện phê duyệt.');
        }
      } catch (err) {
        console.error('SSE deposit_update parse error:', err);
      }
    });

    es.addEventListener('new_deposit_request', (e) => {
      try {
        const req = JSON.parse(e.data);
        const amt = Number(req.amount).toLocaleString('vi-VN');
        showToast('info', 'Yêu cầu nạp mới', `${req.userName} yêu cầu nạp ${amt} DEMO.`);
      } catch (err) {
        console.error('SSE new_deposit_request parse error:', err);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      // EventSource auto-reconnects natively
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [token, user?.userId, showToast]);

  const login = async (userId: string, passwordPlain: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await api.login(userId, passwordPlain);
      setUser(res.user);
      setToken(res.token);
      showToast('success', 'Đăng nhập thành công', `Chào mừng trở lại, ${res.user.name}!`);
      return res.user;
    } catch (err: any) {
      showToast('error', 'Đăng nhập thất bại', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, passwordPlain: string, confirmPasswordPlain: string) => {
    setIsLoading(true);
    try {
      const res = await api.register(name, passwordPlain, confirmPasswordPlain);
      setUser(res.user);
      setToken(res.token);
      showToast('success', 'Đăng ký thành công', `Tài khoản ${res.user.userId} đã được tạo kèm 100,000 DEMO bonus!`);
      return res;
    } catch (err: any) {
      showToast('error', 'Đăng ký thất bại', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setToken(null);
      clearStoredToken();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      showToast('info', 'Đã đăng xuất', 'Hẹn gặp lại bạn lần sau!');
    }
  };

  const setBalanceDirectly = (newBalance: number) => {
    setUser((prev) => (prev ? { ...prev, balance: newBalance } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isConnected,
        login,
        register,
        logout,
        refreshProfile,
        setBalanceDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
