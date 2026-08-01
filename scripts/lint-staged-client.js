#!/usr/bin/env node
// Runs client's own eslint (with client's local config + plugins) against
// only the staged files, from client/ as cwd. Invoked from
// lint-staged.config.js — see that file for why this indirection exists.
const { spawnSync } = require("child_process");
const path = require("path");

const clientDir = path.join(__dirname, "..", "client");
const files = process.argv.slice(2).map((f) => path.relative(clientDir, f));
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";

const result = spawnSync(npxBin, ["eslint", "--fix", ...files], {
  cwd: clientDir,
  stdio: "inherit",
  // shell: true — on Windows, spawning a .cmd shim (npx.cmd) without a
  // shell fails with EINVAL regardless of PATH/cwd correctness.
  shell: true,
});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
