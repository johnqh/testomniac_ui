import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sudobility/components';

/** Sentinel for an empty-string option value — Radix `SelectItem` forbids `""`. */
const EMPTY_VALUE = '__empty__';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Classes for the trigger (e.g. width). */
  className?: string;
}

/**
 * Thin adapter over the shared `@sudobility/components` `Select` that keeps the
 * familiar native-`<select>` API (`value`/`onChange(value)`/`options`) and
 * safely maps the empty-string value (used by "All …" filters) to a sentinel,
 * since Radix's `SelectItem` rejects `value=""`.
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
}: SelectFieldProps) {
  return (
    <Select
      value={value === '' ? EMPTY_VALUE : value}
      onValueChange={v => onChange(v === EMPTY_VALUE ? '' : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value === '' ? EMPTY_VALUE : option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
