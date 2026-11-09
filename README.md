# LifeOS - Hệ thống Quản trị Cá nhân Tích hợp Đồ họa 3D WebGL

Tài liệu đặc tả kiến trúc, kỹ thuật và hướng dẫn vận hành hệ thống LifeOS (Personal Operating System).

---

## 1. Tổng quan dự án (Overview)

LifeOS là một hệ thống quản trị cá nhân toàn diện (Personal Operating System), được xây dựng trên nền tảng Next.js App Router nhằm hợp nhất các hoạt động quản lý công việc, tri thức và dữ liệu cá nhân vào một giao diện tập trung. Dự án kết hợp kiến trúc Full-stack hiện đại với đồ họa 3D WebGL tương tác thời gian thực, đem lại trải nghiệm trực quan và tối ưu hóa năng suất làm việc hàng ngày.

Mục tiêu chính của hệ thống bao gồm:
- **Quản lý tập trung**: Cung cấp đầy đủ các công cụ điều hành cuộc sống số bao gồm Quản lý công việc & Danh sách kiểm tra, Trục thời gian sự kiện, Ghi chú nhanh, Thư viện bài viết kèm chế độ đọc tập trung, Trung tâm tài liệu đa định dạng, và Kho lưu trữ bí mật được bảo vệ hai lớp.
- **Tương tác trực quan thời gian thực**: Tích hợp lõi không gian 3D WebGL được tối ưu hóa về mặt hiệu năng kết hợp cùng chuyển động giao diện mượt mà thông qua Framer Motion.
- **Bảo mật và phân quyền chặt chẽ**: Áp dụng cơ chế xác thực JWT được lưu trữ trong HTTP-only cookie, phân tách rõ ràng giữa các phân hệ quản trị nội bộ và các tài nguyên được phép chia sẻ công khai ra ngoài Internet.

---

## 2. Kiến trúc kỹ thuật & Công nghệ (Tech Stack)

Hệ thống sử dụng hệ sinh thái JavaScript/TypeScript đồng bộ từ tầng giao diện người dùng đến cơ sở dữ liệu quan hệ PostgreSQL.

| Thành phần | Thư viện / Công nghệ | Phiên bản | Vai trò trong hệ thống |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | 15.1.7 | App Router, Server Components, Route Handlers, Middleware |
| **Nền tảng UI** | React / React DOM | 19.0.0 | Thư viện xây dựng giao diện thành phần |
| **Ngôn ngữ** | TypeScript | 5.7.3 | Định nghĩa kiểu dữ liệu tĩnh và kiểm soát lỗi biên dịch |
| **Định kiểu (Styling)** | Tailwind CSS | 3.4.17 | Hệ thống Utility-first CSS, hỗ trợ giao diện sáng đa sắc hài hòa và chế độ tối |
| **Tiện ích CSS** | clsx, tailwind-merge | 2.1.1 / 3.0.1 | Kết hợp và giải quyết xung đột class Tailwind linh hoạt |
| **Đồ họa 3D WebGL** | Three.js | 0.173.0 | Khởi tạo Canvas 3D, hệ thống hạt, hình học phức hợp và vật liệu |
| **Hệ sinh thái Three** | @react-three/fiber, @react-three/drei | 8.17.14 / 9.121.4 | Tích hợp khai báo Three.js vào mô hình React Component |
| **Hoạt họa (Animation)** | Framer Motion | 12.4.7 | Chuyển cảnh giao diện, hiệu ứng danh sách và hộp thoại nổi |
| **Biểu tượng (Icons)** | Lucide React | 0.475.0 | Bộ biểu tượng vector nhẹ và đồng nhất |
| **Cơ sở dữ liệu** | PostgreSQL (Neon Serverless) | ap-southeast-1 | Lưu trữ toàn bộ dữ liệu quan hệ, chỉ mục và trường JSONB |
| **Trình kết nối DB** | pg (node-postgres) | 8.13.3 | Quản lý connection pool và thực thi truy vấn SQL |
| **Xác thực Token** | jose | 5.9.6 | Ký và xác thực JSON Web Token (JWT) theo chuẩn HS256 trên Edge/Node |
| **Mã hóa mật khẩu** | bcryptjs | 2.4.3 | Băm mật khẩu người dùng và mã PIN kho bảo mật |
| **Thực thi Script** | tsx | 4.19.2 | Chạy trực tiếp các tập lệnh TypeScript như khởi tạo cơ sở dữ liệu |

