import path from "node:path";
import type { ElectronApplication, Page } from "@playwright/test";
import { _electron as electron } from "@playwright/test";

export const launchApp = async (): Promise<{ app: ElectronApplication; window: Page }> => {
  const app = await electron.launch({
    args: [path.resolve(process.cwd(), "."), "--no-sandbox", "--disable-gpu"]
  });
  const window = await app.firstWindow();
  return { app, window };
};
