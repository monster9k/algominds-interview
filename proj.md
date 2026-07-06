# AlgoMinds — Architectural Audit & Prioritized Roadmap

**Date:** 2026-07-06  
**Auditor role:** Senior Software Architect  
**Scope:** Full-stack analysis — NestJS backend, React/Vite frontend, PostgreSQL + Redis, BullMQ, Socket.io, Piston code judge, Gemini AI

---

## 1. Overall Architecture

AlgoMinds is a **modular monolith** implementing a "Think-First" interview platform. The architecture follows a clean vertical-slice approach on both ends.

```
Browser (React 19 + Vite)
    │  REST (Axios)         WebSocket (Socket.io)
    ▼                              ▼
NestJS 11  ──  BullMQ (Redis)  ──  AI Processor (Gemini)
    │
Prisma 7 (pg adapter)
    │
PostgreSQL 16
    │
Piston (code execution sandbox, external process)
```

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `auth` | Register/Login (email + Google OAuth), JWT access+refresh token lifecycle, bcrypt hashing |
| `users` | Profile CRUD, `UserStats` (credits, streak, solved) |
| `problems` | Problem CRUD, tag management, per-user status enrichment |
| `sessions` | Session lifecycle (Phase1 → Phase2 → Completed), optimistic locking |
| `chat` | WebSocket gateway, message persistence, queue dispatch |
| `ai` | Gemini calls (strategy evaluation, code evaluation), BullMQ job processor |
| `judge` | Code submission, Piston execution, test-case comparison, performance stats |
| `queue` | Global BullMQ/Redis configuration |

### Frontend Feature Modules

| Feature | Responsibility |
|---|---|
| `auth` | Login/Register/Google OAuth pages, token store, protected route |
| `problems` | Problem list, filters (UI-only), table with status enrichment |
| `interview` | Full interview room — Monaco editor, AI chat, submission, evaluation |

### Data Flow

1. User authenticates → `accessToken` (15 min, memory-only Zustand) + `refreshToken` (7d, httpOnly cookie).  
2. `/problems` fetched with optional JWT for status enrichment.  
3. User selects problem → `POST /sessions/start/:slug` → returns or creates active session.  
4. Socket `join_room(sessionId)` → user joins their room.  
5. Phase 1: User sends strategy via AI chat → socket event → `chat-job` queued → Gemini evaluates → if `APPROVED`, session upgraded to Phase 2 → `session_status_update` emitted.  
6. Phase 2: User writes code in Monaco → `POST /judge/submit` → Piston executes per test case → if `ACCEPTED`, `submission.accepted` event fired → `evaluate-code` job queued → Gemini scores code → `code_evaluation_complete` emitted.  
7. Frontend receives socket events and updates UI reactively.

---

## 2. Prioritized Issue Roadmap

---

## 🔴 CRITICAL

---

### C-1 — Unauthenticated Problem Creation Endpoint

**Why it is a problem**  
`POST /problems` has no `@UseGuards` decorator. Any anonymous user (or attacker) can create arbitrary problems, inject malicious HTML content into the `content` field, and pollute the database. This is a direct path to stored XSS (see C-2) combined with no authentication.

**Impact**  
Data integrity destroyed; content injection vector; free abuse of compute resources.

**Estimated difficulty:** Low (one line to add `@UseGuards(JwtAuthGuard)` + `@Roles('ADMIN')`)

**Files involved**  
- [server/src/modules/problems/problems.controller.ts](server/src/modules/problems/problems.controller.ts)

**Suggested solution**  
Add `@UseGuards(JwtAuthGuard)` and an `AdminGuard` (role check) to `POST /problems`. The `UserRole.ADMIN` enum already exists in the schema but is never enforced anywhere in the codebase.

---

### C-2 — Stored XSS via `dangerouslySetInnerHTML` Without Sanitization

**Why it is a problem**  
`problem.content` is stored as raw HTML in the database and rendered with `dangerouslySetInnerHTML={{ __html: problem.content }}` without any sanitization. If any HTML containing `<script>` or event handler attributes enters the DB (trivially possible via C-1), every user who views that problem executes arbitrary JavaScript.

**Impact**  
Full session hijacking; token theft; credential phishing; account takeover.

