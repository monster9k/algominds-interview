# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AlgoMinds is a "Think-First" coding interview platform: users first justify their strategy to an AI interviewer, and only unlock the code editor once the strategy is approved. It's a modular monolith:

- **Backend** (`server/`): NestJS 11, PostgreSQL 16 via Prisma 7 (driver adapter, not the default engine), Redis + BullMQ for async jobs, Socket.io for real-time events, Google Gemini for AI evaluation.
- **Frontend** (`client/`): React 19 + Vite, TanStack Query, Zustand, shadcn/ui + Tailwind v4, Monaco Editor.
- **Code execution**: [Piston](https://github.com/engineer-man/piston) sandbox, run as its own container.
- `piston_src/` at the repo root is a vendored clone of the Piston project (gitignored) used to build/customize the sandbox image referenced by `docker-compose.yml` — it is not application code and should not be treated as part of this codebase.

## Commands

### Infra
```bash
docker-compose up -d   # postgres:5432, redis:6379, piston:2000
```
Env setup: copy `server/.env.example` → `server/.env` (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `EXPIRES_IN`, `GEMINI_API_KEY`, `REDIS_HOST`, `REDIS_PORT`, `FRONTEND_URL`, `PISTON_API_URL`), and `client/.env.example` → `client/.env.local` (`VITE_API_URL`, `VITE_SOCKET_URL`).

### Server (run from `server/`)
```bash
npm run start:dev      # watch-mode dev server
npm run build
npm run start:prod
npm run lint
npm run format

npm run test            # unit tests (jest)
npx jest path/to/x.spec.ts   # single test file
npm run test:watch
npm run test:cov
npm run test:e2e
```
Note: there are currently no `.spec.ts` files in the codebase besides the NestJS e2e stub, so there's no existing unit test to pattern-match against yet.

### Prisma (run from `server/`)
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db push
npx prisma db seed      # runs prisma/seed.ts
```

### Client (run from `client/`)
```bash
npm run dev
npm run build   # tsc -b && vite build
npm run lint
npm run preview
```

## Architecture

### Backend modules (`server/src/modules/*`)
- `auth` — email/password + Google OAuth, JWT access token (short-lived) + refresh token (`RefreshToken` model), bcrypt hashing.
- `users` — profile CRUD, `UserStats` (credits, streak, solved count).
- `problems` — problem CRUD/tags, per-user status enrichment. `POST /problems` is admin-gated with `JwtAuthGuard` + `RolesGuard` + `@Roles('ADMIN')`.
- `sessions` — interview session lifecycle (`PHASE_1_STRATEGY` → `PHASE_2_IMPLEMENT` → `COMPLETED`/`ABANDONED`), optimistic locking via `Session.version`.
- `chat` — Socket.io gateway (`chat/chat.gateway.ts`), message persistence, dispatches AI jobs to the queue.
- `ai` — Gemini calls (strategy + code evaluation), BullMQ (`ai-queue`) processor/listener.
- `judge` — code submission → Piston execution → test-case comparison → performance stats.
- `common/queue` — global BullMQ/Redis wiring (`QueueModule`). `common/guards` + `common/decorators` hold `RolesGuard`, `@Roles()`, `@CurrentUser()`.

`AiModule` and `ChatModule` depend on each other via `forwardRef()` (chat dispatches AI jobs; AI needs the gateway to emit results back). This is an existing, intentional-if-not-ideal cycle — don't "fix" it as a side effect of an unrelated change.

### Frontend features (`client/src/features/*`)
- `auth` — login/register/Google OAuth pages, `use-auth-store` (Zustand), `ProtectedRoute`.
- `problems` — problem list/table; `problem-filters.tsx` renders filter UI but is not yet wired to the query.
- `interview` — the core interview room: Monaco editor, AI chat panel, submission/result panels, evaluation. `pages/interview-room.tsx` is the main page composing most of this feature's state and hooks.

Path alias `@/` → `client/src/` (see `vite.config.ts`, `tsconfig.json`). Server state via TanStack Query, client/UI state via Zustand (`stores/`), components via shadcn/ui + Tailwind v4.

### End-to-end session flow
1. Login → `accessToken` (memory, Zustand) + `refreshToken` (httpOnly cookie).
2. `GET /problems` (optional JWT for per-user status enrichment) → user picks a problem.
3. `POST /sessions/start/:slug` creates/resumes a session; client emits `join_room(sessionId)` over the socket.
4. **Phase 1**: user sends a strategy message → socket event → queued on `ai-queue` → Gemini evaluates → on `APPROVED`, session flips to `PHASE_2_IMPLEMENT` and `session_status_update` is emitted.
5. **Phase 2**: user writes code in Monaco → `POST /judge/submit` → `PistonService` executes it against `PISTON_API_URL` per test case → on `ACCEPTED`, an `evaluate-code` job is queued → Gemini scores the code → `code_evaluation_complete` is emitted.
6. Frontend hooks (`use-interview-socket`, `use-evaluation`, etc.) listen for these socket events and update UI state.

### Data model (`server/prisma/schema.prisma`)
- `Session.status` (enum) drives the phase state machine; `Session.version` is the optimistic-lock field, incremented on phase transitions.
- `Problem.initialCode` / `solution` / `testCases` are JSON blobs keyed by language.
- `SessionEvent` is an append-only audit trail of phase/status transitions.
- `Evaluation` is 1:1 with `Session` (AI scoring output); `Submission` is 1:many with `Session` (one row per judge run).

### Piston integration
`PistonService` (`server/src/modules/judge/services/piston.service.ts`) reads `PISTON_API_URL` via `ConfigService.getOrThrow` (not hardcoded) and maps each supported language to a Piston runtime/version in `getLanguageConfig()`. Java submissions require an explicit `main: 'Main'` in the payload since Piston otherwise executes the first public class it finds.

## Other notes
- No automated test suite exists yet — be extra careful when touching `judge.service.ts` or `auth.service.ts`, since there's no regression safety net.
- `proj.md` is a dated architectural audit (2026-07-06) with a prioritized issue list (security, RBAC, refactors, etc.). Treat it as historical/reference context, not current state — several items it flags (e.g. unauthenticated problem creation, hardcoded Piston URL) have already been fixed in the current code. Verify against the actual source before acting on anything it says.
- `STEP.md` is a Vietnamese-language phase checklist tracking overall project progress across 6 phases (infra → backend core → AI/session engine → frontend core → interview room UI → polish/deploy).
