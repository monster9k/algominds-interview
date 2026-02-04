# AlgoMinds - Hướng Dẫn Phát Triển Platform Phỏng Vấn LeetCode

## 🎯 Tổng Quan Dự Án

**AlgoMinds** là một platform phỏng vấn coding trực tuyến tương tự LeetCode, cho phép:

- Phỏng vấn viên và ứng viên tương tác real-time
- Giải quyết bài tập algorithms/data structures
- Chat và video call trong quá trình phỏng vấn
- Chấm điểm và đánh giá tự động

## 📁 Phân Tích Cấu Trúc Hiện Tại

### 🏗️ Kiến Trúc Feature-Based

```
src/
├── app/                    # 🚀 Khởi tạo ứng dụng
├── components/             # 🧱 UI Components tái sử dụng
├── features/              # 💼 Logic nghiệp vụ chính
│   ├── auth/              # 🔐 Xác thực người dùng
│   ├── problems/          # 📚 Quản lý bài tập
│   └── interview/         # 🎤 Phòng phỏng vấn
├── lib/                   # ⚙️ Cấu hình hạ tầng
├── hooks/                 # 🪝 Custom React Hooks
├── stores/                # 🗃️ Quản lý state toàn cục
└── types/                 # 📝 Định nghĩa TypeScript
```

## 🛠️ Chi Tiết Công Nghệ Sử Dụng

### **1. 🎯 Core Framework & Build Tools**

#### **React 19.2.0**

```typescript
// Cách sử dụng: Component-based UI development
import { useState, useEffect } from 'react'

function MyComponent() {
  const [state, setState] = useState(0)

  return (
    <div>
      <button onClick={() => setState(prev => prev + 1)}>
        Count: {state}
      </button>
    </div>
  )
}
```

- **Mục đích**: Framework chính để xây dựng UI
- **Ưu điểm**: Component reusable, Virtual DOM, Hook system mạnh mẽ
- **Sử dụng cho**: Tất cả UI components, state management local

#### **Vite 7.2.4**

```javascript
// vite.config.ts - Cấu hình build tool
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Path alias
    },
  },
});
```

- **Mục đích**: Build tool siêu nhanh thay thế Create React App
- **Ưu điểm**: Hot reload tức thì, bundle size nhỏ, ES modules native
- **Sử dụng cho**: Development server, production build, plugin system

#### **TypeScript 5.9.3**

```typescript
// Cách sử dụng: Type-safe development
interface User {
  id: string;
  email: string;
  name: string;
}

// Type-safe function
function getUserById(id: string): Promise<User> {
  return api.get(`/users/${id}`);
}

// Generic types
function createApiHook<T>(endpoint: string) {
  return useQuery<T>(["api", endpoint], () => api.get(endpoint));
}
```

- **Mục đích**: Type safety, IntelliSense, early error detection
- **Ưu điểm**: Catch bugs sớm, auto-completion, refactor an toàn
- **Sử dụng cho**: Toàn bộ codebase, API types, component props

### **2. 🎨 UI & Styling**

#### **Tailwind CSS 4.1.18**

```typescript
// Cách sử dụng: Utility-first CSS
function LoginForm() {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Đăng Nhập
      </h2>
      <input
        className="w-full px-3 py-2 border border-gray-300 rounded-md
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Email"
      />
      <button className="w-full bg-blue-600 text-white py-2 rounded-md
                         hover:bg-blue-700 transition-colors">
        Đăng Nhập
      </button>
    </div>
  )
}
```

- **Mục đích**: Styling nhanh với utility classes
- **Ưu điểm**: No CSS files, responsive design dễ dàng, purge unused CSS
- **Sử dụng cho**: Tất cả styling, responsive layout, dark mode

#### **Clsx + Tailwind-merge**

```typescript
// lib/utils.ts - Merge Tailwind classes intelligently
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cách sử dụng:
function Button({ className, variant = 'primary' }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        className // Override classes if needed
      )}
    >
      Click me
    </button>
  )
}
```

- **Mục đích**: Merge Tailwind classes without conflicts
- **Ưu điểm**: Conditional styling, override classes easily
- **Sử dụng cho**: Component variants, conditional styling

#### **Lucide React 0.562.0**

