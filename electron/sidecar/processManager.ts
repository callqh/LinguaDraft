import { app } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { getUserBuiltinRoot } from "../runtime/modelPaths";

const SIDECAR_PORT = 8765;
const HEALTH_URL = `http://127.0.0.1:${SIDECAR_PORT}/health`;

let sidecarProcess: ChildProcessWithoutNullStreams | null = null;
let ready = false;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const findPython = () => {
  const appPath = app.getAppPath();
  const venvPy = path.join(appPath, "services", "ai-sidecar", ".venv", "bin", "python");
  const candidates = [venvPy, "python3", "python"];
  return candidates.find((bin) => bin.includes("/") ? fs.existsSync(bin) : true) ?? "python3";
};

const checkHealth = async () => {
  try {
    const res = await fetch(HEALTH_URL, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
};

export const startSidecar = async () => {
  if (ready) return true;
  if (await checkHealth()) {
    ready = true;
    return true;
  }

  const sidecarEntry = path.join(app.getAppPath(), "services", "ai-sidecar", "app", "main.py");
  if (!fs.existsSync(sidecarEntry)) return false;

  const python = findPython();
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
    ready = false;
    sidecarProcess = null;
  });
  sidecarProcess.on("exit", () => {
    ready = false;
    sidecarProcess = null;
  });

  for (let i = 0; i < 30; i += 1) {
    if (await checkHealth()) {
      ready = true;
      return true;
    }
    await wait(200);
  }
  return false;
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
