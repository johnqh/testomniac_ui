import type { ReactNode } from 'react';
import type { TestInteractionResponse } from '@sudobility/testomniac_types';
import { GridTile } from '@sudobility/components';
import { StatusBadge } from '../scanner/StatusBadge';
import { ListCell } from './ListCell';

export interface InteractionCellProps {
  interaction: TestInteractionResponse;
  onClick?: () => void;
  actions?: ReactNode;
  /** Optional leading content (e.g. a step number inside a sequence). */
  leading?: ReactNode;
  /** `row` (default, full-width ListCell) or `tile` (compact card for CardGrid). */
  variant?: 'row' | 'tile';
  /** Reduces row padding when used inside a tightened list (row variant only). */
  compact?: boolean;
}

/**
 * Canonical cell for a TestInteraction — title over its starting path, with the
 * test-type badge trailing. Matches the Test Interactions screen so the same
 * interaction looks identical everywhere it appears (sequences, bundles,
 * scaffolds, page detail, …).
 */
export function InteractionCell({
  interaction,
  onClick,
  actions,
  leading,
  variant = 'row',
  compact = false,
}: InteractionCellProps) {
  if (variant === 'tile') {
    return (
      <GridTile
        leading={leading}
        title={interaction.title}
        subtitle={interaction.startingPath || '/'}
        footer={<StatusBadge status={interaction.testType} />}
        actions={actions}
        onClick={onClick}
      />
    );
  }
  return (
    <ListCell
      compact={compact}
      leading={leading}
      title={interaction.title}
      subtitle={interaction.startingPath || '/'}
      trailing={<StatusBadge status={interaction.testType} />}
      actions={actions}
      onClick={onClick}
    />
  );
}
