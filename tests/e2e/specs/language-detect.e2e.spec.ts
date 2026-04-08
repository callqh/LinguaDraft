import { expect, test } from "@playwright/test";
import { launchApp } from "../utils/electronApp";

test.describe("语言识别", () => {
  test("中文输入可识别为中文", async () => {
    const { app, window } = await launchApp();

    const input = "今天先整理需求，再补充技术方案。";
    await window.getByTestId("input-composer-textarea").fill(input);
    await window.getByTestId("input-composer-submit").click();

    const latestCard = window.getByTestId("record-card").first();
    await expect(latestCard.getByText("源语言：中文")).toBeVisible();
    await expect(latestCard).toContainText(input);

    await app.close();
  });

  test("英文输入可识别为英文", async () => {
    const { app, window } = await launchApp();

    const input = "We should finish the MVP first and then improve model quality.";
    await window.getByTestId("input-composer-textarea").fill(input);
    await window.getByTestId("input-composer-submit").click();

    const latestCard = window.getByTestId("record-card").first();
    await expect(latestCard.getByText("源语言：英文")).toBeVisible();
    await expect(latestCard).toContainText(input);

    await app.close();
  });

  test("日文输入可识别为日文", async () => {
    const { app, window } = await launchApp();

    const input = "これはテストです。言語識別の確認をします。";
    await window.getByTestId("input-composer-textarea").fill(input);
    await window.getByTestId("input-composer-submit").click();

    const latestCard = window.getByTestId("record-card").first();
    await expect(latestCard.getByText("源语言：日文")).toBeVisible();
    await expect(latestCard).toContainText(input);

    await app.close();
  });
});

