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

  test("会话支持新建、重命名、删除", async () => {
    const { app, window } = await launchApp();

    const beforeCount = await window.locator("[data-testid^='session-item-']").count();
    await window.getByTestId("session-create").click();
    await expect(window.locator("[data-testid^='session-item-']")).toHaveCount(beforeCount + 1);

    await window.getByTestId("session-rename-s-2").click();
    await window.getByTestId("session-title-input-s-2").fill("需求文档（已改名）");
    await window.getByTestId("session-rename-confirm-s-2").click();
    await expect(window.getByText("需求文档（已改名）")).toBeVisible();

    await window.getByTestId("session-delete-s-3").click();
    await window.getByRole("button", { name: "删除" }).click();
    await expect(window.getByTestId("session-item-s-3")).toHaveCount(0);

    await app.close();
  });
});
