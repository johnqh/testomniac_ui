import { priorityLabel, priorityShortLabel } from '@sudobility/testomniac_lib';

/**
 * Presentation config for finding/issue priorities.
 *
 * The domain vocabulary (labels, levels, bands) lives in `testomniac_lib`; this
 * module owns only the Tailwind color classes and combines them with the lib
 * labels so list/detail pages share a single source instead of re-declaring the
 * `PRIORITY_CONFIG` map.
 */

/** Badge background/text classes per priority level. */
const PRIORITY_CLASSNAMES: Record<number, string> = {
  0: 'bg-destructive/10 text-destructive',
  1: 'bg-warning/10 text-warning',
  2: 'bg-warning/10 text-warning',
  3: 'bg-info/10 text-info',
  4: 'bg-muted text-muted-foreground',
};

/** Outlined "chip" classes (with border) per priority level. */
const PRIORITY_CHIP_CLASSNAMES: Record<number, string> = {
  0: 'bg-destructive/10 text-destructive border-destructive/20',
  1: 'bg-warning/10 text-warning border-warning/20',
  2: 'bg-warning/10 text-warning border-warning/20',
  3: 'bg-info/10 text-info border-info/20',
  4: 'bg-muted text-muted-foreground border-border',
};

export interface PriorityConfig {
  label: string;
  shortLabel: string;
  className: string;
  chipClassName: string;
}

/**
 * Returns the full presentation config for a priority level, falling back to
 * P3 (Minor) styling for unknown levels — matching the previous inline maps.
 */
export function getPriorityConfig(priority: number): PriorityConfig {
  const level = priority in PRIORITY_CLASSNAMES ? priority : 3;
  return {
    label: priorityLabel(level),
    shortLabel: priorityShortLabel(level),
    className: PRIORITY_CLASSNAMES[level],
    chipClassName: PRIORITY_CHIP_CLASSNAMES[level],
  };
}
