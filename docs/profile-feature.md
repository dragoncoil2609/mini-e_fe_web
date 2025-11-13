## Tóm tắt tính năng Profile + Quản lý shop

### Mục tiêu
- Trang hồ sơ người dùng theo Figma: thanh bên trái điều hướng; vùng nội dung có các tab.
- Hai hành động chính: “Cập nhật thông tin” và “Đổi mật khẩu”.
- Nút “Quản lý shop”: nếu đã có shop → vào trang quản lý; nếu chưa có → đăng ký shop mới.

### Thay đổi chính (Frontend)
1) `src/pages/ProfilePage.tsx`
- Điều hướng dạng nhóm: `Tài khoản của tôi` gồm `Hồ sơ`, `Ngân Hàng`, `Địa chỉ`, `Đổi mật khẩu`, `Cài đặt thông báo`, `Đăng xuất`; các mục phụ còn lại (Đơn mua, Thông báo, Voucher, Quản lý shop) giữ riêng.
- `Hồ sơ` hiển thị trực tiếp form cập nhật; `Đổi mật khẩu` dùng `ChangePasswordForm`; `Đăng xuất` gọi `authService.logout()` và xoá session.
- Tab `Quản lý shop` gọi `shopsApi.getMine()`; nếu chưa có shop thì prompt tên shop để đăng ký, sau đó điều hướng.
- Hiển thị `feedback` (success/error) ngay trong trang.

2) `src/components/forms/ProfileUpdateForm.tsx`
- Form chỉnh sửa: name, phone, gender, birthday.
- Gọi `usersApi.updateMe(payload)` và đồng bộ lại state ở `ProfilePage`.

3) `src/components/forms/ChangePasswordForm.tsx`
- Dùng service `authService.changePassword` (đã có sẵn), nhúng vào tab `change-password`.

4) `src/api/users/users.service.ts`
- Mở rộng `UserItem` (phone, gender, birthday, avatarUrl).
- Thêm `updateMe(data)` → `PATCH /users/me`.

5) `src/api/shops/shops.service.ts`
- Thêm `getMine()` → `GET /shops/me` (trả `null` nếu 404).
- Bọc lỗi để hiện thông báo rõ ràng (message từ backend).

### Thay đổi chính (Backend mini_e)
1) Shop:
- Sửa `ShopsService.nameExists` dùng `LOWER(shop.name)` thay `ILike` (tương thích MySQL/Postgres) → tránh 500.

2) Users:
- `PATCH /users/me` nhận các trường: `name`, `phone`, `gender`, `birthday`, `avatarUrl?` (role/isVerified không cho sửa).

### Luồng hoạt động
1) Xem hồ sơ
- Vào `/profile` → load `usersApi.getById(user.id)` (fallback từ context).

2) Cập nhật thông tin
- Ở mục “Hồ sơ” (thuộc nhóm “Tài khoản của tôi”) sửa thông tin → `PATCH /users/me` → cập nhật state + banner feedback.

3) Đổi mật khẩu
- Ở mục “Đổi mật khẩu” → form xác thực (yup) → `POST /auth/change-password`.

4) Quản lý shop
- Tab “Quản lý shop” → `GET /shops/me`:
  - Có shop → `navigate('/shop/{id}')`
  - Chưa có shop → prompt tên → `POST /shops/register` → `navigate('/shop/{id}')`

### Cách gọi API (ví dụ nhanh)
```ts
// Lấy shop hiện tại
const myShop = await shopsApi.getMine(); // null nếu chưa có

// Tạo shop (FE đang dùng luồng prompt tên)
const created = await shopsApi.create({ name, email, description: '' });

// Cập nhật hồ sơ
const updated = await usersApi.updateMe({ name, phone, gender, birthday });
```

### Kiểm tra nhanh
- npm run dev (FE) và chạy backend (mini_e).
- Truy cập `/profile`:
  - Tab “Tài khoản của tôi”: hiển thị thông tin.
  - “Cập nhật thông tin”: sửa và lưu, thấy thông báo thành công.
  - “Đổi mật khẩu”: đổi được và có thông báo.
  - “Quản lý shop”: chuyển đúng theo trạng thái có/không có shop.

### Lưu ý
- Interceptor FE tự gắn Bearer token và xử lý 401 (redirect `/auth`).
- `shopsApi.getMine()` trả `null` khi 404 để đơn giản hoá luồng “chưa có shop”.
- Nếu muốn form đăng ký shop đẹp hơn, thay prompt bằng trang form riêng và gọi `shopsApi.create` với các trường cần thiết.