```typescript
// Cách sử dụng: Icon library
import { Search, User, Settings, ChevronDown } from 'lucide-react'

function TopBar() {
  return (
    <div className="flex items-center space-x-4">
      <Search className="h-5 w-5 text-gray-500" />
      <User className="h-6 w-6 text-blue-600" />
      <Settings className="h-5 w-5 hover:text-gray-700 cursor-pointer" />
    </div>
  )
}
```

- **Mục đích**: Beautiful, customizable icons
- **Ưu điểm**: Tree-shakeable, consistent style, many variants
- **Sử dụng cho**: UI icons, buttons, navigation, status indicators

### **3. 🌐 HTTP & API Management**

#### **Axios 1.13.2**

```typescript
// lib/axios.ts - HTTP client với interceptors
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor - Thêm auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Cách sử dụng trong services:
export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  getProfile: () => api.get("/auth/profile"),
  logout: () => api.post("/auth/logout"),
};
```

- **Mục đích**: HTTP client for API calls
- **Ưu điểm**: Interceptors, auto JSON parsing, request/response transform
- **Sử dụng cho**: All API calls, file uploads, authentication

#### **React Query (@tanstack/react-query) 5.90.16**

```typescript
// Cách sử dụng: Server state management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 1. Fetch data với caching
function useProblems() {
  return useQuery({
    queryKey: ['problems'],
    queryFn: () => api.get('/problems').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// 2. Mutations với optimistic updates
function useCreateProblem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newProblem) => api.post('/problems', newProblem),
    onSuccess: () => {
      queryClient.invalidateQueries(['problems'])
    },
  })
}

// 3. Sử dụng trong component
function ProblemsList() {
  const { data: problems, isLoading, error } = useProblems()
  const createProblem = useCreateProblem()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {problems?.map(problem => (
        <div key={problem.id}>{problem.title}</div>
      ))}
      <button onClick={() => createProblem.mutate({ title: 'New Problem' })}>
        Add Problem
      </button>
    </div>
  )
}
```

- **Mục đích**: Server state management, caching, synchronization
- **Ưu điểm**: Auto caching, background refetch, optimistic updates
- **Sử dụng cho**: API data fetching, caching, mutations

### **4. 🗃️ State Management**

#### **Zustand 5.0.9**

```typescript
// stores/use-auth.ts - Global state management
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('authToken', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('authToken')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

// Cách sử dụng trong component:
function LoginForm() {
  const { login, isAuthenticated } = useAuth()

  const handleLogin = async (credentials) => {
    const { user, token } = await authService.login(credentials)
    login(user, token)
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />
  }

  return <form onSubmit={handleLogin}>...</form>
}
```

- **Mục đích**: Global state management (user auth, UI state)
- **Ưu điểm**: Simple API, TypeScript support, persistence, no providers
- **Sử dụng cho**: User authentication, global UI state, preferences

### **5. 🧭 Routing**

#### **React Router DOM 7.12.0**

```typescript
// app/router.tsx - Route configuration
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      // Protected routes
      {
        path: 'dashboard',
        element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
      },
      {
        path: 'problems',
        children: [
          { index: true, element: <ProblemsListPage /> },
          { path: ':id', element: <ProblemDetailPage /> },
        ],
      },
      {
        path: 'interview/:sessionId',
        element: <InterviewRoomPage />,
      },
    ],
  },
])

// Cách sử dụng navigation:
import { useNavigate, useParams, Link } from 'react-router-dom'

function ProblemCard({ problem }) {
  const navigate = useNavigate()

  return (
    <div onClick={() => navigate(`/problems/${problem.id}`)}>
      <h3>{problem.title}</h3>
      <Link to={`/interview/new?problemId=${problem.id}`}>
        Start Interview
      </Link>
    </div>
  )
}

// Protected routes với authentication
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return children
}
```

- **Mục đích**: Client-side routing, navigation
- **Ưu điểm**: Nested routes, lazy loading, protected routes
- **Sử dụng cho**: Page navigation, route guards, URL parameters

### **6. 🔌 Real-time Communication**

#### **Socket.io Client 4.8.3**

