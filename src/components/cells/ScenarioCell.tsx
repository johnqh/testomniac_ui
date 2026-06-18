import type { ReactNode } from 'react';
import type { TestScenarioResponse } from '@sudobility/testomniac_types';
import { StatusBadge } from '../scanner/StatusBadge';
import { ListCell } from './ListCell';

export interface ScenarioCellProps {
  scenario: TestScenarioResponse;
  onClick?: () => void;
  actions?: ReactNode;
  /** Overrides the default trailing (device badge) — e.g. to prepend a persona label. */
  trailing?: ReactNode;
}

/** Canonical cell for a TestScenario — title over its starting path, device badge trailing. */
export function ScenarioCell({ scenario, onClick, actions, trailing }: ScenarioCellProps) {
  return (
    <ListCell
      title={scenario.title}
      subtitle={scenario.startingPath || '/'}
      trailing={trailing ?? <StatusBadge status={scenario.sizeClass} />}
      actions={actions}
      onClick={onClick}
    />
  );
}
