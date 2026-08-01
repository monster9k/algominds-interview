import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Lets `({ type, ...props })` discard a prop from a rest spread
      // without tripping unused-var on `type` itself.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
      // React Compiler readiness rules (bundled in reactHooks recommended,
      // v7+) — this project doesn't run babel-plugin-react-compiler yet (see
      // vite.config.ts), so these are forward-looking recommendations, not
      // active-build correctness bugs. The flagged spots
      // (interview-room.tsx, use-interview-socket.ts) sync local state from
      // an external system (TanStack Query + socket events) using a pattern
      // the compiler can't safely optimize — the "proper" fix is a real
      // behavioral restructure of the interview session state machine,
      // which has zero test coverage. Downgraded to warn rather than risk
      // that rewrite blind; same judgment already applied server-side to
      // no-floating-promises/no-unsafe-argument.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
])