---

## 3. Các phân hệ chức năng (Core Modules)

### 3.1. Xác thực & Bảo mật (Authentication & Route Protection)
- **Cơ chế phiên làm việc (Session Handling)**: Hệ thống sử dụng mã thông báo JWT được ký bằng thuật toán HS256 với thời hạn 7 ngày. Mã thông báo được lưu trữ an toàn trong HTTP-only cookie có tên `lifeos_session`, ngăn chặn nguy cơ đánh cắp token qua các cuộc tấn công XSS trên trình duyệt.
- **Middleware kiểm soát truy cập (`src/middleware.ts`)**: 
  - Toàn bộ các tuyến đường quản trị thuộc nhóm `/(dashboard)/*` và các REST API tương ứng đều yêu cầu xác thực token hợp lệ trước khi xử lý.
  - Cho phép truy cập tự do vào các tuyến đường công khai: `/login`, trang đọc bài viết công khai `/p/[slug]`, các API xác thực `/api/auth/*`, và API lấy bài viết công khai `/api/articles/public/*`.
  - Tự động điều hướng người dùng về trang chủ nếu đã đăng nhập nhưng cố gắng truy cập lại trang `/login`.

### 3.2. Không gian Đồ họa 3D & Bảng điều khiển (3D WebGL Core & Dashboard)
- **Thành phần lõi 3D (`LifeOSCoreScene.tsx`)**:
  - Xây dựng bằng Three.js hiển thị qua HTML5 Canvas với vật liệu kim loại khúc xạ ánh sáng đa sắc (iridescent crystal & orbital rings) trên canvas trong suốt.
  - Được thu gọn thành widget tiêu điểm (focal widget) trực quan tại Hero Banner của trang tổng quan thay vì phủ toàn màn hình, hạn chế cảm giác rối mắt và tối ưu hóa tài nguyên phần cứng.
  - Tương tác thời gian thực: Tự động theo dõi chuyển động chuột để tạo hiệu ứng thị sai mượt mà (Damping parallax interpolation).
  - Tích hợp công tắc bật/tắt hiển thị 3D ngay trên thanh tiêu đề để người dùng chủ động điều chỉnh.
- **Thư viện Biểu tượng 3D Đa sắc (`Icon3D.tsx`)**:
  - Tích hợp bộ biểu tượng 3D đa sắc (Color style) trực tiếp vào thanh điều hướng, các thẻ KPI và danh mục phân hệ.
  - Hỗ trợ hoạt họa nổi nhẹ nhàng (floating animation) và phản hồi tương tác hover thông qua Framer Motion.
- **Bảng điều khiển tổng quan (Dashboard)**:
  - Bố cục Bento đa sắc hài hòa trên nền sáng tinh gọn kết hợp các dải màu phân định (Indigo, Emerald, Amber, Violet, Sky, Rose) cho từng phân hệ nghiệp vụ.
  - Bảng thống kê KPI thời gian thực truy vấn qua `/api/stats`, tổng hợp số lượng công việc, tỷ lệ hoàn thành, ghi chú mới nhất, bài viết chưa đọc, tổng số tài liệu và các sự kiện sắp diễn ra trên trục thời gian.
  - Hộp thoại tìm kiếm và điều hướng nhanh (`Cmd+K` hoặc `Ctrl+K`): Cho phép người dùng tìm kiếm chức năng, di chuyển nhanh giữa các phân hệ hoặc kích hoạt các tác vụ thêm mới từ bất kỳ vị trí nào trên giao diện.

### 3.3. Quản lý Công việc & Check-list (Tasks & Sub-checklists)
- **Chế độ hiển thị kép**:
  - Chế độ Danh sách kiểm tra (Check-list View): Tối ưu cho việc theo dõi tiến độ từng ngày, tích hợp vòng tròn tiến độ SVG trực quan hóa tỷ lệ hoàn thành.
  - Chế độ Bảng Kanban (Kanban View): Tổ chức công việc theo ba cột trạng thái chuẩn: `todo` (Cần làm), `in_progress` (Đang thực hiện), và `done` (Đã hoàn thành) hỗ trợ chuyển đổi trạng thái nhanh.
