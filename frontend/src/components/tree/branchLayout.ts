import type { Person } from '../../types';
import type { PedigreeGroup } from './pedigreeGeometry';
import { LAYOUT_NODE_WIDTH } from './pedigreeGeometry';
import {
  clusterPixelWidth,
  collectSpouseComponent,
  H_GAP,
  layoutSpouseCluster,
} from './spouseLayout';
import {
  collectSiblingBand,
  comparePeopleByBirthOldestFirst,
  hasKnownBirthYear,
  sortPeopleByBirthOldestFirst,
} from './siblingOrder';
import { layoutSiblingBandOnParentRow } from './siblingParentRowLayout';

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

function shiftNodes(nodes: PositionedNode[], deltaX: number): void {
  if (deltaX === 0) return;
  for (const node of nodes) {
    node.position.x += deltaX;
  }
}

function collectSubtreeIds(rootId: string, byId: Map<string, Person>): Set<string> {
  const ids = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (ids.has(id)) continue;
    ids.add(id);
    byId.get(id)?.children?.forEach(c => queue.push(c.person.id));
  }

  return ids;
}

/** Primary sibling in a parent set (branch owner), not a co-parent spouse. */
export function branchAnchorId(
  parentIds: string[],
  parentGen: number,
  genMap: Map<string, number>,
  byId: Map<string, Person>,
): string | null {
  const atGen = parentIds.filter(id => (genMap.get(id) ?? -1) === parentGen);
  if (atGen.length === 0) return null;

  const withSiblings = atGen.filter(id => (byId.get(id)?.siblings?.length ?? 0) > 0);
  const candidates = withSiblings.length > 0 ? withSiblings : atGen;
  const sorted = sortPeopleByBirthOldestFirst(
    candidates.map(id => byId.get(id)).filter((p): p is Person => p != null),
  );
  return sorted[0]?.id ?? atGen[0] ?? null;
}

function groupsForChildGen(
  pedigreeGroups: PedigreeGroup[],
  childGen: number,
  parentGen: number,
  genMap: Map<string, number>,
): PedigreeGroup[] {
  return pedigreeGroups.filter(
    g =>
      g.childIds.some(id => genMap.get(id) === childGen) &&
      g.parentIds.every(id => genMap.get(id) === parentGen),
  );
}

function groupByBranch(
  groups: PedigreeGroup[],
  parentGen: number,
  genMap: Map<string, number>,
  byId: Map<string, Person>,
): Map<string, PedigreeGroup[]> {
  const byBranch = new Map<string, PedigreeGroup[]>();
  for (const g of groups) {
    const anchor = branchAnchorId(g.parentIds, parentGen, genMap, byId);
    if (!anchor) continue;
    if (!byBranch.has(anchor)) byBranch.set(anchor, []);
    byBranch.get(anchor)!.push(g);
  }
  return byBranch;
}

function branchChildCount(anchorId: string, byBranch: Map<string, PedigreeGroup[]>): number {
  const ids = new Set<string>();
  for (const group of byBranch.get(anchorId) ?? []) {
    group.childIds.forEach(id => ids.add(id));
  }
  return ids.size;
}

/**
 * Left-to-right branch order for the child row. Known births: oldest branch left.
 * Unknown births: smaller branches flank the largest hub — small left, hub center, larger right.
 */
function orderBranchAnchors(
  anchors: Person[],
  byBranch: Map<string, PedigreeGroup[]>,
): Person[] {
  if (anchors.length === 0) return [];
  if (anchors.every(hasKnownBirthYear)) {
    return sortPeopleByBirthOldestFirst(anchors);
  }

  const counts = new Map(anchors.map(a => [a.id, branchChildCount(a.id, byBranch)]));
  const hub = anchors.reduce((best, a) =>
    (counts.get(a.id) ?? 0) > (counts.get(best.id) ?? 0) ? a : best,
  );
  const rest = anchors.filter(a => a.id !== hub.id);

  if (rest.length === 0) return [hub];
  if (rest.length === 1) return [hub, rest[0]!];

  const sorted = [...rest].sort(
    (a, b) =>
      (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) ||
      comparePeopleByBirthOldestFirst(a, b),
  );
  const mid = Math.floor(sorted.length / 2);
  return [...sorted.slice(0, mid), hub, ...sorted.slice(mid)];
}

export function centerAllNodes(nodes: PositionedNode[]): void {
  if (nodes.length === 0) return;
  const minX = Math.min(...nodes.map(n => n.position.x));
  const maxX = Math.max(...nodes.map(n => n.position.x)) + LAYOUT_NODE_WIDTH;
  shiftNodes(nodes, -(minX + maxX) / 2);
}

/**
 * Pack child generation by sibling branch (oldest branch left). Within each branch,
 * co-parent child sets (e.g. polygamy) pack left-to-right oldest-first.
 */
