import type { FamilyTree, Person, RelationshipEdge } from '../types';
import { enrichPeople } from '../utils/enrichPeople';

function personRef(id: string, fullName: string): Person {
  return {
    id,
    fullName,
    confidenceScore: 0,
    isUnknownPlaceholder: false,
  };
}

function parentOf(
  id: string,
  fullName: string,
  confidenceScore: number,
  disputed = false,
): RelationshipEdge {
  return {
    person: personRef(id, fullName),
    type: 'PARENT_OF',
    confidenceScore,
    disputed,
  };
}

function marriedTo(
  id: string,
  fullName: string,
  confidenceScore: number,
  disputed = false,
): RelationshipEdge {
  return {
    person: personRef(id, fullName),
    type: 'MARRIED_TO',
    confidenceScore,
    disputed,
  };
}

// Sample Mandinka family tree spanning 4 generations.
export const MOCK_TREE: FamilyTree = {
  id: 'tree-1',
  name: 'Kouyaté Family Tree',
  originRegion: 'Guinea / Liberia',
  people: [
    {
      id: 'p1',
      fullName: 'Musa Kouyaté',
      birthDate: '1901',
      birthDateApproximate: true,
      deathDate: '1974',
      birthplace: 'Kankan, Guinea',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'MALE',
      confidenceScore: 0.55,
      isUnknownPlaceholder: false,
      spouses: [marriedTo('p2', 'Fatoumata Diabaté', 0.6)],
    },
    {
      id: 'p2',
      fullName: 'Fatoumata Diabaté',
      birthDate: '1905',
      birthDateApproximate: true,
      deathDate: '1980',
      birthplace: 'Kankan, Guinea',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'FEMALE',
      confidenceScore: 0.45,
      isUnknownPlaceholder: false,
      spouses: [marriedTo('p1', 'Musa Kouyaté', 0.6)],
    },
    {
      id: 'p3',
      fullName: 'Unknown Ancestor',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'MALE',
      confidenceScore: 0.1,
      isUnknownPlaceholder: true,
    },

    {
      id: 'p4',
      fullName: 'Ibrahim Kouyaté',
      birthDate: '1928',
      deathDate: '2001',
      birthplace: 'Monrovia, Liberia',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'MALE',
      confidenceScore: 0.82,
      isUnknownPlaceholder: false,
      parents: [
        parentOf('p1', 'Musa Kouyaté', 0.55),
        parentOf('p2', 'Fatoumata Diabaté', 0.55),
      ],
      spouses: [marriedTo('p5', 'Mariama Camara', 0.75)],
    },
    {
      id: 'p5',
      fullName: 'Mariama Camara',
      birthDate: '1932',
      deathDate: '2010',
      birthplace: 'Monrovia, Liberia',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'FEMALE',
      confidenceScore: 0.78,
      isUnknownPlaceholder: false,
      parents: [parentOf('p3', 'Unknown Ancestor', 0.1, true)],
      spouses: [marriedTo('p4', 'Ibrahim Kouyaté', 0.75)],
    },

    {
      id: 'p6',
      fullName: 'Amadou Kouyaté',
      birthDate: '1955',
      birthplace: 'Monrovia, Liberia',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'MALE',
      confidenceScore: 0.95,
      isUnknownPlaceholder: false,
      parents: [
        parentOf('p4', 'Ibrahim Kouyaté', 0.82),
        parentOf('p5', 'Mariama Camara', 0.78),
      ],
      spouses: [marriedTo('p7', 'Aïssatou Bah', 0.91)],
    },
    {
      id: 'p7',
      fullName: 'Aïssatou Bah',
      birthDate: '1958',
      birthplace: 'Conakry, Guinea',
      ethnicGroup: 'Fula',
      biologicalSex: 'FEMALE',
      confidenceScore: 0.91,
      isUnknownPlaceholder: false,
      spouses: [marriedTo('p6', 'Amadou Kouyaté', 0.91)],
    },

    {
      id: 'p8',
      fullName: 'Karamo Kouyaté',
      birthDate: '1983',
      birthplace: 'Monrovia, Liberia',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'MALE',
      confidenceScore: 1.0,
      isUnknownPlaceholder: false,
      parents: [
        parentOf('p6', 'Amadou Kouyaté', 0.95),
        parentOf('p7', 'Aïssatou Bah', 0.91),
      ],
    },
    {
      id: 'p9',
      fullName: 'Kadiatou Kouyaté',
      birthDate: '1986',
      birthplace: 'Monrovia, Liberia',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'FEMALE',
      confidenceScore: 1.0,
      isUnknownPlaceholder: false,
      parents: [
        parentOf('p6', 'Amadou Kouyaté', 0.95),
        parentOf('p7', 'Aïssatou Bah', 0.91),
      ],
    },
  ],
};

export const MOCK_PEOPLE = enrichPeople(MOCK_TREE.people);