- **Tác vụ con (Subtasks)**: Mỗi công việc cho phép định nghĩa một danh sách công việc con được lưu dưới dạng trường JSONB, tính toán tiến độ chi tiết và cập nhật trạng thái độc lập.
- **Phân cấp độ ưu tiên**: Hỗ trợ 4 cấp độ ưu tiên rõ ràng: `urgent` (Khẩn cấp), `high` (Cao), `medium` (Trung bình), và `low` (Thấp) với mã màu nhận diện trực quan.
- **Cập nhật tức thì (Optimistic UI)**: Khi người dùng đánh dấu hoàn thành hoặc thay đổi trạng thái công việc, giao diện phản hồi ngay lập tức trước khi yêu cầu HTTP hoàn tất, mang lại trải nghiệm không có độ trễ.

### 3.4. Trục thời gian (Timeline)
- **Dòng thời gian hợp nhất**: Trình bày toàn bộ lộ trình phát triển cá nhân và kế hoạch công việc trên một trục thời gian dọc liên tục.
- **Tích hợp nguồn dữ liệu đa chiều**:
  - Các cột mốc sự kiện chủ động (`timeline_events`) được phân loại theo: `milestone` (Cột mốc), `work` (Công việc), `personal` (Cá nhân), `idea` (Ý tưởng), và `achievement` (Thành tựu).
  - Tự động lấy và hiển thị các công việc từ bảng `tasks` có thiết lập hạn chót (`due_date`), giúp quan sát tổng thể thời hạn sắp tới.
- **Theo dõi tiến độ theo thời gian**: Hiển thị nhãn tính toán số ngày còn lại hoặc số ngày quá hạn, đồng thời cho phép lọc theo danh mục hoặc chuyển đổi giữa sự kiện sắp tới và sự kiện đã qua.

### 3.5. Quản lý Ghi chú (Notes Grid)
- **Bố cục thẻ lưới (Responsive Masonry/Grid)**: Trình bày ghi chú khoa học, dễ dàng đọc lướt và tìm kiếm.
- **Bảng màu trực quan**: Hỗ trợ 6 bảng màu chủ đạo để phân loại trực quan (`Slate`, `Sapphire`, `Emerald`, `Amber`, `Rose`, `Amethyst`).
- **Tính năng bổ trợ**:
  - Ghim ghi chú quan trọng (`is_pinned`) lên đầu danh sách.
  - Hỗ trợ nội dung định dạng Markdown.
  - Gắn thẻ (tags) và lọc ghi chú tức thì theo thẻ.
  - Nút sao chép nhanh toàn bộ nội dung vào bộ nhớ tạm (Clipboard).

### 3.6. Quản lý Bài viết & Chế độ đọc (Articles Studio & Distraction-Free Reader Mode)
- **Quản lý chu trình đọc**: Theo dõi trạng thái bài viết theo ba mức: `unread` (Chưa đọc), `reading` (Đang đọc), và `completed` (Đã đọc), kèm tính năng đánh dấu bài viết yêu thích (`is_favorite`).
- **Giao diện đọc tập trung (Distraction-Free Reader Mode)**:
  - Loại bỏ mọi thành phần gây xao nhãng, tập trung hoàn toàn vào nội dung chữ và hình ảnh.
  - Thanh đo tiến trình đọc (Reading Progress Bar) định vị ở mép trên màn hình, tính toán theo vị trí cuộn trang.
  - Tùy biến hiển thị đa dạng: 3 tùy chọn kiểu chữ (`Serif` - chữ có chân kiểu sách in, `Sans` - hiện đại không chân, `Mono` - phong cách kỹ thuật); thanh trượt tùy chỉnh cỡ chữ từ 14px đến 28px; và 3 chế độ màu nền phù hợp thị giác (`Dark OLED` - đen sâu tiết kiệm pin, `Warm Sepia` - vàng ấm chống mỏi mắt, `Crisp Paper` - trắng truyền thống).
- **Chia sẻ bài viết công khai (`/p/[slug]`)**:
  - Hỗ trợ cờ bật/tắt công khai (`is_public`).
  - Khi bật, hệ thống cung cấp một đường dẫn riêng biệt theo định dạng `/p/[slug]` không yêu cầu đăng nhập, cho phép chia sẻ kiến thức trực tiếp tới người đọc bên ngoài.

