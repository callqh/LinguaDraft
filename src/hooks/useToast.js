import { useUiStore } from "@/stores/useUiStore";
export const useToast = () => {
    const showToast = useUiStore((state) => state.showToast);
    return { showToast };
};