```typescript
// lib/socket.ts - Real-time communication
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function initializeSocket(token: string): Socket {
  socket = io(process.env.VITE_SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  })

  socket.on('connect', () => {
    console.log('Connected to server:', socket.id)
  })

  return socket
}

// Interview room real-time features
export class InterviewSocket {
  constructor(private socket: Socket) {}

  // Join interview room
  joinRoom(sessionId: string) {
    this.socket.emit('interview:join', { sessionId })
  }

  // Real-time code collaboration
  updateCode(code: string) {
    this.socket.emit('code:update', { code })
  }

  onCodeUpdate(callback: (code: string) => void) {
    this.socket.on('code:updated', ({ code }) => callback(code))
  }

  // Real-time chat
  sendMessage(message: string) {
    this.socket.emit('chat:message', { message })
  }

  onMessage(callback: (message) => void) {
    this.socket.on('chat:message', callback)
  }

  // Drawing/whiteboard
  updateDrawing(drawingData: any) {
    this.socket.emit('drawing:update', drawingData)
  }

  onDrawingUpdate(callback: (data) => void) {
    this.socket.on('drawing:updated', callback)
  }
}

// Sử dụng trong Interview Room:
function InterviewRoom() {
  const [code, setCode] = useState('')
  const [messages, setMessages] = useState([])
  const interviewSocket = useRef<InterviewSocket>()

  useEffect(() => {
    const socket = initializeSocket(token)
    interviewSocket.current = new InterviewSocket(socket)

    // Join room
    interviewSocket.current.joinRoom(sessionId)

    // Listen for code updates
    interviewSocket.current.onCodeUpdate((newCode) => {
      setCode(newCode)
    })

    // Listen for chat messages
    interviewSocket.current.onMessage((message) => {
      setMessages(prev => [...prev, message])
    })

    return () => socket.disconnect()
  }, [])

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    interviewSocket.current?.updateCode(newCode)
  }

  return (
    <div className="grid grid-cols-2 h-screen">
      <CodeEditor value={code} onChange={handleCodeChange} />
      <ChatPanel messages={messages} onSend={interviewSocket.current?.sendMessage} />
    </div>
  )
}
```

- **Mục đích**: Real-time features (chat, code collaboration, whiteboard)
- **Ưu điểm**: Bidirectional communication, auto reconnection, room-based
- **Sử dụng cho**: Interview rooms, live coding, chat, notifications

### **7. 🪝 Custom Hooks System**

```typescript
// hooks/use-debounce.ts - Performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Sử dụng cho search
function SearchProblems() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data: problems } = useQuery({
    queryKey: ['problems', debouncedSearch],
    queryFn: () => searchProblems(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  })

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search problems..."
    />
  )
}

// hooks/use-theme.ts - Theme management
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark'
    if (saved) setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return { theme, toggleTheme }
}
```

### **8. 🔧 Development Tools**

#### **ESLint + TypeScript ESLint**

```javascript
// eslint.config.js - Code quality rules
export default [
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
```

- **Mục đích**: Code quality, consistent style, catch errors
- **Sử dụng cho**: Pre-commit hooks, CI/CD, development

## 🎯 Workflow Sử Dụng Các Công Nghệ

## 🚀 Luồng Phát Triển Được Khuyến Nghị

### **BƯỚC 1: Chuẩn Bị Foundation (1-2 ngày)**

```typescript
// 1.1 Hoàn thiện Authentication System
src/features/auth/
├── components/
│   ├── login-form.tsx
│   ├── register-form.tsx
│   └── google-oauth-button.tsx
├── hooks/
│   ├── use-auth.ts
│   └── use-login.ts
├── services/
│   └── auth.service.ts
└── types/
    └── auth.types.ts
```

**Bắt đầu từ file:** `src/features/auth/components/login-form.tsx`

### **BƯỚC 2: Problems Management (2-3 ngày)**

```typescript
// 2.1 Xây dựng thư viện bài tập
src/features/problems/
├── components/
│   ├── problem-list.tsx
│   ├── problem-detail.tsx
│   ├── problem-filters.tsx
│   └── difficulty-badge.tsx
├── hooks/
│   ├── use-problems.ts
│   └── use-problem-detail.ts
├── services/
│   └── problems.service.ts
└── types/
    └── problem.types.ts
```

**Bắt đầu từ file:** `src/features/problems/components/problem-list.tsx`