### 3.7. Trung tâm Tài liệu (Document Center)
- **Kiến trúc lưu trữ kép (Dual-Storage Architecture)**:
  - Tải lên trực tiếp từ máy tính: Mã hóa nội dung tập tin sang chuỗi Base64 và lưu trữ trực tiếp trong cột `file_data` của bảng `documents` trong cơ sở dữ liệu PostgreSQL. Tích hợp trình xem trước (Preview) tức thì trong ứng dụng cho hình ảnh (PNG, JPG, SVG, WebP), tài liệu PDF và các tệp văn bản thuần.
  - Liên kết tài liệu ngoài (External URLs): Lưu trữ và quản lý các đường dẫn tới Google Drive, Notion, Figma, GitHub hoặc các nền tảng lưu trữ đám mây khác.
- **Tổ chức dữ liệu**: Phân loại theo 6 danh mục chuyên biệt (Công việc & Dự án, Tài chính & Hóa đơn, Hợp đồng & Pháp lý, Học tập & Chứng chỉ, Cá nhân & Y tế, Kỹ thuật & Thiết kế); đánh dấu sao (`is_starred`); hiển thị dung lượng tập tin đã được định dạng chuẩn (`KB`, `MB`); và tính năng tải xuống tập tin trực tiếp.

### 3.8. Kho lưu trữ cá nhân (Personal Vault - Bảo mật 2 lớp bằng PIN)
- **Lớp bảo vệ thứ hai độc lập**:
  - Sau khi đăng nhập vào hệ thống LifeOS, phân hệ Kho bảo mật yêu cầu người dùng nhập mã PIN phụ (4 đến 6 chữ số) để mở khóa quyền xem và thao tác với các dữ liệu nhạy cảm.
  - Mã PIN được băm bằng thuật toán bcrypt và lưu trữ trong cột `vault_pin_hash` của bảng `users`. Hệ thống hỗ trợ đổi mã PIN an toàn thông qua API chuyên biệt.
- **Phân loại dữ liệu nhạy cảm**: Hỗ trợ 5 nhóm mục bảo mật chính:
  1. `credential`: Tài khoản & Mật khẩu đăng nhập.
  2. `api_key`: Khóa API, Secret Tokens, SSH Keys.
  3. `secure_note`: Ghi chú riêng tư, thông tin pháp lý.
  4. `card`: Thông tin thẻ ngân hàng, thẻ tín dụng.
  5. `document`: Dữ liệu định danh hoặc hồ sơ mật.
- **Tiện ích bảo mật nâng cao**:
  - Chế độ ẩn/hiện giá trị bí mật (`secret_value`) kèm cơ chế an toàn tự động.
  - Tích hợp bộ sinh mật khẩu ngẫu nhiên mạnh (`generateStrongPassword`) sử dụng `window.crypto.getRandomValues`.
  - Nút sao chép an toàn một chạm cho cả tên đăng nhập và mật mã bí mật.

---

## 4. Cấu trúc thư mục (Project Structure)

