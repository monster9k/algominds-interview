# AlgoMinds

AlgoMinds is a "Think-First" coding interview platform: users first justify their strategy to an AI interviewer, and only unlock the code editor once the strategy is approved.

Modular monolith:

- **Backend** (`server/`): NestJS 11, PostgreSQL 16 via Prisma 7 (driver adapter), Redis + BullMQ for async jobs, Socket.io for real-time events, Google Gemini for AI evaluation.
- **Frontend** (`client/`): React 19 + Vite, TanStack Query, Zustand, shadcn/ui + Tailwind v4, Monaco Editor.
- **Code execution**: [Piston](https://github.com/engineer-man/piston) sandbox, run as its own container.

See [`CLAUDE.md`](./CLAUDE.md) for a deeper architecture walkthrough (module layout, session lifecycle, data model).

## Prerequisites

- Node.js 20+
- Docker (for Postgres, Redis, and the Piston sandbox)

## 1. Start infrastructure

```bash
docker-compose up -d   # postgres:5432, redis:6379, piston:2000
```

This brings up Postgres, Redis, and the Piston code-execution sandbox. Piston starts with no language runtimes installed — install the ones you need via Piston's own CLI/API (see the [Piston docs](https://github.com/engineer-man/piston)) before submitting code in a language that isn't already provisioned.

## 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Fill in `server/.env`:

| Variable | Notes |
|---|---|
| `PORT` | Server port |
| `DATABASE_URL` | Postgres connection string, matches `docker-compose.yml` credentials by default |
| `JWT_SECRET`, `EXPIRES_IN` | Access token signing |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google OAuth login (console.cloud.google.com → APIs & Services → Credentials) |
| `GEMINI_API_KEY` | Google Gemini API key, used for strategy/code AI evaluation |
| `REDIS_HOST`, `REDIS_PORT` | Matches `docker-compose.yml` |
| `FRONTEND_URL` | Used for CORS |
| `NODE_ENV` | `development` \| `production` — affects the refresh-token cookie's `secure` flag |
| `PISTON_API_URL` | Piston sandbox URL, e.g. `http://localhost:2000` |
| `SENTRY_DSN` | Optional — leave blank to run without error tracking |

Fill in `client/.env.local`:

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:3000` |
| `VITE_SOCKET_URL` | Backend Socket.io URL, usually the same host as `VITE_API_URL` |
| `VITE_NODE_ENV` | `development` \| `production` |
| `VITE_SENTRY_DSN` | Optional — leave blank to run without error tracking |

## 3. Install dependencies and set up the database

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed      # loads sample problems (prisma/seed.ts)
```

```bash
cd client
npm install
```

## 4. Run the dev servers

```bash
# server/
npm run start:dev

# client/
npm run dev
```

## Common commands

### Server (`server/`)

```bash
npm run start:dev      # watch-mode dev server
npm run build
npm run start:prod
npm run lint
npm run format

npm run test                    # unit tests (jest)
npx jest path/to/x.spec.ts      # single test file
npm run test:watch
npm run test:cov
npm run test:e2e
```

### Prisma (`server/`)

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db push
npx prisma db seed
```

### Client (`client/`)

```bash
npm run dev
npm run build   # tsc -b && vite build
npm run lint
npm run preview
npm run test         # vitest run
npm run test:watch
```

## Git hooks

A root-level `husky` + `lint-staged` pre-commit hook runs eslint/prettier against staged files in `server/` and `client/` before each commit (see `lint-staged.config.js`). It only installs after `npm install` is run at the repo root:

```bash
npm install   # from repo root — installs husky + lint-staged, wires up .husky/pre-commit
```
