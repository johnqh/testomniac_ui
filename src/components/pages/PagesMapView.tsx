import { useMemo, useCallback, useEffect } from 'react';
import type { PageResponse, TestInteractionResponse } from '@sudobility/testomniac_types';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BezierEdge,
  type Node,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
  type EdgeProps,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { normalizePath, patternizePath } from '@sudobility/testomniac_lib';
import { buildArtifactUrl } from '@sudobility/testomniac_client';
import { useLocalizedNavigate } from '../../hooks/useLocalizedNavigate';
import { useEnvRoutes } from '../../context/routing';

// --- Constants ---

const PAGE_NODE_WIDTH = 220;
const PAGE_NODE_HEIGHT = 180;
// Vertical distance between row origins. Must exceed PAGE_NODE_HEIGHT so tiles
// in adjacent depth rows don't overlap; the extra leaves a comfortable gap.
const ROW_GAP = 280;
const COL_GAP = 250;
const MAP_TEST_TYPES = new Set(['navigation', 'interaction']);

// --- Custom Nodes ---

function PageNode({
  data,
}: {
  data: {
    label: string;
    isExternal: boolean;
    count: number;
    screenshotUrl?: string | null;
  };
}) {
  // Decorative map-node category colors (external vs internal): distinct
  // identity palette for graph nodes, no semantic token equivalent.
  const borderColor = data.isExternal ? '#f97316' : '#374151';

  return (
    <div
      className="rounded-lg bg-card text-xs overflow-hidden shadow-sm"
      style={{
        border: `2px solid ${borderColor}`,
        width: PAGE_NODE_WIDTH,
        minHeight: PAGE_NODE_HEIGHT,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />

      {/* Screenshot thumbnail */}
      <div className="bg-muted flex items-center justify-center" style={{ height: 130 }}>
        {data.screenshotUrl ? (
          <img
            src={data.screenshotUrl}
            alt={data.label}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <svg
            className="w-8 h-8 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 15l5-5 4 4 3-3 6 6" />
            <circle cx="8.5" cy="8.5" r="1.5" />
          </svg>
        )}
      </div>

      {/* Path label */}
      <div className="px-2 py-1.5 text-center border-t border-border">
        <span className="block max-w-[190px] truncate text-foreground font-medium">
          {data.label}
        </span>
        {data.count > 1 && (
          <span className="text-[10px] text-muted-foreground">{data.count} URLs</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  pageNode: PageNode,
};

function CurvedEdge(props: EdgeProps) {
  return <BezierEdge {...props} pathOptions={{ curvature: 0.8 }} />;
}

const edgeTypes: EdgeTypes = {
  curved: CurvedEdge,
};

// --- Helpers ---

function getConsolidationKey(page: PageResponse): string {
  // Always normalize: strip query params / hash, trailing slashes,
  // then collapse dynamic segments so parameterised URLs merge.
  const raw = page.routeKey || page.relativePath;
  const isExternal = page.relativePath.startsWith('http');

  if (isExternal) {
    try {
      const url = new URL(page.relativePath);
      const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
      return `${url.host}${patternizePath(pathname)}`;
    } catch {
      return page.relativePath;
    }
  }

  const normalized = normalizePath(raw);
  if (normalized) return patternizePath(normalized);
  return raw;
}

// --- Component ---

interface PagesMapViewProps {
  pages: PageResponse[];
  testInteractions: TestInteractionResponse[];
  envId: string;
  entitySlug: string;
  runId?: string;
  /** Map of pageId → screenshot artifact path (from page states) */
  screenshotsByPageId?: Map<number, string>;
  apiUrl?: string;
  /** When true, the map fills its parent's height instead of a fixed 600px box. */
  fill?: boolean;
}

export function PagesMapView({
  pages,
  testInteractions,
  runId,
  screenshotsByPageId,
  apiUrl,
  fill = false,
}: PagesMapViewProps) {
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();

  const { initialNodes, initialEdges, hiddenInteractionCount } = useMemo(() => {
    if (pages.length === 0)
      return { initialNodes: [], initialEdges: [], hiddenInteractionCount: 0 };

    // --- 1. Consolidate pages by routeKey / normalized path ---
    const consolidated = new Map<string, { pageIds: number[]; isExternal: boolean }>();

    for (const page of pages) {
      const key = getConsolidationKey(page);
      const existing = consolidated.get(key);
      if (existing) {
        existing.pageIds.push(page.id);
      } else {
        consolidated.set(key, {
          pageIds: [page.id],
          isExternal: page.relativePath.startsWith('http'),
        });
      }
    }

    const nodeEntries = Array.from(consolidated.entries()).map(([path, data]) => ({
      path,
      ...data,
    }));

    // --- 2. Map original page IDs → consolidated path ---
    const pageIdToPath = new Map<number, string>();
    for (const entry of nodeEntries) {
      for (const pid of entry.pageIds) {
        pageIdToPath.set(pid, entry.path);
      }
    }

    // --- 3. Build parent → child hierarchy from URL paths ---
    // Each non-root node attaches to its nearest *existing* ancestor path, so a
    // deep page whose intermediate segments were never discovered still hangs
    // off the closest known page rather than floating.
    const pathSet = new Set(nodeEntries.map(n => n.path));
    const parentOf = new Map<string, string | null>();
    const childrenOf = new Map<string, string[]>();

    for (const entry of nodeEntries) {
      let parent: string | null = null;
      if (entry.path !== '/' && !entry.isExternal) {
        const segments = entry.path.split('/').filter(Boolean);
        for (let i = segments.length - 1; i >= 0; i--) {
          const candidate = i === 0 ? '/' : '/' + segments.slice(0, i).join('/');
          if (pathSet.has(candidate)) {
            parent = candidate;
            break;
          }
        }
      }
      parentOf.set(entry.path, parent);
      if (parent) {
        const siblings = childrenOf.get(parent) ?? [];
        siblings.push(entry.path);
        childrenOf.set(parent, siblings);
      }
    }

    for (const siblings of childrenOf.values()) {
      siblings.sort((a, b) => a.localeCompare(b));
    }

    // Roots: the home page, external links, and any orphan whose ancestors
    // weren't discovered. '/' is forced first so it owns the top-left corner.
    const roots = nodeEntries
      .filter(e => parentOf.get(e.path) == null)
      .map(e => e.path)
      .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));

    // --- 4. Position nodes as a left-aligned tree ---
    // Leaves are packed left→right; every parent sits directly above its FIRST
    // child (the top-left of its subtree) instead of being centered over it.
    // This keeps the root page pinned to (0,0), so the default top-left
    // viewport always shows it, and reads as a true hierarchy. y is the tree
    // depth (parent depth + 1), not the raw URL depth, so branches stay
    // vertically compact.
    const xByPath = new Map<string, number>();
    const depthByPath = new Map<string, number>();
    let leafCursor = 0;

    const placeSubtree = (path: string, depth: number): number => {
      depthByPath.set(path, depth);
      const kids = childrenOf.get(path) ?? [];
      if (kids.length === 0) {
        const x = leafCursor * COL_GAP;
        leafCursor++;
        xByPath.set(path, x);
        return x;
      }
      let firstChildX: number | null = null;
      for (const child of kids) {
        const childX = placeSubtree(child, depth + 1);
        if (firstChildX === null) firstChildX = childX;
      }
      const x = firstChildX ?? leafCursor * COL_GAP;
      xByPath.set(path, x);
      return x;
    };

    for (const root of roots) {
      placeSubtree(root, 0);
    }

    const rfNodes: Node[] = [];
    for (const entry of nodeEntries) {
      // Find screenshot for the first page ID that has one.
      let screenshotUrl: string | null = null;
      if (screenshotsByPageId && apiUrl) {
        for (const pid of entry.pageIds) {
          const shotPath = screenshotsByPageId.get(pid);
          if (shotPath) {
            screenshotUrl = buildArtifactUrl(apiUrl, shotPath, { thumbnail: true });
            break;
          }
        }
      }

      rfNodes.push({
        id: entry.path,
        type: 'pageNode',
        data: {
          label: entry.path,
          isExternal: entry.isExternal,
          count: entry.pageIds.length,
          pageIds: entry.pageIds,
          screenshotUrl,
        },
        position: {
          x: xByPath.get(entry.path) ?? 0,
          y: (depthByPath.get(entry.path) ?? 0) * ROW_GAP,
        },
      });
    }

    // --- 5. URL hierarchy edges (parent → child) ---
    const rfEdges: Edge[] = [];
    const edgeKeySet = new Set<string>();

    for (const entry of nodeEntries) {
      const parent = parentOf.get(entry.path);
      if (!parent) continue;
      const key = `${parent}\0${entry.path}`;
      edgeKeySet.add(key);
      rfEdges.push({
        id: `h-${rfEdges.length}`,
        source: parent,
        target: entry.path,
        type: 'curved',
        // Decorative graph-edge colors (hierarchy vs interaction): distinct
        // identity palette for the map, no semantic token equivalent.
        style: { stroke: '#94a3b8' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#94a3b8',
        },
      });
    }

    // --- 6. Test interaction edges (cross-page) ---
    // Only interactions that declare a distinct target page represent a
    // cross-page connection. Direct-navigation tests ("Navigate to /x") carry
    // no page IDs (pageId/targetPageId are null), so they are NOT connections
    // and must not be reported as omitted. Mirrors the filter in
    // testomniac_lib's usePageMapData.
    let hiddenInteractionCount = 0;
    const interactionCounts = new Map<string, { source: string; target: string; count: number }>();

    for (const ti of testInteractions) {
      if (!MAP_TEST_TYPES.has(ti.testType)) continue;
      if (ti.targetPageId == null || ti.pageId === ti.targetPageId) continue;

      const src = ti.pageId != null ? (pageIdToPath.get(ti.pageId) ?? null) : null;
      const tgt = pageIdToPath.get(ti.targetPageId) ?? null;

      if (src && tgt && src !== tgt) {
        const key = `${src}\0${tgt}`;
        const existing = interactionCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          interactionCounts.set(key, { source: src, target: tgt, count: 1 });
        }
      } else if (!(src && tgt)) {
        // A declared cross-page target whose source or target page isn't part
        // of this view — a genuine omission worth surfacing.
        hiddenInteractionCount++;
      }
      // src === tgt: both endpoints consolidated to the same node (e.g.
      // parameterised URLs merged) — a self-loop, not a missing connection.
    }

    for (const [key, edge] of interactionCounts) {
      if (!edgeKeySet.has(key)) {
        edgeKeySet.add(key);
        rfEdges.push({
          id: `ti-${rfEdges.length}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: true,
          // Decorative cross-page interaction edge color (see hierarchy edge above).
          style: { stroke: '#60a5fa' },
          label: edge.count > 1 ? String(edge.count) : undefined,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#60a5fa',
          },
        });
      }
    }

    return {
      initialNodes: rfNodes,
      initialEdges: rfEdges,
      hiddenInteractionCount,
    };
  }, [pages, testInteractions, screenshotsByPageId, apiUrl]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const pageIds = node.data.pageIds as number[] | undefined;
      if (pageIds && pageIds.length > 0) {
        navigate(runId ? r.runPage(runId, pageIds[0]) : r.page(pageIds[0]));
      }
    },
    [navigate, r, runId]
  );

  if (pages.length === 0) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-border bg-muted">
        <p className="text-muted-foreground">
          No page connections to display. Run a scan to discover navigation flows.
        </p>
      </div>
    );
  }

  return (
    <div className={fill ? 'flex h-full min-h-[400px] flex-col gap-2' : 'space-y-2'}>
      {hiddenInteractionCount > 0 && (
        <p className="flex-shrink-0 text-xs text-muted-foreground">
          {hiddenInteractionCount} interaction
          {hiddenInteractionCount === 1 ? '' : 's'} omitted (no cross-page connection).
        </p>
      )}
      <div
        className={`w-full overflow-hidden rounded-lg border border-border ${
          fill ? 'min-h-0 flex-1' : 'h-[600px]'
        }`}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDoubleClick={handleNodeDoubleClick}
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
