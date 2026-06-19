import type { ReactNode } from 'react';
import type { ScaffoldResponse } from '@sudobility/testomniac_types';
import { GridTile } from '@sudobility/components';
import { ListCell, ChevronRight } from './ListCell';
import { SCAFFOLD_ICONS, SCAFFOLD_LABELS } from './scaffoldMeta';

export interface ScaffoldCellProps {
  scaffold: ScaffoldResponse;
  /** Number of pages using this scaffold (rendered as the subtitle). */
  pageCount?: number;
  onClick?: () => void;
  actions?: ReactNode;
  /** `row` (default, full-width ListCell) or `tile` (compact card for CardGrid). */
  variant?: 'row' | 'tile';
}

/** Canonical cell for a Scaffold — type icon + label, page count, navigable chevron. */
export function ScaffoldCell({
  scaffold,
  pageCount,
  onClick,
  actions,
  variant = 'row',
}: ScaffoldCellProps) {
  const label = SCAFFOLD_LABELS[scaffold.type] ?? scaffold.type;
  const subtitle =
    pageCount != null && pageCount > 0
      ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`
      : undefined;

  if (variant === 'tile') {
    return (
      <GridTile
        leading={SCAFFOLD_ICONS[scaffold.type]}
        title={label}
        subtitle={subtitle}
        actions={actions}
        onClick={onClick}
      />
    );
  }
  return (
    <ListCell
      leading={SCAFFOLD_ICONS[scaffold.type]}
      title={label}
      subtitle={subtitle}
      trailing={onClick ? <ChevronRight /> : undefined}
      actions={actions}
      onClick={onClick}
    />
  );
}