export function layoutChildGenerationByBranch(
  childGen: number,
  parentGen: number,
  genY: number,
  genMap: Map<string, number>,
  pedigreeGroups: PedigreeGroup[],
  genPeople: Person[],
  byId: Map<string, Person>,
): PositionedNode[] {
  const genIds = new Set(genPeople.map(p => p.id));
  const relevant = groupsForChildGen(pedigreeGroups, childGen, parentGen, genMap);
  const byBranch = groupByBranch(relevant, parentGen, genMap, byId);

  const branchAnchors = orderBranchAnchors(
    [...byBranch.keys()].map(id => byId.get(id)).filter((p): p is Person => p != null),
    byBranch,
  );

  const allNodes: PositionedNode[] = [];
  let previousBranchRight = -Infinity;

  for (const anchor of branchAnchors) {
    const branchGroups = byBranch.get(anchor.id) ?? [];

    const childIdSet = new Set<string>();
    for (const group of branchGroups) {
      group.childIds.forEach(id => childIdSet.add(id));
    }

    const children = sortPeopleByBirthOldestFirst(
      [...childIdSet].map(id => byId.get(id)).filter((p): p is Person => p != null),
    );

    const branchCursor =
      previousBranchRight === -Infinity ? 0 : previousBranchRight + H_GAP;
    const branchNodes = layoutClustersInRow(children, branchCursor, genY, genIds, byId);

    if (branchNodes.length === 0) continue;

    const left = Math.min(...branchNodes.map(n => n.position.x));
    if (previousBranchRight > -Infinity && left < previousBranchRight + H_GAP) {
      shiftNodes(branchNodes, previousBranchRight + H_GAP - left);
    }

    previousBranchRight = Math.max(...branchNodes.map(n => n.position.x)) + LAYOUT_NODE_WIDTH;
    allNodes.push(...branchNodes);
  }

  return allNodes;
}

/**
 * Place each sibling (+ spouses) centered above their own children. Siblings without
 * children sit just outside the previous branch's child span.
 */
export function layoutParentGenerationByBranch(
  parentGen: number,
  childGen: number,
  genY: number,
  genMap: Map<string, number>,
  pedigreeGroups: PedigreeGroup[],
  genPeople: Person[],
  byId: Map<string, Person>,
  existingNodes: Map<string, PositionedNode>,
): PositionedNode[] {
  const genIds = new Set(genPeople.map(p => p.id));
  const byBranch = groupByBranch(
    groupsForChildGen(pedigreeGroups, childGen, parentGen, genMap),
    parentGen,
    genMap,
    byId,
  );

  const placed = new Set<string>();
  const bands: Person[][] = [];
  for (const person of genPeople) {
    if (placed.has(person.id)) continue;
    const band = collectSiblingBand(person, genIds, genPeople, byId);
    band.forEach(p => placed.add(p.id));
    bands.push(band);
  }
  bands.sort((a, b) => comparePeopleByBirthOldestFirst(a[0]!, b[0]!));

  const allNodes: PositionedNode[] = [];

  for (const band of bands) {
    allNodes.push(
      ...layoutSiblingBandOnParentRow(
        band,
        byBranch,
        existingNodes,
        genIds,
        byId,
        genY,
        parentGen,
        genMap,
      ),
    );
  }

  const placedIds = new Set(allNodes.map(n => n.id));
  const coParentById = new Map<string, PositionedNode[]>();

  for (const group of groupsForChildGen(pedigreeGroups, childGen, parentGen, genMap)) {
    const childNodes = group.childIds
      .map(id => existingNodes.get(id))
      .filter((n): n is PositionedNode => n != null);
    if (childNodes.length === 0) continue;

    const branchAnchor = branchAnchorId(group.parentIds, parentGen, genMap, byId);

    for (const parentId of group.parentIds) {
      if (placedIds.has(parentId)) continue;
      if (parentId === branchAnchor) continue;
      if ((genMap.get(parentId) ?? -1) !== parentGen) continue;

      const existing = coParentById.get(parentId) ?? [];
      for (const node of childNodes) {
        if (!existing.some(n => n.id === node.id)) {
          existing.push(node);
        }
      }
      coParentById.set(parentId, existing);
    }
  }

  const coParentCandidates = [...coParentById.entries()]
    .map(([id, childNodes]) => ({
      person: byId.get(id)!,
      childNodes,
    }))
    .filter((c): c is { person: Person; childNodes: PositionedNode[] } => c.person != null);

  coParentCandidates.sort((a, b) => {
    const ax = Math.min(...a.childNodes.map(n => n.position.x));
    const bx = Math.min(...b.childNodes.map(n => n.position.x));
    return ax - bx;
  });

  for (const { person, childNodes } of coParentCandidates) {
    const childMin = Math.min(...childNodes.map(n => n.position.x));
    const childMax = Math.max(...childNodes.map(n => n.position.x)) + LAYOUT_NODE_WIDTH;
    const centerX = (childMin + childMax) / 2;

    allNodes.push({
      id: person.id,
      position: { x: centerX - LAYOUT_NODE_WIDTH / 2, y: genY },
      data: person,
    });
    placedIds.add(person.id);
  }

  return allNodes;
}

/** Gen-0 parents center over the full footprint of each direct child's subtree. */
export function layoutGen0ParentsByFootprint(
  genPeople: Person[],
  genY: number,
  genMap: Map<string, number>,
  byId: Map<string, Person>,
  existingNodes: Map<string, PositionedNode>,
): PositionedNode[] {
  const nodes: PositionedNode[] = [];

  for (const parent of sortPeopleByBirthOldestFirst(genPeople)) {
    const directChildren = (parent.children ?? [])
      .map(c => c.person.id)
      .filter(id => (genMap.get(id) ?? -1) === 1);

    const footprintIds = new Set<string>();
    for (const childId of directChildren) {
      collectSubtreeIds(childId, byId).forEach(id => footprintIds.add(id));
    }

    const footprintNodes = [...footprintIds]
      .map(id => existingNodes.get(id))
      .filter((n): n is PositionedNode => n != null);

    if (footprintNodes.length === 0) continue;

    const minX = Math.min(...footprintNodes.map(n => n.position.x));
    const maxX = Math.max(...footprintNodes.map(n => n.position.x)) + LAYOUT_NODE_WIDTH;

    nodes.push({
      id: parent.id,
      position: { x: (minX + maxX) / 2 - LAYOUT_NODE_WIDTH / 2, y: genY },
      data: parent,
    });
  }

  return nodes;
}
