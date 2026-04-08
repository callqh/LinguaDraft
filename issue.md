tests/e2e/specs/input-and-translation.e2e.spec.ts:68:7 › 输入与翻译 › 【回归】短中文翻译不应出现▁符号和异常重复英文片段 ────

    Error: expect(received).not.toContain(expected) // indexOf

    Expected substring: not "▁"
    Received string:        "▁Test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test▁test"

      85 |
      86 |     // 断言 1：不应包含 SentencePiece 的前缀符号
    > 87 |     expect(text).not.toContain("▁");
         |                      ^
      88 |
      89 |     // 断言 2：不应出现异常重复的 "test test test..." 模式
      90 |     expect(text).not.toMatch(/(?:\btest\b[\s,.!?]*){6,}/i);
        at /Users/liuqh/lqh/LinguaDraft/tests/e2e/specs/input-and-translation.e2e.spec.ts:87:22

    Error Context: test-results/specs-input-and-translatio-3b302-译-【回归】短中文翻译不应出现▁符号和异常重复英文片段/error-context.md
