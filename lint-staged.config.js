// server/ and client/ each have their own eslint config + plugins in their
// own node_modules, so we can't just run `eslint` from the repo root against
// staged paths directly (wrong cwd -> wrong config/plugin resolution, and
// wrong file paths since these globs match paths relative to repo root).
// The wrapper scripts re-root the staged file list and spawn each side's
// local eslint (and prettier, for server) with the right cwd.
module.exports = {
  "server/**/*.ts": (files) =>
    `node scripts/lint-staged-server.js ${files.map((f) => JSON.stringify(f)).join(" ")}`,
  "client/**/*.{ts,tsx}": (files) =>
    `node scripts/lint-staged-client.js ${files.map((f) => JSON.stringify(f)).join(" ")}`,
};
