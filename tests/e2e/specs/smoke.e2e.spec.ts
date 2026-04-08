import { expect, test } from "@playwright/test";
import { launchApp } from "../utils/electronApp";

test.describe("应用基础", () => {
  test("应用可启动并默认进入工作台", async () => {
    const { app, window } = await launchApp();

    await expect(window.getByText("写译 · 本地")).toBeVisible();
    await expect(window.getByText("工作台")).toBeVisible();
    await expect(window.getByRole("main").getByText("未命名写作")).toBeVisible();

    await app.close();
  });

  test("可切换到模型管理和设置页面", async () => {
    const { app, window } = await launchApp();

    await window.getByRole("link", { name: "模型管理" }).first().click();
    await expect(window.getByRole("heading", { name: "模型管理" })).toBeVisible();

    await window.getByRole("link", { name: "设置" }).first().click();
    await expect(window.getByRole("heading", { name: "语音输入" })).toBeVisible();

    await app.close();
  });
});

