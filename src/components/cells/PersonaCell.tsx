import type { ReactNode } from 'react';
import type { PersonaResponse } from '@sudobility/testomniac_types';
import { ListCell } from './ListCell';

export interface PersonaCellProps {
  persona: PersonaResponse;
  onClick?: () => void;
  actions?: ReactNode;
}

/** Canonical cell for a Persona — title over description, with action buttons trailing. */
export function PersonaCell({ persona, onClick, actions }: PersonaCellProps) {
  return (
    <ListCell
      title={persona.title}
      subtitle={persona.description || undefined}
      actions={actions}
      onClick={onClick}
    />
  );
}
