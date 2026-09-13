import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  registerUser,
  loginUser,
  validateSession,
  logoutSession,
  getUserProfile,
  findPublicUserById,
  executeTransfer,
  createDepositRequest,
  getUserDepositRequests,
  approveDepositRequest,
  rejectDepositRequest,
  getTransactionsForUser,
  getAllTransactions,
  getAllDepositRequests,
  getAllUsers,
  getAdminStats,
  adminAdjustBalance,
  resetSeedData,
} from './server/db.ts';
import { realtime } from './server/realtime.ts';
import type { UserProfile } from './src/types.ts';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
      token?: string;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // -------------------------------------------------------------
  // AUTH MIDDLEWARES
  // -------------------------------------------------------------
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
      return;
    }

    const user = validateSession(token);
    if (!user) {
      res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  };

  const ADMIN_PASSCODE = '0944379685_vuok';

  const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const passcodeHeader = req.headers['x-admin-passcode'] as string | undefined;
    const passcodeBody = req.body?.adminPasscode as string | undefined;
    const passcodeQuery = req.query?.adminPasscode as string | undefined;

    const hasValidPasscode =
      passcodeHeader === ADMIN_PASSCODE ||
      passcodeBody === ADMIN_PASSCODE ||
      passcodeQuery === ADMIN_PASSCODE;

    if (hasValidPasscode) {
      next();
      return;
    }

    if (req.user && req.user.role === 'admin') {
      next();
      return;
    }

    res.status(403).json({
      error: 'Từ chối truy cập: Yêu cầu mật khẩu Quản trị viên (0944379685_vuok) để truy cập hoặc thực hiện thao tác quản trị.',
    });
  };

  // Verify Admin Passcode Endpoint
  app.post('/api/admin/verify-passcode', (req: Request, res: Response) => {
    const { passcode } = req.body;
    if (passcode === ADMIN_PASSCODE) {
      res.json({ success: true, message: 'Mật khẩu quản trị chính xác.' });
    } else {
      res.status(401).json({ success: false, error: 'Mật khẩu quản trị không đúng. Vui lòng kiểm tra lại.' });
    }
  });

  // -------------------------------------------------------------
  // REAL-TIME SERVER-SENT EVENTS (SSE)
  // -------------------------------------------------------------
  app.get('/api/realtime/stream', (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      res.status(401).end();
      return;
    }

    const user = validateSession(token);
    if (!user) {
      res.status(401).end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `${user.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    realtime.addClient(clientId, user.userId, user.role, res);

    // Initial connection ack
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: user.userId })}\n\n`);

    req.on('close', () => {
      realtime.removeClient(clientId);
    });
  });

  // -------------------------------------------------------------
  // AUTH ROUTES
  // -------------------------------------------------------------
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, password, confirmPassword } = req.body;
      if (!name || !password) {
        res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên và mật khẩu.' });
        return;
      }
      if (password !== confirmPassword) {
        res.status(400).json({ error: 'Mật khẩu xác nhận không khớp.' });
        return;
      }

      const result = registerUser(name, password);
      res.status(201).json({
        success: true,
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Đăng ký không thành công.' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { userId, password } = req.body;
      if (!userId || !password) {
        res.status(400).json({ error: 'Vui lòng nhập Mã người dùng và Mật khẩu.' });
        return;
      }

      const result = loginUser(userId, password);
      res.json({
        success: true,
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Đăng nhập không thành công.' });
    }
  });

  app.post('/api/auth/logout', authMiddleware, (req: Request, res: Response) => {
    if (req.token) {
      logoutSession(req.token);
    }
    res.json({ success: true });
  });

  app.get('/api/me', authMiddleware, (req: Request, res: Response) => {
    // Return the freshest profile from DB
    const freshProfile = getUserProfile(req.user!.userId);
    res.json({ user: freshProfile });
  });

  // -------------------------------------------------------------
  // USER SEARCH / LOOKUP
  // -------------------------------------------------------------
  app.get('/api/users/:id', authMiddleware, (req: Request, res: Response) => {
    try {
      const targetId = req.params.id.trim().toUpperCase();
      const user = findPublicUserById(targetId);
      if (!user) {
        res.status(404).json({ error: 'Không tìm thấy người nhận.' });
        return;
      }
      res.json({ user });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi khi tra cứu người dùng.' });
    }
  });

  // -------------------------------------------------------------
  // TRANSFER ENDPOINTS
  // -------------------------------------------------------------
  app.post('/api/transfers', authMiddleware, (req: Request, res: Response) => {
    try {
      const { recipientId, amount, note, idempotencyKey } = req.body;
      const numericAmount = Math.round(Number(amount));

      const result = executeTransfer(
        req.user!.userId,
        recipientId,
        numericAmount,
        note,
        idempotencyKey
      );

      res.json({
        success: true,
        transaction: result.transaction,
        newBalance: result.senderBalance,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Giao dịch chuyển tiền thất bại.' });
    }
  });

  app.get('/api/transactions', authMiddleware, (req: Request, res: Response) => {
    try {
      const transactions = getTransactionsForUser(req.user!.userId);
      res.json({ transactions });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải lịch sử giao dịch.' });
    }
  });

  // -------------------------------------------------------------
  // DEPOSIT REQUESTS
  // -------------------------------------------------------------
  app.post('/api/deposits', authMiddleware, (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      const numericAmount = Math.round(Number(amount));
      const request = createDepositRequest(req.user!.userId, numericAmount);
      res.status(201).json({
        success: true,
        request,
        message: 'Yêu cầu nạp tiền đã được gửi. Đang chờ Admin xét duyệt.',
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Không thể tạo yêu cầu nạp tiền.' });
    }
  });

  app.get('/api/deposits', authMiddleware, (req: Request, res: Response) => {
    try {
      const deposits = getUserDepositRequests(req.user!.userId);
      res.json({ deposits });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải danh sách nạp tiền.' });
    }
  });

  // Quick approve for Admin ("Bấm vào đây để duyệt") - ONLY ADMIN ALLOWED
  app.post('/api/deposits/:id/quick-approve', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const depositId = req.params.id;
      const adminApproverId = req.user!.userId;
      const result = approveDepositRequest(depositId, adminApproverId);
      res.json({
        success: true,
        request: result.request,
        newBalance: result.newBalance,
        message: 'Đã duyệt yêu cầu nạp tiền thành công!',
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Không thể duyệt yêu cầu.' });
    }
  });

  // -------------------------------------------------------------
  // ADMIN PROTECTED ROUTES
  // -------------------------------------------------------------
  app.post('/api/admin/deposits/approve-all', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const adminId = req.user!.userId || 'DB000001';
      const pending = getAllDepositRequests('pending');
      let count = 0;
      for (const dep of pending) {
        try {
          approveDepositRequest(dep.id, adminId);
          count++;
        } catch {
          // ignore already processed
        }
      }
      res.json({
        success: true,
        approvedCount: count,
        message: `Đã duyệt thành công ${count} yêu cầu nạp tiền.`,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Không thể duyệt tất cả yêu cầu.' });
    }
  });
  app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const stats = getAdminStats();
      res.json({ stats });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải số liệu thống kê.' });
    }
  });

  app.get('/api/admin/deposits', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const deposits = getAllDepositRequests(status);
      res.json({ deposits });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải danh sách yêu cầu nạp tiền.' });
    }
  });

  app.post('/api/admin/deposits/:id/approve', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const depositId = req.params.id;
      const result = approveDepositRequest(depositId, req.user!.userId);
      res.json({
        success: true,
        request: result.request,
        newBalance: result.newBalance,
        message: 'Đã duyệt yêu cầu nạp tiền thành công.',
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Không thể duyệt yêu cầu.' });
    }
  });

  app.post('/api/admin/deposits/:id/reject', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const depositId = req.params.id;
      const { reason } = req.body;
      const request = rejectDepositRequest(depositId, req.user!.userId, reason);
      res.json({
        success: true,
        request,
        message: 'Đã từ chối yêu cầu nạp tiền.',
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Không thể từ chối yêu cầu.' });
    }
  });

  app.get('/api/admin/users', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const search = req.query.search as string | undefined;
      const users = getAllUsers(search);
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải danh sách người dùng.' });
    }
  });

  app.get('/api/admin/transactions', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 100;
      const transactions = getAllTransactions(limit);
      res.json({ transactions });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải danh sách giao dịch.' });
    }
  });

  app.post('/api/admin/adjust-balance', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    try {
      const { targetUserId, amount, reason } = req.body;
      const result = adminAdjustBalance(req.user!.userId, targetUserId, Number(amount), reason || 'Điều chỉnh kiểm thử');
      res.json({ success: true, newBalance: result.newBalance });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Lỗi khi điều chỉnh số dư.' });
    }
  });

  app.post('/api/admin/reset-seed', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
    try {
      resetSeedData();
      res.json({ success: true, message: 'Đã khôi phục dữ liệu mẫu: Alice (500,000 DEMO), Bob (100,000 DEMO).' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Lỗi khi khôi phục dữ liệu mẫu.' });
    }
  });

  // -------------------------------------------------------------
  // VITE / STATIC SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DemoBank server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
