import { Button } from "@/components/ui/button";

interface SavedViewActionsProps {
  onReset: () => void;
  onSaveAsNew: () => void;
  onSave: () => void;
}

export function SavedViewActions({
  onReset,
  onSaveAsNew,
  onSave,
}: SavedViewActionsProps) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={onReset}>
        Reset
      </Button>
      <Button variant="ghost" size="sm" onClick={onSaveAsNew}>
        Save as new view
      </Button>
      <Button size="sm" onClick={onSave}>
        Save
      </Button>
    </>
  );
}

interface NewViewActionsProps {
  onClear: () => void;
  onSaveAsNew: () => void;
}

export function NewViewActions({ onClear, onSaveAsNew }: NewViewActionsProps) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
      <Button size="sm" onClick={onSaveAsNew}>
        Save as view
      </Button>
    </>
  );
}
