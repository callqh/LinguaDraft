import { app } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

const firstExisting = (candidates: string[]) => candidates.find((p) => fs.existsSync(p)) ?? candidates[0];

export const getBundledBuiltinRoot = () => {
  const appPath = app.getAppPath();
  return firstExisting([
    path.join(appPath, "local-model", "models", "builtin"),
    path.join(process.resourcesPath, "local-model", "models", "builtin"),
    path.join(process.resourcesPath, "app.asar.unpacked", "local-model", "models", "builtin")
  ]);
};

export const getUserModelRoot = () => path.join(app.getPath("userData"), "models");
export const getUserBuiltinRoot = () => path.join(getUserModelRoot(), "builtin");

