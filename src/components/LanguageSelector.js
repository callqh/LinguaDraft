import { jsx as _jsx } from "react/jsx-runtime";
import { languageOptions } from "@/mock/data";
export const LanguageSelector = ({ value, onChange, className }) => (_jsx("select", { value: value, onChange: (event) => onChange(event.target.value), className: `h-10 rounded-xl border border-borderSoft bg-white px-3 text-sm outline-none ${className ?? ""}`, children: languageOptions.map((item) => (_jsx("option", { value: item.label, children: item.label }, item.code))) }));
