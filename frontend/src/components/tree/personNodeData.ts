import type { Person } from '../../types';

/** Scalar fields only — avoids cyclic relationship graphs in React Flow node state. */
export type PersonNodeDisplay = Pick<
  Person,
  | 'id'
  | 'fullName'
  | 'birthDate'
  | 'deathDate'
  | 'birthDateApproximate'
  | 'biologicalSex'
  | 'photoUrl'
  | 'confidenceScore'
  | 'isUnknownPlaceholder'
>;

export function toPersonNodeDisplay(person: Person): PersonNodeDisplay {
  return {
    id: person.id,
    fullName: person.fullName,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    birthDateApproximate: person.birthDateApproximate,
    biologicalSex: person.biologicalSex,
    photoUrl: person.photoUrl,
    confidenceScore: person.confidenceScore,
    isUnknownPlaceholder: person.isUnknownPlaceholder,
  };
}
