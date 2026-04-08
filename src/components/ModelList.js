import { jsx as _jsx } from "react/jsx-runtime";
import { ModelRow } from "@/components/ModelRow";
export const ModelList = ({ models, onDownload, onPause, onResume, onCancel, onDelete }) => (_jsx("div", { className: "space-y-2", children: models.map((model) => (_jsx(ModelRow, { model: model, onDownload: onDownload, onPause: onPause, onResume: onResume, onCancel: onCancel, onDelete: onDelete }, model.id))) }));
