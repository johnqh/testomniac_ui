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
import { usePageStates, buildArtifactUrl } from '@sudobility/testomniac_client';
import { layoutDagreGraph } from '@sudobility/testomniac_lib';
import { ContentLayout } from '@sudobility/components';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams, useEnvRoutes } from '../context/routing';
import BackLink from '../components/navigation/BackLink';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 160;

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

function PageStateNode({ data }: { data: { label: string; screenshotUrl?: string } }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      <div className="w-full h-[120px] bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
        {data.screenshotUrl ? (
          <img
            src={data.screenshotUrl}
            alt=""
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <svg
            className="w-8 h-8 text-gray-300 dark:text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 15l5-5 4 4 3-3 6 6" />
          </svg>
        )}
      </div>
      <div className="px-2 py-1.5 text-center">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
          {data.label}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = { pageState: PageStateNode };

export function PageGraphPage() {
  const { pageId } = useRouteParams<{
    pageId: string;
  }>();
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const { navigate } = useLocalizedNavigate();
  const r = useEnvRoutes();

  const numericPageId = Number(pageId);
  const pageStatesQuery = usePageStates(networkClient, baseUrl, token ?? '', numericPageId, {
    enabled: !!pageId && !!token,
  });
  const pageStates = useMemo(() => pageStatesQuery.data?.data ?? [], [pageStatesQuery.data]);
  const statesLoading = pageStatesQuery.isLoading;

  const isLoading = statesLoading;

  const { initialNodes, initialEdges } = useMemo(() => {
    if (pageStates.length === 0) return { initialNodes: [], initialEdges: [] };

    const rawNodes: Node[] = pageStates.map(ps => {
      const screenshotUrl = ps.screenshotPath
        ? buildArtifactUrl(baseUrl, ps.screenshotPath, { thumbnail: true })
        : undefined;
      return {
        id: String(ps.id),
        type: 'pageState',
        data: {
          label: `${ps.sizeClass} (#${ps.id})`,
          screenshotUrl,
        },
        position: { x: 0, y: 0 },
      };
    });

    const rawEdges: Edge[] = [];
    const layoutNodes = layoutGraph(rawNodes, rawEdges);
    return { initialNodes: layoutNodes, initialEdges: rawEdges };
  }, [pageStates, baseUrl]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      navigate(r.pageState(pageId, node.id));
    },
    [navigate, r, pageId]
  );

  const pagesBasePath = r.page(pageId);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading graph...</div>
      </div>
    );
  }

  return (
    <ContentLayout
      contentClassName="min-h-0"
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Page Graph" description="" noIndex />
          <BackLink label="Page Detail" onClick={() => navigate(pagesBasePath)} />
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Page Graph</h1>
        </div>
      }
    >
      {pageStates.length === 0 ? (
        <div className="px-4 py-4 sm:px-6">
          <p className="text-gray-500 dark:text-gray-400">No page states found.</p>
        </div>
      ) : (
        <div className="h-full min-h-0 p-4 sm:p-6">
          <div className="h-full min-h-[400px] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-50 dark:bg-gray-900"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
