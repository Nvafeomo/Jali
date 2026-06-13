import { useQuery } from '@apollo/client/react';
import { MY_TREE_QUERY } from '../graphql/queries';
import type { Person, RelationshipEdge } from '../types';

// --- Raw GraphQL shapes (what Apollo gives us before we map) ---

interface RawEdge {
  person: { uuid: string; fullName: string; confidenceScore: number; isUnknownPlaceholder: boolean };
  confidenceScore: number;
  disputed: boolean;
  parentRole?: 'MOTHER' | 'FATHER';
}

interface RawPerson {
  uuid: string;
  fullName: string;
  bio?: string;
  birthDate?: string;
  deathDate?: string;
  birthplace?: string;
  ethnicGroup?: string;
  biologicalSex?: string;
  confidenceScore: number;
  isUnknownPlaceholder: boolean;
  createdAt?: string;
  canEditDetails?: boolean;
  children: RawEdge[];
  spouses: RawEdge[];
  siblings: RawEdge[];
}

// --- Mapping ---

// The backend returns `uuid` as the node ID and only gives us children/
// spouses/siblings — not parents. This function:
//   1. Maps uuid → id so the rest of the frontend code works unchanged
//   2. Derives parent edges by inverting the children relationships
//   3. Wires all relationship edges to full Person objects (not just stubs)
function mapToPersons(rawList: RawPerson[]): Person[] {
  // First pass: build id-keyed stubs with all scalar fields
  const byId = new Map<string, Person>();
  for (const raw of rawList) {
    byId.set(raw.uuid, {
      id: raw.uuid,
      fullName: raw.fullName,
      bio: raw.bio ?? undefined,
      birthDate: raw.birthDate ?? undefined,
      deathDate: raw.deathDate ?? undefined,
      birthplace: raw.birthplace ?? undefined,
      ethnicGroup: raw.ethnicGroup ?? undefined,
      biologicalSex: raw.biologicalSex ?? undefined,
      confidenceScore: raw.confidenceScore ?? 1.0,
      isUnknownPlaceholder: raw.isUnknownPlaceholder ?? false,
      createdAt: raw.createdAt ?? undefined,
      canEditDetails: raw.canEditDetails ?? false,
      children: [],
      parents: [],
      spouses: [],
      siblings: [],
    });
  }

  // Second pass: wire relationships using the full Person objects from the map
  for (const raw of rawList) {
    const person = byId.get(raw.uuid)!;

    // Children — and derive parents on the child side
    for (const edge of raw.children ?? []) {
      const child = byId.get(edge.person.uuid);
      if (!child) continue;

      const childEdge: RelationshipEdge = {
        person: child,
        type: 'PARENT_OF',
        confidenceScore: edge.confidenceScore,
        disputed: edge.disputed,
        parentRole: edge.parentRole,
      };
      person.children!.push(childEdge);

      // The inverse: this person is a parent of `child`
      const parentEdge: RelationshipEdge = {
        person,
        type: 'PARENT_OF',
        confidenceScore: edge.confidenceScore,
        disputed: edge.disputed,
        parentRole: edge.parentRole,
      };
      child.parents!.push(parentEdge);
    }

    // Spouses — wire both directions so graph walks work from any node
    for (const edge of raw.spouses ?? []) {
      const spouse = byId.get(edge.person.uuid);
      if (!spouse) continue;

      const forward: RelationshipEdge = {
        person: spouse,
        type: 'MARRIED_TO',
        confidenceScore: edge.confidenceScore,
        disputed: edge.disputed,
      };
      if (!person.spouses!.some(s => s.person.id === spouse.id)) {
        person.spouses!.push(forward);
      }

      const reverse: RelationshipEdge = {
        person,
        type: 'MARRIED_TO',
        confidenceScore: edge.confidenceScore,
        disputed: edge.disputed,
      };
      if (!spouse.spouses!.some(s => s.person.id === person.id)) {
        spouse.spouses!.push(reverse);
      }
    }

    // Siblings — wire both directions
    for (const edge of raw.siblings ?? []) {
      const sibling = byId.get(edge.person.uuid);
      if (!sibling) continue;

      const forward: RelationshipEdge = {
        person: sibling,
        type: 'SIBLING_OF',
        confidenceScore: edge.confidenceScore,
        disputed: edge.disputed,
      };
      if (!person.siblings!.some(s => s.person.id === sibling.id)) {
        person.siblings!.push(forward);
      }

      const reverse: RelationshipEdge = {
        person,
        type: 'SIBLING_OF',
        confidenceScore: edge.confidenceScore,
        disputed: edge.disputed,
      };
      if (!sibling.siblings!.some(s => s.person.id === person.id)) {
        sibling.siblings!.push(reverse);
      }
    }
  }

  return Array.from(byId.values());
}

// --- Hook ---

export function useMyTree() {
  const { data, loading, error, refetch } = useQuery<{ myTree: RawPerson[] }>(MY_TREE_QUERY, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  const people: Person[] = data?.myTree ? mapToPersons(data.myTree) : [];

  return { people, loading, error, refetch };
}
