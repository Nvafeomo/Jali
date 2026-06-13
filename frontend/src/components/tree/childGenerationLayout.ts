import type { Person } from '../../types';
import type { PedigreeGroup } from './pedigreeGeometry';
import { LAYOUT_NODE_WIDTH, parentCenterX } from './pedigreeGeometry';
import {
  clusterPixelWidth,
  collectSpouseComponent,
  H_GAP,
  layoutSpouseCluster,
  NODE_WIDTH,
} from './spouseLayout';
import { sortPeopleByBirthOldestFirst } from './siblingOrder';

export interface PositionedNode {
  id: string;
  position: { x: number; y: number };
  data: Person;
}

function layoutClustersInRow(
  people: Person[],
  startX: number,
  y: number,
  genIds: Set<string>,
  byId: Map<string, Person>,
): PositionedNode[] {
  const clusterPlaced = new Set<string>();
  const nodes: PositionedNode[] = [];
  let cursor = startX;

  for (const person of people) {
    if (clusterPlaced.has(person.id)) continue;

    const cluster = collectSpouseComponent(person, genIds, byId);
    cluster.forEach(p => clusterPlaced.add(p.id));

    const clusterPositions = layoutSpouseCluster(cluster);
    const clusterWidth = clusterPixelWidth(clusterPositions);

    for (const { id, x } of clusterPositions) {
      const p = byId.get(id);
      if (!p) continue;
      nodes.push({
        id,
        position: { x: cursor + x, y },
        data: p,
      });
    }

    cursor += clusterWidth + H_GAP;
  }

  return nodes;
}

function rowWidth(nodes: PositionedNode[]): number {
  if (nodes.length === 0) return 0;
  const minX = Math.min(...nodes.map(n => n.position.x));
  const maxX = Math.max(...nodes.map(n => n.position.x)) + NODE_WIDTH;
  return maxX - minX;
}

function shiftNodes(nodes: PositionedNode[], deltaX: number): void {
  if (deltaX === 0) return;
  for (const node of nodes) {
    node.position.x += deltaX;
  }
}

/**
 * Place children oldest-to-right in a row centered on their parents' midpoint.
 * Shifts groups apart when multiple parent sets share a generation row.
 */
export function layoutChildrenUnderParents(
  groups: PedigreeGroup[],
  genPeople: Person[],
  genY: number,
  parentGen: number,
  genMap: Map<string, number>,
  parentPositions: Map<string, { x: number }>,
  byId: Map<string, Person>,
): { nodes: PositionedNode[]; assigned: Set<string> } {
  const genIds = new Set(genPeople.map(p => p.id));

  const relevant = groups
    .filter(
      g =>
        g.childIds.some(id => genIds.has(id)) &&
        g.parentIds.every(id => genMap.get(id) === parentGen && parentPositions.has(id)),
    )
    .sort((a, b) => {
      const ax = parentCenterX(a.parentIds, parentPositions) ?? 0;
      const bx = parentCenterX(b.parentIds, parentPositions) ?? 0;
      return ax - bx;
    });

  const allNodes: PositionedNode[] = [];
  const assigned = new Set<string>();
  let rightEdge = -Infinity;

  for (const group of relevant) {
    const centerX = parentCenterX(group.parentIds, parentPositions);
    if (centerX == null) continue;

    const children = sortPeopleByBirthOldestFirst(
      group.childIds.map(id => byId.get(id)).filter((p): p is Person => p != null),
    );

    const widthEstimate = children.length * (NODE_WIDTH + H_GAP) - H_GAP;
    const startX = centerX - widthEstimate / 2;

    const bandNodes = layoutClustersInRow(children, startX, genY, genIds, byId);
    if (bandNodes.length === 0) continue;

    const width = rowWidth(bandNodes);
    const alignedStart = centerX - width / 2;
    shiftNodes(bandNodes, alignedStart - Math.min(...bandNodes.map(n => n.position.x)));

    const left = Math.min(...bandNodes.map(n => n.position.x));
    if (left < rightEdge + H_GAP) {
      shiftNodes(bandNodes, rightEdge + H_GAP - left);
    }

    const right = Math.max(...bandNodes.map(n => n.position.x)) + LAYOUT_NODE_WIDTH;
    rightEdge = Math.max(rightEdge, right);

    for (const node of bandNodes) {
      assigned.add(node.id);
      allNodes.push(node);
    }
  }

  return { nodes: allNodes, assigned };
}