### **BƯỚC 3: Interview Room (Core Feature - 4-5 ngày)**

```typescript
// 3.1 Phòng phỏng vấn real-time
src/features/interview/
├── components/
│   ├── interview-room.tsx      # 🎯 COMPONENT CHÍNH
│   ├── code-editor.tsx         # Code editor với syntax highlighting
│   ├── video-call.tsx          # Video call integration
│   ├── chat-panel.tsx          # Real-time chat
│   ├── whiteboard.tsx          # Whiteboard for drawing
│   └── timer.tsx               # Interview timer
├── hooks/
│   ├── use-interview-session.ts
│   ├── use-code-collaboration.ts
│   └── use-video-call.ts
├── services/
│   ├── interview.service.ts
│   ├── code-execution.service.ts
│   └── webrtc.service.ts
└── types/
    └── interview.types.ts
```

**Bắt đầu từ file:** `src/features/interview/components/interview-room.tsx`

## 🎯 Luồng Code Chi Tiết

### **A. Entry Point - Điểm Bắt Đầu**

```typescript
// 1. main.tsx -> App.tsx -> router.tsx
// 2. Providers wrap toàn bộ app (Auth, Query, Socket)
// 3. Router điều hướng đến các features

// File: src/main.tsx
import "@/app/index.css";
import { Providers } from "@/app/provider";
import { AppRouter } from "@/app/router";
```

### **B. Authentication Flow**

```typescript
// Luồng đăng nhập:
LoginPage -> LoginForm -> useAuth hook -> auth.service -> API -> Store user state
```

### **C. Interview Room Flow**

```typescript
// Luồng phỏng vấn:
ProblemList -> SelectProblem -> CreateInterview -> InterviewRoom -> Real-time collaboration
```

## 🛠️ Implementation Roadmap

### **Week 1: Authentication & Problems**

- [ ] **Day 1-2**: Login/Register system
- [ ] **Day 3-4**: Problems CRUD operations
- [ ] **Day 5**: User dashboard

### **Week 2: Interview Core**

- [ ] **Day 1-2**: Interview room basic layout
- [ ] **Day 3-4**: Code editor integration (Monaco Editor)
- [ ] **Day 5**: Real-time synchronization (Socket.io)

### **Week 3: Advanced Features**

- [ ] **Day 1-2**: Video call (WebRTC/Agora)
- [ ] **Day 3-4**: Code execution & judging
- [ ] **Day 5**: Whiteboard & drawing

### **Week 4: Polish & Deploy**

- [ ] **Day 1-2**: UI/UX improvements
- [ ] **Day 3-4**: Performance optimization
- [ ] **Day 5**: Testing & deployment

## 📋 Checklist Chuẩn Bị

### **Backend Requirements**

- [ ] User authentication API
- [ ] Problems database
- [ ] Interview sessions management
- [ ] Code execution service (Judge0/Piston API)
- [ ] WebSocket for real-time features

### **Frontend Dependencies Cần Thêm**

```bash
# Code Editor
npm install @monaco-editor/react

# Video Call
npm install agora-rtc-sdk-ng
# hoặc
npm install @daily-co/daily-js

# Drawing/Whiteboard
npm install fabric

# Markdown rendering
npm install react-markdown

# Syntax highlighting
npm install prismjs
```

### **Environment Variables Cần Thiết**

```env
# API
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000

# Third-party services
VITE_AGORA_APP_ID=your_agora_app_id
VITE_JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## 🎨 UI/UX Strategy

### **Design System**

- **Colors**: Professional coding theme (dark/light mode)
- **Typography**: Monospace fonts for code, Sans-serif for UI
- **Components**: Consistent button styles, form inputs, modals

### **Layout Strategy**

```typescript
// Interview Room Layout:
┌─────────────────────────────────────────────────────────┐
│ Header (Timer, Interview Info)                          │
├─────────────────┬─────────────────┬─────────────────────┤
│ Problem Panel   │ Code Editor     │ Video Call          │
│ (scrollable)    │ (Monaco)        │ (WebRTC)            │
│                 │                 │                     │
├─────────────────┴─────────────────┤ Chat Panel          │
│ Terminal/Output                   │ (real-time)         │
│ (test results)                    │                     │
└───────────────────────────────────┴─────────────────────┘
```

## 🔄 Data Flow Architecture

### **1. State Management Strategy**

```typescript
// Global State (Zustand)
- User authentication state
- Interview session state
- UI preferences (theme, layout)

