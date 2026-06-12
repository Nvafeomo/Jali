import { useCallback, useMemo } from 'react';
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
import { buildLayout } from './treeLayout';
import PersonNode from './PersonNode';
import TreeLegend from './TreeLegend';
import styles from './FamilyTree.module.css';

// Register our custom node type.
// The key 'person' is what we'll pass as node.type when building the layout.
// React Flow looks this up and renders PersonNode instead of its default box.
const nodeTypes = { person: PersonNode };

interface FamilyTreeProps {
  people: Person[];
  onPersonSelect: (person: Person) => void;
}

const FamilyTree = ({ people, onPersonSelect }: FamilyTreeProps) => {

  // Build the React Flow nodes and edges from our person data.
  // useMemo means this only recalculates when `people` changes, not on every render.
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => {
      const { nodes, edges } = buildLayout(people);
      // Tag each node with type: 'person' so React Flow uses our PersonNode component
      return {
        nodes: nodes.map(n => ({
          id: n.id,
          type: 'person',
          position: n.position,
          draggable: false,
          data: n.data as unknown as Record<string, unknown>,
        })) as Node[],
        edges,
      };
    },
    [people]
  );

  // useNodesState / useEdgesState are React Flow's own state hooks.
  // They store the node/edge arrays and handle internal updates like dragging.
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // When a node is clicked, find the matching Person and notify the parent.
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const person = people.find(p => p.id === node.id);
      if (person) onPersonSelect(person);
    },
    [people, onPersonSelect]
  );

  return (
    <div className={styles.canvas}>
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
        {/* Background: subtle dot grid */}
        <Background color="#334155" gap={20} />

        {/* Controls: zoom in/out/fit buttons (bottom-left) */}
        <Controls />

        {/* MiniMap: small overview in the corner for large trees */}
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
      <TreeLegend />
    </div>
  );
};

export default FamilyTree;
