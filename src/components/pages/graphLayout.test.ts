import { describe, it, expect } from 'vitest';
import { assignColumns, UNREACHABLE_COLUMN } from './graphLayout.js';

const n = (id: number) => ({ id });
const e = (fromViewId: number, toViewId: number | null) => ({
  fromViewId,
  toViewId,
});

describe('assignColumns', () => {
  it('puts the origin in column 0', () => {
    const { columns } = assignColumns([n(1)], [], 1);
    expect(columns.get(1)).toBe(0);
  });

  it('assigns increasing columns by BFS depth', () => {
    const { columns } = assignColumns([n(1), n(2), n(3)], [e(1, 2), e(2, 3)], 1);
    expect(columns.get(2)).toBe(1);
    expect(columns.get(3)).toBe(2);
  });

  it('uses the shortest depth when a view is reachable two ways', () => {
    const { columns } = assignColumns([n(1), n(2), n(3)], [e(1, 2), e(2, 3), e(1, 3)], 1);
    expect(columns.get(3)).toBe(1);
  });

  it('marks views with no path from the origin as unreachable', () => {
    const { columns, unreachable } = assignColumns([n(1), n(9)], [], 1);
    expect(unreachable).toEqual([9]);
    expect(columns.get(9)).toBe(UNREACHABLE_COLUMN);
  });

  it('terminates on cycles', () => {
    const { columns } = assignColumns([n(1), n(2)], [e(1, 2), e(2, 1)], 1);
    expect(columns.get(2)).toBe(1);
  });

  it('ignores edges pointing at pages not in the node set', () => {
    const { columns } = assignColumns([n(1)], [e(1, 77)], 1);
    expect(columns.has(77)).toBe(false);
  });

  it('treats every view as unreachable when the origin is absent', () => {
    const { unreachable } = assignColumns([n(1), n(2)], [e(1, 2)], 999);
    expect(unreachable.sort()).toEqual([1, 2]);
  });
});

describe('assignColumns with unobserved targets', () => {
  // A declared transition can point at a path whose view has not been observed
  // yet. It has no node to lay out, so it must not contribute reachability —
  // otherwise a view could appear reachable through an edge leading nowhere.
  it('ignores a transition whose target view is unknown', () => {
    const { columns, unreachable } = assignColumns([n(1), n(2)], [e(1, null), e(1, 2)], 1);
    expect(columns.get(2)).toBe(1);
    expect(unreachable).toEqual([]);
  });

  it('does not crash when every transition is unresolved', () => {
    const { unreachable } = assignColumns([n(1), n(2)], [e(1, null)], 1);
    expect(unreachable).toEqual([2]);
  });
});
