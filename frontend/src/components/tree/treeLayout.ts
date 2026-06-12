import type { Person, RelationshipEdge } from '../../types';
import { edgeStyle } from './relationshipStyles';

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: Person;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: 'step';
  animated: boolean;
  data: {
    relationshipType: 'PARENT_OF' | 'MARRIED_TO';
    confidenceScore: number;
    disputed: boolean;
  };
  style: { stroke: string; strokeWidth: number; strokeDasharray?: string };
  markerEnd?: {
    type: 'arrowclosed';
    color: string;
    width: number;
    height: number;
  };
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 140;
const H_GAP = 60;
const V_GAP = 100;

function assignGenerations(people: Person[]): Map<string, number> {
  const genMap = new Map<string, number>();

  const hasParents = new Set<string>();
  people.forEach(p => {
    p.parents?.forEach(() => hasParents.add(p.id));
  });

  const roots = people.filter(p => !hasParents.has(p.id));
  roots.forEach(p => genMap.set(p.id, 0));

  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentGen = genMap.get(current.id) ?? 0;

    people
      .filter(p => p.parents?.some(rel => rel.person.id === current.id))
      .forEach(child => {
        const existing = genMap.get(child.id) ?? -1;
        const newGen = Math.max(existing, currentGen + 1);
        genMap.set(child.id, newGen);
        if (!queue.includes(child)) queue.push(child);
      });
  }

  people.forEach(p => {
    if (!genMap.has(p.id)) genMap.set(p.id, 0);
  });

  return genMap;
}

/** Place spouses next to each other within each generation row. */
function orderGenerationRow(genPeople: Person[]): Person[] {
  const ordered: Person[] = [];
  const placed = new Set<string>();

  for (const person of genPeople) {
    if (placed.has(person.id)) continue;

    ordered.push(person);
    placed.add(person.id);

    const spouse = person.spouses?.[0];
    if (spouse && !placed.has(spouse.person.id)) {
      const spousePerson = genPeople.find(p => p.id === spouse.person.id);
      if (spousePerson) {
        ordered.push(spousePerson);
        placed.add(spousePerson.id);
      }
    }
  }

  return ordered;
}

function addRelationshipEdge(
  edges: LayoutEdge[],
  edgeSeen: Set<string>,
  sourceId: string,
  targetId: string,
  rel: RelationshipEdge,
  handles?: { sourceHandle: string; targetHandle: string },
) {
  const relationshipType =
    rel.type === 'MARRIED_TO' ? 'MARRIED_TO' : 'PARENT_OF';
  const edgeId =
    relationshipType === 'MARRIED_TO'
      ? `marriage:${[sourceId, targetId].sort().join(':')}`
      : `${sourceId}->${targetId}`;

  if (edgeSeen.has(edgeId)) return;
  edgeSeen.add(edgeId);

  const style = edgeStyle(relationshipType, rel.confidenceScore, rel.disputed);

  edges.push({
    id: edgeId,
    source: sourceId,
    target: targetId,
    ...handles,
    type: 'step',
    animated: false,
    data: {
      relationshipType,
      confidenceScore: rel.confidenceScore,
      disputed: rel.disputed,
    },
    style,
    ...(relationshipType === 'PARENT_OF'
      ? {
          markerEnd: {
            type: 'arrowclosed' as const,
            color: style.stroke,
            width: 20,
            height: 20,
          },
        }
      : {}),
  });
}

export function buildLayout(people: Person[]): {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
} {
  const genMap = assignGenerations(people);

  const byGen = new Map<number, Person[]>();
  people.forEach(p => {
    const gen = genMap.get(p.id) ?? 0;
    if (!byGen.has(gen)) byGen.set(gen, []);
    byGen.get(gen)!.push(p);
  });

  const nodes: LayoutNode[] = [];
  byGen.forEach((genPeople, gen) => {
    const rowPeople = orderGenerationRow(genPeople);
    const rowWidth = rowPeople.length * (NODE_WIDTH + H_GAP) - H_GAP;
    rowPeople.forEach((person, i) => {
      nodes.push({
        id: person.id,
        position: {
          x: i * (NODE_WIDTH + H_GAP) - rowWidth / 2,
          y: gen * (NODE_HEIGHT + V_GAP),
        },
        data: person,
      });
    });
  });

  const edges: LayoutEdge[] = [];
  const edgeSeen = new Set<string>();

  people.forEach(person => {
    person.parents?.forEach(rel => {
      addRelationshipEdge(edges, edgeSeen, rel.person.id, person.id, rel);
    });

    person.spouses?.forEach(rel => {
      addRelationshipEdge(edges, edgeSeen, person.id, rel.person.id, rel, {
        sourceHandle: 'spouse-out',
        targetHandle: 'spouse-in',
      });
    });
  });

  return { nodes, edges };
}
