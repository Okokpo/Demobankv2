# DemoBank - Full-Stack Multi-User Banking Simulation

> **⚠️ QUAN TRỌNG / IMPORTANT DISCLAIMER:**  
> **DEMO BANK • VIRTUAL MONEY ONLY • NOT A REAL BANK**  
> Ứng dụng này hoàn toàn sử dụng **TIỀN ẢO MÔ PHỎNG** phục vụ mục đích kiểm thử và demo công nghệ. Hoàn toàn **KHÔNG** sử dụng tiền thật, tài khoản ngân hàng thật, thẻ thanh toán hay cổng thanh toán thực tế nào.

---

## 1. Yêu cầu Cốt lõi (Core Requirement)

> *"Nếu User A chuyển tiền ảo cho User B, User B phải nhận được chính xác số tiền đó trên cơ sở dữ liệu dùng chung (shared database), ngay cả khi User B đang sử dụng trình duyệt, điện thoại, máy tính hoặc phiên đăng nhập khác."*

### Ví dụ kịch bản kiểm thử:
- **User A (Alice)**: ID `DB123456` — Số dư: `500,000 DEMO`
- **User B (Bob)**: ID `DB654321` — Số dư: `100,000 DEMO`
- Alice chuyển `150,000 DEMO` cho Bob kèm lời nhắn "Tặng bạn".
- **Kết quả ngay lập tức**:
  - Alice: `350,000 DEMO`
  - Bob: `250,000 DEMO`
- Cả hai tab / thiết bị nhận thông báo biến động số dư qua SSE trong thời gian thực. F5 làm mới trang hoặc đăng nhập lại ở thiết bị khác số dư vẫn được duy trì nguyên vẹn trên cơ sở dữ liệu server.

---

## 2. Kiến trúc Hệ thống (System Architecture)

- **Backend**: Node.js + Express 5 với `tsx` trong môi trường phát triển và `esbuild` cho production bundle (`dist/server.cjs`).
- **Cơ sở dữ liệu**: SQLite máy chủ (`node:sqlite`) với **Giao dịch nguyên tử (Atomic Transactions)** sử dụng lệnh `BEGIN IMMEDIATE;` đảm bảo tính toàn vẹn ACID, chống race-condition khi nhiều giao dịch diễn ra đồng thời.
- **Xác thực & Bảo mật**:
  - Mã hóa mật khẩu với `bcryptjs` (salt rounds = 10), không lưu plaintext password.
  - Quản lý phiên làm việc bằng Bearer Token bảo mật (lưu trữ trong bảng `sessions` tại backend và `sessionStorage`/`localStorage` tại frontend).
  - Tự động sinh mã định danh duy nhất chuẩn ngân hàng: `DBxxxxxx` (ví dụ `DB123456`, `DB654321`).
  - Tìm kiếm người nhận chỉ trả về thông tin công khai (`userId`, `name`), không lộ số dư hay thông tin nhạy cảm.
- **Thời gian thực (Real-time PUSH)**:
  - Sử dụng Server-Sent Events (SSE) tại `/api/realtime/stream` để tự động đẩy sự kiện cập nhật số dư, thông báo nhận tiền và duyệt nạp tiền mà không cần polling liên tục.
- **Frontend**: Single Page Application với React 18, Vite, Tailwind CSS, Lucide Icons và Motion animations.

---

## 3. Tài khoản Thử nghiệm có sẵn (Seed Accounts)

| Vai trò | Tên người dùng | Mã tài khoản (User ID) | Mật khẩu | Số dư ban đầu |
| :--- | :--- | :--- | :--- | :--- |
| **User A** | Alice | `DB123456` | `password123` | **500,000 DEMO** |
| **User B** | Bob | `DB654321` | `password123` | **100,000 DEMO** |
| **Admin** | Hệ thống Quản trị | `DB000001` | `admin123` | `10,000,000 DEMO` |

*(Có sẵn các nút bấm đăng nhập nhanh 1-chạm tại trang Login để thử nghiệm thuận tiện).*

---

## 4. Hướng dẫn Kiểm thử Hai Thiết bị / Hai Trình duyệt

1. **Cửa sổ 1 (Alice)**:
   - Mở trình duyệt thông thường, truy cập trang web DemoBank.
   - Bấm nút chọn nhanh **"Alice (DB123456)"** và đăng nhập.
   - Số dư hiển thị: `500,000 DEMO`.

2. **Cửa sổ 2 (Bob)**:
   - Mở cửa sổ **Ẩn danh (Incognito)** hoặc trình duyệt/điện thoại khác.
   - Bấm nút chọn nhanh **"Bob (DB654321)"** và đăng nhập.
   - Số dư hiển thị: `100,000 DEMO`.

3. **Thực hiện chuyển tiền từ Alice -> Bob**:
   - Tại cửa sổ của Alice: Vào menu **Chuyển tiền**.
   - Nhập Mã người nhận: `DB654321` -> Bấm **Tìm người nhận**.
   - Hệ thống truy vấn cơ sở dữ liệu và hiển thị xác nhận: *"Đã tìm thấy người nhận: Bob (DB654321)"*.
   - Nhập số tiền: `150000` -> Nhập lời nhắn: *"Tặng bạn"*.
   - Bấm **Chuyển tiền DEMO** -> Cửa sổ xác nhận xuất hiện -> Bấm **Xác nhận chuyển**.

4. **Quan sát kết quả**:
   - Cửa sổ Alice: Số dư lập tức trừ còn `350,000 DEMO`.
   - Cửa sổ Bob: Nhận thông báo toast xanh lá *"Nhận tiền thành công! +150,000 DEMO từ Alice"* và số dư tự động tăng lên `250,000 DEMO` trong tích tắc mà không cần F5!
   - Tải lại trang (F5) cả 2 bên: Số dư và lịch sử giao dịch vẫn được lưu giữ chính xác trên cơ sở dữ liệu server.

---

## 5. Quy trình Quản trị Nạp tiền (Deposit Approval Flow)

1. Người dùng vào trang **Nạp tiền**, nhập số tiền (ví dụ: `500,000 DEMO`) và gửi yêu cầu.
2. Tiền **KHÔNG** được cộng ngay mà tạo bản ghi `status: 'pending'`.
3. Quản trị viên đăng nhập bằng tài khoản `DB000001` (`admin123`), truy cập trang **Quản trị (Admin)** -> Tab **Duyệt nạp tiền**.
4. Quản trị viên bấm **Duyệt nạp**:
   - Hệ thống thực thi giao dịch nguyên tử: chuyển trạng thái thành `approved`, cộng số dư cho người dùng và ghi nhận giao dịch loại `deposit`.
   - Cơ chế phòng chống duyệt đúp (Double approval prevention): ngăn chặn việc duyệt 2 lần cùng một yêu cầu.
   - Người dùng nhận thông báo thời gian thực và số dư tăng ngay lập tức.
5. Nếu bấm **Từ chối**: Trạng thái chuyển thành `rejected` kèm lý do và không thay đổi số dư.

---

## 6. Biến môi trường (`.env`)

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=demobank_secret_key_2026_demo_virtual_banking
```

---

## 7. Cài đặt và Khởi chạy

```bash
# Cài đặt thư viện
npm install

# Khởi chạy chế độ phát triển (port 3000)
npm run dev

# Kiểm tra cú pháp TypeScript
npm run lint

# Build cho môi trường production
npm run build

# Khởi chạy production server
npm start
```
