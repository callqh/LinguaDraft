import { expect, test } from "@playwright/test";
import { launchApp } from "../utils/electronApp";

test.describe("输入与翻译", () => {
  test("工作台可提交文本并生成历史记录", async () => {
    const { app, window } = await launchApp();

    await expect(window.getByTestId("record-card").first()).toBeVisible();
    const beforeCount = await window.getByTestId("record-card").count();
    await window.getByTestId("input-composer-textarea").fill("E2E 提交测试文本");
    await window.getByTestId("input-composer-submit").click();
    await expect(window.getByText("E2E 提交测试文本", { exact: true }).first()).toBeVisible();
    await expect(window.getByTestId("record-card")).toHaveCount(beforeCount + 1);

    await app.close();
  });

  test("提交后自动识别语言并自动翻译", async () => {
    const { app, window } = await launchApp();

    await window.getByTestId("input-composer-target-lang").selectOption("中文");
    await window.getByTestId("input-composer-textarea").fill("This is auto detect and translation test.");
    await window.getByTestId("input-composer-submit").click();

    const latestCard = window.getByTestId("record-card").first();
    await expect(latestCard).toHaveAttribute("data-source-lang", "英文");
    await expect(latestCard).toHaveAttribute("data-target-lang", "中文");
    await expect(latestCard).toHaveAttribute("data-translation-status", "success");

    await app.close();
  });

  test("UI 提交后中文翻译到英文应产出英文结果", async () => {
    const { app, window } = await launchApp();

    const input = "请把这句话翻译成英文。";
    await window.getByTestId("input-composer-target-lang").selectOption("英文");
    await window.getByTestId("input-composer-textarea").fill(input);
    await window.getByTestId("input-composer-submit").click();

    const latestCard = window.getByTestId("record-card").first();
    const translated = latestCard.getByTestId("translation-content");
    await expect(latestCard).toHaveAttribute("data-translation-status", "success");
    await expect(translated).not.toContainText(input);
    await expect(translated).toContainText(/[A-Za-z]/);
    await expect(translated).not.toContainText(/[\u4e00-\u9fff]{2,}/);

    await app.close();
  });

  test("UI 提交后英文翻译到中文应产出中文结果", async () => {
    const { app, window } = await launchApp();

    const input = "Please translate this sentence into Chinese.";
    await window.getByTestId("input-composer-target-lang").selectOption("中文");
    await window.getByTestId("input-composer-textarea").fill(input);
    await window.getByTestId("input-composer-submit").click();

    const latestCard = window.getByTestId("record-card").first();
    const translated = latestCard.getByTestId("translation-content");
    await expect(latestCard).toHaveAttribute("data-translation-status", "success");
    await expect(translated).not.toContainText(input);
    await expect(translated).toContainText(/[\u4e00-\u9fff]/);

    await app.close();
  });

  test("【回归】短中文翻译不应出现▁符号和异常重复英文片段", async () => {
    const { app, window } = await launchApp();

    // 问题背景：
    // 之前 sidecar 翻译解码使用了错误的 tokenizer，导致译文出现
    // “▁Test▁test▁test...” 这种 SentencePiece 残留 + 重复输出。
    // 该用例用于防止该问题再次出现。
    await window.getByTestId("input-composer-target-lang").selectOption("英文");
    await window.getByTestId("input-composer-textarea").fill("测试");
    await window.getByTestId("input-composer-submit").click();

    const latestCard = window.getByTestId("record-card").first();
    const translated = latestCard.getByTestId("translation-content");
    await expect(latestCard).toHaveAttribute("data-translation-status", "success");

    const text = ((await translated.textContent()) || "").trim();
    expect(text.length).toBeGreaterThan(0);

    // 断言 1：不应包含 SentencePiece 的前缀符号
    expect(text).not.toContain("▁");

    // 断言 2：不应出现异常重复的 "test test test..." 模式
    expect(text).not.toMatch(/(?:\btest\b[\s,.!?]*){6,}/i);

    await app.close();
  });

  test("【回归】混合文本 ok做的不错 翻译不应出现长串重复 done well", async () => {
    const { app, window } = await launchApp();

    // 问题背景：
    // 用户输入“ok做的不错”时，曾出现
    // “Ok did well for Ok doing well done well done well ...” 的异常重复输出。
    // 该用例确保译文不会出现长串重复片段，并控制译文长度。
    await window.getByTestId("input-composer-target-lang").selectOption("英文");
    await window.getByTestId("input-composer-textarea").fill("ok做的不错");
    await window.getByTestId("input-composer-submit").click();

    const latestCard = window.getByTestId("record-card").first();
    await expect(latestCard).toHaveAttribute("data-translation-status", "success");

    const text = ((await latestCard.getByTestId("translation-content").textContent()) || "").trim();
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThan(120);

    // 不允许出现明显重复短语（6 次以上）
    expect(text).not.toMatch(/(?:\bdone\s+well\b[\s,.!?]*){6,}/i);
    expect(text).not.toMatch(/(?:\bok\b[\s,.!?]*){8,}/i);

    await app.close();
  });

  test("点击重新翻译会覆盖当前记录而不是新增记录", async () => {
    const { app, window } = await launchApp();

    await expect(window.getByTestId("record-card").first()).toBeVisible();
    const latestCard = window.getByTestId("record-card").first();
    const cardCountBefore = await window.getByTestId("record-card").count();
    const recordId = await latestCard.evaluate((el) => {
      const btn = el.querySelector("button[data-testid^='record-retranslate-']");
      return (btn?.getAttribute("data-testid") || "").replace("record-retranslate-", "");
    });

    await window.getByTestId(`record-target-lang-${recordId}`).selectOption("中文");
    await window.getByTestId(`record-retranslate-${recordId}`).click();

    await expect(window.getByTestId("record-card")).toHaveCount(cardCountBefore);
    await expect(window.getByTestId("record-card").first()).toHaveAttribute("data-target-lang", "中文");
    await expect(window.getByTestId("record-card").first()).toHaveAttribute("data-translation-status", "success");

    await app.close();
  });

  test("输入框支持 Cmd+Enter 提交，Enter 换行", async () => {
    const { app, window } = await launchApp();

    await expect(window.getByTestId("record-card").first()).toBeVisible();
    const beforeCount = await window.getByTestId("record-card").count();
    const inputBox = window.getByTestId("input-composer-textarea");

    await inputBox.fill("第一行");
    await inputBox.press("Enter");
    await inputBox.type("第二行");
    await expect(inputBox).toHaveValue("第一行\n第二行");

    await inputBox.press("Meta+Enter");
    await expect(window.getByTestId("record-card")).toHaveCount(beforeCount + 1);
    await expect(window.getByTestId("record-card").first()).toContainText("第一行");
    await expect(window.getByTestId("record-card").first()).toContainText("第二行");

    await app.close();
  });
});