// Local State (React useState/useReducer)
- Form inputs
- Component-specific UI state
- Temporary data

// Server State (React Query)
- API data caching
- Background synchronization
- Optimistic updates
```

### **2. Real-time Communication**

```typescript
// Socket.io Events:
- 'interview:join' - Join interview room
- 'code:update' - Real-time code changes
- 'chat:message' - Chat messages
- 'drawing:update' - Whiteboard changes
- 'video:toggle' - Video call controls
```

## 🚦 Development Priority Order

### **🔴 High Priority (MVP)**

1. User login/register
2. Problem list/detail
3. Basic interview room
4. Code editor
5. Real-time code sync

### **🟡 Medium Priority**

1. Video call integration
2. Chat system
3. Code execution/testing
4. Interview timer
5. Basic whiteboard

### **🟢 Nice to Have**

1. Advanced whiteboard tools
2. Screen sharing
3. Interview recordings
4. Analytics dashboard
5. Mobile responsive

## 🎯 Bắt Đầu Coding Ngay Bây Giờ!

### **File Đầu Tiên Nên Code:**

```typescript
// src/features/auth/components/login-form.tsx
// Đây là entry point cho user interaction đầu tiên
```

### **Thứ Tự Recommendation:**

1. `src/features/auth/` - Authentication system
2. `src/features/problems/` - Problems management
3. `src/features/interview/` - Core interview features
4. `src/components/ui/` - Shared UI components
5. `src/lib/` - Infrastructure improvements

### **Template Code Bắt Đầu:**

```typescript
// src/features/auth/components/login-form.tsx
export function LoginForm() {
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Đăng Nhập AlgoMinds</h2>
      {/* Form implementation here */}
    </div>
  )
}
```

## 🎯 Workflow Sử Dụng Các Công Nghệ

### **📋 Luồng Development Thực Tế**

```typescript
// 1. Tạo component với TypeScript
interface LoginFormProps {
  onSuccess?: () => void
}

// 2. Sử dụng Tailwind cho styling
function LoginForm({ onSuccess }: LoginFormProps) {
  // 3. Local state với React hooks
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 4. Global state với Zustand
  const { login } = useAuth()

  // 5. API calls với React Query
  const loginMutation = useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: ({ user, token }) => {
      login(user, token)
      onSuccess?.()
    },
  })

  // 6. Form handling
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ email, password })
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
        />
        <Button
          type="submit"
          disabled={loginMutation.isLoading}
          className="w-full mt-4"
        >
          {loginMutation.isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  )
}
```

### **🚀 Quy Trình Coding Thực Tế**

#### **Bước 1: Setup Component Structure**

```bash
# Tạo file component mới
src/features/auth/components/login-form.tsx
```

#### **Bước 2: Define Types**

```typescript
// src/features/auth/types/auth.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: "interviewer" | "candidate";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
```

#### **Bước 3: Create API Service**

```typescript
// src/features/auth/services/auth.service.ts
import { api } from "@/lib/axios";
import type { LoginCredentials, AuthResponse } from "../types/auth.types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};
```

#### **Bước 4: Create React Query Hook**

```typescript
// src/features/auth/hooks/use-auth.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/stores/use-auth";

export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: ({ user, token }) => {
      login(user, token);
    },
  });
}

export function useProfile() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["auth", "profile"],
    queryFn: authService.getProfile,
    enabled: !!token,
  });
}
```

#### **Bước 5: Create Zustand Store**

```typescript
// src/stores/use-auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/features/auth/types/auth.types";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem("authToken", token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("authToken");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: "auth-storage" },
  ),
);
```

### **🔧 Best Practices Cho Từng Công Nghệ**

#### **React Components**

```typescript
// ✅ GOOD: Proper component structure
interface Props {
  title: string
  onSubmit: (data: FormData) => void
}

export function MyForm({ title, onSubmit }: Props) {
  // Logic here
  return <form>...</form>
}

