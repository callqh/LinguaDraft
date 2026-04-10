import { app } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { execSync } from "node:child_process";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { getUserBuiltinRoot } from "../runtime/modelPaths";

const SIDECAR_PORT = 8765;
const HEALTH_URL = `http://127.0.0.1:${SIDECAR_PORT}/health`;

let sidecarProcess: ChildProcessWithoutNullStreams | null = null;
let ready = false;
let startPromise: Promise<boolean> | null = null;

type SidecarDiagnostics = {
  selectedPython: string;
  pythonSource: "bundled" | "runtime-venv" | "system" | "unknown";
  depsReady: boolean;
  sidecarEntry: string;
  requirementsPath: string;
  runtimeVenvRoot: string;
  modelRoot: string;
  healthReason?: string;
  lastError?: string;
  ready: boolean;
};

const diagnostics: SidecarDiagnostics = {
  selectedPython: "",
  pythonSource: "unknown",
  depsReady: false,
  sidecarEntry: "",
  requirementsPath: "",
  runtimeVenvRoot: "",
  modelRoot: "",
  ready: false,
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const firstExisting = (candidates: string[]) =>
  candidates.find((p) => fs.existsSync(p)) ?? candidates[0];

const isWindows = process.platform === "win32";

const getRuntimeVenvRoot = () => path.join(app.getPath("userData"), "sidecar-venv");

const getRuntimeVenvPython = () =>
  isWindows
    ? path.join(getRuntimeVenvRoot(), "Scripts", "python.exe")
    : path.join(getRuntimeVenvRoot(), "bin", "python");

const getBundledRequirements = () =>
  firstExisting([
    path.join(app.getAppPath(), "services", "ai-sidecar", "requirements.txt"),
    path.join(process.resourcesPath, "services", "ai-sidecar", "requirements.txt"),
    path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "services",
      "ai-sidecar",
      "requirements.txt",
    ),
  ]);

const canRunPython = (pythonCmd: string) => {
  const r = spawnSync(pythonCmd, ["-c", "import sys; print(sys.version)"], {
    stdio: "ignore",
    timeout: 8000,
  });
  return r.status === 0;
};

const canImportSidecarDeps = (pythonCmd: string) => {
  const r = spawnSync(
    pythonCmd,
    [
      "-c",
      "import importlib.util as iu; has=lambda n: iu.find_spec(n) is not None; ok = has('fastapi') and has('uvicorn') and ((has('ctranslate2') and has('sentencepiece')) or has('faster_whisper')); raise SystemExit(0 if ok else 1)",
    ],
    {
      stdio: "ignore",
      timeout: 12000,
    },
  );
  return r.status === 0;
};

const findPython = () => {
  const appPath = app.getAppPath();
  const venvPy = firstExisting([
    path.join(appPath, "services", "ai-sidecar", ".venv", "bin", "python"),
    path.join(appPath, "services", "ai-sidecar", ".venv", "Scripts", "python.exe"),
    path.join(process.resourcesPath, "services", "ai-sidecar", ".venv", "bin", "python"),
    path.join(process.resourcesPath, "services", "ai-sidecar", ".venv", "Scripts", "python.exe"),
    path.join(process.resourcesPath, "app.asar.unpacked", "services", "ai-sidecar", ".venv", "bin", "python"),
    path.join(process.resourcesPath, "app.asar.unpacked", "services", "ai-sidecar", ".venv", "Scripts", "python.exe"),
  ]);
  const candidates = [venvPy, "python3", "python"];
  return candidates.find((bin) => bin.includes("/") ? fs.existsSync(bin) : true) ?? "python3";
};

const ensureRuntimePython = () => {
  diagnostics.requirementsPath = getBundledRequirements();
  diagnostics.runtimeVenvRoot = getRuntimeVenvRoot();
  const bundled = findPython();
  const bundledReady = canRunPython(bundled) && canImportSidecarDeps(bundled);
  if (bundledReady) {
    diagnostics.selectedPython = bundled;
    diagnostics.pythonSource = bundled.includes("sidecar-venv")
      ? "runtime-venv"
      : bundled.includes("python")
        ? "bundled"
        : "unknown";
    diagnostics.depsReady = true;
    return bundled;
  }

  const req = diagnostics.requirementsPath;
  if (!fs.existsSync(req)) return bundled;

  const systemPython = [bundled, "python3", "python"].find((cmd) =>
    cmd.includes("/") || cmd.includes("\\") ? fs.existsSync(cmd) && canRunPython(cmd) : canRunPython(cmd),
  );
  if (!systemPython) {
    diagnostics.selectedPython = bundled;
    diagnostics.pythonSource = bundled.includes("python") ? "bundled" : "unknown";
    diagnostics.depsReady = false;
    diagnostics.lastError = "no-python-for-runtime-venv";
    return bundled;
  }

  const venvRoot = getRuntimeVenvRoot();
  if (!fs.existsSync(venvRoot)) {
    fs.mkdirSync(venvRoot, { recursive: true });
    const r = spawnSync(systemPython, ["-m", "venv", venvRoot], {
      stdio: "inherit",
      timeout: 240000,
    });
    if (r.status !== 0) {
      diagnostics.lastError = "runtime-venv-create-failed";
      return bundled;
    }
  }

  const runtimePython = getRuntimeVenvPython();
  if (!fs.existsSync(runtimePython)) return bundled;

  if (!canImportSidecarDeps(runtimePython)) {
    const pipInstall = spawnSync(
      runtimePython,
      ["-m", "pip", "install", "-r", req],
      {
        stdio: "inherit",
        timeout: 600000,
      },
    );
    if (pipInstall.status !== 0) {
      diagnostics.lastError = "runtime-pip-install-failed";
      return bundled;
    }
  }
  diagnostics.selectedPython = runtimePython;
  diagnostics.pythonSource = "runtime-venv";
  diagnostics.depsReady = true;
  return runtimePython;
};