```
LifeOS/
├── .env.example               # Mẫu khai báo biến môi trường
├── package.json               # Định nghĩa gói thư viện và tập lệnh thực thi
├── tsconfig.json              # Cấu hình biên dịch TypeScript
├── tailwind.config.ts         # Cấu hình mở rộng màu sắc và tiện ích Tailwind CSS
├── postcss.config.mjs         # Cấu hình plugin xử lý CSS PostCSS
├── next.config.ts             # Cấu hình Next.js runtime và hình ảnh ngoài
├── scripts/
│   └── init-db.ts             # Kịch bản khởi tạo lược đồ PostgreSQL và tạo tài khoản khởi đầu
└── src/
    ├── middleware.ts          # Middleware kiểm soát token JWT và bảo vệ route
    ├── app/
    │   ├── globals.css        # Định kiểu toàn cục, font chữ và hiệu ứng cuộn
    │   ├── layout.tsx         # Root Layout của ứng dụng
    │   ├── login/
    │   │   └── page.tsx       # Giao diện đăng nhập tích hợp nền 3D WebGL
    │   ├── p/[slug]/
    │   │   └── page.tsx       # Giao diện đọc bài viết chia sẻ công khai không cần đăng nhập
    │   ├── (dashboard)/       # Nhóm tuyến đường được bảo vệ bởi xác thực
    │   │   ├── layout.tsx     # Layout bảng điều khiển tích hợp Sidebar và Header
    │   │   ├── page.tsx       # Trang Dashboard tổng quan và sơ đồ 3D trung tâm
    │   │   ├── tasks/
    │   │   │   └── page.tsx   # Trang quản lý Công việc và Check-list
    │   │   ├── timeline/
    │   │   │   └── page.tsx   # Trang Trục thời gian sự kiện và thời hạn
    │   │   ├── notes/
    │   │   │   └── page.tsx   # Trang Ghi chú lưới theo màu
    │   │   ├── articles/
    │   │   │   └── page.tsx   # Trang Quản lý bài viết và Studio đọc tập trung
    │   │   ├── documents/
    │   │   │   └── page.tsx   # Trang Trung tâm tài liệu và xem trước tập tin
    │   │   └── vault/
    │   │       └── page.tsx   # Trang Kho lưu trữ cá nhân khóa mã PIN
    │   └── api/               # Hệ thống 18 Route Handlers (REST API)
    │       ├── auth/
    │       │   ├── login/route.ts
    │       │   ├── logout/route.ts
    │       │   └── me/route.ts
    │       ├── tasks/
    │       │   ├── route.ts
    │       │   └── [id]/route.ts
    │       ├── timeline/
    │       │   ├── route.ts
    │       │   └── [id]/route.ts
    │       ├── notes/
    │       │   ├── route.ts
    │       │   └── [id]/route.ts
    │       ├── articles/
    │       │   ├── route.ts
    │       │   ├── [id]/route.ts
    │       │   └── public/[slug]/route.ts
    │       ├── documents/
    │       │   ├── route.ts
    │       │   └── [id]/route.ts
    │       ├── vault/
    │       │   ├── route.ts
    │       │   ├── [id]/route.ts
    │       │   └── pin/route.ts
    │       └── stats/
    │           └── route.ts
    ├── components/
    │   ├── articles/
    │   │   └── ArticlesStudio.tsx    # Giao diện quản lý bài viết và Reader Mode
    │   ├── dashboard/
    │   │   └── DashboardView.tsx     # Giao diện KPI thời gian thực và thống kê
    │   ├── documents/
    │   │   └── DocumentCenter.tsx    # Giao diện quản lý tài liệu, Base64 và modal preview
    │   ├── layout/
    │   │   ├── Header.tsx            # Thanh tiêu đề trên cùng kèm tìm kiếm nhanh Cmd+K
    │   │   └── Sidebar.tsx           # Thanh điều hướng bên trái có thể thu gọn
    │   ├── notes/
    │   │   └── NotesGrid.tsx         # Giao diện lưới ghi chú và bộ sửa Markdown
    │   ├── tasks/
    │   │   └── TaskManager.tsx       # Giao diện Check-list tiến độ và bảng Kanban
    │   ├── three/
    │   │   └── LifeOSCoreScene.tsx   # Thành phần Canvas 3D Three.js Icosahedron và Particles
    │   ├── timeline/
    │   │   └── TimelineView.tsx      # Giao diện trục thời gian dọc và đếm ngược
    │   └── vault/
    │       └── PersonalVault.tsx     # Giao diện khóa PIN, danh sách mật mã và trình sinh pass
    ├── db/
    │   ├── index.ts                  # Quản lý Connection Pool PostgreSQL
    │   └── schema.ts                 # SQL Schema khởi tạo bảng và các hàm ánh xạ Row to Entity
    ├── lib/
    │   └── auth.ts                   # Tiện ích ký JWT, giải mã và đọc cookie xác thực
    └── types/
        └── lifeos.ts                 # Khai báo toàn bộ Interface TypeScript dùng chung
```

---

## 5. Thiết kế Cơ sở dữ liệu & Danh sách API

### 5.1. Lược đồ Cơ sở dữ liệu (PostgreSQL Schema)

Cơ sở dữ liệu bao gồm 7 bảng quan hệ được thiết kế với các khóa ngoại ràng buộc xóa lan truyền (`ON DELETE CASCADE`) theo người dùng:

1. **`users`**:
   - `id SERIAL PRIMARY KEY`: Định danh người dùng duy nhất.
   - `username VARCHAR(100) UNIQUE NOT NULL`: Tên đăng nhập hệ thống.
   - `password_hash VARCHAR(255) NOT NULL`: Mật khẩu được băm bằng bcrypt.
   - `display_name VARCHAR(150) NOT NULL`: Tên hiển thị trên giao diện.
   - `vault_pin_hash VARCHAR(255)`: Mã PIN kho bảo mật được băm bằng bcrypt.
   - `created_at`, `updated_at TIMESTAMP WITH TIME ZONE`: Thời gian tạo và cập nhật.

