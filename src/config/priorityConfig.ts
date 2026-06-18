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
  0: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  1: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  2: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  3: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  4: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200',
};

/** Outlined "chip" classes (with border) per priority level. */
const PRIORITY_CHIP_CLASSNAMES: Record<number, string> = {
  0: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
  1: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  2: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  3: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  4: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600',
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
