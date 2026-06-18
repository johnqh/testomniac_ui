import type { ReactNode } from 'react';
import type { TestSurfaceBundleResponse } from '@sudobility/testomniac_types';
import { Badge } from '@sudobility/components';
import { ListCell, ChevronRight } from './ListCell';

export interface BundleCellProps {
  bundle: TestSurfaceBundleResponse;
  onClick?: () => void;
  actions?: ReactNode;
}

/** Canonical cell for a TestSurfaceBundle — title (with an "auto" tag for the Discovery bundle) and description. */
export function BundleCell({ bundle, onClick, actions }: BundleCellProps) {
  const isAuto = bundle.title === 'Discovery';
  return (
    <ListCell
      title={
        <span className="inline-flex items-center">
          {bundle.title}
          {isAuto && (
            <Badge variant="default" size="sm" className="ml-2">
              auto
            </Badge>
          )}
        </span>
      }
      subtitle={bundle.description || undefined}
      trailing={onClick ? <ChevronRight /> : undefined}
      actions={actions}
      onClick={onClick}
    />
  );
}