2. **`tasks`**:
   - `id SERIAL PRIMARY KEY`: Khóa chính.
   - `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`: Khóa ngoại.
   - `title VARCHAR(255) NOT NULL`: Tiêu đề công việc.
   - `description TEXT DEFAULT ''`: Mô tả chi tiết công việc.
   - `status VARCHAR(50) DEFAULT 'todo'`: Trạng thái công việc (`todo`, `in_progress`, `done`).
   - `priority VARCHAR(50) DEFAULT 'medium'`: Độ ưu tiên (`low`, `medium`, `high`, `urgent`).
   - `due_date TIMESTAMP WITH TIME ZONE`: Hạn chót thực hiện.
   - `tags JSONB DEFAULT '[]'::jsonb`: Mảng chuỗi thẻ đánh dấu.
   - `subtasks JSONB DEFAULT '[]'::jsonb`: Mảng đối tượng tác vụ con `[{ id, title, completed }]`.
   - `completed_at TIMESTAMP WITH TIME ZONE`: Thời điểm hoàn thành.
   - `created_at`, `updated_at TIMESTAMP WITH TIME ZONE`.
   - *Chỉ mục*: `idx_tasks_user_id`, `idx_tasks_status`.

3. **`timeline_events`**:
   - `id SERIAL PRIMARY KEY`: Khóa chính.
   - `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`: Khóa ngoại.
   - `title VARCHAR(255) NOT NULL`: Tên sự kiện / cột mốc.
   - `description TEXT DEFAULT ''`: Mô tả chi tiết.
   - `event_date TIMESTAMP WITH TIME ZONE NOT NULL`: Ngày diễn ra sự kiện.
   - `category VARCHAR(50) DEFAULT 'milestone'`: Danh mục (`milestone`, `work`, `personal`, `idea`, `achievement`).
   - `color VARCHAR(50) DEFAULT '#3b82f6'`: Mã màu hiển thị.
   - `completed BOOLEAN DEFAULT false`: Trạng thái hoàn thành.
   - `created_at TIMESTAMP WITH TIME ZONE`.
   - *Chỉ mục*: `idx_timeline_events_user_id`, `idx_timeline_events_date`.

4. **`notes`**:
   - `id SERIAL PRIMARY KEY`: Khóa chính.
   - `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`: Khóa ngoại.
   - `title VARCHAR(255) NOT NULL`: Tiêu đề ghi chú.
   - `content TEXT DEFAULT ''`: Nội dung ghi chú dạng Markdown.
   - `color VARCHAR(50) DEFAULT '#ffffff'`: Mã định danh màu nền thẻ.
   - `tags JSONB DEFAULT '[]'::jsonb`: Mảng thẻ phân loại.
   - `is_pinned BOOLEAN DEFAULT false`: Cờ ghim lên đầu danh sách.
   - `created_at`, `updated_at TIMESTAMP WITH TIME ZONE`.
   - *Chỉ mục*: `idx_notes_user_id`.

5. **`articles`**:
   - `id SERIAL PRIMARY KEY`: Khóa chính.
   - `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`: Khóa ngoại.
   - `title VARCHAR(255) NOT NULL`: Tiêu đề bài viết.
   - `slug VARCHAR(255) UNIQUE NOT NULL`: Đường dẫn định danh URL duy nhất.
   - `excerpt TEXT DEFAULT ''`: Đoạn trích dẫn ngắn.
   - `content TEXT DEFAULT ''`: Nội dung chi tiết bài viết.
   - `category VARCHAR(100) DEFAULT 'General'`: Danh mục chuyên mục.
   - `tags JSONB DEFAULT '[]'::jsonb`: Mảng các thẻ chủ đề.
   - `cover_image TEXT DEFAULT ''`: Đường dẫn ảnh bìa.
   - `reading_time INTEGER DEFAULT 1`: Ước tính thời gian đọc (phút).
   - `is_public BOOLEAN DEFAULT false`: Trạng thái cho phép chia sẻ công khai.
   - `is_favorite BOOLEAN DEFAULT false`: Đánh dấu bài viết yêu thích.
   - `read_status VARCHAR(50) DEFAULT 'unread'`: Trạng thái đọc (`unread`, `reading`, `completed`).
   - `created_at`, `updated_at TIMESTAMP WITH TIME ZONE`.
   - *Chỉ mục*: `idx_articles_user_id`, `idx_articles_slug`.

