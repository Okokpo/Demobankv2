import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { realtime } from './realtime.ts';
import type { UserProfile, PublicUser, Transaction, DepositRequest, AdminStats } from '../src/types.ts';

// Ensure data directory exists
const dbPath = path.join(process.cwd(), 'demobank.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT UNIQUE,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deposit_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
  CREATE INDEX IF NOT EXISTS idx_tx_sender ON transactions(sender_id);
  CREATE INDEX IF NOT EXISTS idx_tx_receiver ON transactions(receiver_id);
  CREATE INDEX IF NOT EXISTS idx_deposit_user ON deposit_requests(user_id);
  CREATE INDEX IF NOT EXISTS idx_deposit_status ON deposit_requests(status);
`);

// Seed default test accounts as requested in specification
function seedInitialData() {
  const checkAdmin = db.prepare('SELECT user_id FROM users WHERE user_id = ?').get('DB000001');
  if (!checkAdmin) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (user_id, name, password_hash, balance, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('DB000001', 'Admin DemoBank', adminHash, 0, 'admin', now);
  }

  const checkAlice = db.prepare('SELECT user_id FROM users WHERE user_id = ?').get('DB123456');
  if (!checkAlice) {
    const aliceHash = bcrypt.hashSync('password123', 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (user_id, name, password_hash, balance, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('DB123456', 'Alice', aliceHash, 500000, 'user', now);

    // Initial seed transaction log
    db.prepare(`
      INSERT INTO transactions (id, sender_id, receiver_id, sender_name, receiver_name, type, amount, note, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'TX_SEED_ALICE',
      'SYSTEM',
      'DB123456',
      'DemoBank Hệ Thống',
      'Alice',
      'deposit',
      500000,
      'Số dư Demo ban đầu để kiểm thử',
      'completed',
      now
    );
  }

  const checkBob = db.prepare('SELECT user_id FROM users WHERE user_id = ?').get('DB654321');
  if (!checkBob) {
    const bobHash = bcrypt.hashSync('password123', 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (user_id, name, password_hash, balance, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('DB654321', 'Bob', bobHash, 100000, 'user', now);

    // Initial seed transaction log
    db.prepare(`
      INSERT INTO transactions (id, sender_id, receiver_id, sender_name, receiver_name, type, amount, note, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'TX_SEED_BOB',
      'SYSTEM',
      'DB654321',
      'DemoBank Hệ Thống',
      'Bob',
      'deposit',
      100000,
      'Số dư Demo ban đầu để kiểm thử',
      'completed',
      now
    );
  }
}

seedInitialData();

// Admin: Reset Alice and Bob balances and clean test transactions for testing the exact scenario
export function resetSeedData() {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const now = new Date().toISOString();
    const aliceHash = bcrypt.hashSync('password123', 10);
    const bobHash = bcrypt.hashSync('password123', 10);
    const adminHash = bcrypt.hashSync('admin123', 10);

    // Delete existing records for seed accounts & test requests
    db.prepare('DELETE FROM users WHERE user_id IN (?, ?, ?)').run('DB123456', 'DB654321', 'DB000001');
    db.prepare('DELETE FROM transactions WHERE sender_id IN (?, ?) OR receiver_id IN (?, ?)').run('DB123456', 'DB654321', 'DB123456', 'DB654321');
    db.prepare('DELETE FROM deposit_requests WHERE user_id IN (?, ?)').run('DB123456', 'DB654321');

    db.prepare(`
      INSERT INTO users (user_id, name, password_hash, balance, role, created_at)
      VALUES (?, ?, ?, ?, 'admin', ?)
    `).run('DB000001', 'Admin DemoBank', adminHash, 0, now);

    db.prepare(`
      INSERT INTO users (user_id, name, password_hash, balance, role, created_at)
      VALUES (?, ?, ?, ?, 'user', ?)
    `).run('DB123456', 'Alice', aliceHash, 500000, now);

    db.prepare(`
      INSERT INTO users (user_id, name, password_hash, balance, role, created_at)
      VALUES (?, ?, ?, ?, 'user', ?)
    `).run('DB654321', 'Bob', bobHash, 100000, now);

    db.prepare(`
      INSERT INTO transactions (id, sender_id, receiver_id, sender_name, receiver_name, type, amount, note, status, created_at)
      VALUES (?, 'SYSTEM', 'DB123456', 'DemoBank Hệ Thống', 'Alice', 'deposit', 500000, 'Số dư Demo ban đầu để kiểm thử', 'completed', ?)
    `).run('TX_SEED_ALICE_RESET', now);

    db.prepare(`
      INSERT INTO transactions (id, sender_id, receiver_id, sender_name, receiver_name, type, amount, note, status, created_at)
      VALUES (?, 'SYSTEM', 'DB654321', 'DemoBank Hệ Thống', 'Bob', 'deposit', 100000, 'Số dư Demo ban đầu để kiểm thử', 'completed', ?)
    `).run('TX_SEED_BOB_RESET', now);

    db.exec('COMMIT;');

    realtime.broadcast('stats_update', getAdminStats());
    realtime.notifyUser('DB123456', 'balance_update', { balance: 500000 });
    realtime.notifyUser('DB654321', 'balance_update', { balance: 100000 });

    return { success: true };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Helper: Generate unique user ID like DB482193
export function generateUniqueUserId(): string {
  while (true) {
    const digits = Math.floor(100000 + Math.random() * 900000).toString();
    const candidate = `DB${digits}`;
    const existing = db.prepare('SELECT user_id FROM users WHERE user_id = ?').get(candidate);
    if (!existing) {
      return candidate;
    }
  }
}

// User Profile lookup
export function getUserProfile(userId: string): UserProfile | null {
  const row = db.prepare(`
    SELECT user_id, name, balance, role, created_at
    FROM users
    WHERE user_id = ?
  `).get(userId) as any;

  if (!row) return null;
  return {
    userId: row.user_id,
    name: row.name,
    balance: Number(row.balance),
    role: row.role as any,
    createdAt: row.created_at,
  };
}

// Public user search by ID
export function findPublicUserById(userId: string): PublicUser | null {
  const row = db.prepare(`
    SELECT user_id, name
    FROM users
    WHERE user_id = ?
  `).get(userId) as any;

  if (!row) return null;
  return {
    userId: row.user_id,
    name: row.name,
  };
}

// Auth: Register new user
export function registerUser(name: string, passwordPlain: string): { user: UserProfile; token: string } {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Họ và tên phải có ít nhất 2 ký tự.');
  }
  if (!passwordPlain || passwordPlain.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  const userId = generateUniqueUserId();
  const passwordHash = bcrypt.hashSync(passwordPlain, 10);
  const now = new Date().toISOString();
  const initialWelcomeBalance = 100000; // 100,000 DEMO bonus for newly registered users

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(`
      INSERT INTO users (user_id, name, password_hash, balance, role, created_at)
      VALUES (?, ?, ?, ?, 'user', ?)
    `).run(userId, trimmedName, passwordHash, initialWelcomeBalance, now);

    // Record welcome deposit
    db.prepare(`
      INSERT INTO transactions (id, sender_id, receiver_id, sender_name, receiver_name, type, amount, note, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `TX_WELCOME_${userId}`,
      'SYSTEM',
      userId,
      'DemoBank Hệ Thống',
      trimmedName,
      'deposit',
      initialWelcomeBalance,
      'Quà tặng mở tài khoản DemoBank',
      'completed',
      now
    );

    // Create session token (valid for 30 days)
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    db.prepare(`
      INSERT INTO sessions (token, user_id, role, expires_at, created_at)
      VALUES (?, ?, 'user', ?, ?)
    `).run(token, userId, expiresAt, now);

    db.exec('COMMIT;');

    const user: UserProfile = {
      userId,
      name: trimmedName,
      balance: initialWelcomeBalance,
      role: 'user',
      createdAt: now,
    };

    realtime.broadcast('stats_update', getAdminStats());

    return { user, token };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Auth: Login user
export function loginUser(userIdInput: string, passwordPlain: string): { user: UserProfile; token: string } {
  const trimmedId = userIdInput.trim().toUpperCase();
  const row = db.prepare(`
    SELECT user_id, name, password_hash, balance, role, created_at
    FROM users
    WHERE user_id = ?
  `).get(trimmedId) as any;

  if (!row) {
    throw new Error('Mã người dùng hoặc mật khẩu không chính xác.');
  }

  const match = bcrypt.compareSync(passwordPlain, row.password_hash);
  if (!match) {
    throw new Error('Mã người dùng hoặc mật khẩu không chính xác.');
  }

  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, role, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(token, row.user_id, row.role, expiresAt, now);

  const user: UserProfile = {
    userId: row.user_id,
    name: row.name,
    balance: Number(row.balance),
    role: row.role,
    createdAt: row.created_at,
  };

  return { user, token };
}

// Auth: Validate session token
export function validateSession(token: string): UserProfile | null {
  if (!token) return null;
  const session = db.prepare(`
    SELECT user_id, role, expires_at
    FROM sessions
    WHERE token = ?
  `).get(token) as any;

  if (!session) return null;
  if (session.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  return getUserProfile(session.user_id);
}

// Auth: Logout
export function logoutSession(token: string) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// -------------------------------------------------------------
// CORE TRANSFER LOGIC (ATOMIC & IDEMPOTENT)
// -------------------------------------------------------------
export function executeTransfer(
  senderId: string,
  recipientId: string,
  amount: number,
  note?: string,
  idempotencyKey?: string
): { transaction: Transaction; senderBalance: number; recipientBalance: number } {
  const cleanRecipientId = recipientId.trim().toUpperCase();
  const cleanNote = (note || 'Chuyển tiền DEMO').trim();

  // Validate amount
  if (typeof amount !== 'number' || isNaN(amount) || !Number.isInteger(amount)) {
    throw new Error('Số tiền không hợp lệ. Vui lòng nhập số nguyên.');
  }
  if (amount <= 0) {
    throw new Error('Số tiền chuyển phải lớn hơn 0 DEMO.');
  }

  // Prevent self-transfer
  if (senderId === cleanRecipientId) {
    throw new Error('Bạn không thể chuyển tiền cho chính mình.');
  }

  // Check idempotency if key was provided
  if (idempotencyKey) {
    const existing = db.prepare(`
      SELECT * FROM transactions WHERE idempotency_key = ?
    `).get(idempotencyKey) as any;

    if (existing) {
      const sender = getUserProfile(senderId);
      const recipient = getUserProfile(cleanRecipientId);
      return {
        transaction: {
          id: existing.id,
          idempotencyKey: existing.idempotency_key,
          type: existing.type,
          senderId: existing.sender_id,
          receiverId: existing.receiver_id,
          senderName: existing.sender_name,
          receiverName: existing.receiver_name,
          amount: Number(existing.amount),
          note: existing.note,
          status: existing.status,
          createdAt: existing.created_at,
        },
        senderBalance: sender?.balance ?? 0,
        recipientBalance: recipient?.balance ?? 0,
      };
    }
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    // 1. Lock and get sender
    const sender = db.prepare(`
      SELECT user_id, name, balance FROM users WHERE user_id = ?
    `).get(senderId) as any;

    if (!sender) {
      throw new Error('Không tìm thấy tài khoản người gửi.');
    }

    if (sender.balance < amount) {
      throw new Error(`Số dư không đủ. Bạn có ${Number(sender.balance).toLocaleString('vi-VN')} DEMO.`);
    }

    // 2. Lock and get recipient
    const recipient = db.prepare(`
      SELECT user_id, name, balance FROM users WHERE user_id = ?
    `).get(cleanRecipientId) as any;

    if (!recipient) {
      throw new Error('Không tìm thấy người nhận.');
    }

    // 3. Atomically subtract money from sender
    db.prepare(`
      UPDATE users SET balance = balance - ? WHERE user_id = ?
    `).run(amount, senderId);

    // 4. Atomically add money to recipient
    db.prepare(`
      UPDATE users SET balance = balance + ? WHERE user_id = ?
    `).run(amount, cleanRecipientId);

    // 5. Create transaction record
    const txId = `TX_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO transactions (id, idempotency_key, sender_id, receiver_id, sender_name, receiver_name, type, amount, note, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'transfer', ?, ?, 'completed', ?)
    `).run(
      txId,
      idempotencyKey || null,
      senderId,
      cleanRecipientId,
      sender.name,
      recipient.name,
      amount,
      cleanNote,
      now
    );

    db.exec('COMMIT;');

    const newSenderBalance = Number(sender.balance) - amount;
    const newRecipientBalance = Number(recipient.balance) + amount;

    const tx: Transaction = {
      id: txId,
      idempotencyKey,
      type: 'transfer',
      senderId,
      receiverId: cleanRecipientId,
      senderName: sender.name,
      receiverName: recipient.name,
      amount,
      note: cleanNote,
      status: 'completed',
      createdAt: now,
    };

    // Realtime notifications to both users
    realtime.notifyUser(senderId, 'balance_update', {
      balance: newSenderBalance,
      transaction: tx,
      role: 'sender',
    });

    realtime.notifyUser(cleanRecipientId, 'balance_update', {
      balance: newRecipientBalance,
      transaction: { ...tx, type: 'receive' },
      role: 'receiver',
    });

    realtime.broadcast('stats_update', getAdminStats());

    return {
      transaction: tx,
      senderBalance: newSenderBalance,
      recipientBalance: newRecipientBalance,
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// -------------------------------------------------------------
// DEPOSIT SYSTEM
// -------------------------------------------------------------
export function createDepositRequest(userId: string, amount: number): DepositRequest {
  if (typeof amount !== 'number' || isNaN(amount) || !Number.isInteger(amount)) {
    throw new Error('Số tiền nạp không hợp lệ.');
  }
  if (amount <= 0) {
    throw new Error('Số tiền nạp phải lớn hơn 0 DEMO.');
  }
  if (amount > 100000000) {
    throw new Error('Số tiền nạp mỗi lần không được vượt quá 100,000,000 DEMO.');
  }

  const user = getUserProfile(userId);
  if (!user) {
    throw new Error('Tài khoản không tồn tại.');
  }

  const depositId = `DEP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO deposit_requests (id, user_id, user_name, amount, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(depositId, userId, user.name, amount, now);

  const req: DepositRequest = {
    id: depositId,
    userId,
    userName: user.name,
    amount,
    status: 'pending',
    createdAt: now,
  };

  // Real-time alert to admins
  realtime.notifyAdmins('new_deposit_request', req);
  realtime.broadcast('stats_update', getAdminStats());

  return req;
}

export function getUserDepositRequests(userId: string): DepositRequest[] {
  const rows = db.prepare(`
    SELECT * FROM deposit_requests
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as any[];

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    amount: Number(r.amount),
    status: r.status,
    reason: r.reason,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reviewedBy: r.reviewed_by,
  }));
}

// -------------------------------------------------------------
// ADMIN ACTIONS (APPROVE / REJECT / AUDIT)
// -------------------------------------------------------------
export function approveDepositRequest(depositId: string, adminId: string): { request: DepositRequest; newBalance: number } {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const req = db.prepare(`
      SELECT * FROM deposit_requests WHERE id = ?
    `).get(depositId) as any;

    if (!req) {
      throw new Error('Yêu cầu nạp tiền không tồn tại.');
    }

    // MANDATORY PROTECTION AGAINST DOUBLE APPROVAL
    if (req.status !== 'pending') {
      throw new Error('Yêu cầu này đã được xử lý.');
    }

    const user = db.prepare(`
      SELECT user_id, name, balance FROM users WHERE user_id = ?
    `).get(req.user_id) as any;

    if (!user) {
      throw new Error('Người dùng không còn tồn tại.');
    }

    const now = new Date().toISOString();
    const amount = Number(req.amount);

    // 1. Mark request approved
    db.prepare(`
      UPDATE deposit_requests
      SET status = 'approved', reviewed_at = ?, reviewed_by = ?
      WHERE id = ? AND status = 'pending'
    `).run(now, adminId, depositId);

    // 2. Add money to user's balance
    db.prepare(`
      UPDATE users SET balance = balance + ? WHERE user_id = ?
    `).run(amount, req.user_id);

    // 3. Create transaction record for the deposit
    const txId = `TX_DEP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    db.prepare(`
      INSERT INTO transactions (id, sender_id, receiver_id, sender_name, receiver_name, type, amount, note, status, created_at)
      VALUES (?, 'SYSTEM', ?, 'DemoBank Hệ Thống', ?, 'deposit', ?, 'Admin-approved deposit', 'completed', ?)
    `).run(txId, req.user_id, user.name, amount, now);

    db.exec('COMMIT;');

    const newBalance = Number(user.balance) + amount;
    const updatedRequest: DepositRequest = {
      id: req.id,
      userId: req.user_id,
      userName: user.name,
      amount,
      status: 'approved',
      createdAt: req.created_at,
      reviewedAt: now,
      reviewedBy: adminId,
    };

    const depositTx: Transaction = {
      id: txId,
      type: 'deposit',
      senderId: 'SYSTEM',
      receiverId: req.user_id,
      senderName: 'DemoBank Hệ Thống',
      receiverName: user.name,
      amount,
      note: 'Admin-approved deposit',
      status: 'completed',
      createdAt: now,
    };

    // Realtime notification to user
    realtime.notifyUser(req.user_id, 'deposit_update', {
      request: updatedRequest,
      balance: newBalance,
      transaction: depositTx,
    });

    realtime.notifyAdmins('deposit_resolved', updatedRequest);
    realtime.broadcast('stats_update', getAdminStats());

    return { request: updatedRequest, newBalance };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function rejectDepositRequest(depositId: string, adminId: string, reason?: string): DepositRequest {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const req = db.prepare(`
      SELECT * FROM deposit_requests WHERE id = ?
    `).get(depositId) as any;

    if (!req) {
      throw new Error('Yêu cầu nạp tiền không tồn tại.');
    }

    if (req.status !== 'pending') {
      throw new Error('Yêu cầu này đã được xử lý.');
    }

    const now = new Date().toISOString();
    const cleanReason = (reason || 'Yêu cầu nạp tiền không hợp lệ.').trim();

    db.prepare(`
      UPDATE deposit_requests
      SET status = 'rejected', reason = ?, reviewed_at = ?, reviewed_by = ?
      WHERE id = ? AND status = 'pending'
    `).run(cleanReason, now, adminId, depositId);

    db.exec('COMMIT;');

    const updatedRequest: DepositRequest = {
      id: req.id,
      userId: req.user_id,
      userName: req.user_name,
      amount: Number(req.amount),
      status: 'rejected',
      reason: cleanReason,
      createdAt: req.created_at,
      reviewedAt: now,
      reviewedBy: adminId,
    };

    realtime.notifyUser(req.user_id, 'deposit_update', {
      request: updatedRequest,
    });

    realtime.notifyAdmins('deposit_resolved', updatedRequest);
    realtime.broadcast('stats_update', getAdminStats());

    return updatedRequest;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// -------------------------------------------------------------
// TRANSACTIONS & HISTORY
// -------------------------------------------------------------
export function getTransactionsForUser(userId: string): Transaction[] {
  const rows = db.prepare(`
    SELECT * FROM transactions
    WHERE sender_id = ? OR receiver_id = ?
    ORDER BY created_at DESC
  `).all(userId, userId) as any[];

  return rows.map((r) => {
    let computedType: 'transfer' | 'receive' | 'deposit' | 'adjustment' = r.type;
    if (r.type === 'transfer' && r.receiver_id === userId) {
      computedType = 'receive';
    }

    return {
      id: r.id,
      idempotencyKey: r.idempotency_key,
      type: computedType,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      senderName: r.sender_name,
      receiverName: r.receiver_name,
      amount: Number(r.amount),
      note: r.note,
      status: r.status,
      createdAt: r.created_at,
    };
  });
}

// Admin: Get all transactions
export function getAllTransactions(limit = 100): Transaction[] {
  const rows = db.prepare(`
    SELECT * FROM transactions
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    idempotencyKey: r.idempotency_key,
    type: r.type,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    senderName: r.sender_name,
    receiverName: r.receiver_name,
    amount: Number(r.amount),
    note: r.note,
    status: r.status,
    createdAt: r.created_at,
  }));
}

// Admin: Get all deposit requests
export function getAllDepositRequests(status?: string): DepositRequest[] {
  let query = 'SELECT * FROM deposit_requests';
  const params: any[] = [];
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    amount: Number(r.amount),
    status: r.status,
    reason: r.reason,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reviewedBy: r.reviewed_by,
  }));
}

