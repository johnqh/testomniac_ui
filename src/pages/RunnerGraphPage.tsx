import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRunnerPages, useRunnerPageStates } from '@sudobility/testomniac_client';
import { layoutDagreGraph } from '@sudobility/testomniac_lib';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const positions = layoutDagreGraph(nodes, edges, {
    nodeWidth: NODE_WIDTH,
    nodeHeight: NODE_HEIGHT,
  });
  return nodes.map(node => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
}

export function RunnerGraphPage() {
  const { envId } = useRouteParams<{ envId: string }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();

  const numericEnvId = Number(envId);

  const pagesQuery = useRunnerPages(networkClient, baseUrl, token ?? '', numericEnvId, {
    enabled: !!envId && !!token,
  });
  const pages = useMemo(() => pagesQuery.data?.data ?? [], [pagesQuery.data]);
  const pagesLoading = pagesQuery.isLoading;

  const pageStatesQuery = useRunnerPageStates(networkClient, baseUrl, token ?? '', numericEnvId, {
    enabled: !!envId && !!token,
  });
  const pageStates = useMemo(() => pageStatesQuery.data?.data ?? [], [pageStatesQuery.data]);
  const pageStatesLoading = pageStatesQuery.isLoading;

  const isLoading = pagesLoading || pageStatesLoading;

  const { initialNodes, initialEdges } = useMemo(() => {
    if (pages.length === 0) return { initialNodes: [], initialEdges: [] };

    // Create nodes - one per page
    const rawNodes: Node[] = pages.map(page => {
      const stateCount = pageStates.filter(state => state.pageId === page.id).length;
      let label: string;
      try {
        label = page.routeKey || page.relativePath;
      } catch {
        label = page.routeKey || page.relativePath;
      }
      return {
        id: String(page.id),
        data: { label: `${label}${stateCount > 0 ? ` (${stateCount} states)` : ''}` },
        position: { x: 0, y: 0 },
        style: {
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '12px',
          width: NODE_WIDTH,
        },
      };
    });

    const rawEdges: Edge[] = [];
    const layoutNodes = layoutGraph(rawNodes, rawEdges);
    return { initialNodes: layoutNodes, initialEdges: rawEdges };
  }, [pages, pageStates]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      navigate(r.page(node.id));
    },
    [navigate, r]
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <SEOHead title="Runner Graph" description="" noIndex />
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading graph...</div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <SEOHead title="Runner Graph" description="" noIndex />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Runner Graph</h1>
        <p className="text-gray-500 dark:text-gray-400">No pages discovered yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <SEOHead title="Runner Graph" description="" noIndex />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Runner Graph</h1>
      <div className="w-full h-[70vh] sm:h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          className="bg-gray-50 dark:bg-gray-900"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
