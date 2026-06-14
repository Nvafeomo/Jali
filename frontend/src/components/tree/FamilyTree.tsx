import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Person } from '../../types';
import type { LinkPickState } from '../../types/linkPick';
import {
  buildLayout,
  type LayoutEdge,
} from './treeLayout';
import PersonNode from './PersonNode';
import { toPersonNodeDisplay } from './personNodeData';
import PedigreeEdge from './PedigreeEdge';
import MarriageEdge from './MarriageEdge';
import TreeLegend from './TreeLegend';
import UnattachedPanel from './UnattachedPanel';
import styles from './FamilyTree.module.css';

const nodeTypes = { person: PersonNode };
const edgeTypes = { pedigree: PedigreeEdge, marriage: MarriageEdge };

interface FamilyTreeProps {
  people: Person[];
  unattached?: Person[];
  linkPick: LinkPickState | null;
  anchorName: string | null;
  onPersonSelect: (person: Person) => void;
  onCancelLinkPick: () => void;
}

function mapLayoutNodes(
  layoutNodes: { id: string; position: { x: number; y: number }; data: Person }[],
  picking: boolean,
  linkTargetId: string | null,
): Node[] {
  return layoutNodes.map(n => {
    const person = n.data as Person;
    const isTarget = linkTargetId === n.id;
    const isDimmed = picking && !isTarget;

    return {
      id: n.id,
      type: 'person',
      position: n.position,
      draggable: false,
      selected: isTarget,
      data: {
        ...toPersonNodeDisplay(person),
        linkPickTarget: isTarget,
        linkPickDimmed: isDimmed,
        linkPickHover: picking,
      },
    };
  }) as Node[];
}

interface FamilyTreeCanvasProps {
  initialNodes: Node[];
  initialEdges: LayoutEdge[];
  peopleCount: number;
  showMiniMap: boolean;
  onNodeClick: NodeMouseHandler;
}

function FamilyTreeCanvas({
  initialNodes,
  initialEdges,
  peopleCount,
  showMiniMap,
  onNodeClick,
}: FamilyTreeCanvasProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesReconnectable={false}
      onlyRenderVisibleElements={peopleCount > 50}
      defaultEdgeOptions={{ type: 'marriage' }}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.05}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#334155" gap={20} />
      <Controls />
      {showMiniMap && (
        <MiniMap
          nodeColor={node => {
            const person = node.data as { isUnknownPlaceholder?: boolean; confidenceScore?: number };
            if (person.isUnknownPlaceholder) return '#475569';
            const score = person.confidenceScore ?? 1;
            return score >= 0.7 ? '#4ade80' : score >= 0.4 ? '#facc15' : '#f87171';
          }}
          style={{ background: '#1e1e2e' }}
        />
      )}
    </ReactFlow>
  );
}

const FamilyTree = ({
  people,
  unattached = [],
  linkPick,
  anchorName,
  onPersonSelect,
  onCancelLinkPick,
}: FamilyTreeProps) => {
  const picking = linkPick?.picking ?? false;
  const linkTargetId = linkPick?.targetId ?? null;

  const [layouting, setLayouting] = useState(true);
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<LayoutEdge[]>([]);

  useEffect(() => {
    setLayouting(true);
    let cancelled = false;

    const runLayout = () => {
      if (cancelled) return;

      const { nodes, edges } = buildLayout(people);

      if (cancelled) return;

      setInitialNodes(mapLayoutNodes(nodes, picking, linkTargetId));
      setInitialEdges(edges);
      setLayouting(false);
    };

    // Yield so the arranging overlay paints before layout + React Flow mount.
    const delay = people.length > 50 ? 16 : 0;
    const timer = window.setTimeout(runLayout, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [people, picking, linkTargetId]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const person = people.find(p => p.id === node.id);
      if (person) onPersonSelect(person);
    },
    [people, onPersonSelect],
  );

  const showMiniMap = people.length <= 50;
  const flowReady = !layouting && initialNodes.length > 0;
  const canvasKey = `${initialNodes.length}-${linkTargetId ?? ''}-${picking}`;

  return (
    <div className={[styles.canvas, picking ? styles.canvasPicking : ''].join(' ')}>
      {layouting && (
        <div className={styles.layoutOverlay} role="status">
          <div className={styles.layoutSpinner} aria-hidden />
          <p>Arranging {people.length.toLocaleString()} people…</p>
        </div>
      )}

      {picking && anchorName && (
        <div className={styles.pickBanner} role="status">
          <p className={styles.pickBannerText}>
            {linkTargetId
              ? 'Target selected. Click another node to change, then Link in the drawer.'
              : `Click someone on the tree to link to ${anchorName}`}
          </p>
          <button type="button" className={styles.pickBannerCancel} onClick={onCancelLinkPick}>
            Cancel
          </button>
        </div>
      )}

      {flowReady && (
        <FamilyTreeCanvas
          key={canvasKey}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          peopleCount={people.length}
          showMiniMap={showMiniMap}
          onNodeClick={onNodeClick}
        />
      )}
      <UnattachedPanel people={unattached} onSelect={onPersonSelect} />
      <TreeLegend />
    </div>
  );
};

export default FamilyTree;
