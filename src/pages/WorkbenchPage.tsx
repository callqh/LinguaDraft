import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PanelLeftOpen } from "lucide-react";
import { InputComposer } from "@/components/InputComposer";
import { RecordCard } from "@/components/RecordCard";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useUiStore } from "@/stores/useUiStore";

const EmptyRecordsState = () => (
  <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center text-textMuted">
    <svg
      width="220"
      height="160"
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mb-4"
    >
      <rect x="18" y="20" width="184" height="120" rx="20" fill="#F8FAFC" />
      <rect x="34" y="36" width="96" height="12" rx="6" fill="#DBEAFE" />
      <rect x="34" y="56" width="152" height="8" rx="4" fill="#E2E8F0" />
      <rect x="34" y="70" width="132" height="8" rx="4" fill="#E2E8F0" />
      <rect x="34" y="84" width="120" height="8" rx="4" fill="#E2E8F0" />
      <rect x="34" y="104" width="64" height="24" rx="12" fill="#DBEAFE" />
      <circle cx="166" cy="108" r="20" fill="#EFF6FF" />
      <path
        d="M158 108L164 114L174 102"
        stroke="#2563EB"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <p className="text-sm text-textMain">还没有写作记录</p>
    <p className="mt-1 text-xs">输入一段内容或使用语音录入，开始第一条记录</p>
  </div>
);

export const WorkbenchPage = () => {
  const navigate = useNavigate();
  const currentSession = useAppStore((state) => state.getCurrentSession());
  const inputText = useAppStore((state) => state.inputText);
  const setInputText = useAppStore((state) => state.setInputText);
  const translationEnabled = useAppStore((state) => state.translationEnabled);
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
  const cancelVoiceInput = useAppStore((state) => state.cancelVoiceInput);
  const getTranslationModelByLanguage = useAppStore(
    (state) => state.getTranslationModelByLanguage,
  );
  const deepSeekEnabled = useSettingsStore((state) => state.deepSeekEnabled);
  const deepSeekApiKey = useSettingsStore((state) => state.deepSeekApiKey);
  const openDialog = useUiStore((state) => state.openDialog);
  const showToast = useUiStore((state) => state.showToast);
  const sidebarPinned = useUiStore((state) => state.sidebarPinned);
  const setSidebarPinned = useUiStore((state) => state.setSidebarPinned);
  const setSidebarPeek = useUiStore((state) => state.setSidebarPeek);
  const scheduleSidebarPeekHide = useUiStore(
    (state) => state.scheduleSidebarPeekHide,
  );
  const cancelSidebarPeekHide = useUiStore(
    (state) => state.cancelSidebarPeekHide,
  );
  const recordsScrollRef = useRef<HTMLDivElement | null>(null);
  const records = currentSession?.records ?? [];
  const displayRecords = [...records].reverse();
  const remoteTranslationActive = deepSeekEnabled && Boolean(deepSeekApiKey.trim());

  const scrollToBottom = useCallback(() => {
    const container = recordsScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

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
    if (recordingState === "recording") {
      await cancelVoiceInput(showToast);
      return;
    }
    if (translationEnabled && !remoteTranslationActive) {
      const model = getTranslationModelByLanguage(targetLang);
      if (!model || model.status !== "installed") {
        openModelDialog(targetLang);
      }
    }
    await submitInput(showToast);
  };

  const handleVoice = useCallback(async () => {
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
  }, [navigate, openDialog, recordingState, showToast, startVoiceInput, stopVoiceInput]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "t") {
        event.preventDefault();
        void handleVoice();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleVoice]);

  useEffect(() => {
    scrollToBottom();
  }, [records.length, currentSession?.id, scrollToBottom]);

  const handleLangChange = (value: string) => {
    setTargetLang(value);
    if (remoteTranslationActive) return;
    const model = getTranslationModelByLanguage(value);
    if (!model || model.status !== "installed") {
      openModelDialog(value);
    }
  };

  const onRetranslate = async (recordId: string, lang: string) => {
    const result = await retranslateRecord(recordId, lang, showToast);
    if (result === "missing-model" && !remoteTranslationActive) {
      openModelDialog(lang);
    }
    requestAnimationFrame(() => scrollToBottom());
  };

  return (
    <div className="relative h-full grid grid-rows-[1fr_auto] gap-3">
      {!sidebarPinned ? (
        <button
          aria-label="展开侧边栏"
          className="absolute left-1 top-1 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          onMouseEnter={() => {
            cancelSidebarPeekHide();
            setSidebarPeek(true);
          }}
          onMouseLeave={() => scheduleSidebarPeekHide(180)}
          onClick={() => {
            setSidebarPinned(true);
            setSidebarPeek(false);
          }}
        >
          <PanelLeftOpen size={16} />
        </button>
      ) : null}
      <div className="grid grid-cols-1fr min-h-0">
        <div className="panel min-h-0 flex flex-col">
          <div
            ref={recordsScrollRef}
            className="flex-1 min-h-0 overflow-auto space-y-1 p-3 pr-2"
          >
            {records.length > 0 ? (
              displayRecords.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onRetranslate={onRetranslate}
                  onNotify={showToast}
                />
              ))
            ) : (
              <EmptyRecordsState />
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
