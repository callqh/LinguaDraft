import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { InputComposer } from "@/components/InputComposer";
import { RecordCard } from "@/components/RecordCard";
import { TopStatusBar } from "@/components/TopStatusBar";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
export const WorkbenchPage = () => {
    const navigate = useNavigate();
    const currentSession = useAppStore((state) => state.getCurrentSession());
    const inputText = useAppStore((state) => state.inputText);
    const setInputText = useAppStore((state) => state.setInputText);
    const translationEnabled = useAppStore((state) => state.translationEnabled);
    const setTranslationEnabled = useAppStore((state) => state.setTranslationEnabled);
    const targetLang = useAppStore((state) => state.targetLang);
    const setTargetLang = useAppStore((state) => state.setTargetLang);
    const detectedSourceLang = useAppStore((state) => state.detectedSourceLang);
    const recordingState = useAppStore((state) => state.recordingState);
    const submitInput = useAppStore((state) => state.submitInput);
    const retranslateRecord = useAppStore((state) => state.retranslateRecord);
    const startVoiceInput = useAppStore((state) => state.startVoiceInput);
    const stopVoiceInput = useAppStore((state) => state.stopVoiceInput);
    const getTranslationModelByLanguage = useAppStore((state) => state.getTranslationModelByLanguage);
    const openDialog = useUiStore((state) => state.openDialog);
    const showToast = useUiStore((state) => state.showToast);
    const openModelDialog = (lang) => {
        openDialog({
            title: "模型未安装",
            description: `${lang}模型尚未安装，是否前往模型管理页下载？`,
            confirmText: "去下载",
            cancelText: "稍后",
            onConfirm: () => navigate("/models")
        });
    };
    const handleSubmit = async () => {
        if (translationEnabled) {
            const model = getTranslationModelByLanguage(targetLang);
            if (!model || model.status !== "installed") {
                openModelDialog(targetLang);
            }
        }
        await submitInput(showToast);
    };
    const handleVoice = async () => {
        if (recordingState === "recording") {
            await stopVoiceInput(showToast);
            return;
        }
        const result = await startVoiceInput(showToast);
        if (result === "missing-model") {
            openDialog({
                title: "语音模型未安装",
                description: "语音录入需要先安装语音识别模型，是否前往模型管理下载？",
                confirmText: "去下载",
                cancelText: "取消",
                onConfirm: () => navigate("/models")
            });
        }
    };
    const handleLangChange = (value) => {
        setTargetLang(value);
        const model = getTranslationModelByLanguage(value);
        if (!model || model.status !== "installed") {
            openModelDialog(value);
        }
    };
    const onRetranslate = async (recordId, lang) => {
        const result = await retranslateRecord(recordId, lang, showToast);
        if (result === "missing-model")
            openModelDialog(lang);
    };
    return (_jsxs("div", { className: "h-full grid grid-rows-[auto_1fr_auto] gap-3", children: [_jsx(TopStatusBar, { title: currentSession?.title ?? "未命名写作", detectedLang: detectedSourceLang, translationEnabled: translationEnabled, targetLang: targetLang }), _jsxs("div", { className: "grid grid-cols-[1fr_300px] gap-3 min-h-0", children: [_jsx("div", { className: "panel p-3 min-h-0 flex flex-col gap-3", children: _jsx("div", { className: "flex-1 min-h-0 overflow-auto space-y-3 pr-1", children: currentSession?.records.map((record) => (_jsx(RecordCard, { record: record, onRetranslate: onRetranslate }, record.id))) }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "panel p-4", children: [_jsx("h3", { className: "font-medium mb-2", children: "\u5F53\u524D\u72B6\u6001" }), _jsxs("div", { className: "text-sm text-textMuted space-y-2", children: [_jsxs("div", { children: ["\u8F93\u5165\u65B9\u5F0F\uFF1A", recordingState === "idle" ? "键盘输入" : "语音录入"] }), _jsxs("div", { children: ["\u8BC6\u522B\u8BED\u79CD\uFF1A", detectedSourceLang] }), _jsxs("div", { children: ["\u7FFB\u8BD1\u72B6\u6001\uFF1A", translationEnabled ? "开启" : "关闭"] }), _jsx("div", { children: "\u6A21\u578B\u72B6\u6001\uFF1A\u672C\u5730 mock" })] })] }), _jsxs("div", { className: "panel p-4", children: [_jsx("h3", { className: "font-medium mb-2", children: "\u8BED\u97F3\u5F55\u5165\u72B6\u6001" }), _jsxs("div", { className: "text-sm text-textMuted", children: [recordingState === "idle" && "未开始", recordingState === "recording" && "录音中", recordingState === "transcribing" && "识别中", recordingState === "failed" && "识别失败"] })] }), _jsx("div", { className: "panel p-4 text-sm text-textMuted", children: "\u8F93\u5165\u533A\u652F\u6301\u6587\u672C\u548C mock \u8BED\u97F3\u8F6C\u5199\uFF0C\u53EF\u76F4\u63A5\u63D0\u4EA4\u5E76\u751F\u6210\u5386\u53F2\u8BB0\u5F55\u3002" })] })] }), _jsx(InputComposer, { inputText: inputText, onChange: setInputText, onSubmit: handleSubmit, translationEnabled: translationEnabled, onTranslationToggle: setTranslationEnabled, targetLang: targetLang, onTargetLangChange: handleLangChange, recordingState: recordingState, onVoiceClick: handleVoice })] }));
};
