# 🚀 ALGOMINDS DEVELOPMENT ROADMAP

**Role:** Full-stack Developer (Portfolio Project)  
**Architecture:** Modular Monolith | **Stack:** NestJS, React, PostgreSQL, AI (GPT-4o)

---

## 🟢 PHASE 1: SYSTEM DESIGN & INFRASTRUCTURE (NỀN MÓNG)

_Trạng thái: Đang thực hiện_

- [x] **1.1. Phân tích yêu cầu (Requirement Analysis)**
  - [x] Chốt luồng "Think-First" (Phase 1 Strategy -> Phase 2 Implementation).
  - [x] Chốt Tech Stack (NestJS, React Vite, Prisma, Socket.io, Docker).
- [x] **1.2. Thiết kế Database (Conceptual Design)**
  - [x] Phân tích thực thể (User, Session, Problem, Message, Submission).
  - [x] Hoàn thiện ERD trên Dbdiagram (Final Production Schema).
  - [x] Chốt logic Auth, Nullable, Indexing và Audit Log.
- [x] **1.3. Khởi tạo môi trường (Implementation)**
  - [x] Tạo cấu trúc thư mục Monorepo (`client`, `server`).
  - [x] Viết file `docker-compose.yml` (PostgreSQL + Redis).
  - [x] Chạy Docker container (`docker-compose up`).
- [x] **1.4. Setup Database Code (Prisma)**
  - [x] Khởi tạo NestJS project (`nest new server`).
  - [x] Cài đặt Prisma & Kết nối Database (`.env`).
  - [x] **Quan trọng:** Copy Schema đã thiết kế vào `schema.prisma`.
  - [x] Chạy migration (`npx prisma db push`).

---

## 🟡 PHASE 2: BACKEND CORE - NESTJS (API LAYER)

_Mục tiêu: Xây dựng API khung sườn, Auth và Dữ liệu tĩnh._

- [ ] **2.1. Project Scaffolding**
  - [ ] Setup ConfigModule (Quản lý biến môi trường).
  - [ ] Setup Global Validation Pipe & Error Filter.
- [ ] **2.2. Authentication Module**
  - [ ] API Register/Login (Email & Password).
  - [ ] Setup JWT Guard (Bảo vệ API).
  - [ ] _(Optional)_ Setup Google OAuth.
- [ ] **2.3. User & Problem Modules**
  - [ ] API User Profile (Get/Update).
  - [ ] API CRUD Problem (Tạo bài tập, Test cases).
  - [ ] Seed dữ liệu mẫu (Tạo sẵn 1-2 bài thuật toán).

---

## 🟠 PHASE 3: THE "THINK-FIRST" ENGINE (LOGIC LÕI)

_Mục tiêu: Xử lý logic phỏng vấn, State Machine và Real-time._

- [ ] **3.1. Session Module**
  - [ ] API Start Session (Tạo phiên mới).
  - [ ] Logic Optimistic Locking (Xử lý `version` để tránh ghi đè).
  - [ ] API chuyển đổi trạng thái (Phase 1 -> Phase 2).
- [ ] **3.2. Real-time Gateway (Socket.io)**
  - [ ] Setup WebSocket Gateway.
  - [ ] Xử lý Join Room (Mỗi session 1 room).
  - [ ] Chat realtime (Gửi/Nhận tin nhắn).
- [ ] **3.3. AI Integration (GPT-4o)**
  - [ ] Setup Service gọi OpenAI API.
  - [ ] Viết Prompt Engineering cho vai trò "Interviewer khó tính".
  - [ ] Setup Queue (BullMQ) để xử lý request AI bất đồng bộ.
- [ ] **3.4. Code Execution (Chấm bài)**
  - [ ] API Submit Code.
  - [ ] Logic so sánh Output với Test Case (Hidden/Public).
  - [ ] Lưu kết quả Submission & Evaluation.

---

## 🔵 PHASE 4: FRONTEND CORE - REACT (CLIENT FOUNDATION)

_Mục tiêu: Dựng giao diện cơ bản._

- [ ] **4.1. Setup Client**
  - [ ] Init React Vite + TypeScript.
  - [ ] Cài đặt Tailwind CSS + Shadcn/UI.
  - [ ] Setup React Router & Axios.
- [ ] **4.2. Global State (Zustand)**
  - [ ] Auth Store (Lưu user login).
  - [ ] UI Store (Theme, Sidebar).
- [ ] **4.3. Basic UI**
  - [ ] Trang Login / Register.
  - [ ] Trang Dashboard (Danh sách bài tập).
  - [ ] Trang Landing Page.

---

## 🟣 PHASE 5: THE INTERVIEW ROOM (ADVANCED UI)

_Mục tiêu: Giao diện phỏng vấn chính (Split View)._

- [ ] **5.1. Chat UI (Phase 1)**
  - [ ] Giao diện Chat stream text (giống ChatGPT).
  - [ ] Hiển thị Markdown code block đẹp.
- [ ] **5.2. Editor UI (Phase 2)**
  - [ ] Tích hợp Monaco Editor.
  - [ ] Logic khóa/mở Editor theo trạng thái Session.
- [ ] **5.3. Kết nối Real-time**
  - [ ] Tích hợp Socket.io Client.
  - [ ] Xử lý sự kiện nhận tin nhắn, đổi Phase.

---

## ⚪ PHASE 6: POLISH & DEPLOY (HOÀN THIỆN)

- [ ] **6.1. Analytics UI:** Trang xem kết quả chi tiết.
- [ ] **6.2. Optimization:** Debounce save code, Caching.
- [ ] **6.3. Documentation:** Quay video demo, Viết README.
