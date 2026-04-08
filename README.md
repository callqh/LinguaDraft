# LinguaDraft MVP

基于 `Electron + React + TypeScript + Vite + Tailwind CSS + React Router + Zustand` 的离线写作翻译工具原型。

## 1. 启动方式

```bash
pnpm install
pnpm approve-builds
pnpm dev
```

构建：

```bash
pnpm build
```

首次使用 `pnpm approve-builds` 时，请选择并允许 `electron`。

## 2. 项目目录结构

```text
.
├── electron
│   ├── main.ts
│   ├── preload.ts
│   └── tsconfig.json
├── src
│   ├── components
│   ├── pages
│   ├── layouts
│   ├── stores
│   ├── services
│   ├── hooks
│   ├── types
│   ├── utils
│   ├── mock
│   ├── assets
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs
└── package.json
```

## 3. 已实现功能清单（MVP）

- 默认进入工作台页面
- 文本输入、提交生成历史记录
- 翻译开关 + 目标语言切换（影响后续新提交）
- 自动识别语种（mock）
- 历史记录重翻译并覆盖同条记录，不新增记录
- 语音录入流程：录音中 -> 识别中 -> 回填输入框（mock）
- 模型管理页：查看状态、下载、暂停、继续、取消、删除、进度展示
- 设置页：通用/语音输入/翻译/存储/关于
- 全局弹窗与 Toast 提示（替代 alert）
- 异常提示：空输入、模型未安装、翻译失败、语音识别失败、下载失败

## 4. 主流程说明

### 流程 1：输入提交

在工作台输入区输入文本，点击提交后会新增一条历史记录；若翻译开关开启则进入翻译并回填译文。

### 流程 2：翻译开关和目标语言

可切换翻译开关与目标语言。切换语言后仅影响后续新提交记录，不影响已有历史。

### 流程 3：重翻译覆盖

历史卡片中可选择语言并点击“重新翻译”，会覆盖该记录的译文与目标语言，不新增记录。

### 流程 4：语音录入

点击语音按钮进入录音，再次点击结束录音，进入识别中，返回 mock 转写文本并回填输入框。

### 流程 5：模型下载

模型管理页支持下载、暂停、继续、取消与删除，下载中显示进度，完成后变为已安装。

### 流程 6：未安装模型提示

当目标翻译语言或语音模型未安装时，弹出统一对话框提示，可一键跳转模型管理页。

## 5. mock 服务说明

`src/services/translationService.ts`
- `detectLanguage(text)`
- `translate(text, targetLang)`
- 带延迟与随机失败模拟

`src/services/voiceService.ts`
- `startRecording()`
- `stopRecording()`
- `transcribe()`
- 完整录音状态切换 + 随机失败模拟

`src/services/modelService.ts`
- `getModels()`
- `downloadModel(modelId, ...)`
- `pauseDownload(modelId)`
- `resumeDownload(modelId)`
- `cancelDownload(modelId)`
- `deleteModel(modelId)`
- 下载进度、完成、失败模拟

## 6. 待接入真实本地能力的接口点

- `translationService`：替换为本地翻译模型推理接口（可走 Electron IPC）
- `voiceService`：替换为本地 ASR 录音/转写能力
- `modelService`：替换为真实模型下载器、断点续传与文件落盘逻辑
- `stores/useAppStore.ts`：当前 action 已抽象为服务调用，直接替换服务层即可

## 7. 当前哪些功能是 mock

- 语种识别
- 翻译结果
- 语音识别文本
- 模型下载进度与失败概率
- 麦克风权限状态检查
