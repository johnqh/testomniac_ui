import type { ReactNode } from 'react';
import type { TestSurfaceBundleResponse } from '@sudobility/testomniac_types';
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
            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              auto
            </span>
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
