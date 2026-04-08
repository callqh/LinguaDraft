import type { LocalModel } from "@/types";
import { ModelRow } from "@/components/ModelRow";

type Props = {
  models: LocalModel[];
  onDownload: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
};

export const ModelList = ({ models, onDownload, onPause, onResume, onCancel, onDelete }: Props) => (
  <div className="space-y-2">
    {models.map((model) => (
      <ModelRow
        key={model.id}
        model={model}
        onDownload={onDownload}
        onPause={onPause}
        onResume={onResume}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    ))}
  </div>
);

