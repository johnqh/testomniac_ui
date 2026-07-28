import { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {
  NavigationGraphEdge,
  NavigationGraphNode,
} from '@sudobility/testomniac_client';
import {
  assignColumns,
  MAX_GRAPH_NODES,
  UNREACHABLE_COLUMN,
} from './graphLayout';

const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 90;

interface PagesGraphViewProps {
  nodes: NavigationGraphNode[];
  edges: NavigationGraphEdge[];
  route: NavigationGraphEdge[] | null;
  selectedTargetPageId: number | null;
  onSelectTarget: (pageId: number | null) => void;
  showRemoved: boolean;
  onToggleRemoved: (next: boolean) => void;
  originPageId: number | null;
  fill?: boolean;
}

const edgeKey = (edge: NavigationGraphEdge) =>
  `${edge.fromPageId}-${edge.toRelativePath}-${edge.kind}-${edge.selector}`;

export function PagesGraphView({
  nodes,
  edges,
  route,
  selectedTargetPageId,
  onSelectTarget,
  showRemoved,
  onToggleRemoved,
  originPageId,
  fill,
}: PagesGraphViewProps) {
  const { flowNodes, flowEdges, droppedCount, unreachableCount } =
    useMemo(() => {
      const liveEdges = edges.filter((edge) => edge.removedAt == null);
      const origin = originPageId ?? nodes[0]?.pageId ?? 0;
      const { columns, unreachable } = assignColumns(nodes, liveEdges, origin);

      // Cap by distance from the origin, keeping the nearest. Unreachable
      // pages sort last so they are dropped first.
      const ordered = [...nodes].sort((a, b) => {
        const ca = columns.get(a.pageId) ?? UNREACHABLE_COLUMN;
        const cb = columns.get(b.pageId) ?? UNREACHABLE_COLUMN;
        const ra = ca === UNREACHABLE_COLUMN ? Number.MAX_SAFE_INTEGER : ca;
        const rb = cb === UNREACHABLE_COLUMN ? Number.MAX_SAFE_INTEGER : cb;
        if (ra !== rb) return ra - rb;
        return a.relativePath.localeCompare(b.relativePath);
      });
      const kept = ordered.slice(0, MAX_GRAPH_NODES);
      const keptIds = new Set(kept.map((node) => node.pageId));

      // Fixed x for the unreachable column, computed BEFORE positioning so it
      // does not depend on mutation order of rowByColumn.
      const maxColumn = kept.reduce((acc, node) => {
        const column = columns.get(node.pageId) ?? UNREACHABLE_COLUMN;
        return column > acc ? column : acc;
      }, 0);
      const unreachableX = (maxColumn + 2) * COLUMN_WIDTH;

      // Stable ordering within a column: by path, never by insertion.
      const rowByColumn = new Map<number, number>();
      const positioned: Node[] = kept.map((node) => {
        const column = columns.get(node.pageId) ?? UNREACHABLE_COLUMN;
        const row = rowByColumn.get(column) ?? 0;
        rowByColumn.set(column, row + 1);
        const isTarget = node.pageId === selectedTargetPageId;
        return {
          id: String(node.pageId),
          position: {
            x: column === UNREACHABLE_COLUMN ? unreachableX : column * COLUMN_WIDTH,
            y: row * ROW_HEIGHT,
          },
          data: { label: node.relativePath },
          className: [
            'rounded-md border px-3 py-2 text-xs',
            isTarget
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-card text-foreground',
            !node.hasInboundEdge ? 'ring-1 ring-destructive' : '',
            node.requiresLogin ? 'italic' : '',
          ]
            .filter(Boolean)
            .join(' '),
        };
      });

      const routeKeys = new Set((route ?? []).map(edgeKey));
      const visible = edges.filter(
        (edge) =>
          keptIds.has(edge.fromPageId) &&
          keptIds.has(edge.toPageId) &&
          (showRemoved || edge.removedAt == null)
      );
      const flow: Edge[] = visible.map((edge) => {
        const onRoute = routeKeys.has(edgeKey(edge));
        const removed = edge.removedAt != null;
        return {
          id: edgeKey(edge),
          source: String(edge.fromPageId),
          target: String(edge.toPageId),
          label: edge.label ?? undefined,
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: onRoute,
          style: {
            strokeWidth: onRoute ? 3 : 1,
            opacity: route && !onRoute ? 0.25 : removed ? 0.4 : 1,
            strokeDasharray: removed
              ? '2 4'
              : edge.kind === 'declared'
                ? '6 4'
                : undefined,
          },
        };
      });

      return {
        flowNodes: positioned,
        flowEdges: flow,
        droppedCount: nodes.length - kept.length,
        unreachableCount: unreachable.length,
      };
    }, [nodes, edges, route, selectedTargetPageId, showRemoved, originPageId]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(flowEdges);

  // useNodesState/useEdgesState only SEED state from their argument. Without
  // this sync the graph goes stale as soon as the selected target or the
  // removed-links toggle changes. PagesMapView.tsx does the same thing.
  useEffect(() => {
    setRfNodes(flowNodes);
    setRfEdges(flowEdges);
  }, [flowNodes, flowEdges, setRfNodes, setRfEdges]);

  const originLabel = useMemo(() => {
    const match = nodes.find((node) => node.pageId === originPageId);
    return match?.relativePath ?? '(unresolved)';
  }, [nodes, originPageId]);

  if (nodes.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p className="text-muted-foreground">
          No navigation graph yet. Run a scan to discover links.
        </p>
      </div>
    );
  }

  return (
    <div className={fill ? 'flex h-full min-h-[400px] flex-col gap-2' : 'space-y-2'}>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <label className="flex items-center gap-1">
          <span>Route to</span>
          <select
            className="rounded border border-border bg-card px-2 py-1 text-foreground"
            value={selectedTargetPageId ?? ''}
            onChange={(event) =>
              onSelectTarget(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">(none)</option>
            {[...nodes]
              .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
              .map((node) => (
                <option key={node.pageId} value={node.pageId}>
                  {node.relativePath}
                </option>
              ))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showRemoved}
            onChange={(event) => onToggleRemoved(event.target.checked)}
          />
          <span>Show removed links</span>
        </label>
        <span>Origin: {originLabel}</span>
        {selectedTargetPageId != null && (
          <span>
            {route === null
              ? 'No known route to this page.'
              : `Route: ${route.length} hop${route.length === 1 ? '' : 's'}`}
          </span>
        )}
        {unreachableCount > 0 && (
          <span>{unreachableCount} page(s) not reachable from the origin.</span>
        )}
        {droppedCount > 0 && (
          <span>
            {droppedCount} page(s) not shown (limit {MAX_GRAPH_NODES}).
          </span>
        )}
      </div>
      <div
        className={`w-full overflow-hidden rounded-lg border border-border ${
          fill ? 'min-h-0 flex-1' : 'h-[600px]'
        }`}
      >
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          defaultViewport={{ x: 40, y: 40, zoom: 0.7 }}
          minZoom={0.1}
          className="bg-muted"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