6. **`documents`**:
   - `id SERIAL PRIMARY KEY`: Khóa chính.
   - `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`: Khóa ngoại.
   - `title VARCHAR(255) NOT NULL`: Tên tài liệu.
   - `description TEXT DEFAULT ''`: Mô tả tài liệu.
   - `category VARCHAR(100) DEFAULT 'General'`: Danh mục phân loại.
   - `file_name VARCHAR(255) DEFAULT ''`: Tên tập tin gốc.
   - `file_type VARCHAR(100) DEFAULT ''`: MIME type của tập tin.
   - `file_size INTEGER DEFAULT 0`: Dung lượng tập tin (bytes).
   - `file_data TEXT DEFAULT ''`: Nội dung tập tin mã hóa Base64 (nếu tải lên trực tiếp).
   - `external_url TEXT DEFAULT ''`: Liên kết tới tài liệu lưu trữ bên ngoài.
   - `tags JSONB DEFAULT '[]'::jsonb`: Mảng thẻ tìm kiếm.
   - `is_starred BOOLEAN DEFAULT false`: Đánh dấu sao tài liệu quan trọng.
   - `created_at TIMESTAMP WITH TIME ZONE`.
   - *Chỉ mục*: `idx_documents_user_id`.

7. **`vault_items`**:
   - `id SERIAL PRIMARY KEY`: Khóa chính.
   - `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`: Khóa ngoại.
   - `title VARCHAR(255) NOT NULL`: Tiêu đề mục bảo mật.
   - `category VARCHAR(50) DEFAULT 'credential'`: Phân loại (`credential`, `api_key`, `secure_note`, `card`, `document`).
   - `username VARCHAR(255) DEFAULT ''`: Tên tài khoản / định danh.
   - `secret_value TEXT DEFAULT ''`: Mật mã, token hoặc giá trị nhạy cảm.
   - `url TEXT DEFAULT ''`: Đường dẫn đăng nhập liên quan.
   - `notes TEXT DEFAULT ''`: Ghi chú bổ sung an toàn.
   - `tags JSONB DEFAULT '[]'::jsonb`: Thẻ phân loại.
   - `is_favorite BOOLEAN DEFAULT false`: Đánh dấu ưu tiên.
   - `created_at`, `updated_at TIMESTAMP WITH TIME ZONE`.
   - *Chỉ mục*: `idx_vault_items_user_id`.

---

### 5.2. Danh sách REST API Endpoints (18 Route Handlers)

Toàn bộ các endpoints được tổ chức dưới đường dẫn `/api/*`, kiểm tra xác thực người dùng ngoại trừ endpoint bài viết công khai:

| TT | Phương thức | Đường dẫn Endpoint | Chức năng nghiệp vụ |
| :---: | :--- | :--- | :--- |
| 1 | `POST` | `/api/auth/login` | Xác thực tên người dùng/mật khẩu và cấp phát HTTP-only cookie `lifeos_session` |
| 2 | `POST` | `/api/auth/logout` | Hủy phiên làm việc và xóa cookie `lifeos_session` trên trình duyệt |
| 3 | `GET` | `/api/auth/me` | Kiểm tra phiên làm việc hiện tại và trả về thông tin cơ bản của người dùng |
| 4 | `GET`, `POST` | `/api/tasks` | Lấy danh sách toàn bộ công việc / Tạo mới một công việc kèm subtasks và priority |
| 5 | `PATCH`, `DELETE` | `/api/tasks/[id]` | Cập nhật trạng thái, tiến độ, thông tin công việc / Xóa công việc theo ID |
| 6 | `GET`, `POST` | `/api/timeline` | Lấy toàn bộ sự kiện trục thời gian / Tạo mới một cột mốc hoặc sự kiện |
| 7 | `PATCH`, `DELETE` | `/api/timeline/[id]` | Cập nhật thông tin hoặc trạng thái sự kiện / Xóa sự kiện theo ID |
| 8 | `GET`, `POST` | `/api/notes` | Lấy danh sách ghi chú cá nhân / Tạo mới ghi chú kèm màu sắc và thẻ gắn |
| 9 | `PATCH`, `DELETE` | `/api/notes/[id]` | Chỉnh sửa nội dung ghi chú, màu nền hoặc ghim / Xóa ghi chú theo ID |
| 10 | `GET`, `POST` | `/api/articles` | Lấy danh sách bài viết nội bộ / Tạo mới bài viết kèm tiêu đề, slug và nội dung |
| 11 | `GET`, `PATCH`, `DELETE` | `/api/articles/[id]` | Lấy chi tiết bài viết / Cập nhật nội dung, trạng thái đọc, cờ công khai / Xóa bài viết |
| 12 | `GET` | `/api/articles/public/[slug]` | Trả về nội dung bài viết công khai theo slug (không yêu cầu xác thực) |
| 13 | `GET`, `POST` | `/api/documents` | Lấy danh sách tài liệu / Lưu trữ tài liệu mới (Base64 hoặc đường dẫn ngoài) |
| 14 | `GET`, `PATCH`, `DELETE` | `/api/documents/[id]` | Lấy chi tiết tài liệu (bao gồm Base64) / Cập nhật thông tin hoặc sao / Xóa tài liệu |
| 15 | `GET`, `POST` | `/api/vault` | Lấy danh sách các mục trong kho bảo mật / Tạo mới mục bảo mật |
| 16 | `PATCH`, `DELETE` | `/api/vault/[id]` | Cập nhật thông tin, đổi mật mã mục bảo mật / Xóa mục bảo mật theo ID |
| 17 | `POST` | `/api/vault/pin` | Xác thực mã PIN mở khóa kho hoặc thiết lập mã PIN mới cho tài khoản |
| 18 | `GET` | `/api/stats` | Tính toán và tổng hợp toàn bộ chỉ số KPI cho màn hình Dashboard |

