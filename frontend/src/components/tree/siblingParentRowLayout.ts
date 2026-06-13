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
  comparePeopleByBirthOldestFirst,
  hasKnownBirthYear,
  sortPeopleByBirthOldestFirst,
} from './siblingOrder';

export interface PositionedNode {
  id: string;
  position: { x: number; y: number };
  data: Person;
}

interface SiblingRowItem {
  rep: Person;
  cluster: Person[];
  childNodes: PositionedNode[];
  clusterWidth: number;
}

function childFootprint(nodes: PositionedNode[]): { min: number; max: number } | null {
  if (nodes.length === 0) return null;
  return {
    min: Math.min(...nodes.map(n => n.position.x)),
    max: Math.max(...nodes.map(n => n.position.x)) + LAYOUT_NODE_WIDTH,
  };
}

function placeSpouseClusterAt(
  cluster: Person[],
  clusterLeft: number,
  genY: number,
  byId: Map<string, Person>,
): PositionedNode[] {
  const positions = layoutSpouseCluster(cluster);
  const nodes: PositionedNode[] = [];
  for (const { id, x } of positions) {
    const p = byId.get(id);
    if (!p) continue;
    nodes.push({
      id,
      position: { x: clusterLeft + x, y: genY },
      data: p,
    });
  }
  return nodes;
}

/** Every co-parent on this branch's pedigree groups (e.g. Fatumata + Kalifala + Kadijah). */
function collectBranchParentPeople(
  anchorId: string,
  byBranch: Map<string, PedigreeGroup[]>,
  parentGen: number,
  genMap: Map<string, number>,
  byId: Map<string, Person>,
): Person[] {
  const ids = new Set<string>();
  for (const group of byBranch.get(anchorId) ?? []) {
    for (const pid of group.parentIds) {
      if ((genMap.get(pid) ?? -1) === parentGen) ids.add(pid);
    }
  }
  return sortPeopleByBirthOldestFirst(
    [...ids].map(id => byId.get(id)).filter((p): p is Person => p != null),
  );
}

function parentGroupCounts(
  groups: PedigreeGroup[],
  parentGen: number,
  genMap: Map<string, number>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const group of groups) {
    for (const pid of group.parentIds) {
      if ((genMap.get(pid) ?? -1) !== parentGen) continue;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
  }
  return counts;
}

function isLikelyFather(
  person: Person,
  childIds: Iterable<string>,
  byId: Map<string, Person>,
): boolean {
  if (person.biologicalSex === 'MALE') return true;
  for (const childId of childIds) {
    const edge = byId.get(childId)?.parents?.find(p => p.person.id === person.id);
    if (edge?.parentRole === 'FATHER') return true;
  }
  return false;
}

/** Branch owner centered above children; spouses flank left / right (most-shared first). */
function findBranchHubParent(
  anchorId: string,
  groups: PedigreeGroup[],
  parents: Person[],
  parentGen: number,
  genMap: Map<string, number>,
  byId: Map<string, Person>,
): Person {
  const branchOwner = parents.find(p => p.id === anchorId);
  if (branchOwner) return branchOwner;

  const childIds = new Set<string>();
  for (const group of groups) {
    group.childIds.forEach(id => childIds.add(id));
  }

  const counts = parentGroupCounts(groups, parentGen, genMap);
  const totalGroups = groups.length;

  const pickFrom = (candidates: Person[]): Person => {
    const father = candidates.find(p => isLikelyFather(p, childIds, byId));
    if (father) return father;
    return sortPeopleByBirthOldestFirst(candidates)[0]!;
  };

  const universal = parents.filter(p => (counts.get(p.id) ?? 0) === totalGroups);
  if (universal.length > 0) return pickFrom(universal);

  const maxCount = Math.max(...parents.map(p => counts.get(p.id) ?? 0));
  const topTier = parents.filter(p => (counts.get(p.id) ?? 0) === maxCount);
  return pickFrom(topTier);
}

function sortFlankers(
  flankers: Person[],
  groups: PedigreeGroup[],
  parentGen: number,
  genMap: Map<string, number>,
): Person[] {
  const counts = parentGroupCounts(groups, parentGen, genMap);
  return [...flankers].sort((a, b) => {
    const countDiff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    return comparePeopleByBirthOldestFirst(a, b);
  });
}

function hubCenteredParentUnitWidth(parentCount: number): number {
  if (parentCount <= 1) return LAYOUT_NODE_WIDTH;
  const tiers = Math.ceil((parentCount - 1) / 2);
  return LAYOUT_NODE_WIDTH + 2 * tiers * (LAYOUT_NODE_WIDTH + H_GAP);
}

