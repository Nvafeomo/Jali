import type { Person, RelationshipEdge } from '../types';

function siblingOf(
  person: Person,
  confidenceScore = 0.9,
  disputed = false,
): RelationshipEdge {
  return {
    person,
    type: 'SIBLING_OF',
    confidenceScore,
    disputed,
  };
}

function childOf(
  child: Person,
  parentRel: RelationshipEdge,
): RelationshipEdge {
  return {
    person: child,
    type: 'PARENT_OF',
    confidenceScore: parentRel.confidenceScore,
    disputed: parentRel.disputed,
  };
}

/** Resolve relationship stubs to full records and derive children/siblings. */
export function enrichPeople(people: Person[]): Person[] {
  const byId = new Map(people.map(p => [p.id, p]));

  const resolveEdge = (rel: RelationshipEdge): RelationshipEdge => ({
    ...rel,
    person: byId.get(rel.person.id) ?? rel.person,
  });

  return people.map(person => {
    const parents = person.parents?.map(resolveEdge);

    const parentIds = new Set(parents?.map(rel => rel.person.id) ?? []);

    const children: RelationshipEdge[] = [];
    for (const candidate of people) {
      if (candidate.id === person.id) continue;
      const parentRel = candidate.parents?.find(rel => rel.person.id === person.id);
      if (parentRel) {
        children.push(childOf(candidate, parentRel));
      }
    }

    const siblings: RelationshipEdge[] = [];
    if (parentIds.size > 0) {
      for (const candidate of people) {
        if (candidate.id === person.id) continue;
        const sharesParent = candidate.parents?.some(rel => parentIds.has(rel.person.id));
        if (sharesParent) {
          siblings.push(siblingOf(candidate));
        }
      }
    }

    return {
      ...person,
      parents,
      spouses: person.spouses?.map(resolveEdge),
      children: children.length > 0 ? children : person.children?.map(resolveEdge),
      siblings: siblings.length > 0 ? siblings : person.siblings?.map(resolveEdge),
    };
  });
}

export function peopleById(people: Person[]): Map<string, Person> {
  return new Map(people.map(p => [p.id, p]));
}
