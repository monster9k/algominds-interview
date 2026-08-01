#!/usr/bin/env node
// Runs server's own eslint/prettier (with server's local config + plugins)
// against only the staged files, from server/ as cwd. Invoked from
// lint-staged.config.js — see that file for why this indirection exists.
const { spawnSync } = require("child_process");
const path = require("path");

const serverDir = path.join(__dirname, "..", "server");
const files = process.argv.slice(2).map((f) => path.relative(serverDir, f));
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";

function run(args) {
  // shell: true — on Windows, spawning a .cmd shim (npx.cmd) without a
  // shell fails with EINVAL regardless of PATH/cwd correctness.
  const result = spawnSync(npxBin, args, {
    cwd: serverDir,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(["eslint", "--fix", ...files]);
run(["prettier", "--write", ...files]);
