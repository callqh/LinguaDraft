#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(repoRoot, "scripts", "prepare_builtin_models.py");
const isWin = process.platform === "win32";

const candidates = isWin
  ? [
      { cmd: "py", args: ["-3.11"] },
      { cmd: "py", args: ["-3.10"] },
      { cmd: "py", args: ["-3.9"] },
      { cmd: "python", args: [] },
      { cmd: "python3", args: [] },
    ]
  : [
      { cmd: "python3.11", args: [] },
      { cmd: "python3.10", args: [] },
      { cmd: "python3.9", args: [] },
      { cmd: "python3", args: [] },
      { cmd: "python", args: [] },
    ];

const canRun = (cmd, args) => {
  const result = spawnSync(cmd, [...args, "--version"], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  return result.status === 0;
};

const selected = candidates.find((it) => canRun(it.cmd, it.args));
if (!selected) {
  console.error("[prepare:models] No Python interpreter found.");
  process.exit(1);
}

const result = spawnSync(selected.cmd, [...selected.args, scriptPath], {
  cwd: repoRoot,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
