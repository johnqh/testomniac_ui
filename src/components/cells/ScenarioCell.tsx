import type { ReactNode } from 'react';
import type { TestScenarioResponse } from '@sudobility/testomniac_types';
import { GridTile } from '@sudobility/components';
import { StatusBadge } from '../scanner/StatusBadge';
import { ListCell } from './ListCell';

export interface ScenarioCellProps {
  scenario: TestScenarioResponse;
  onClick?: () => void;
  actions?: ReactNode;
  /** Overrides the default trailing (device badge) — e.g. to prepend a persona label. */
  trailing?: ReactNode;
  /** `row` (default, full-width ListCell) or `tile` (compact card for CardGrid). */
  variant?: 'row' | 'tile';
}

/** Canonical cell for a TestScenario — title over its starting path, device badge trailing. */
export function ScenarioCell({
  scenario,
  onClick,
  actions,
  trailing,
  variant = 'row',
}: ScenarioCellProps) {
  if (variant === 'tile') {
    return (
      <GridTile
        title={scenario.title}
        subtitle={scenario.startingPath || '/'}
        footer={trailing ?? <StatusBadge status={scenario.sizeClass} />}
        actions={actions}
        onClick={onClick}
      />
    );
  }
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
