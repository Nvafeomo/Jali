import type { Person } from '../../types';
import { birthYearFromStored } from '../../utils/vitalYears';

/** Sort key for birth year; unknown births sort last (rightmost). */
export function birthYearSortKey(birthDate?: string | null): number {
  const year = birthYearFromStored(birthDate ?? undefined);
  if (!year) return Number.MAX_SAFE_INTEGER;
  const parsed = parseInt(year, 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

/** Oldest first (left), youngest last (right). Unknown birth dates go last. */
export function comparePeopleByBirthOldestFirst(a: Person, b: Person): number {
  const diff = birthYearSortKey(a.birthDate) - birthYearSortKey(b.birthDate);
  if (diff !== 0) return diff;
  return a.fullName.localeCompare(b.fullName);
}

export function sortPeopleByBirthOldestFirst(people: Person[]): Person[] {
  return [...people].sort(comparePeopleByBirthOldestFirst);
}

export function sortIdsByBirthOldestFirst(ids: string[], byId: Map<string, Person>): string[] {
  return sortPeopleByBirthOldestFirst(
    ids.map(id => byId.get(id)).filter((p): p is Person => p != null),
  ).map(p => p.id);
}

function parentSetKey(person: Person): string | null {
  const ids = (person.parents ?? []).map(rel => rel.person.id).sort();
  return ids.length > 0 ? ids.join(':') : null;
}

/**
 * Everyone in the same generation who shares a sibling link or the same parent set.
 */
export function collectSiblingBand(
  start: Person,
  genIds: Set<string>,
  genPeople: Person[],
  byId: Map<string, Person>,
): Person[] {
  const component: Person[] = [];
  const seen = new Set<string>();
  const queue = [start.id];

  const byParentKey = new Map<string, string[]>();
  for (const p of genPeople) {
    const key = parentSetKey(p);
    if (!key) continue;
    if (!byParentKey.has(key)) byParentKey.set(key, []);
    byParentKey.get(key)!.push(p.id);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id) || !genIds.has(id)) continue;
    seen.add(id);

    const person = byId.get(id);
    if (!person) continue;
    component.push(person);

    for (const rel of person.siblings ?? []) {
      if (!seen.has(rel.person.id) && genIds.has(rel.person.id)) {
        queue.push(rel.person.id);
      }
    }

    const pKey = parentSetKey(person);
    if (pKey) {
      for (const relatedId of byParentKey.get(pKey) ?? []) {
        if (!seen.has(relatedId)) queue.push(relatedId);
      }
    }
  }

  return sortPeopleByBirthOldestFirst(component);
}

/** Sibling-connected component (for generation alignment across half-siblings). */
export function collectSiblingComponentAll(
  start: Person,
  byId: Map<string, Person>,
): Person[] {
  const component: Person[] = [];
  const seen = new Set<string>();
  const queue = [start.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);

    const person = byId.get(id);
    if (!person) continue;

    component.push(person);

    for (const rel of person.siblings ?? []) {
      if (!seen.has(rel.person.id)) {
        queue.push(rel.person.id);
      }
    }
  }

  return component;
}
