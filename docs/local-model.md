# LinguaDraft 本地模型技术方案（MVP -> 可扩展）

## 1. 目标与约束

- 默认内置能力：
  - 语音识别（中文优先，兼容英文）
  - 中译英、英译中
- 其他翻译语言模型：用户手动下载
- 模型整体策略：`够小够用`，优先离线可跑、可控包体、可维护
- 对齐现有架构：保留 `src/services/*` 与 `zustand store` 调用方式，底层从 mock 切到 Electron IPC

---

## 2. 推荐模型选型（小模型优先）

## 2.1 内置语音识别模型（ASR）

- 推荐：`whisper.cpp + ggml-tiny`（多语版）
- 原因：
  - 模型体积小（量化后通常在几十 MB 级别）
  - CPU 可用，离线稳定
  - 工程接入简单（CLI/动态库都可）
- 能力边界：
  - 中文短句、英文短句可用
  - 长音频与复杂口音准确率有限（MVP可接受）

## 2.2 内置翻译模型（中英互译）

- 推荐：`Marian/OPUS-MT` 两个方向的小模型
  - `zh -> en`
  - `en -> zh`
- 推理后端建议：`CTranslate2`（int8 量化）
- 原因：
  - 相比大模型显著更小
  - 中英场景可满足 MVP 写作辅助
  - 可统一后续多语言模型扩展路径

## 2.3 手动下载模型（其余语言）

- 使用同一翻译后端（CTranslate2），仅新增模型包
- 第一批可下载：`ja/ko/fr/de/ru/es/it` 相关双向或与英文桥接模型
- 下载后进入模型管理页中的 `installed` 状态即可使用

注：最终模型体积与效果以实测为准，建议在 `Apple M 系列` 与 `Windows x64` 各做一轮 benchmark 后锁版本。

---

## 3. 与当前系统的集成方式

当前前端已抽象：
- `translationService.detectLanguage/translate`
- `voiceService.startRecording/stopRecording/transcribe`
- `modelService.download/pause/resume/cancel/delete`

建议替换策略：

1. 保留 `src/services/*.ts` 方法签名不变  
2. 在 renderer 内通过 `window.linguaDraft` 调 Electron IPC  
3. 在 `electron/main.ts` 新增本地模型调度模块（ModelRuntime + DownloadManager）  
4. 前端 store 无需大改，只替换 service 实现

---

## 4. 运行时架构（建议）

```text
Renderer(React/Zustand)
  -> services (IPC client)
    -> Electron Main
      -> ModelRuntime
         - ASR Runner (whisper.cpp)
         - Translation Runner (CTranslate2)
      -> ModelManager
         - manifest 管理
         - 下载/暂停/续传/校验
         - 安装与删除
```

---

## 5. 文件与目录规划（新增）

```text
local-model/
├── technical-plan.md
├── manifest/
│   ├── builtin.manifest.json
│   └── remote.manifest.json
├── runtime/
│   ├── whisper/              # whisper.cpp 二进制与配置
│   └── ctranslate2/          # 翻译推理运行时
└── models/
    ├── builtin/
    │   ├── asr/whisper-tiny/
    │   └── translation/
    │       ├── zh-en/
    │       └── en-zh/
    └── downloaded/
```

用户目录（实际运行）建议放：
- macOS: `~/Library/Application Support/lingua-draft/models`
- Windows: `%APPDATA%/lingua-draft/models`

安装时把内置模型从 app 资源目录拷贝到用户目录，避免权限问题。

---

## 6. 模型管理协议（与现有 UI 状态对齐）

沿用现有 `LocalModel.status`：
- `not_installed`
- `downloading`
- `paused`
- `installed`
- `failed`

新增 manifest 字段建议：

```ts
type ModelManifestItem = {
  id: string
  type: 'asr' | 'translation'
  language?: string
  direction?: 'zh-en' | 'en-zh' | string
  version: string
  size: number
  sha256: string
  downloadUrl?: string
  builtIn: boolean
  minAppVersion: string
}
```

---

## 7. 下载与校验策略

- 分片下载（支持断点续传）
- 下载中写临时文件：`*.part`
- 完成后校验 `sha256`
- 校验通过再原子 rename 为正式文件
- 任意步骤失败 -> `failed`，保留日志便于重试

---

## 8. 核心接口定义（替换 mock 的目标）

## 8.1 Renderer -> IPC

- `model:list()`
- `model:download(modelId)`
- `model:pause(modelId)`
- `model:resume(modelId)`
- `model:cancel(modelId)`
- `model:delete(modelId)`
- `asr:start()`
- `asr:stop()`
- `asr:transcribe(audioPath | audioBuffer)`
- `translation:detect(text)`
- `translation:run(text, targetLang)`

## 8.2 前端 service 落地方式

- `src/services/voiceService.ts`
  - 从延时 mock 改为调用 `window.linguaDraft.asr.*`
- `src/services/translationService.ts`
  - 从字符串拼接 mock 改为 `window.linguaDraft.translation.*`
- `src/services/modelService.ts`
  - 由计时器 mock 改为主进程真实下载事件

---

## 9. MVP 验收标准（本地模型版）

- 冷启动后不联网可完成：
  - 语音录入（短句）
  - 中英互译
- 模型管理页可见：
  - 内置模型为 `installed`
  - 其他语言模型为 `not_installed`
- 下载模型流程可恢复（暂停/继续/失败重试）
- 失败时有可追踪日志（主进程文件日志）

---

## 10. 实施里程碑

1. `M1`：接入 IPC 骨架，保留 mock 兜底  
2. `M2`：内置 ASR 跑通（whisper tiny）  
3. `M3`：内置中英翻译跑通（zh-en / en-zh）  
4. `M4`：下载管理替换 mock（断点续传 + 校验）  
5. `M5`：性能与包体优化（量化、懒加载、压缩）  

---

## 11. 风险与对策

- 风险：模型体积超预期  
  - 对策：统一 int8 量化；内置仅保留 3 个核心模型
- 风险：CPU 延迟高  
  - 对策：限制单次输入长度；分段翻译；异步队列
- 风险：跨平台二进制差异  
  - 对策：runtime 按平台打包；启动时校验版本与可执行性
- 风险：模型许可变更  
  - 对策：在 manifest 固化模型版本与许可证信息，发版前复核