---

## 6. Hướng dẫn cài đặt & Vận hành (Setup & Commands)

### 6.1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.18.0 trở lên (khuyến nghị phiên bản LTS Node.js 20).
- **Trình quản lý gói**: `npm` (kèm sẵn với Node.js), `yarn`, hoặc `pnpm`.
- **Cơ sở dữ liệu**: Máy chủ PostgreSQL (hoặc tài khoản Neon Serverless PostgreSQL) có kết nối mạng hợp lệ.

### 6.2. Cấu hình biến môi trường (`.env`)
Tạo tập tin `.env` tại thư mục gốc của dự án với nội dung như sau:

```env
# Chuỗi kết nối tới cơ sở dữ liệu PostgreSQL (khuyến nghị Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://<user>:<password>@<neon-host>/LifeOS?sslmode=require"

# Khóa bí mật dùng để ký và xác thực JSON Web Token (JWT)
JWT_SECRET="<your-secure-jwt-secret-key>"
```

> **Ghi chú bảo mật**: Thay thế `<user>`, `<password>`, và `<neon-host>` bằng thông tin xác thực thực tế từ bảng điều khiển Neon của bạn. Không chia sẻ hoặc đẩy tập tin `.env` có chứa mật khẩu lên hệ thống quản lý phiên bản git.

### 6.3. Khởi tạo cơ sở dữ liệu và tài khoản mặc định
Thực thi tập lệnh khởi tạo để tự động tạo các bảng trong cơ sở dữ liệu và thiết lập tài khoản khởi đầu:

```bash
npm run db:init
```

Tập lệnh sẽ thực hiện:
1. Kết nối tới cơ sở dữ liệu được cấu hình trong `DATABASE_URL`.
2. Tạo toàn bộ 7 bảng (`users`, `tasks`, `timeline_events`, `notes`, `articles`, `documents`, `vault_items`) cùng các chỉ mục tương ứng.
3. Băm mật khẩu và mã PIN, sau đó nạp tài khoản quản trị khởi đầu nếu chưa tồn tại.

### 6.4. Khởi động môi trường phát triển
Chạy máy chủ phát triển Next.js tại máy cục bộ:

```bash
npm run dev
```

Sau khi khởi động, mở trình duyệt và truy cập địa chỉ: `http://localhost:3000`. Hệ thống sẽ tự động điều hướng tới trang `/login`.

### 6.5. Kiểm tra và tạo bản dựng sản xuất
Thực hiện kiểm tra quy trình biên dịch và tạo bản dựng tối ưu hóa cho môi trường sản xuất:

```bash
# Tạo bản dựng sản xuất
npm run build

# Khởi chạy máy chủ sản xuất
npm run start
```

### 6.6. Thông tin xác thực quản trị
Sau khi thực thi tập lệnh khởi tạo `npm run db:init`, tài khoản quản trị được lưu trong cơ sở dữ liệu để đăng nhập vào hệ thống:

- **Đường dẫn đăng nhập**: `http://localhost:3000/login`
- **Tên đăng nhập**: `<username>`
- **Mật khẩu đăng nhập**: `<password>`
- **Mã PIN Kho lưu trữ cá nhân (Personal Vault)**: `<vault-pin>`