/** Hub parent centered above children; other co-parents alternate left / right by birth order. */
function layoutHubCenteredParentRow(
  anchorId: string,
  groups: PedigreeGroup[],
  parents: Person[],
  centerX: number,
  parentGen: number,
  genMap: Map<string, number>,
  genY: number,
  byId: Map<string, Person>,
): PositionedNode[] {
  if (parents.length === 0) return [];

  const hub = findBranchHubParent(anchorId, groups, parents, parentGen, genMap, byId);
  const flankers = sortFlankers(
    parents.filter(p => p.id !== hub.id),
    groups,
    parentGen,
    genMap,
  );
  const slot = LAYOUT_NODE_WIDTH + H_GAP;
  const nodes: PositionedNode[] = [];

  nodes.push({
    id: hub.id,
    position: { x: centerX - LAYOUT_NODE_WIDTH / 2, y: genY },
    data: hub,
  });

  flankers.forEach((person, i) => {
    const tier = Math.floor(i / 2) + 1;
    const side = i % 2 === 0 ? -1 : 1;
    nodes.push({
      id: person.id,
      position: { x: centerX + side * tier * slot - LAYOUT_NODE_WIDTH / 2, y: genY },
      data: person,
    });
  });

  return nodes;
}

function branchParentCount(
  anchorId: string,
  byBranch: Map<string, PedigreeGroup[]>,
  parentGen: number,
  genMap: Map<string, number>,
): number {
  const ids = new Set<string>();
  for (const group of byBranch.get(anchorId) ?? []) {
    for (const pid of group.parentIds) {
      if ((genMap.get(pid) ?? -1) === parentGen) ids.add(pid);
    }
  }
  return ids.size;
}

function parentUnitWidth(
  anchorId: string,
  byBranch: Map<string, PedigreeGroup[]>,
  parentGen: number,
  genMap: Map<string, number>,
): number {
  return hubCenteredParentUnitWidth(branchParentCount(anchorId, byBranch, parentGen, genMap));
}

/** Branch co-parents with the shared parent centered above the child footprint. */
function layoutBranchParentUnit(
  anchorId: string,
  byBranch: Map<string, PedigreeGroup[]>,
  childNodes: PositionedNode[],
  parentGen: number,
  genMap: Map<string, number>,
  genY: number,
  byId: Map<string, Person>,
): PositionedNode[] {
  const groups = byBranch.get(anchorId) ?? [];
  const parents = collectBranchParentPeople(anchorId, byBranch, parentGen, genMap, byId);
  const foot = childFootprint(childNodes);
  if (parents.length === 0 || !foot) return [];

  return layoutHubCenteredParentRow(
    anchorId,
    groups,
    parents,
    (foot.min + foot.max) / 2,
    parentGen,
    genMap,
    genY,
    byId,
  );
}

function buildSiblingRowItems(
  band: Person[],
  byBranch: Map<string, PedigreeGroup[]>,
  existingNodes: Map<string, PositionedNode>,
  genIds: Set<string>,
  byId: Map<string, Person>,
  parentGen: number,
  genMap: Map<string, number>,
): SiblingRowItem[] {
  const bandIds = new Set(band.map(p => p.id));
  const clusterPlaced = new Set<string>();
  const items: SiblingRowItem[] = [];

  for (const person of sortPeopleByBirthOldestFirst(band)) {
    if (clusterPlaced.has(person.id)) continue;

    const cluster = collectSpouseComponent(person, genIds, byId);
    if (!cluster.some(p => bandIds.has(p.id))) continue;

    cluster.forEach(p => clusterPlaced.add(p.id));
    const rep =
      sortPeopleByBirthOldestFirst(cluster.filter(p => bandIds.has(p.id)))[0] ??
      person;

    const childIdSet = new Set<string>();
    for (const group of byBranch.get(rep.id) ?? []) {
      group.childIds.forEach(id => childIdSet.add(id));
    }

    const childNodes = [...childIdSet]
      .map(id => existingNodes.get(id))
      .filter((n): n is PositionedNode => n != null);

    items.push({
      rep,
      cluster,
      childNodes,
      clusterWidth:
        parentUnitWidth(rep.id, byBranch, parentGen, genMap) ||
        clusterPixelWidth(layoutSpouseCluster(cluster)),
    });
  }

  return items;
}

