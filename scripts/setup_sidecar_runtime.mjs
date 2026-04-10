#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const sidecarRoot = path.join(repoRoot, "services", "ai-sidecar");
const venvRoot = path.join(sidecarRoot, ".venv");
const requirements = path.join(sidecarRoot, "requirements.txt");
const isWin = process.platform === "win32";

const pythonCandidates = isWin
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

const run = (cmd, args, opts = {}) => {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...opts,
  });
  if (result.status !== 0) {
    const joined = [cmd, ...args].join(" ");
    process.exit(result.status ?? 1);
  }
};

const canRun = (cmd, args) => {
  const result = spawnSync(cmd, [...args, "--version"], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  return result.status === 0;
};

const pickPython = () => {
  for (const candidate of pythonCandidates) {
    if (canRun(candidate.cmd, candidate.args)) return candidate;
  }
  return null;
};

const selected = pickPython();
if (!selected) {
  console.error("[setup:sidecar] No Python interpreter found.");
  process.exit(1);
}

run(selected.cmd, [...selected.args, "-m", "venv", venvRoot]);

const venvPython = isWin
  ? path.join(venvRoot, "Scripts", "python.exe")
  : path.join(venvRoot, "bin", "python");

run(venvPython, ["-m", "pip", "install", "-r", requirements]);
console.log("[setup:sidecar] Runtime is ready.");
