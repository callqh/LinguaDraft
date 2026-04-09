import { expect, test } from "@playwright/test";
import { launchApp } from "../utils/electronApp";

test.describe("语音输入", () => {
  test("点击语音按钮可进入录音状态", async () => {
    const { app, window } = await launchApp();

    await window.getByRole("button", { name: "按住说话 / 语音录入" }).click();
    await expect(window.getByRole("button", { name: "停止录音" })).toBeVisible();
    await expect(window.getByTestId("voice-wave")).toBeVisible();

    await app.close();
  });

  test("停止录音后会完成转写并回填输入框", async () => {
    const { app, window } = await launchApp();

    const input = window.getByTestId("input-composer-textarea");
    await window.getByRole("button", { name: "按住说话 / 语音录入" }).click();
    await expect(window.getByRole("button", { name: "停止录音" })).toBeVisible();
    await window.getByRole("button", { name: "停止录音" }).click();

    await expect(input).toHaveValue(/^(语音输入测试文本。|这是一条语音输入的测试转写结果。)$/);
    await expect(window.getByText("语音识别完成，已回填输入框")).toBeVisible();

    await app.close();
  });
});