function placeByBirthOrder(
  items: SiblingRowItem[],
  byBranch: Map<string, PedigreeGroup[]>,
  parentGen: number,
  genMap: Map<string, number>,
  genY: number,
  byId: Map<string, Person>,
): PositionedNode[] {
  const sorted = [...items].sort((a, b) => comparePeopleByBirthOldestFirst(a.rep, b.rep));
  const placedClusters: { min: number; max: number }[] = [];
  const nodes: PositionedNode[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!;
    const foot = childFootprint(item.childNodes);

    if (foot && item.childNodes.length > 0) {
      const unitNodes = layoutBranchParentUnit(
        item.rep.id,
        byBranch,
        item.childNodes,
        parentGen,
        genMap,
        genY,
        byId,
      );
      nodes.push(...unitNodes);
      if (unitNodes.length > 0) {
        placedClusters.push({
          min: Math.min(...unitNodes.map(n => n.position.x)),
          max: Math.max(...unitNodes.map(n => n.position.x)) + LAYOUT_NODE_WIDTH,
        });
      }
      continue;
    }

    let clusterLeft: number;
    const prevFoot = [...placedClusters].reverse()[0];
    const nextItem = sorted.slice(i + 1).find(it => childFootprint(it.childNodes));
    const nextFoot = nextItem ? childFootprint(nextItem.childNodes) : null;

    if (prevFoot && nextFoot) {
      const slotLeft = prevFoot.max + H_GAP;
      const slotRight = nextFoot.min - H_GAP;
      clusterLeft = (slotLeft + slotRight - item.clusterWidth) / 2;
    } else if (prevFoot) {
      clusterLeft = prevFoot.max + H_GAP;
    } else if (nextFoot) {
      clusterLeft = nextFoot.min - H_GAP - item.clusterWidth;
    } else {
      clusterLeft = -item.clusterWidth / 2;
    }

    const bandNodes = placeSpouseClusterAt(item.cluster, clusterLeft, genY, byId);
    nodes.push(...bandNodes);
    placedClusters.push({
      min: clusterLeft,
      max: clusterLeft + item.clusterWidth,
    });
  }

  return nodes;
}

function placeBySpacePacking(
  items: SiblingRowItem[],
  byBranch: Map<string, PedigreeGroup[]>,
  parentGen: number,
  genMap: Map<string, number>,
  genY: number,
  byId: Map<string, Person>,
): PositionedNode[] {
  const nodes: PositionedNode[] = [];
  const withChildren = items.filter(i => i.childNodes.length > 0);
  const childless = items.filter(i => i.childNodes.length === 0);

  if (withChildren.length === 0) {
    let cursor = 0;
    for (const item of sortPeopleByBirthOldestFirst(childless.map(i => i.rep)).map(rep =>
      childless.find(i => i.rep.id === rep.id)!,
    )) {
      nodes.push(...placeSpouseClusterAt(item.cluster, cursor, genY, byId));
      cursor += item.clusterWidth + H_GAP;
    }
    return nodes;
  }

  const hub = withChildren.reduce((best, item) =>
    item.childNodes.length > best.childNodes.length ? item : best,
  );
  const hubFoot = childFootprint(hub.childNodes)!;

  nodes.push(
    ...layoutBranchParentUnit(
      hub.rep.id,
      byBranch,
      hub.childNodes,
      parentGen,
      genMap,
      genY,
      byId,
    ),
  );

  let leftCursor = hubFoot.min - H_GAP;
  for (const item of sortPeopleByBirthOldestFirst(childless.map(i => i.rep)).map(rep =>
    childless.find(i => i.rep.id === rep.id)!,
  )) {
    const clusterLeft = leftCursor - item.clusterWidth;
    nodes.push(...placeSpouseClusterAt(item.cluster, clusterLeft, genY, byId));
    leftCursor = clusterLeft - H_GAP;
  }

  const others = withChildren.filter(i => i.rep.id !== hub.rep.id);
  others.sort((a, b) => {
    const aFoot = childFootprint(a.childNodes)!;
    const bFoot = childFootprint(b.childNodes)!;
    return aFoot.min - bFoot.min;
  });

  for (const item of others) {
    nodes.push(
      ...layoutBranchParentUnit(
        item.rep.id,
        byBranch,
        item.childNodes,
        parentGen,
        genMap,
        genY,
        byId,
      ),
    );
  }

  return nodes;
}

export function layoutSiblingBandOnParentRow(
  band: Person[],
  byBranch: Map<string, PedigreeGroup[]>,
  existingNodes: Map<string, PositionedNode>,
  genIds: Set<string>,
  byId: Map<string, Person>,
  genY: number,
  parentGen: number,
  genMap: Map<string, number>,
): PositionedNode[] {
  const items = buildSiblingRowItems(
    band,
    byBranch,
    existingNodes,
    genIds,
    byId,
    parentGen,
    genMap,
  );
  if (items.length === 0) return [];

  const bandHasUnknownBirth = items.some(i => !hasKnownBirthYear(i.rep));
  if (!bandHasUnknownBirth) {
    return placeByBirthOrder(items, byBranch, parentGen, genMap, genY, byId);
  }
  return placeBySpacePacking(items, byBranch, parentGen, genMap, genY, byId);
}
