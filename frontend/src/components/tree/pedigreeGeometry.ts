import type { InternalNode } from '@xyflow/react';
import type { Person } from '../../types';
import { edgeStyle } from './relationshipStyles';
import { sortIdsByBirthOldestFirst } from './siblingOrder';

/** Must match PersonNode.module.css width and treeLayout spacing. */
export const LAYOUT_NODE_WIDTH = 110;
export const LAYOUT_NODE_HEIGHT = 118;

const MERGE_DROP = 22;
const BUS_DROP = 20;

export interface PedigreeEdgeData extends Record<string, unknown> {
  parentIds: string[];
  childIds: string[];
  style: { stroke: string; strokeWidth: number; strokeDasharray?: string };
}

export interface PedigreeGroup {
  key: string;
  parentIds: string[];
  childIds: string[];
  style: PedigreeEdgeData['style'];
}

function nodeSize(node: InternalNode) {
  return {
    width: node.measured?.width ?? LAYOUT_NODE_WIDTH,
    height: node.measured?.height ?? LAYOUT_NODE_HEIGHT,
  };
}

function bottomCenter(node: InternalNode) {
  const { width, height } = nodeSize(node);
  return { x: node.position.x + width / 2, y: node.position.y + height };
}

function topCenter(node: InternalNode) {
  const { width } = nodeSize(node);
  return { x: node.position.x + width / 2, y: node.position.y };
}

/** Build pedigree connector paths: merged trunk + bus, then separate drops to children. */
export function buildPedigreePaths(
  parentNodes: InternalNode[],
  childNodes: InternalNode[],
): { trunk: string; drops: string[] } {
  if (parentNodes.length === 0 || childNodes.length === 0) {
    return { trunk: '', drops: [] };
  }

  const childTops = childNodes.map(topCenter).sort((a, b) => a.x - b.x);

  if (childTops.length === 1 && parentNodes.length === 1) {
    const from = bottomCenter(parentNodes[0]!);
    const to = childTops[0]!;
    return { trunk: '', drops: [`M ${from.x} ${from.y} L ${to.x} ${to.y}`] };
  }

  const parentBottoms = parentNodes.map(bottomCenter);
  const unionX =
    parentBottoms.length === 1
      ? parentBottoms[0]!.x
      : (parentBottoms[0]!.x + parentBottoms[1]!.x) / 2;
  const startY = Math.max(...parentBottoms.map(p => p.y));
  const mergeY = startY + MERGE_DROP;
  const busY = mergeY + BUS_DROP;

  const busLeft = Math.min(unionX, ...childTops.map(c => c.x));
  const busRight = Math.max(unionX, ...childTops.map(c => c.x));

  const trunkSegments: string[] = [];

  if (parentBottoms.length === 1) {
    trunkSegments.push(`M ${unionX} ${startY} L ${unionX} ${busY}`);
  } else {
    for (const p of parentBottoms) {
      trunkSegments.push(`M ${p.x} ${p.y} L ${unionX} ${mergeY}`);
    }
    trunkSegments.push(`M ${unionX} ${mergeY} L ${unionX} ${busY}`);
  }

  if (busLeft !== busRight) {
    trunkSegments.push(`M ${busLeft} ${busY} L ${busRight} ${busY}`);
  }

  const drops = childTops.map(
    child => `M ${child.x} ${busY} L ${child.x} ${child.y}`,
  );

  return { trunk: trunkSegments.join(' '), drops };
}

export function groupPedigreeFamilies(people: Person[]): PedigreeGroup[] {
  const byId = new Map(people.map(p => [p.id, p]));
  const groups = new Map<string, { parentIds: string[]; childIds: string[] }>();

  for (const child of people) {
    const parentIds = (child.parents ?? [])
      .map(rel => rel.person.id)
      .sort();
    if (parentIds.length === 0) continue;

    const key = parentIds.join(':');
    const existing = groups.get(key);
    if (existing) {
      if (!existing.childIds.includes(child.id)) {
        existing.childIds.push(child.id);
      }
    } else {
      groups.set(key, { parentIds, childIds: [child.id] });
    }
  }

  return Array.from(groups.entries()).map(([key, group]) => ({
    key,
    parentIds: group.parentIds,
    childIds: sortIdsByBirthOldestFirst(group.childIds, byId),
    style: pedigreeGroupStyle(group.parentIds, group.childIds, people),
  }));
}

function pedigreeGroupStyle(
  parentIds: string[],
  childIds: string[],
  people: Person[],
): PedigreeEdgeData['style'] {
  let minScore = 1;
  let disputed = false;

  for (const childId of childIds) {
    const child = people.find(p => p.id === childId);
    for (const rel of child?.parents ?? []) {
      if (parentIds.includes(rel.person.id)) {
        minScore = Math.min(minScore, rel.confidenceScore);
        if (rel.disputed) disputed = true;
      }
    }
  }

  return edgeStyle('PARENT_OF', minScore, disputed);
}
