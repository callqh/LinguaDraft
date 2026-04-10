#!/usr/bin/env node
import path from "node:path";
import process from "node:process";

const resolveElectronLauncher = async () => {
  const candidates = ["playwright", "@playwright/test", "playwright-core"];
  for (const pkg of candidates) {
    try {
      const mod = await import(pkg);
      if (mod?._electron) return mod._electron;
    } catch {
      // try next package
    }
  }
  throw new Error(
    "Cannot load Playwright electron launcher. Tried: playwright, @playwright/test, playwright-core",
  );
};

const executablePath = process.argv[2] ? path.resolve(process.argv[2]) : "";
if (!executablePath) {
  console.error("usage: node scripts/ci/smoke_packaged_ipc.mjs <packaged-executable>");
  process.exit(1);
}

const electron = await resolveElectronLauncher();
const app = await electron.launch({
  executablePath,
  args: [],
  env: {
    ...process.env,
    LINGUA_SMOKE_TEST: "1",
  },
});

try {
  const window = await app.firstWindow({ timeout: 30000 });
  await window.waitForLoadState("domcontentloaded", { timeout: 30000 });

  const checks = await window.evaluate(async () => {
    const api = window.linguaDraft;
    const out = {
      bridge: false,
      modelList: "",
      languageDetect: "",
      sidecarDiagnose: "",
    };
    if (!api) return out;

    out.bridge = true;
    try {
      await api.model.list();
      out.modelList = "ok";
    } catch (error) {
      out.modelList = String(error);
    }
    try {
      await api.language.detect("hello world");
      out.languageDetect = "ok";
    } catch (error) {
      out.languageDetect = String(error);
    }
    try {
      await api.sidecar.diagnose();
      out.sidecarDiagnose = "ok";
    } catch (error) {
      out.sidecarDiagnose = String(error);
    }
    return out;
  });

  if (!checks.bridge) {
    throw new Error("preload bridge missing: window.linguaDraft is undefined");
  }

  const failures = [checks.modelList, checks.languageDetect, checks.sidecarDiagnose].filter(
    (v) => v !== "ok",
  );
  if (failures.length > 0) {
    throw new Error(`ipc smoke failed: ${failures.join(" | ")}`);
  }
  console.log("[smoke-packaged-ipc] OK");
} finally {
  await app.close();
}
