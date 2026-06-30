import { ActionButton, Card, Checkbox } from '@sudobility/components';
import { EXPERTISE_OPTIONS } from '@sudobility/testomniac_lib';

/**
 * Presentational scan-settings editor: a checklist of expertises plus a save
 * action. Used for both the product-level defaults and the per-environment
 * overrides — the difference is purely which data the host wires in.
 */
export function ScanSettingsPanel({
  title,
  description,
  selectedExpertises,
  onToggle,
  onSave,
  isSaving,
  overrideCount,
}: {
  title: string;
  description: string;
  selectedExpertises: string[];
  onToggle: (slug: string, checked: boolean) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  overrideCount: number;
}) {
  return (
    <Card variant="bordered" className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EXPERTISE_OPTIONS.map(option => (
          <Checkbox
            key={option.slug}
            checked={selectedExpertises.includes(option.slug)}
            onChange={checked => onToggle(option.slug, checked)}
            label={option.label}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{overrideCount} rule override(s)</span>
        <ActionButton
          variant="primary"
          onClick={() => void onSave()}
          isLoading={isSaving}
          loadingText="Saving..."
        >
          Save
        </ActionButton>
      </div>
    </Card>
  );
}
