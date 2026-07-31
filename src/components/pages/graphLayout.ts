/** Cap on rendered nodes. Excess is dropped by distance and reported, never silently. */
export const MAX_GRAPH_NODES = 300;

/** Column marker for views with no path from the origin. */
export const UNREACHABLE_COLUMN = -1;

export interface LayoutInput {
  id: number;
}

export interface LayoutEdge {
  fromViewId: number;
  toViewId: number | null;
}

/**
 * Assign each view a column by BFS depth from the origin over LIVE transitions.
 *
 * Reachability is a DAG, not a tree, so shortest depth wins when a view is
 * reachable several ways. Views with no path land in UNREACHABLE_COLUMN rather
 * than being dropped — the scan bootstraps by navigating directly to many
 * paths, so unreached views are expected and worth showing.
 *
 * Transitions with a null `toViewId` are skipped: they point at a path whose
 * view has not been observed yet, so there is nothing to lay out.
 */
export function assignColumns(
  nodes: LayoutInput[],
  liveEdges: LayoutEdge[],
  originViewId: number
): { columns: Map<number, number>; unreachable: number[] } {
  const known = new Set(nodes.map(node => node.id));
  const outgoing = new Map<number, number[]>();
  for (const edge of liveEdges) {
    if (edge.toViewId == null) continue;
    if (!known.has(edge.fromViewId) || !known.has(edge.toViewId)) continue;
    const list = outgoing.get(edge.fromViewId) ?? [];
    list.push(edge.toViewId);
    outgoing.set(edge.fromViewId, list);
  }

  const columns = new Map<number, number>();
  if (known.has(originViewId)) {
    columns.set(originViewId, 0);
    let frontier = [originViewId];
    let depth = 0;
    while (frontier.length > 0) {
      depth += 1;
      const next: number[] = [];
      for (const viewId of frontier) {
        for (const target of outgoing.get(viewId) ?? []) {
          if (columns.has(target)) continue;
          columns.set(target, depth);
          next.push(target);
        }
      }
      frontier = next;
    }
  }

  const unreachable: number[] = [];
  for (const node of nodes) {
    if (!columns.has(node.id)) {
      columns.set(node.id, UNREACHABLE_COLUMN);
      unreachable.push(node.id);
    }
  }
  return { columns, unreachable };
}
