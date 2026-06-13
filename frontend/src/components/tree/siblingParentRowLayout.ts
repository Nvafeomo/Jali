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

/** Minimum child count to treat a branch as "large" for left/right side choice. */
const LARGE_BRANCH_CHILDREN = 3;

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

function buildSiblingRowItems(
  band: Person[],
  byBranch: Map<string, PedigreeGroup[]>,
  existingNodes: Map<string, PositionedNode>,
  genIds: Set<string>,
  byId: Map<string, Person>,
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
      clusterWidth: clusterPixelWidth(layoutSpouseCluster(cluster)),
    });
  }

  return items;
}

function placeByBirthOrder(items: SiblingRowItem[], genY: number, byId: Map<string, Person>): PositionedNode[] {
  const sorted = [...items].sort((a, b) => comparePeopleByBirthOldestFirst(a.rep, b.rep));
  const placedClusters: { min: number; max: number }[] = [];
  const nodes: PositionedNode[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!;
    const foot = childFootprint(item.childNodes);

    let clusterLeft: number;
    if (foot) {
      const centerX = (foot.min + foot.max) / 2;
      clusterLeft = centerX - item.clusterWidth / 2;
    } else {
      const prevFoot = [...placedClusters].reverse().find(Boolean);
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
    ...placeSpouseClusterAt(
      hub.cluster,
      (hubFoot.min + hubFoot.max) / 2 - hub.clusterWidth / 2,
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

  const leftWidthUsed = hubFoot.min - leftCursor;
  let rightmostChildMax = hubFoot.max;

  const others = withChildren.filter(i => i.rep.id !== hub.rep.id);
  others.sort((a, b) => {
    const aFoot = childFootprint(a.childNodes)!;
    const bFoot = childFootprint(b.childNodes)!;
    return aFoot.min - bFoot.min;
  });

  for (const item of others) {
    const foot = childFootprint(item.childNodes)!;
    let centerX = (foot.min + foot.max) / 2;

    const rightWidth = rightmostChildMax - hubFoot.max;
    if (
      item.childNodes.length >= LARGE_BRANCH_CHILDREN &&
      leftWidthUsed > rightWidth + LAYOUT_NODE_WIDTH
    ) {
      centerX = Math.max(centerX, rightmostChildMax + H_GAP + item.clusterWidth / 2);
    }

    nodes.push(
      ...placeSpouseClusterAt(item.cluster, centerX - item.clusterWidth / 2, genY, byId),
    );
    rightmostChildMax = Math.max(rightmostChildMax, foot.max, centerX + item.clusterWidth / 2);
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
): PositionedNode[] {
  const items = buildSiblingRowItems(band, byBranch, existingNodes, genIds, byId);
  if (items.length === 0) return [];

  const bandHasUnknownBirth = items.some(i => !hasKnownBirthYear(i.rep));
  if (!bandHasUnknownBirth) {
    return placeByBirthOrder(items, genY, byId);
  }
  return placeBySpacePacking(items, genY, byId);
}
