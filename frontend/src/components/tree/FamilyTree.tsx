import { useCallback, useEffect, useMemo } from 'react';
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
import { buildLayout } from './treeLayout';
import PersonNode from './PersonNode';
import TreeLegend from './TreeLegend';
import UnattachedPanel from './UnattachedPanel';
import styles from './FamilyTree.module.css';

const nodeTypes = { person: PersonNode };

interface FamilyTreeProps {
  people: Person[];
  unattached?: Person[];
  linkPick: LinkPickState | null;
  anchorName: string | null;
  onPersonSelect: (person: Person) => void;
  onCancelLinkPick: () => void;
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

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => {
      const { nodes, edges } = buildLayout(people);
      return {
        nodes: nodes.map(n => {
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
              ...person,
              linkPickTarget: isTarget,
              linkPickDimmed: isDimmed,
              linkPickHover: picking,
            },
          };
        }) as Node[],
        edges,
      };
    },
    [people, picking, linkTargetId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const person = people.find(p => p.id === node.id);
      if (person) onPersonSelect(person);
    },
    [people, onPersonSelect],
  );

  return (
    <div className={[styles.canvas, picking ? styles.canvasPicking : ''].join(' ')}>
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

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesReconnectable={false}
        defaultEdgeOptions={{ type: 'step' }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={node => {
            const person = node.data as unknown as Person;
            if (person.isUnknownPlaceholder) return '#475569';
            const score = person.confidenceScore;
            return score >= 0.7 ? '#4ade80' : score >= 0.4 ? '#facc15' : '#f87171';
          }}
          style={{ background: '#1e1e2e' }}
        />
      </ReactFlow>
      <UnattachedPanel people={unattached} onSelect={onPersonSelect} />
      <TreeLegend />
    </div>
  );
};

export default FamilyTree;

