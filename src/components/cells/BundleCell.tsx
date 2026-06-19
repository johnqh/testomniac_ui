import type { ReactNode } from 'react';
import type { TestSurfaceBundleResponse } from '@sudobility/testomniac_types';
import { Badge, GridTile } from '@sudobility/components';
import { ListCell, ChevronRight } from './ListCell';

export interface BundleCellProps {
  bundle: TestSurfaceBundleResponse;
  onClick?: () => void;
  actions?: ReactNode;
  /** `row` (default, full-width ListCell) or `tile` (compact card for CardGrid). */
  variant?: 'row' | 'tile';
}

/** Canonical cell for a TestSurfaceBundle — title (with an "auto" tag for the Discovery bundle) and description. */
export function BundleCell({ bundle, onClick, actions, variant = 'row' }: BundleCellProps) {
  const isAuto = bundle.title === 'Discovery';
  const title = (
    <span className="inline-flex items-center">
      {bundle.title}
      {isAuto && (
        <Badge variant="default" size="sm" className="ml-2">
          auto
        </Badge>
      )}
    </span>
  );

  if (variant === 'tile') {
    return (
      <GridTile
        title={title}
        subtitle={bundle.description || undefined}
        actions={actions}
        onClick={onClick}
      />
    );
  }
  return (
    <ListCell
      title={title}
      subtitle={bundle.description || undefined}
      trailing={onClick ? <ChevronRight /> : undefined}
      actions={actions}
      onClick={onClick}
    />
  );
}
