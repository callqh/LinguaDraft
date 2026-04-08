import path from "node:path";
import { test, expect, _electron as electron } from "@playwright/test";

test.describe("LinguaDraft Electron MVP", () => {
  test("应用可启动并默认进入工作台", async () => {
    const app = await electron.launch({
      args: [path.resolve(process.cwd(), ".")]
    });
    const window = await app.firstWindow();

    await expect(window.getByText("写译 · 本地")).toBeVisible();
    await expect(window.getByText("工作台")).toBeVisible();
    await expect(window.getByText("未命名写作")).toBeVisible();

    await app.close();
  });

  test("工作台可提交文本并生成历史记录", async () => {
    const app = await electron.launch({
      args: [path.resolve(process.cwd(), ".")]
    });
    const window = await app.firstWindow();

    await expect(window.getByTestId("record-card").first()).toBeVisible();
    const beforeCount = await window.getByTestId("record-card").count();
    await window.getByTestId("input-composer-textarea").fill("E2E 提交测试文本");
    await window.getByTestId("input-composer-submit").click();
    await expect(window.getByText("E2E 提交测试文本")).toBeVisible();
    await expect(window.getByTestId("record-card")).toHaveCount(beforeCount + 1);

    await app.close();
  });

  test("可切换到模型管理和设置页面", async () => {
    const app = await electron.launch({
      args: [path.resolve(process.cwd(), ".")]
    });
    const window = await app.firstWindow();

    await window.getByRole("link", { name: "模型管理" }).first().click();
    await expect(window.getByRole("heading", { name: "模型管理" })).toBeVisible();

    await window.getByRole("link", { name: "设置" }).first().click();
    await expect(window.getByRole("heading", { name: "语音输入" })).toBeVisible();

    await app.close();
  });
});
