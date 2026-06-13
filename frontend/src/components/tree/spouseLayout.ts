import type { Person } from '../../types';
import { LAYOUT_NODE_HEIGHT, LAYOUT_NODE_WIDTH } from './pedigreeGeometry';

export const H_GAP = 60;
export const V_GAP = 100;
export const NODE_WIDTH = LAYOUT_NODE_WIDTH;
export const NODE_HEIGHT = LAYOUT_NODE_HEIGHT;

export interface ClusterPosition {
  id: string;
  x: number;
}

/** Collect everyone in the same spouse-connected component within this generation. */
export function collectSpouseComponent(
  start: Person,
  genIds: Set<string>,
  byId: Map<string, Person>,
): Person[] {
  const component: Person[] = [];
  const seen = new Set<string>();
  const queue = [start.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id) || !genIds.has(id)) continue;
    seen.add(id);

    const person = byId.get(id);
    if (!person) continue;

    component.push(person);

    for (const rel of person.spouses ?? []) {
      if (!seen.has(rel.person.id) && genIds.has(rel.person.id)) {
        queue.push(rel.person.id);
      }
    }
  }

  return component;
}

/**
 * Anchor = person with the most spouses in the cluster. Other spouses fan out
 * alternating left / right: 1st left, 2nd right, 3rd left (further), etc.
 */
export function layoutSpouseCluster(cluster: Person[]): ClusterPosition[] {
  if (cluster.length === 0) return [];

  const clusterIds = new Set(cluster.map(p => p.id));
  const anchor = cluster.reduce((best, p) => {
    const count = (p.spouses ?? []).filter(s => clusterIds.has(s.person.id)).length;
    const bestCount = (best.spouses ?? []).filter(s => clusterIds.has(s.person.id)).length;
    return count > bestCount ? p : best;
  });

  const slot = NODE_WIDTH + H_GAP;
  const positions = new Map<string, number>();
  positions.set(anchor.id, 0);

  const anchorSpouses = (anchor.spouses ?? [])
    .map(rel => rel.person.id)
    .filter(id => clusterIds.has(id) && id !== anchor.id);

  const orderedSpouseIds: string[] = [];
  const spouseSeen = new Set<string>();
  for (const id of anchorSpouses) {
    if (!spouseSeen.has(id)) {
      spouseSeen.add(id);
      orderedSpouseIds.push(id);
    }
  }

  orderedSpouseIds.forEach((spouseId, i) => {
    const tier = Math.floor(i / 2) + 1;
    const side = i % 2 === 0 ? -1 : 1;
    positions.set(spouseId, side * tier * slot);
  });

  let fallbackSide = 1;
  let fallbackTier =
    orderedSpouseIds.length > 0
      ? Math.floor((orderedSpouseIds.length - 1) / 2) + 2
      : 1;

  for (const person of cluster) {
    if (positions.has(person.id)) continue;
    positions.set(person.id, fallbackSide * fallbackTier * slot);
    fallbackSide *= -1;
    if (fallbackSide === 1) fallbackTier++;
  }

  return cluster.map(p => ({
    id: p.id,
    x: positions.get(p.id) ?? 0,
  }));
}

export function clusterPixelWidth(positions: ClusterPosition[]): number {
  if (positions.length === 0) return 0;
  const xs = positions.map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return maxX - minX + NODE_WIDTH;
}
