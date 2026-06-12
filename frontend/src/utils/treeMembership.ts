import type { Person } from '../types';

export interface TreePartition {
  /** People on the main canvas (reachable from the seed person). */
  connected: Person[];
  /** People not yet linked into the tree — shown in the unlinked panel. */
  unattached: Person[];
  seedId: string | null;
}

function relationshipNeighborIds(person: Person): string[] {
  const ids: string[] = [];
  person.parents?.forEach(r => ids.push(r.person.id));
  person.children?.forEach(r => ids.push(r.person.id));
  person.spouses?.forEach(r => ids.push(r.person.id));
  person.siblings?.forEach(r => ids.push(r.person.id));
  return ids;
}

/** The first person added to an empty tree — anchor for reachability. */
export function findTreeSeed(people: Person[]): Person | null {
  if (people.length === 0) return null;

  const dated = people.filter(p => p.createdAt);
  if (dated.length > 0) {
    return [...dated].sort(
      (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime(),
    )[0];
  }

  return people[0];
}

export function hasAnyRelationship(person: Person): boolean {
  return (
    (person.parents?.length ?? 0) > 0 ||
    (person.children?.length ?? 0) > 0 ||
    (person.spouses?.length ?? 0) > 0 ||
    (person.siblings?.length ?? 0) > 0
  );
}

/**
 * Split members into canvas vs unlinked panel.
 * Only the seed (first added) may sit on the canvas alone; everyone else
 * must be reachable from the seed through a relationship path.
 */
export function partitionTreeMembers(people: Person[]): TreePartition {
  if (people.length === 0) {
    return { connected: [], unattached: [], seedId: null };
  }

  const seed = findTreeSeed(people)!;
  const byId = new Map(people.map(p => [p.id, p]));
  const visited = new Set<string>([seed.id]);
  const queue = [seed.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const person = byId.get(id);
    if (!person) continue;

    for (const neighborId of relationshipNeighborIds(person)) {
      if (!visited.has(neighborId) && byId.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  const connected = people.filter(p => visited.has(p.id));
  const unattached = people.filter(p => !visited.has(p.id));

  return { connected, unattached, seedId: seed.id };
}

export function isOnTree(personId: string, partition: TreePartition): boolean {
  return partition.connected.some(p => p.id === personId);
}