// ❌ BAD: No types, unclear structure
export function MyForm(props) {
  return <form>...</form>
}
```

#### **Tailwind CSS**

```typescript
// ✅ GOOD: Responsive, semantic classes
<div className="
  max-w-4xl mx-auto p-6
  bg-white dark:bg-gray-800
  rounded-lg shadow-lg
  md:p-8 lg:p-10
">

// ❌ BAD: Magic numbers, not responsive
<div className="w-800px h-600px bg-blue-500">
```

#### **React Query**

```typescript
// ✅ GOOD: Proper error handling, loading states
function ProblemsList() {
  const { data, isLoading, error } = useProblems()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return <div>{data?.map(...)}</div>
}

// ❌ BAD: No error handling
function ProblemsList() {
  const { data } = useProblems()
  return <div>{data.map(...)}</div> // Can crash if data is undefined
}
```

#### **Socket.io**

```typescript
// ✅ GOOD: Cleanup listeners, error handling
useEffect(() => {
  const socket = initializeSocket(token);

  const handleCodeUpdate = (code: string) => setCode(code);
  const handleError = (error: any) => console.error("Socket error:", error);

  socket.on("code:updated", handleCodeUpdate);
  socket.on("error", handleError);

  return () => {
    socket.off("code:updated", handleCodeUpdate);
    socket.off("error", handleError);
    socket.disconnect();
  };
}, [token]);

// ❌ BAD: Memory leaks, no cleanup
useEffect(() => {
  const socket = initializeSocket(token);
  socket.on("code:updated", (code) => setCode(code));
  // No cleanup!
}, []);
```

## 💡 Tips & Tricks Cho AlgoMinds

### **Performance Optimization**

```typescript
// 1. Code splitting với React.lazy
const InterviewRoom = lazy(
  () => import("@/features/interview/pages/interview-room"),
);

// 2. Memoize expensive computations
const sortedProblems = useMemo(
  () => problems?.sort((a, b) => a.difficulty - b.difficulty),
  [problems],
);

// 3. Debounce search inputs
const debouncedSearch = useDebounce(searchTerm, 300);
```

### **Error Boundaries**

```typescript
// components/common/error-boundary.tsx
class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

### **Code Organization**

```typescript
// Barrel exports cho clean imports
// features/auth/index.ts
export { LoginForm } from "./components/login-form";
export { useLogin } from "./hooks/use-auth";
export { authService } from "./services/auth.service";
export type { User, LoginCredentials } from "./types/auth.types";

// Sử dụng:
import { LoginForm, useLogin, type User } from "@/features/auth";
```

## 🎯 Action Items Để Bắt Đầu

### **Week 1: Foundation**

1. **Setup Authentication**
   - Tạo `LoginForm` component với Tailwind styling
   - Setup Zustand store cho user state
   - Implement login/logout với React Query
   - Add protected routes với React Router

2. **Create UI Components**
   - Button, Input, Modal components với Tailwind
   - Loading states và error handling
   - Responsive layout với Tailwind grid

### **Week 2: Core Features**

1. **Problems Management**
   - Problems list với search & filter
   - Problem detail view
   - Difficulty badges và tags

2. **Basic Interview Room**
   - Room creation và joining
   - Basic layout với Tailwind grid
   - Socket.io connection setup

### **Week 3: Advanced Features**

1. **Real-time Collaboration**
   - Code editor integration (Monaco Editor)
   - Real-time code synchronization
   - Chat system

2. **Video Integration**
   - WebRTC setup hoặc Agora integration
   - Camera/microphone controls

### **Week 4: Polish & Deploy**

1. **Performance & UX**
   - Code splitting và lazy loading
   - Error boundaries và fallbacks
   - Responsive design polish

2. **Testing & Deployment**
   - Unit tests cho key components
   - E2E tests cho core flows
   - Production deployment

## 📚 Resources Học Thêm

- **React**: [React Docs](https://react.dev)
- **Tailwind CSS**: [Tailwind Docs](https://tailwindcss.com)
- **React Query**: [TanStack Query](https://tanstack.com/query)
- **Zustand**: [Zustand Docs](https://zustand-demo.pmnd.rs)
- **Socket.io**: [Socket.io Docs](https://socket.io/docs)

**🚀 Giờ bạn đã có đầy đủ kiến thức để bắt đầu phát triển AlgoMinds!**
