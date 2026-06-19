import type { ReactNode } from 'react';
import type { PersonaResponse } from '@sudobility/testomniac_types';
import { GridTile } from '@sudobility/components';
import { ListCell } from './ListCell';

export interface PersonaCellProps {
  persona: PersonaResponse;
  onClick?: () => void;
  actions?: ReactNode;
  /** `row` (default, full-width ListCell) or `tile` (compact card for CardGrid). */
  variant?: 'row' | 'tile';
}

/** Canonical cell for a Persona — title over description, with action buttons trailing. */
export function PersonaCell({ persona, onClick, actions, variant = 'row' }: PersonaCellProps) {
  const colorDot = persona.color ? (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: persona.color }}
    />
  ) : undefined;

  if (variant === 'tile') {
    return (
      <GridTile
        leading={colorDot}
        title={persona.title}
        subtitle={persona.description || undefined}
        actions={actions}
        onClick={onClick}
      />
    );
  }
  return (
    <ListCell
      leading={colorDot}
      title={persona.title}
      subtitle={persona.description || undefined}
      actions={actions}
      onClick={onClick}
    />
  );
}
