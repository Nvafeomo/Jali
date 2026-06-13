export type RelRole = 'parent' | 'child' | 'spouse' | 'sibling';

export function toRelationshipMutationVars(anchorId: string, otherId: string, role: RelRole) {
  switch (role) {
    case 'parent':
      return { fromUuid: otherId, toUuid: anchorId, relationshipType: 'PARENT_OF' };
    case 'child':
      return { fromUuid: anchorId, toUuid: otherId, relationshipType: 'PARENT_OF' };
    case 'spouse':
      return { fromUuid: anchorId, toUuid: otherId, relationshipType: 'MARRIED_TO' };
    case 'sibling':
      return { fromUuid: anchorId, toUuid: otherId, relationshipType: 'SIBLING_OF' };
  }
}

export function toDeleteRelationshipVars(anchorId: string, otherId: string, role: RelRole) {
  const { fromUuid, toUuid, relationshipType } = toRelationshipMutationVars(anchorId, otherId, role);
  return { anchorUuid: anchorId, fromUuid, toUuid, relationshipType };
}
