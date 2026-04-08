import * as fs from "node:fs";
import * as path from "node:path";
import { getBundledBuiltinRoot, getUserBuiltinRoot } from "./modelPaths";

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const copyDir = (src: string, dst: string) => {
  ensureDir(dst);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
      continue;
    }
    fs.copyFileSync(from, to);
  }
};

export const installBuiltinModels = () => {
  const bundledRoot = getBundledBuiltinRoot();
  const userRoot = getUserBuiltinRoot();
  if (!fs.existsSync(bundledRoot)) {
    throw new Error(`内置模型目录不存在: ${bundledRoot}`);
  }
  copyDir(bundledRoot, userRoot);
  return userRoot;
};

