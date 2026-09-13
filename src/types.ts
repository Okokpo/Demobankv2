export type UserRole = 'user' | 'admin';

export interface UserProfile {
  userId: string;
  name: string;
  balance: number;
  role: UserRole;
  createdAt: string;
}

export interface PublicUser {
  userId: string;
  name: string;
}

export type TransactionType = 'transfer' | 'receive' | 'deposit' | 'adjustment';
export type TransactionStatus = 'completed' | 'failed';

export interface Transaction {
  id: string;
  idempotencyKey?: string;
  type: TransactionType;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  amount: number;
  note: string;
  status: TransactionStatus;
  createdAt: string;
}

export type DepositStatus = 'pending' | 'approved' | 'rejected';

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: DepositStatus;
  reason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalVirtualMoney: number;
  pendingDeposits: number;
  totalTransactions: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
}