**Estimated difficulty:** Low (add a DOMPurify `sanitize()` call at render time)

**Files involved**  
- [client/src/features/interview/components/problem-panel/description-tab.tsx](client/src/features/interview/components/problem-panel/description-tab.tsx#L42)

**Suggested solution**  
Install `dompurify` + `@types/dompurify`. Wrap the value: `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(problem.content) }}`. Optionally sanitize on write in the backend DTO as a second layer.

---

### C-3 — Access Token Leaked in Google OAuth Redirect URL

**Why it is a problem**  
After Google OAuth, the backend redirects to:  
`FRONTEND_URL/auth/google-callback?accessToken=<JWT>&user=<JSON>`  
Tokens in URLs are stored in browser history, can appear in server access logs, Referer headers, and analytics scripts. This is explicitly called out in OAuth 2.0 security best practices (RFC 6819).

**Impact**  
Access token theft via browser history, referrer leakage, or log scraping.

**Estimated difficulty:** Medium (requires changing the OAuth handoff mechanism)

**Files involved**  
- [server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts) (Google callback handler)
- [client/src/features/auth/pages/google-callback-page.tsx](client/src/features/auth/pages/google-callback-page.tsx)

**Suggested solution**  
On the server, after Google login, set the `accessToken` in a **short-lived** (30s) `httpOnly` session cookie or a same-site POST form. On the frontend, exchange that cookie for the actual token via a `GET /auth/session` endpoint, then clear the cookie. Alternatively, use a one-time opaque code and exchange it client-side.

---

### C-4 — WebSocket Gateway Has No Authentication

**Why it is a problem**  
`ChatGateway` is decorated with `@WebSocketGateway({ cors: { origin: '*' } })`. There is no token validation on `handleConnection`. Any unauthenticated client can connect, join any `sessionId` room, and send messages that get persisted to the DB and routed to AI.

**Impact**  
Unauthorized access to any session; free AI credit abuse; message injection.

**Estimated difficulty:** Medium

**Files involved**  
- [server/src/modules/chat/chat/chat.gateway.ts](server/src/modules/chat/chat/chat.gateway.ts)

**Suggested solution**  
Implement a `WsJwtGuard` that reads the JWT from `socket.handshake.auth.token` in `handleConnection`. On the client, pass the token: `initializeSocket(accessToken)` — the socket.ts file already passes `auth: { token }` on init, so the transport is ready.

---

## 🟠 HIGH

---

### H-1 — Zero Test Coverage

**Why it is a problem**  
There is not a single `.spec.ts` or `.test.ts` file in the codebase (only the NestJS e2e stub at `test/app.e2e-spec.ts`). The `judge.service.ts` alone contains 300+ lines of complex logic (code execution, output normalization, percentile computation) with zero tests.

**Impact**  
Any refactor is high-risk; regressions are undetectable; CI/CD has no safety net.

**Estimated difficulty:** High (requires sustained effort across the full codebase)

**Files involved**  
- All `*.service.ts` files  
- [server/src/modules/judge/judge.service.ts](server/src/modules/judge/judge.service.ts)  
- [server/src/modules/ai/ai.processor.ts](server/src/modules/ai/ai.processor.ts)  
- [server/src/modules/auth/auth.service.ts](server/src/modules/auth/auth.service.ts)

**Suggested solution**  
Prioritize unit tests for: `auth.service.ts` (token rotation logic), `judge.service.ts` (output normalization, test-case comparison), `ai.processor.ts` (phase transition logic). Use Jest + `@nestjs/testing`. On the frontend, add Vitest + React Testing Library for `use-auth.ts` hooks and `ProtectedRoute`.

---

### H-2 — No RBAC Enforcement Despite Schema Having `UserRole.ADMIN`

**Why it is a problem**  
The database schema defines `UserRole { USER, ADMIN }` and the `User` model has a `role` field. The JWT payload includes `role`. However, no `RolesGuard` or `@Roles()` decorator exists anywhere in the codebase. Admin actions (problem creation, seeding) are either unguarded (C-1) or rely on direct DB access.

**Impact**  
No privilege separation. Any registered user has equivalent capability to an admin user.

**Estimated difficulty:** Medium

**Files involved**  
- [server/src/modules/problems/problems.controller.ts](server/src/modules/problems/problems.controller.ts)  
- [server/src/modules/auth/jwt-auth.guard.ts](server/src/modules/auth/jwt-auth.guard.ts)

**Suggested solution**  
Implement a `RolesGuard` that reads `request.user.role` and a `@Roles('ADMIN')` decorator. Apply to `POST /problems` at minimum. The JWT payload already includes `role` from `jwt.strategy.ts`.

---

### H-3 — `useSession` Hook Calls a State-Mutating POST Inside `useQuery`

**Why it is a problem**  
`use-session.ts` wraps `sessionApi.startSession()` (which calls `POST /sessions/start/:slug`) inside `useQuery`. React Query treats queries as idempotent reads and may re-run them on refocus, network reconnect, or stale-time expiry. Each re-run creates a new session or touches the DB unnecessarily. This blurs the command/query boundary and makes behavior unpredictable.

**Impact**  
Unexpected session creation; wasted DB writes; React Query cache invalidation confusion; potential duplicate session rows.

**Estimated difficulty:** Low

**Files involved**  
- [client/src/features/interview/hooks/use-session.ts](client/src/features/interview/hooks/use-session.ts)  
- [client/src/features/interview/pages/interview-room.tsx](client/src/features/interview/pages/interview-room.tsx)

**Suggested solution**  
Replace `useQuery` with `useMutation` for the initial session start. Use a separate `useQuery` (`GET /sessions/:id`) to re-fetch session state. Store the `sessionId` in component state after the initial mutation resolves. `staleTime: 0` is a workaround that should be removed.

---

### H-4 — Circular Module Dependency Between `AiModule` and `ChatModule`

**Why it is a problem**  
`AiModule` uses `forwardRef(() => ChatModule)` and `ChatModule` uses `forwardRef(() => AiModule)`. Circular dependencies mask hidden architectural coupling, make module loading order non-deterministic, and cause subtle initialization bugs in NestJS (especially with lazy loading or testing).

**Impact**  
Brittle module initialization; difficult to test in isolation; future refactors likely to break.

**Estimated difficulty:** Medium

**Files involved**  
- [server/src/modules/ai/ai.module.ts](server/src/modules/ai/ai.module.ts)  
- [server/src/modules/chat/chat.module.ts](server/src/modules/chat/chat.module.ts)

**Suggested solution**  
Extract the WebSocket emission responsibility into a shared `NotificationModule` (or `RealtimeModule`) that exports a `NotificationService`. Both `AiModule` and `ChatModule` import `NotificationModule`. This breaks the cycle cleanly.

---

### H-5 — Piston Code Judge Not in docker-compose; URL Hardcoded

**Why it is a problem**  
`piston.service.ts` calls `http://localhost:2000/api/v2/execute`. This URL is hardcoded (not read from `ConfigService`) and Piston is not defined in `docker-compose.yml`. The entire code execution feature silently fails in any environment that hasn't manually set up a Piston instance on port 2000.

**Impact**  
Code execution feature is broken for any new developer; production deployment will fail silently.

**Estimated difficulty:** Medium

**Files involved**  
- [server/src/modules/judge/services/piston.service.ts](server/src/modules/judge/services/piston.service.ts#L14)  
- [docker-compose.yml](docker-compose.yml)

**Suggested solution**  
1. Add Piston to `docker-compose.yml` as a service (`ghcr.io/engineer-man/piston`).  
2. Move the URL to an environment variable `PISTON_API_URL` and read it via `ConfigService`.

---

### H-6 — Dual Redundant Update Path for AI Evaluation (Polling + WebSocket)

**Why it is a problem**  
`useSessionEvaluation` polls the server every 3 seconds via `refetchInterval` when `shouldPollEvaluation === true`. Simultaneously, `useInterviewSocket` listens for `code_evaluation_complete` which delivers the same data via WebSocket. The server is queried on a timer even though a push notification already exists.

**Impact**  
Unnecessary server load; doubled DB reads for evaluation; race conditions between the poll response and the socket event updating the same state.

**Estimated difficulty:** Low

**Files involved**  
- [client/src/features/interview/hooks/use-evaluation.ts](client/src/features/interview/hooks/use-evaluation.ts)  
- [client/src/features/interview/pages/interview-room.tsx](client/src/features/interview/pages/interview-room.tsx)

**Suggested solution**  
Remove `refetchInterval` entirely. On `code_evaluation_complete` socket event, call `queryClient.invalidateQueries(['session-evaluation', sessionId])` to trigger a single targeted re-fetch.

---

### H-7 — Auth State Lost on Page Refresh (No Persistence)

**Why it is a problem**  
`useAuthStore` (Zustand) holds `user` and `accessToken` in memory only — no `persist` middleware. On any page refresh, the store resets to `null`. The `ProtectedRoute` immediately redirects the user to `/auth/login`. Although a `refreshToken` httpOnly cookie exists, there is no "rehydration" call on app startup that uses it to restore the session.

**Impact**  
Poor UX: users are logged out on every refresh. Any deep link to `/interview/:slug` becomes inaccessible.

**Estimated difficulty:** Medium

**Files involved**  
- [client/src/stores/use-auth-store.ts](client/src/stores/use-auth-store.ts)  
- [client/src/app/provider.tsx](client/src/app/provider.tsx)  
- [client/src/features/auth/components/protected-route.tsx](client/src/features/auth/components/protected-route.tsx)

**Suggested solution**  
Add an `isLoading` state to the auth store. On app mount (in `Providers` or a top-level `useEffect`), call `GET /auth/profile` (which uses the httpOnly cookie via the axios `withCredentials` interceptor). If it succeeds, hydrate the store. `ProtectedRoute` should show a loading spinner until `isLoading` is false.

---

## 🟡 MEDIUM

---

### M-1 — `interview-room.tsx` Has Too Many Responsibilities (God Component)

**Why it is a problem**  
`interview-room.tsx` manages: session fetching, submission state, evaluation polling, WebSocket lifecycle, phase state, code state, panel tab state, UI layout orchestration — all in one component. This violates the Single Responsibility Principle and makes the file extremely hard to maintain.

**Impact**  
Every change to any concern requires touching this file; high merge conflict risk; bugs in one concern affect others.

**Estimated difficulty:** Medium

**Files involved**  
- [client/src/features/interview/pages/interview-room.tsx](client/src/features/interview/pages/interview-room.tsx)

**Suggested solution**  
Extract a custom `useInterviewRoom(slug)` hook that encapsulates all state and side effects. The component becomes a thin layout coordinator consuming this hook. Further split into sub-hooks: `useSessionState`, `useSubmissions`, `useEvaluation`.

---

### M-2 — `judge.service.ts` Violates Single Responsibility

**Why it is a problem**  
`judge.service.ts` handles: submission orchestration, test-case execution delegation, `UserStats` upsert, performance percentile computation, and result formatting — all mixed in one service.

**Impact**  
Changes to the statistics algorithm risk breaking submission logic; hard to unit test individual concerns.

**Estimated difficulty:** Medium

**Files involved**  
- [server/src/modules/judge/judge.service.ts](server/src/modules/judge/judge.service.ts)

**Suggested solution**  
Extract a `StatsService` for `attachPerformanceStats`/`buildDistribution`/`computeBeat` and a `EvaluationService` for evaluation retrieval. `JudgeService` focuses solely on submission execution.

---

### M-3 — Duplicate Type Definitions Across Feature Modules

**Why it is a problem**  
`Difficulty` is defined in both `problems/types/index.ts` and `interview/types/index.ts`. `Evaluation`/`EvaluationScores` are defined in both `interview/types/index.ts` and `interview/components/problem-panel/types.ts`. Out-of-sync type evolution will cause subtle runtime mismatches.

**Impact**  
Type divergence; confusing imports; refactors must be done in multiple places.

**Estimated difficulty:** Low

**Files involved**  
- [client/src/features/problems/types/index.ts](client/src/features/problems/types/index.ts)  
- [client/src/features/interview/types/index.ts](client/src/features/interview/types/index.ts)  
- [client/src/features/interview/components/problem-panel/types.ts](client/src/features/interview/components/problem-panel/types.ts)

**Suggested solution**  
Create a `client/src/types/domain.ts` (or `client/src/types/models.ts`) for all shared domain types (`Difficulty`, `Evaluation`, `SessionPhase`). Import from the shared location in each feature.

---

### M-4 — `socketEvents` Constants Don't Match Actual Socket Event Names

**Why it is a problem**  
`lib/socket.ts` defines `socketEvents` with names like `INTERVIEW_JOIN`, `INTERVIEW_CODE_UPDATE`, `CHAT_MESSAGE`. None of these match the actual event names used:  
- Gateway uses: `join_room`, `send_message`, `receive_message`  
- Processor emits: `session_status_update`, `code_evaluation_complete`  
- Frontend listens for: `receive_message`, `session_status_update`, `code_evaluation_complete`  

The `socketEvents` object is entirely unused.

**Impact**  
Dead code creates confusion; any developer reading `socketEvents` will have a false mental model of the socket protocol.

**Estimated difficulty:** Low

**Files involved**  
- [client/src/lib/socket.ts](client/src/lib/socket.ts)  
- [client/src/features/interview/components/console-panel/ai-chat-tab.tsx](client/src/features/interview/components/console-panel/ai-chat-tab.tsx)  
- [client/src/features/interview/hooks/use-interview-socket.ts](client/src/features/interview/hooks/use-interview-socket.ts)

**Suggested solution**  
Replace the `socketEvents` object with the actual event names: `join_room`, `send_message`, `receive_message`, `session_status_update`, `code_evaluation_complete`. Use these constants throughout instead of string literals.

---

### M-5 — `ProblemFilters` Component Has No Wired State

**Why it is a problem**  
The `ProblemFilters` component renders topic pills, search input, difficulty/status selects — but none of the interactions have state or filter the `useProblems()` query. Clicking anything does nothing.

**Impact**  
Dead UI that misleads users; filtering is a core feature for a problem list.

**Estimated difficulty:** Medium

**Files involved**  
- [client/src/features/problems/components/problem-filters.tsx](client/src/features/problems/components/problem-filters.tsx)  
- [client/src/features/problems/pages/problems-page.tsx](client/src/features/problems/pages/problems-page.tsx)  
- [client/src/features/problems/hooks/use-problems.ts](client/src/features/problems/hooks/use-problems.ts)

**Suggested solution**  
Add `difficulty`, `status`, `search` state (or URL search params via `useSearchParams`). Pass filters to `useProblems(filters)`. The backend `GET /problems` needs corresponding query param support.

---

### M-6 — `attachPerformanceStats` Does a Full Table Scan for Each Request

**Why it is a problem**  
In `judge.service.ts`, `attachPerformanceStats` loads all `ACCEPTED` submissions for a session's problem from the DB to compute runtime percentile distribution. Every time any user views their submissions, this reads an unbounded number of rows.

**Impact**  
Query time grows linearly with the number of total accepted submissions for a problem; becomes a bottleneck at scale.

**Estimated difficulty:** Medium

**Files involved**  
- [server/src/modules/judge/judge.service.ts](server/src/modules/judge/judge.service.ts)

**Suggested solution**  
Pre-compute and cache the distribution (e.g., store bucket percentiles in `Problem.submitCount`/`passCount` or a separate `ProblemStats` table). Alternatively, cache with Redis TTL (e.g., 5 minutes). At minimum, add `take: 1000` to cap the query.

---

### M-7 — WebSocket CORS `origin: '*'` in Gateway

**Why it is a problem**  
`@WebSocketGateway({ cors: { origin: '*' } })` allows any origin to establish a WebSocket connection. Even though C-4 (no WS auth) is the root cause, this doubles the attack surface.

**Impact**  
Cross-site WebSocket hijacking; any webpage can initiate a connection from a victim's browser.

**Estimated difficulty:** Low

**Files involved**  
- [server/src/modules/chat/chat/chat.gateway.ts](server/src/modules/chat/chat/chat.gateway.ts)

**Suggested solution**  
Set `origin` to `configService.get('FRONTEND_URL')` matching the HTTP CORS config in `main.ts`.

---

### M-8 — `ThrottlerGuard` Global Config Too Aggressive (10 req / 60s)

**Why it is a problem**  
The global `ThrottlerModule` allows only 10 requests per 60 seconds per IP. This applies to ALL endpoints including `GET /problems` (list page), `GET /sessions/:id`, and auth endpoints. Normal browsing (list → open problem → open submissions) can hit this limit quickly.

**Impact**  
Legitimate users get throttled; bad UX; the rate limit does not distinguish endpoint sensitivity.

**Estimated difficulty:** Low

**Files involved**  
- [server/src/app.module.ts](server/src/app.module.ts#L34)

**Suggested solution**  
Remove the global throttle. Apply `@Throttle()` selectively with tighter limits on sensitive endpoints: `POST /auth/login` (5/min), `POST /judge/submit` (already has `@Throttle({ default: { ttl: 5000, limit: 1 } })`). Read-only endpoints should not be throttled globally.

---

### M-9 — Hardcoded Mock Data and Debug Artifacts in Production Code

**Why it is a problem**  
Multiple hardcoded values exist in production-bound code:
- `submission-header.tsx` line 40: username `"dokhoaminh"` hardcoded instead of `user.name`  
- `result-stats-cards.tsx`: beats percentages (`67.56%`, `8.89%`) hardcoded instead of using real `beats` prop  
- `mockData.ts` in `problem-panel`: 5 mock submissions included in the bundle  
- `console.log` debug statements in `problem-table.tsx`, `interview-room.tsx`, `LandingPage.tsx`

**Impact**  
Wrong data shown to users; bundle bloat; log noise in production.

**Estimated difficulty:** Low

**Files involved**  
- [client/src/features/interview/components/problem-panel/submission-header.tsx](client/src/features/interview/components/problem-panel/submission-header.tsx)  
- [client/src/features/interview/components/console-panel/result-stats-cards.tsx](client/src/features/interview/components/console-panel/result-stats-cards.tsx)  
- [client/src/features/interview/components/problem-panel/mockData.ts](client/src/features/interview/components/problem-panel/mockData.ts)  
- [client/src/features/problems/components/problem-table.tsx](client/src/features/problems/components/problem-table.tsx)  
- [client/src/features/interview/pages/interview-room.tsx](client/src/features/interview/pages/interview-room.tsx)

**Suggested solution**  
Replace hardcoded username with `user` from `useAuthStore`. Wire `beats` prop into `ResultStatsCards`. Delete `mockData.ts`. Remove all `console.log` calls (or replace with a structured logger like `pino` that respects `NODE_ENV`).

---

### M-10 — `PrismaService` Bypasses `ConfigService` for `DATABASE_URL`

**Why it is a problem**  
`PrismaService` reads `process.env.DATABASE_URL` directly instead of using `ConfigService`. This bypasses NestJS's configuration validation layer and is inconsistent with all other env usage.

**Impact**  
If a `.env` file is missing, the error message is cryptic (Prisma pool error) rather than a clear startup failure.

**Estimated difficulty:** Low

**Files involved**  
- [server/src/prisma/prisma.service.ts](server/src/prisma/prisma.service.ts)

**Suggested solution**  
Inject `ConfigService` and read the URL from it: `configService.get<string>('DATABASE_URL')`. Add `DATABASE_URL` to a validation schema using `Joi` or `zod` in `ConfigModule`.

---

## 🟢 LOW

---

### L-1 — No Error Boundaries on the Frontend

**Why it is a problem**  
There are no React `ErrorBoundary` components wrapping any routes or panels. If the Monaco editor, WebSocket hook, or any component throws during render, the entire application unmounts with a blank white screen.

**Impact**  
Poor user experience on unexpected errors; no graceful degradation.

**Files involved**  
- [client/src/app/router.tsx](client/src/app/router.tsx)  
- [client/src/features/interview/pages/interview-room.tsx](client/src/features/interview/pages/interview-room.tsx)

**Suggested solution**  
Wrap each route in a `<ErrorBoundary fallback={<ErrorPage />}>`. React Router v7's `errorElement` per route is an alternative.

---

### L-2 — No Pagination on `GET /problems`

**Why it is a problem**  
`ProblemsService.findAll()` returns all problems with no `skip`/`take`. The frontend `useProblems()` hook has no pagination logic. `ListQueryParams` type with `page`/`limit` fields exists in `types/api.ts` but is never used.

**Impact**  
Performance degrades as the problem set grows; frontend renders an unbounded list.

**Files involved**  
- [server/src/modules/problems/problems.service.ts](server/src/modules/problems/problems.service.ts)  
- [client/src/features/problems/hooks/use-problems.ts](client/src/features/problems/hooks/use-problems.ts)

**Suggested solution**  
Add `page`/`limit` query params to `GET /problems`. Use `PaginatedResponse<Problem>` type already defined in `client/src/types/api.ts`. React Query's `useInfiniteQuery` or simple page state.

---

### L-3 — `use-submissions-state.ts` Is an Empty File

**Why it is a problem**  
`client/src/features/interview/hooks/use-submissions-state.ts` is completely empty. It appears to be an unfinished extract.

**Impact**  
Dead file; confuses contributors about intent.

**Files involved**  
- [client/src/features/interview/hooks/use-submissions-state.ts](client/src/features/interview/hooks/use-submissions-state.ts)

**Suggested solution**  
Either implement it (extract submissions state from `interview-room.tsx` as part of M-1) or delete it.

---

### L-4 — `common/add/` Folder Has Unclear Purpose

**Why it is a problem**  
`server/src/common/add/` is either empty or contains uncommitted files with no clear architectural role.

**Impact**  
Confusing project structure; ambiguous intent for new contributors.

**Files involved**  
- `server/src/common/add/`

**Suggested solution**  
Either populate with its intended content (e.g., shared pipes, filters) or delete it and rename to `pipes/`, `filters/` etc. as needed.

---

### L-5 — Typo in Auth Store Interface Name

**Why it is a problem**  
`use-auth-store.ts` defines `interface AuthSatate` (should be `AuthState`). Minor but signals code quality.

**Files involved**  
- [client/src/stores/use-auth-store.ts](client/src/stores/use-auth-store.ts)

**Suggested solution**  
Rename the interface to `AuthState`.

---

### L-6 — `hello()` Debug Utility Remains in Production Code

**Why it is a problem**  
`lib/utils.ts` exports `hello()` which returns `"Hello AlgoMinds"`. It is called with `console.log(hello())` in `LandingPage.tsx` and `test-page.tsx`. These are scaffolding artifacts.

**Files involved**  
- [client/src/lib/utils.ts](client/src/lib/utils.ts)  
- [client/src/LandingPage.tsx](client/src/LandingPage.tsx)  
- [client/src/components/common/test-page.tsx](client/src/components/common/test-page.tsx)

**Suggested solution**  
Remove `hello()` from `utils.ts`. Remove or repurpose the `LandingPage.tsx` test scaffolding. Remove `test-page.tsx` and its route.

---

### L-7 — Hardcoded Credentials in `docker-compose.yml`

**Why it is a problem**  
`POSTGRES_PASSWORD: admin123` is committed in plaintext. While this is a development compose file, it encourages bad habits and if used as a template for staging/production, the password will be exposed in version history.

**Files involved**  
- [docker-compose.yml](docker-compose.yml)

**Suggested solution**  
Use environment variable substitution: `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-admin123}`. Document that `.env` must override this for non-development environments. Add `.env` to `.gitignore`.

---

### L-8 — `debounce` Implemented Twice

**Why it is a problem**  
A `debounce()` utility function exists in `lib/utils.ts`. A `useDebounce()` hook exists in `hooks/use-debounce.ts`. Both do the same thing with a slightly different interface.

**Files involved**  
- [client/src/lib/utils.ts](client/src/lib/utils.ts)  
- [client/src/hooks/use-debounce.ts](client/src/hooks/use-debounce.ts)

**Suggested solution**  
The `useDebounce` hook (React-idiomatic) should be the canonical implementation. Remove `debounce` from `utils.ts`. The React hook internally uses `setTimeout` so it doesn't need the utility.

---

### L-9 — `CalendarWidget` and `StudyPlanWidget` Are Fully Static (No Functionality)

**Why it is a problem**  
`CalendarWidget` shows a hardcoded "5 Day Streak" and hardcoded daily completion state. `StudyPlanWidget` shows static marketing cards. These are dummy UI features.

**Files involved**  
- [client/src/features/problems/components/calendar-widget.tsx](client/src/features/problems/components/calendar-widget.tsx)  
- [client/src/features/problems/components/study-plan-widget.tsx](client/src/features/problems/components/study-plan-widget.tsx)

**Suggested solution**  
Either wire `CalendarWidget` to `UserStats.streakDays` and session history from the API, or remove it from the layout until it's functional. Static widgets that imply personalization mislead users.

---

## 3. Summary Table

| ID | Title | Priority | Difficulty |
|---|---|---|---|
| C-1 | Unauthenticated problem creation | 🔴 Critical | Low |
| C-2 | XSS via unsanitized `dangerouslySetInnerHTML` | 🔴 Critical | Low |
| C-3 | Access token in Google OAuth redirect URL | 🔴 Critical | Medium |
| C-4 | WebSocket gateway has no authentication | 🔴 Critical | Medium |
| H-1 | Zero test coverage | 🟠 High | High |
| H-2 | No RBAC enforcement | 🟠 High | Medium |
| H-3 | POST inside `useQuery` (session start) | 🟠 High | Low |
| H-4 | Circular module dependency (Chat ↔ AI) | 🟠 High | Medium |
| H-5 | Piston hardcoded URL, not in docker-compose | 🟠 High | Medium |
| H-6 | Redundant polling + WebSocket for evaluation | 🟠 High | Low |
| H-7 | Auth state lost on page refresh | 🟠 High | Medium |
| M-1 | `interview-room.tsx` God Component | 🟡 Medium | Medium |
| M-2 | `judge.service.ts` violates SRP | 🟡 Medium | Medium |
| M-3 | Duplicate type definitions | 🟡 Medium | Low |
| M-4 | `socketEvents` constants unused / wrong | 🟡 Medium | Low |
| M-5 | `ProblemFilters` has no wired state | 🟡 Medium | Medium |
| M-6 | Full table scan in `attachPerformanceStats` | 🟡 Medium | Medium |
| M-7 | WebSocket CORS `origin: '*'` | 🟡 Medium | Low |
| M-8 | Global throttle too aggressive | 🟡 Medium | Low |
| M-9 | Hardcoded data and debug artifacts | 🟡 Medium | Low |
| M-10 | `PrismaService` bypasses `ConfigService` | 🟡 Medium | Low |
| L-1 | No React error boundaries | 🟢 Low | Low |
| L-2 | No pagination on problems list | 🟢 Low | Medium |
| L-3 | Empty `use-submissions-state.ts` | 🟢 Low | Low |
| L-4 | `common/add/` folder unclear | 🟢 Low | Low |
| L-5 | `AuthSatate` typo | 🟢 Low | Low |
| L-6 | `hello()` debug artifact | 🟢 Low | Low |
| L-7 | Hardcoded DB password in docker-compose | 🟢 Low | Low |
| L-8 | `debounce` implemented twice | 🟢 Low | Low |
| L-9 | Static non-functional widgets | 🟢 Low | Medium |

---

## 4. Recommended Attack Order

Given this is a portfolio project moving toward completeness, recommended execution order balances security, stability, and feature completion:

**Sprint 1 — Security (C-1 → C-4)**  
Unblock the application from being trivially exploitable. All four critical items can be completed in under a day.

**Sprint 2 — Correctness (H-3, H-7, M-9)**  
Fix the `useQuery`/POST confusion, add auth hydration on refresh, and remove all hardcoded values. These affect daily development.

**Sprint 3 — Infrastructure (H-5, M-10, L-7)**  
Add Piston to Docker, move env vars to ConfigService, clean up docker-compose. Required before any deployment.

**Sprint 4 — RBAC + Module Architecture (H-2, H-4, M-7, M-8)**  
Enforce roles, break the circular dependency, tighten CORS and throttle configs.

**Sprint 5 — Testing Foundation (H-1)**  
Start with auth and judge service unit tests. Target 60% coverage on business-critical services before adding new features.

**Sprint 6 — Refactoring (M-1, M-2, M-3, M-4, M-6)**  
Decompose god components and services, unify types, fix socket event constants, optimize the stats query.

**Sprint 7 — Features + Polish (M-5, H-6, L-1 through L-9)**  
Wire filters, fix evaluation polling, add error boundaries, clean up technical debt.
