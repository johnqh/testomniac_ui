import type { ReactNode } from 'react';
import type { TestSurfaceResponse } from '@sudobility/testomniac_types';
import { Badge, GridTile } from '@sudobility/components';
import { StatusBadge } from '../scanner/StatusBadge';
import { ListCell } from './ListCell';

function FolderIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.06-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
      />
    </svg>
  );
}

/** Surface priority is a 0–10 scale (higher = more critical). */
export function SurfacePriorityBadge({ priority }: { priority: number }) {
  const label =
    priority >= 8 ? 'critical' : priority >= 5 ? 'high' : priority >= 3 ? 'medium' : 'low';
  const variant =
    priority >= 8 ? 'danger' : priority >= 5 ? 'warning' : priority >= 3 ? 'warning' : 'default';

  return (
    <Badge variant={variant} size="sm" pill>
      P{priority} {label}
    </Badge>
  );
}

export interface SurfaceCellProps {
  surface: TestSurfaceResponse;
  onClick?: () => void;
  actions?: ReactNode;
  /** `row` (default, full-width ListCell) or `tile` (compact card for CardGrid). */
  variant?: 'row' | 'tile';
}

/** Canonical cell for a TestSurface — folder icon, title, description/path, priority + device badges. */
export function SurfaceCell({ surface, onClick, actions, variant = 'row' }: SurfaceCellProps) {
  if (variant === 'tile') {
    return (
      <GridTile
        leading={<FolderIcon />}
        topRight={<SurfacePriorityBadge priority={surface.priority} />}
        title={surface.title}
        subtitle={surface.startingPath || '/'}
        footer={<StatusBadge status={surface.sizeClass} />}
        actions={actions}
        onClick={onClick}
      />
    );
  }
  return (
    <ListCell
      leading={<FolderIcon />}
      title={surface.title}
      subtitle={surface.description || surface.startingPath || '/'}
      trailing={
        <>
          <SurfacePriorityBadge priority={surface.priority} />
          <StatusBadge status={surface.sizeClass} />
        </>
      }
      actions={actions}
      onClick={onClick}
    />
  );
}
