# LinguaDraft 本地模型接入最终 Prompt（定版）

你现在是资深 Electron / 前端 / 本地 AI 工程师。请在当前 LinguaDraft 项目中，完成“本地模型能力接入”的第一阶段到可演示状态，并严格遵循以下定版方案。

## 一、目标

在现有 MVP（mock service）基础上，落地真实本地模型能力：

1. 内置语音识别模型（ASR）
2. 内置文本语种识别模型（LID）
3. 内置中英翻译模型（MT）
4. 其他翻译语种改为用户手动下载

要求：保留当前 UI/交互与 Zustand 状态流，不推翻现有页面结构。
本方案的核心原则是：页面不推翻、接口尽量不变

---

## 二、模型选型（最终定版，不再改动）

## 2.1 内置语音识别模型（ASR）

- `faster-whisper-base`（int8）
- 用途：
  - 语音转文字
  - 返回语音语种识别结果

## 2.2 内置文本语种识别模型（LID）

- `fastText lid.176.ftz`
- 用途：
  - 键盘输入文本语种识别
  - 语音转写后的文本语种兜底识别

## 2.3 内置翻译模型（MT）

- `OPUS-MT zh->en`
- `OPUS-MT en->zh`
- 推理后端：`CTranslate2`（int8）

## 2.4 非内置模型策略

- `ja/ko/fr/de/ru/es/it` 等其他语种翻译模型默认不内置
- 用户在模型管理页手动下载

---

## 三、架构约束（必须遵守）

1. 前端 `src/stores/useAppStore.ts` 的调用方式尽量不变
2. `src/services/voiceService.ts` / `translationService.ts` / `modelService.ts` 保留现有接口签名
3. 新增 Electron IPC 层承接真实能力
4. mock 保留为 fallback（本地模型不可用时可切回 mock，避免页面不可演示）

---

## 四、实现范围

## 4.1 Electron 主进程能力

请新增模块（命名可调整，但职责必须一致）：

- `electron/ipc/modelHandlers.ts`
- `electron/runtime/asrRunner.ts`
- `electron/runtime/lidRunner.ts`
- `electron/runtime/translationRunner.ts`
- `electron/runtime/modelManager.ts`

能力要求：

1. `asr:transcribe`  
   返回：

- `text`
- `language`
- `confidence`

2. `language:detect`

- 使用 `fastText lid.176.ftz`
- 返回 `language` + `confidence`
- 对短文本和低置信度做 `unknown` 回退

3. `translation:run`

- 仅支持 `zh->en` 和 `en->zh`
- 其他方向返回“模型未安装/不支持”

4. `model:list/download/pause/resume/cancel/delete`

- 与现有模型管理页状态对齐：
  - `not_installed/downloading/paused/installed/failed`

## 4.2 Preload 暴露 API

在 `electron/preload.ts` 暴露：

- `window.linguaDraft.asr.start/stop/transcribe`
- `window.linguaDraft.language.detect`
- `window.linguaDraft.translation.detect/translate`
- `window.linguaDraft.model.*`

并补充 renderer 侧类型声明。

## 4.3 Renderer Service 替换

替换以下文件内部实现（保留方法名）：

- `src/services/voiceService.ts`
- `src/services/translationService.ts`
- `src/services/modelService.ts`

策略：

- 默认调用 IPC 真能力
- IPC 不可用或运行失败时降级 mock，并输出可见错误提示

---

## 五、模型资源与目录规划

请按以下结构落地（可按实际调整细节）：

```text
local-model/
├── manifest/
│   ├── builtin.manifest.json
│   └── remote.manifest.json
├── runtime/
├── models/
│   ├── builtin/
│   │   ├── asr/faster-whisper-base/
│   │   ├── lid/fasttext-lid-176-ftz/
│   │   └── translation/
│   │       ├── zh-en/
│   │       └── en-zh/
│   └── downloaded/
└── scripts/
```

---

## 六、模型管理行为要求

1. 内置模型（ASR/LID/中英翻译）首次启动即展示为 `installed`
2. 其他翻译模型展示为 `not_installed`
3. 用户选择未安装目标语言时，弹窗提示并可跳转模型管理
4. 下载需要支持：

- 进度
- 暂停
- 继续
- 取消
- 失败重试

---

## 七、验收标准（必须全部满足）

1. Electron 启动后可离线完成：

- 语音录入 -> 转写文本回填
- 中译英 / 英译中

2. 文本语种识别生效：

- 输入中文识别中文
- 输入英文识别英文
- 极短文本返回可接受的兜底结果（unknown 或上下文）

3. 模型管理页生效：

- 内置模型已安装
- 非内置模型可下载并状态流转正确

4. 保持现有主流程可演示，不出现“接入真模型后 UI 主流程失效”

---

## 八、交付要求

完成后请输出：

1. 已接入的真实能力清单
2. 仍保留 mock 的能力点
3. 新增/修改的核心文件路径
4. 运行命令（含模型初始化）
5. 已知限制与下一步建议
