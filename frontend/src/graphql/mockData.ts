import { FamilyTree } from '../types';

// Sample Mandinka family tree spanning 4 generations.
// Covers the key visual states we need to style:
//   - Normal nodes (high confidence)
//   - Low-confidence nodes (great-grandparents with limited evidence)
//   - Unknown placeholder node (missing ancestor)
//   - Deceased members (deathDate set)
//   - No photo (most nodes - shows initials fallback)
export const MOCK_TREE: FamilyTree = {
  id: 'tree-1',
  name: 'Kouyaté Family Tree',
  originRegion: 'Guinea / Liberia',
  people: [
    // ── Generation 1 (great-grandparents) ──────────────────────────────
    {
      id: 'p1',
      fullName: 'Musa Kouyaté',
      birthDate: '1901',
      birthDateApproximate: true,
      deathDate: '1974',
      birthplace: 'Kankan, Guinea',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'MALE',
      confidenceScore: 0.55,  // moderate - oral history only
      isUnknownPlaceholder: false,
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
      confidenceScore: 0.45,  // lower - fewer corroborations
      isUnknownPlaceholder: false,
    },
    {
      id: 'p3',
      fullName: 'Unknown Ancestor',
      ethnicGroup: 'Mandinka',
      biologicalSex: 'MALE',
      confidenceScore: 0.1,   // placeholder - existence inferred only
      isUnknownPlaceholder: true,  // renders with dashed border + ? avatar
    },

    // ── Generation 2 (grandparents) ────────────────────────────────────
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
        { person: { id: 'p1', fullName: 'Musa Kouyaté' }, confidenceScore: 0.55, disputed: false },
        { person: { id: 'p2', fullName: 'Fatoumata Diabaté' }, confidenceScore: 0.55, disputed: false },
      ],
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
      parents: [
        { person: { id: 'p3', fullName: 'Unknown Ancestor' }, confidenceScore: 0.1, disputed: false },
      ],
    },

    // ── Generation 3 (parents) ─────────────────────────────────────────
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
        { person: { id: 'p4', fullName: 'Ibrahim Kouyaté' }, confidenceScore: 0.82, disputed: false },
        { person: { id: 'p5', fullName: 'Mariama Camara' }, confidenceScore: 0.78, disputed: false },
      ],
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
    },

    // ── Generation 4 (current generation) ─────────────────────────────
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
        { person: { id: 'p6', fullName: 'Amadou Kouyaté' }, confidenceScore: 0.95, disputed: false },
        { person: { id: 'p7', fullName: 'Aïssatou Bah' }, confidenceScore: 0.91, disputed: false },
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
        { person: { id: 'p6', fullName: 'Amadou Kouyaté' }, confidenceScore: 0.95, disputed: false },
        { person: { id: 'p7', fullName: 'Aïssatou Bah' }, confidenceScore: 0.91, disputed: false },
      ],
    },
  ],
};
