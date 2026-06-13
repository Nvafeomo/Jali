export type RelRole = 'parent' | 'child' | 'spouse' | 'sibling';

export type LinkKind = 'mother' | 'father' | 'child' | 'spouse' | 'sibling';

export type ParentRoleKind = 'MOTHER' | 'FATHER';

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

export function toLinkMutationVars(
  anchorId: string,
  otherId: string,
  kind: LinkKind,
  parentRole?: ParentRoleKind | null,
) {
  switch (kind) {
    case 'mother':
      return {
        fromUuid: otherId,
        toUuid: anchorId,
        relationshipType: 'PARENT_OF',
        parentRole: 'MOTHER' as const,
      };
    case 'father':
      return {
        fromUuid: otherId,
        toUuid: anchorId,
        relationshipType: 'PARENT_OF',
        parentRole: 'FATHER' as const,
      };
    case 'child':
      return {
        fromUuid: anchorId,
        toUuid: otherId,
        relationshipType: 'PARENT_OF',
        parentRole: parentRole ?? null,
      };
    case 'spouse':
      return {
        fromUuid: anchorId,
        toUuid: otherId,
        relationshipType: 'MARRIED_TO',
        parentRole: null,
      };
    case 'sibling':
      return {
        fromUuid: anchorId,
        toUuid: otherId,
        relationshipType: 'SIBLING_OF',
        parentRole: null,
      };
  }
}

export function defaultParentRoleFromSex(biologicalSex?: string): ParentRoleKind | '' {
  if (biologicalSex === 'FEMALE') return 'MOTHER';
  if (biologicalSex === 'MALE') return 'FATHER';
  return '';
}

export function toDeleteRelationshipVars(anchorId: string, otherId: string, role: RelRole) {
  const { fromUuid, toUuid, relationshipType } = toRelationshipMutationVars(anchorId, otherId, role);
  return { anchorUuid: anchorId, fromUuid, toUuid, relationshipType };
}
