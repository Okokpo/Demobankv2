import type { UserProfile, PublicUser, Transaction, DepositRequest, AdminStats } from './types.ts';

const TOKEN_KEY = 'demobank_auth_token';
const ADMIN_PASSCODE_KEY = 'demobank_admin_passcode';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getAdminPasscode(): string | null {
  return sessionStorage.getItem(ADMIN_PASSCODE_KEY) || localStorage.getItem(ADMIN_PASSCODE_KEY);
}

export function setAdminPasscode(passcode: string) {
  sessionStorage.setItem(ADMIN_PASSCODE_KEY, passcode);
  localStorage.setItem(ADMIN_PASSCODE_KEY, passcode);
}

export function clearAdminPasscode() {
  sessionStorage.removeItem(ADMIN_PASSCODE_KEY);
  localStorage.removeItem(ADMIN_PASSCODE_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = getStoredToken();
  const adminPasscode = getAdminPasscode();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (adminPasscode) {
    headers.set('x-admin-passcode', adminPasscode);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Yêu cầu thất bại (${response.status})`);
  }

  return data;
}

export const api = {
  async register(name: string, passwordPlain: string, confirmPasswordPlain: string) {
    const data = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, password: passwordPlain, confirmPassword: confirmPasswordPlain }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    return data as { success: boolean; user: UserProfile; token: string };
  },

  async login(userId: string, passwordPlain: string) {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password: passwordPlain }),
    });
    if (data.token) {
      setStoredToken(data.token);
    }
    return data as { success: boolean; user: UserProfile; token: string };
  },

  async logout() {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore error on logout
    } finally {
      clearStoredToken();
    }
  },

  async getMe(): Promise<UserProfile> {
    const data = await fetchWithAuth('/api/me');
    return data.user;
  },

  async searchUser(userId: string): Promise<PublicUser> {
    const data = await fetchWithAuth(`/api/users/${encodeURIComponent(userId.trim().toUpperCase())}`);
    return data.user;
  },

  async transfer(recipientId: string, amount: number, note?: string, idempotencyKey?: string) {
    return await fetchWithAuth('/api/transfers', {
      method: 'POST',
      body: JSON.stringify({
        recipientId,
        amount,
        note,
        idempotencyKey,
      }),
    });
  },

  async getTransactions(): Promise<Transaction[]> {
    const data = await fetchWithAuth('/api/transactions');
    return data.transactions;
  },

  async createDeposit(amount: number) {
    return await fetchWithAuth('/api/deposits', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async getDeposits(): Promise<DepositRequest[]> {
    const data = await fetchWithAuth('/api/deposits');
    return data.deposits;
  },

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    const data = await fetchWithAuth('/api/admin/stats');
    return data.stats;
  },

  async getAdminDeposits(status?: string): Promise<DepositRequest[]> {
    const url = status ? `/api/admin/deposits?status=${status}` : '/api/admin/deposits';
    const data = await fetchWithAuth(url);
    return data.deposits;
  },

  async approveDeposit(depositId: string) {
    return await fetchWithAuth(`/api/admin/deposits/${depositId}/approve`, {
      method: 'POST',
    });
  },

  async quickApproveDeposit(depositId: string) {
    return await fetchWithAuth(`/api/deposits/${depositId}/quick-approve`, {
      method: 'POST',
    });
  },

  async approveAllDeposits() {
    return await fetchWithAuth('/api/admin/deposits/approve-all', {
      method: 'POST',
    });
  },

  async rejectDeposit(depositId: string, reason?: string) {
    return await fetchWithAuth(`/api/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getAdminUsers(search?: string): Promise<UserProfile[]> {
    const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users';
    const data = await fetchWithAuth(url);
    return data.users;
  },

  async getAdminTransactions(limit = 100): Promise<Transaction[]> {
    const data = await fetchWithAuth(`/api/admin/transactions?limit=${limit}`);
    return data.transactions;
  },

  async adminAdjustBalance(targetUserId: string, amount: number, reason: string) {
    return await fetchWithAuth('/api/admin/adjust-balance', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, amount, reason }),
    });
  },

  async resetSeedData() {
    return await fetchWithAuth('/api/admin/reset-seed', {
      method: 'POST',
    });
  },

  async verifyAdminPasscode(passcode: string) {
    const data = await fetchWithAuth('/api/admin/verify-passcode', {
      method: 'POST',
      body: JSON.stringify({ passcode }),
    });
    if (data.success) {
      setAdminPasscode(passcode);
    }
    return data;
  },
};
