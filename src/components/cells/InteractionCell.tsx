import type { ReactNode } from 'react';
import type { TestInteractionResponse } from '@sudobility/testomniac_types';
import { StatusBadge } from '../scanner/StatusBadge';
import { ListCell } from './ListCell';

export interface InteractionCellProps {
  interaction: TestInteractionResponse;
  onClick?: () => void;
  actions?: ReactNode;
  /** Optional leading content (e.g. a step number inside a sequence). */
  leading?: ReactNode;
}

/**
 * Canonical cell for a TestInteraction — title over its starting path, with the
 * test-type badge trailing. Matches the Test Interactions screen so the same
 * interaction looks identical everywhere it appears (sequences, bundles,
 * scaffolds, page detail, …).
 */
export function InteractionCell({ interaction, onClick, actions, leading }: InteractionCellProps) {
  return (
    <ListCell
      leading={leading}
      title={interaction.title}
      subtitle={interaction.startingPath || '/'}
      trailing={<StatusBadge status={interaction.testType} />}
      actions={actions}
      onClick={onClick}
    />
  );
}
