import type { ReactNode } from 'react';
import type { ScaffoldResponse } from '@sudobility/testomniac_types';
import { ListCell, ChevronRight } from './ListCell';
import { SCAFFOLD_ICONS, SCAFFOLD_LABELS } from './scaffoldMeta';

export interface ScaffoldCellProps {
  scaffold: ScaffoldResponse;
  /** Number of pages using this scaffold (rendered as the subtitle). */
  pageCount?: number;
  onClick?: () => void;
  actions?: ReactNode;
}

/** Canonical cell for a Scaffold — type icon + label, page count, navigable chevron. */
export function ScaffoldCell({ scaffold, pageCount, onClick, actions }: ScaffoldCellProps) {
  return (
    <ListCell
      leading={SCAFFOLD_ICONS[scaffold.type]}
      title={SCAFFOLD_LABELS[scaffold.type] ?? scaffold.type}
      subtitle={
        pageCount != null && pageCount > 0
          ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`
          : undefined
      }
      trailing={onClick ? <ChevronRight /> : undefined}
      actions={actions}
      onClick={onClick}
    />
  );
}
