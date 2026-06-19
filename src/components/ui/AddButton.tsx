import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Button } from '@sudobility/components';

interface AddButtonProps {
  /** Accessible label for the add action, e.g. "New Bundle". */
  label: string;
  onClick: () => void;
  /**
   * When the add button toggles an inline form, pass the open state — the icon
   * switches to a close (×) glyph while the form is open.
   */
  active?: boolean;
  disabled?: boolean;
}

/**
 * Compact primary-colored "+" icon button used for all "add object" actions
 * (New Bundle / New Scenario / New Persona / …), for visual consistency.
 * Switches to a "×" when `active` (its form is open).
 */
export function AddButton({ label, onClick, active = false, disabled }: AddButtonProps) {
  return (
    <Button
      type="button"
      variant="primary"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={active ? `Cancel ${label}` : label}
      title={active ? 'Cancel' : label}
    >
      {active ? <XMarkIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
    </Button>
  );
}