// Admin: Get all users with search
export function getAllUsers(search?: string): UserProfile[] {
  let query = 'SELECT user_id, name, balance, role, created_at FROM users';
  const params: any[] = [];

  if (search && search.trim()) {
    const term = `%${search.trim().toUpperCase()}%`;
    const termName = `%${search.trim()}%`;
    query += ' WHERE UPPER(user_id) LIKE ? OR name LIKE ?';
    params.push(term, termName);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((r) => ({
    userId: r.user_id,
    name: r.name,
    balance: Number(r.balance),
    role: r.role,
    createdAt: r.created_at,
  }));
}

// Admin: Controlled demo adjustment
export function adminAdjustBalance(adminId: string, targetUserId: string, adjustmentAmount: number, reason: string): { newBalance: number } {
  if (adjustmentAmount === 0 || !Number.isInteger(adjustmentAmount)) {
    throw new Error('Số tiền điều chỉnh không hợp lệ.');
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    const user = db.prepare('SELECT user_id, name, balance FROM users WHERE user_id = ?').get(targetUserId) as any;
    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    const currentBalance = Number(user.balance);
    if (currentBalance + adjustmentAmount < 0) {
      throw new Error('Số dư sau khi điều chỉnh không thể âm.');
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(adjustmentAmount, targetUserId);

    const txId = `TX_ADJ_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    db.prepare(`
      INSERT INTO transactions (id, sender_id, receiver_id, sender_name, receiver_name, type, amount, note, status, created_at)
      VALUES (?, 'SYSTEM', ?, 'Admin DemoBank', ?, 'adjustment', ?, ?, 'completed', ?)
    `).run(
      txId,
      targetUserId,
      user.name,
      Math.abs(adjustmentAmount),
      `Điều chỉnh bởi Admin: ${reason}`,
      now
    );

    db.exec('COMMIT;');

    const newBalance = currentBalance + adjustmentAmount;

    realtime.notifyUser(targetUserId, 'balance_update', {
      balance: newBalance,
      note: `Điều chỉnh số dư: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount.toLocaleString('vi-VN')} DEMO`,
    });

    realtime.broadcast('stats_update', getAdminStats());

    return { newBalance };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Admin Stats
export function getAdminStats(): AdminStats {
  const usersRow = db.prepare('SELECT COUNT(*) as count, SUM(balance) as total_money FROM users').get() as any;
  const depositsRow = db.prepare("SELECT COUNT(*) as count FROM deposit_requests WHERE status = 'pending'").get() as any;
  const txRow = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any;

  return {
    totalUsers: usersRow?.count || 0,
    totalVirtualMoney: Number(usersRow?.total_money || 0),
    pendingDeposits: depositsRow?.count || 0,
    totalTransactions: txRow?.count || 0,
  };
}
