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
import type { GraphTransition, GraphView } from '@sudobility/testomniac_client';
import { assignColumns, MAX_GRAPH_NODES, UNREACHABLE_COLUMN } from './graphLayout.js';

const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 90;

interface PagesGraphViewProps {
  views: GraphView[];
  transitions: GraphTransition[];
  route: GraphTransition[] | null;
  selectedTargetViewId: number | null;
  onSelectTarget: (viewId: number | null) => void;
  showRemoved: boolean;
  onToggleRemoved: (next: boolean) => void;
  originViewId: number | null;
  fill?: boolean;
}

/**
 * Label for a view.
 *
 * Several views can share one URL path — a cart with items and an empty one, a
 * modal open and closed. That separation is the whole reason the graph is keyed
 * on signatures, so a shared path gets a short signature suffix rather than
 * collapsing into indistinguishable duplicates.
 */
function labelFor(view: GraphView, sharesPath: boolean): string {
  const base = view.title ? `${view.urlPath} · ${view.title}` : view.urlPath;
  return sharesPath ? `${base} · ${view.signature.slice(0, 6)}` : base;
}

export function PagesGraphView({
  views,
  transitions,
  route,
  selectedTargetViewId,
  onSelectTarget,
  showRemoved,
  onToggleRemoved,
  originViewId,
  fill,
}: PagesGraphViewProps) {
  const pathCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const view of views) {
      counts.set(view.urlPath, (counts.get(view.urlPath) ?? 0) + 1);
    }
    return counts;
  }, [views]);

  /**
   * Views nothing links to. The scan bootstraps by navigating directly to many
   * paths, so an orphan is worth surfacing rather than hiding.
   */
  const inbound = useMemo(() => {
    const seen = new Set<number>();
    for (const transition of transitions) {
      if (transition.removedAt == null && transition.toViewId != null) {
        seen.add(transition.toViewId);
      }
    }
    return seen;
  }, [transitions]);

  const { flowNodes, flowEdges, droppedCount, unreachableCount } = useMemo(() => {
    const liveEdges = transitions.filter(edge => edge.removedAt == null);
    const origin = originViewId ?? views[0]?.id ?? 0;
    const { columns, unreachable } = assignColumns(views, liveEdges, origin);

    // Cap by distance from the origin, keeping the nearest. Unreachable views
    // sort last so they are dropped first.
    const ordered = [...views].sort((a, b) => {
      const ca = columns.get(a.id) ?? UNREACHABLE_COLUMN;
      const cb = columns.get(b.id) ?? UNREACHABLE_COLUMN;
      const ra = ca === UNREACHABLE_COLUMN ? Number.MAX_SAFE_INTEGER : ca;
      const rb = cb === UNREACHABLE_COLUMN ? Number.MAX_SAFE_INTEGER : cb;
      if (ra !== rb) return ra - rb;
      return a.urlPath.localeCompare(b.urlPath);
    });
    const kept = ordered.slice(0, MAX_GRAPH_NODES);
    const keptIds = new Set(kept.map(view => view.id));

    // Fixed x for the unreachable column, computed BEFORE positioning so it
    // does not depend on mutation order of rowByColumn.
    const maxColumn = kept.reduce((acc, view) => {
      const column = columns.get(view.id) ?? UNREACHABLE_COLUMN;
      return column > acc ? column : acc;
    }, 0);
    const unreachableX = (maxColumn + 2) * COLUMN_WIDTH;

    // Stable ordering within a column: by path, never by insertion.
    const rowByColumn = new Map<number, number>();
    const positioned: Node[] = kept.map(view => {
      const column = columns.get(view.id) ?? UNREACHABLE_COLUMN;
      const row = rowByColumn.get(column) ?? 0;
      rowByColumn.set(column, row + 1);
      const isTarget = view.id === selectedTargetViewId;
      return {
        id: String(view.id),
        position: {
          x: column === UNREACHABLE_COLUMN ? unreachableX : column * COLUMN_WIDTH,
          y: row * ROW_HEIGHT,
        },
        data: {
          label: labelFor(view, (pathCounts.get(view.urlPath) ?? 0) > 1),
        },
        className: [
          'rounded-md border px-3 py-2 text-xs',
          isTarget
            ? 'border-foreground bg-foreground text-background'
            : 'border-border bg-card text-foreground',
          !inbound.has(view.id) ? 'ring-1 ring-destructive' : '',
        ]
          .filter(Boolean)
          .join(' '),
      };
    });

    const routeIds = new Set((route ?? []).map(edge => edge.id));
    const visible = transitions.filter(
      edge =>
        edge.toViewId != null &&
        keptIds.has(edge.fromViewId) &&
        keptIds.has(edge.toViewId) &&
        (showRemoved || edge.removedAt == null)
    );
    const flow: Edge[] = visible.map(edge => {
      const onRoute = routeIds.has(edge.id);
      const removed = edge.removedAt != null;
      // A transition callers have reported failing is worth seeing before it is
      // walked: routing only demotes such an edge, it never removes it.
      const unreliable = edge.failureCount > 0;
      return {
        id: String(edge.id),
        source: String(edge.fromViewId),
        target: String(edge.toViewId),
        label: edge.triggerLabel ?? undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: onRoute,
        style: {
          strokeWidth: onRoute ? 3 : 1,
          opacity: route && !onRoute ? 0.25 : removed ? 0.4 : 1,
          strokeDasharray: removed
            ? '2 4'
            : unreliable
              ? '1 3'
              : edge.kind === 'declared'
                ? '6 4'
                : undefined,
        },
      };
    });

    return {
      flowNodes: positioned,
      flowEdges: flow,
      droppedCount: views.length - kept.length,
      unreachableCount: unreachable.length,
    };
  }, [
    views,
    transitions,
    route,
    selectedTargetViewId,
    showRemoved,
    originViewId,
    pathCounts,
    inbound,
  ]);

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
    const match = views.find(view => view.id === originViewId);
    return match?.urlPath ?? '(unresolved)';
  }, [views, originViewId]);

  if (views.length === 0) {
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
            value={selectedTargetViewId ?? ''}
            onChange={event =>
              onSelectTarget(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">(none)</option>
            {[...views]
              .sort((a, b) => a.urlPath.localeCompare(b.urlPath))
              .map(view => (
                <option key={view.id} value={view.id}>
                  {labelFor(view, (pathCounts.get(view.urlPath) ?? 0) > 1)}
                </option>
              ))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showRemoved}
            onChange={event => onToggleRemoved(event.target.checked)}
          />
          <span>Show removed links</span>
        </label>
        <span>Origin: {originLabel}</span>
        {selectedTargetViewId != null && (
          <span>
            {route === null
              ? 'No known route to this view.'
              : `Route: ${route.length} hop${route.length === 1 ? '' : 's'}`}
          </span>
        )}
        {unreachableCount > 0 && (
          <span>{unreachableCount} view(s) not reachable from the origin.</span>
        )}
        {droppedCount > 0 && (
          <span>
            {droppedCount} view(s) not shown (limit {MAX_GRAPH_NODES}).
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