type HealthPayload = {
  ok?: boolean;
  engines?: {
    faster_whisper?: boolean;
    ctranslate2?: boolean;
  };
  model_root?: string;
  models?: {
    asr_ready?: boolean;
  };
};

const expectedModelRoot = () => getUserBuiltinRoot();

const checkHealth = async (): Promise<{ ok: boolean; reason?: string }> => {
  try {
    const res = await fetch(HEALTH_URL, { method: "GET" });
    if (!res.ok) return { ok: false, reason: `http-${res.status}` };
    const payload = (await res.json()) as HealthPayload;
    if (!payload.ok) return { ok: false, reason: "payload-not-ok" };
    if (!payload.engines?.faster_whisper && !payload.engines?.ctranslate2) {
      return { ok: false, reason: "sidecar-engines-missing" };
    }
    if (payload.model_root && payload.model_root !== expectedModelRoot()) {
      return { ok: false, reason: "model-root-mismatch" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
};

const killOccupantOnPort = () => {
  try {
    const stdout = execSync(`lsof -ti tcp:${SIDECAR_PORT} || true`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!stdout) return;
    const pids = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
};

export const startSidecar = async () => {
  if (ready) return true;
  if (startPromise) return startPromise;

  startPromise = (async () => {
    const health = await checkHealth();
    diagnostics.healthReason = health.reason;
    if (health.ok) {
      ready = true;
      diagnostics.ready = true;
      return true;
    }
    if (health.reason === "model-root-mismatch") {
      killOccupantOnPort();
      await wait(250);
    }

    if (sidecarProcess) {
      for (let i = 0; i < 80; i += 1) {
        if ((await checkHealth()).ok) {
          ready = true;
          diagnostics.ready = true;
          return true;
        }
        await wait(250);
      }
      diagnostics.lastError = "sidecar-health-check-timeout";
      diagnostics.ready = false;
      return false;
    }

    const sidecarEntry = firstExisting([
      path.join(app.getAppPath(), "services", "ai-sidecar", "app", "main.py"),
      path.join(process.resourcesPath, "services", "ai-sidecar", "app", "main.py"),
      path.join(process.resourcesPath, "app.asar.unpacked", "services", "ai-sidecar", "app", "main.py"),
    ]);
    if (!fs.existsSync(sidecarEntry)) return false;
    diagnostics.sidecarEntry = sidecarEntry;
    diagnostics.modelRoot = getUserBuiltinRoot();

    const python = ensureRuntimePython();
    diagnostics.selectedPython = python;
    process.stdout.write(
      `[sidecar-diagnose] python=${diagnostics.selectedPython} source=${diagnostics.pythonSource} depsReady=${diagnostics.depsReady} entry=${diagnostics.sidecarEntry} modelRoot=${diagnostics.modelRoot}\n`,
    );
    sidecarProcess = spawn(python, [sidecarEntry, "--port", `${SIDECAR_PORT}`], {
      cwd: app.getAppPath(),
      env: { ...process.env, PYTHONUNBUFFERED: "1", LINGUA_MODEL_ROOT: getUserBuiltinRoot() }
    });

    sidecarProcess.stdout.on("data", (chunk) => {
      process.stdout.write(`[sidecar] ${chunk.toString()}`);
    });
    sidecarProcess.stderr.on("data", (chunk) => {
      process.stderr.write(`[sidecar] ${chunk.toString()}`);
    });
    sidecarProcess.on("error", (error) => {
      process.stderr.write(`[sidecar] spawn error: ${error.message}\n`);
      diagnostics.lastError = error.message;
      diagnostics.ready = false;
      ready = false;
      sidecarProcess = null;
    });
    sidecarProcess.on("exit", () => {
      diagnostics.ready = false;
      ready = false;
      sidecarProcess = null;
    });

    for (let i = 0; i < 80; i += 1) {
      if ((await checkHealth()).ok) {
        ready = true;
        diagnostics.ready = true;
        return true;
      }
      await wait(250);
    }
    diagnostics.lastError = "sidecar-health-check-timeout";
    diagnostics.ready = false;
    return false;
  })();

  try {
    return await startPromise;
  } finally {
    startPromise = null;
  }
};

export const stopSidecar = () => {
  if (sidecarProcess) {
    sidecarProcess.kill("SIGTERM");
    sidecarProcess = null;
  }
  ready = false;
};

export const isSidecarReady = () => ready;

export const getSidecarPort = () => SIDECAR_PORT;

export const getSidecarDiagnostics = () => ({ ...diagnostics, ready });
