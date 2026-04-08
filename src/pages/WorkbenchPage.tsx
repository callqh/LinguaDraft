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
  const detectedSourceLang = useAppStore((state) => state.detectedSourceLang);
  const setTranslationEnabled = useAppStore(
    (state) => state.setTranslationEnabled,
  );
  const targetLang = useAppStore((state) => state.targetLang);
  const setTargetLang = useAppStore((state) => state.setTargetLang);
  const recordingState = useAppStore((state) => state.recordingState);
  const submitInput = useAppStore((state) => state.submitInput);
  const retranslateRecord = useAppStore((state) => state.retranslateRecord);
  const startVoiceInput = useAppStore((state) => state.startVoiceInput);
  const stopVoiceInput = useAppStore((state) => state.stopVoiceInput);
  const getTranslationModelByLanguage = useAppStore(
    (state) => state.getTranslationModelByLanguage,
  );
  const openDialog = useUiStore((state) => state.openDialog);
  const showToast = useUiStore((state) => state.showToast);
  const sidebarPinned = useUiStore((state) => state.sidebarPinned);
  const setSidebarPinned = useUiStore((state) => state.setSidebarPinned);
  const setSidebarPeek = useUiStore((state) => state.setSidebarPeek);
  const records = currentSession?.records ?? [];

  const openModelDialog = (lang: string) => {
    openDialog({
      title: "模型未安装",
      description: `${lang}模型尚未安装，是否前往模型管理页下载？`,
      confirmText: "去下载",
      cancelText: "稍后",
      onConfirm: () => navigate("/models"),
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
        onConfirm: () => navigate("/models"),
      });
    }
  };

  const handleLangChange = (value: string) => {
    setTargetLang(value);
    const model = getTranslationModelByLanguage(value);
    if (!model || model.status !== "installed") {
      openModelDialog(value);
    }
  };

  const onRetranslate = async (recordId: string, lang: string) => {
    const result = await retranslateRecord(recordId, lang, showToast);
    if (result === "missing-model") openModelDialog(lang);
  };

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto] gap-3">
      <TopStatusBar
        title={currentSession?.title ?? "未命名写作"}
        detectedLang={detectedSourceLang}
        translationEnabled={translationEnabled}
        targetLang={targetLang}
        sidebarPinned={sidebarPinned}
        onToggleSidebarPinned={() => {
          const next = !sidebarPinned;
          setSidebarPinned(next);
          if (next) setSidebarPeek(false);
        }}
        onSidebarTriggerHover={(value) => {
          if (!sidebarPinned) setSidebarPeek(value);
        }}
      />
      <div className="grid grid-cols-1fr min-h-0">
        <div className="panel min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto space-y-1 p-3 pr-2">
            {records.length > 0 ? (
              records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onRetranslate={onRetranslate}
                  onNotify={showToast}
                />
              ))
            ) : (
              <div className="text-textMuted">没有记录</div>
            )}
          </div>
        </div>
      </div>

      <InputComposer
        inputText={inputText}
        onChange={setInputText}
        onSubmit={handleSubmit}
        translationEnabled={translationEnabled}
        onTranslationToggle={setTranslationEnabled}
        targetLang={targetLang}
        onTargetLangChange={handleLangChange}
        recordingState={recordingState}
        onVoiceClick={handleVoice}
      />
    </div>
  );
};
