/** Cap on rendered nodes. Excess is dropped by distance and reported, never silently. */
export const MAX_GRAPH_NODES = 300;

/** Column marker for pages with no path from the origin. */
export const UNREACHABLE_COLUMN = -1;

export interface LayoutInput {
  pageId: number;
}

export interface LayoutEdge {
  fromPageId: number;
  toPageId: number;
}

/**
 * Assign each page a column by BFS depth from the origin over LIVE edges.
 *
 * Reachability is a DAG, not a tree, so shortest depth wins when a page is
 * reachable several ways. Pages with no path land in UNREACHABLE_COLUMN rather
 * than being dropped — the scan bootstraps by navigating directly to many
 * paths, so unreached pages are expected and worth showing.
 */
export function assignColumns(
  nodes: LayoutInput[],
  liveEdges: LayoutEdge[],
  originPageId: number
): { columns: Map<number, number>; unreachable: number[] } {
  const known = new Set(nodes.map((node) => node.pageId));
  const outgoing = new Map<number, number[]>();
  for (const edge of liveEdges) {
    if (!known.has(edge.fromPageId) || !known.has(edge.toPageId)) continue;
    const list = outgoing.get(edge.fromPageId) ?? [];
    list.push(edge.toPageId);
    outgoing.set(edge.fromPageId, list);
  }

  const columns = new Map<number, number>();
  if (known.has(originPageId)) {
    columns.set(originPageId, 0);
    let frontier = [originPageId];
    let depth = 0;
    while (frontier.length > 0) {
      depth += 1;
      const next: number[] = [];
      for (const pageId of frontier) {
        for (const target of outgoing.get(pageId) ?? []) {
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
    if (!columns.has(node.pageId)) {
      columns.set(node.pageId, UNREACHABLE_COLUMN);
      unreachable.push(node.pageId);
    }
  }
  return { columns, unreachable };
}
