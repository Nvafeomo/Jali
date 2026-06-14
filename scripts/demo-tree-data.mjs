/** Demo Kouyaté family — 5 generations, 1000 people, Mandinka / West African diaspora. */

import { buildExpansion } from './demo-tree-expansion.mjs';

export const DEMO_TREE_NAME = 'Kouyaté Family Tree';
export const DEMO_PERSON_COUNT = 1000;

const CORE_PEOPLE = [
  // —— Generation 0 ——
  {
    key: 'musa_g0',
    fullName: 'Musa Kouyaté',
    bio: 'Born near Kankan on the Niger River. A jali who carried oral histories for several lineages before settling in Monrovia.',
    birthDate: '1901',
    deathDate: '1974',
    birthplace: 'Kankan, Guinea',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'fatoumata_g0',
    fullName: 'Fatoumata Diabaté',
    bio: 'Known in the community for her knowledge of medicinal plants and for keeping the names of every grandchild straight.',
    birthDate: '1905',
    deathDate: '1980',
    birthplace: 'Kankan, Guinea',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },

  // —— Generation 1 ——
  {
    key: 'ibrahim_g1',
    fullName: 'Ibrahim Kouyaté',
    bio: 'Respected elder in Monrovia. Recorded family genealogy in notebooks and on cassette tapes for younger cousins.',
    birthDate: '1928',
    deathDate: '2001',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'mariama_g1',
    fullName: 'Mariama Camara',
    bio: 'Raised in Vai country; moved to Monrovia after marriage. Worked as a market trader for decades.',
    birthDate: '1932',
    deathDate: '2010',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Vai',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'yusuf_g1',
    fullName: 'Yusuf Kouyaté',
    bio: 'Younger brother of Ibrahim. Never had children; lived with Ibrahim\'s family and helped raise nieces and nephews.',
    birthDate: '1935',
    deathDate: '2018',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'aminata_g1',
    fullName: 'Aminata Kouyaté',
    bio: 'Sister of Ibrahim and Yusuf. Emigrated to France in the 1970s; visits still bring the whole family together.',
    birthDate: '1940',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },

  // —— Generation 2 ——
  {
    key: 'amadou_g2',
    fullName: 'Amadou Kouyaté',
    bio: 'Mechanic and part-time musician. Keeps a folder of old photos scanned from relatives in Guinea and Liberia.',
    birthDate: '1955',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'hawa_g2',
    fullName: 'Hawa Diallo',
    bio: 'Nurse in Monrovia before the family relocated. Speaks Mandinka, French, and English at home.',
    birthDate: '1958',
    birthplace: 'Conakry, Guinea',
    ethnicGroup: 'Fula',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'aissatou_g2',
    fullName: 'Aïssatou Traoré',
    bio: 'Co-parent with Amadou for their youngest daughter. Lives in Abidjan; visits Monrovia every dry season.',
    birthDate: '1962',
    birthplace: 'Abidjan, Côte d\'Ivoire',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'bakary_g2',
    fullName: 'Bakary Kouyaté',
    bio: 'Ibrahim\'s second son. Teacher and imam at the neighborhood masjid.',
    birthDate: '1959',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'adama_g2',
    fullName: 'Adama Bah',
    bio: 'Homemaker and community organizer. Runs the annual family reunion potluck.',
    birthDate: '1961',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Fula',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'sekou_g2',
    fullName: 'Sekou Kouyaté',
    bio: 'Youngest of Ibrahim\'s sons. Half-brother to Amadou and Bakary through shared father only — same mother Mariama.',
    birthDate: '1965',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'nene_g2',
    fullName: 'Nene Keita',
    bio: 'Sekou\'s wife. From a Keita lineage in Bamako; met Sekou at a wedding in Conakry.',
    birthDate: '1968',
    birthplace: 'Bamako, Mali',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },

  // —— Generation 3 (Amadou + Hawa branch) ——
  {
    key: 'karamo_g3',
    fullName: 'Karamo Kouyaté',
    bio: 'Software engineer in Columbus. Built this tree to preserve what elders told him at Ibrahim\'s funeral.',
    birthDate: '1983',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'kadiatou_g3',
    fullName: 'Kadiatou Kouyaté',
    bio: 'Attorney in Atlanta. Interviewed Mariama on video before she passed — those clips are family treasures.',
    birthDate: '1986',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'ibrahim2_g3',
    fullName: 'Ibrahim Kouyaté Jr.',
    bio: 'Named for his grandfather. Studying public health; wants to open a clinic in rural Liberia.',
    birthDate: '1988',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'mariam_g3',
    fullName: 'Mariam Kouyaté',
    bio: 'Teacher in Monrovia. Keeps the WhatsApp group for the whole diaspora active.',
    birthDate: '1990',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'lamin_g3',
    fullName: 'Lamin Kouyaté',
    bio: 'Youngest of Amadou and Hawa\'s five. Still in university; plays kora at family events.',
    birthDate: '1994',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'fatou_g3',
    fullName: 'Fatou Kouyaté',
    bio: 'Amadou and Aïssatou\'s daughter. Split time between Abidjan and Monrovia growing up.',
    birthDate: '1996',
    birthplace: 'Abidjan, Côte d\'Ivoire',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },

  // —— Generation 3 (Bakary branch) ——
  {
    key: 'mamadou_b_g3',
    fullName: 'Mamadou Kouyaté',
    bio: 'Bakary\'s eldest. Logistics manager; coordinates shipments between West Africa and the US.',
    birthDate: '1984',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'awa_b_g3',
    fullName: 'Awa Kouyaté',
    bio: 'Fashion designer with a studio in Monrovia. Bakary\'s second child.',
    birthDate: '1987',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'saliou_b_g3',
    fullName: 'Saliou Kouyaté',
    bio: 'Youngest of Bakary\'s three. Plays football semi-professionally in Dakar.',
    birthDate: '1992',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },

  // —— Generation 3 (Sekou branch) ——
  {
    key: 'bintou_g3',
    fullName: 'Bintou Kouyaté',
    bio: 'Sekou and Nene\'s eldest. Pharmacist in Bamako.',
    birthDate: '1989',
    birthplace: 'Bamako, Mali',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'mamadou_s_g3',
    fullName: 'Mamasu Kouyaté',
    bio: 'Middle child of Sekou. DJ and producer under the name "Mamasu M".',
    birthDate: '1991',
    birthplace: 'Bamako, Mali',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'vasayo_g3',
    fullName: 'Vasayo Kouyaté',
    bio: 'Youngest of Sekou\'s three. High school student in Bamako.',
    birthDate: '2003',
    birthplace: 'Bamako, Mali',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },

  // —— Generation 4 (grandchildren) ——
  {
    key: 'aminata_g4',
    fullName: 'Aminata Kouyaté',
    bio: 'Karamo\'s daughter. Loves hearing stories about great-great-grandfather Musa.',
    birthDate: '2012',
    birthplace: 'Columbus, Ohio, USA',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'modou_g4',
    fullName: 'Modou Kouyaté',
    bio: 'Karamo\'s son. Learning Mandinka phrases from his grandfather Amadou on video calls.',
    birthDate: '2015',
    birthplace: 'Columbus, Ohio, USA',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'hawa_g4',
    fullName: 'Hawa Kouyaté',
    bio: 'Kadiatou\'s daughter. Named for her grandmother Hawa Diallo.',
    birthDate: '2014',
    birthplace: 'Atlanta, Georgia, USA',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'omar_g4',
    fullName: 'Omar Kouyaté',
    bio: 'Mamadou (Bakary\'s son) and his wife\'s first child.',
    birthDate: '2016',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'MALE',
  },
  {
    key: 'sira_g4',
    fullName: 'Sira Kouyaté',
    bio: 'Mamadou\'s second child. Not yet in school; already sings at family gatherings.',
    birthDate: '2019',
    birthplace: 'Monrovia, Liberia',
    ethnicGroup: 'Mandinka',
    biologicalSex: 'FEMALE',
  },
  {
    key: 'kadiatou_g4',
    fullName: 'Kadiatou Bah',
    bio: 'Mamadou\'s wife. From a Bah family in Conakry; met Mamadou at a cousin\'s wedding.',
    birthDate: '1988',
    birthplace: 'Conakry, Guinea',
    ethnicGroup: 'Fula',
    biologicalSex: 'FEMALE',
  },
];

/** from → to, relationshipType, optional parentRole */
const CORE_RELATIONSHIPS = [
  // Gen 0 parents
  { from: 'musa_g0', to: 'ibrahim_g1', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'fatoumata_g0', to: 'ibrahim_g1', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'musa_g0', to: 'yusuf_g1', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'fatoumata_g0', to: 'yusuf_g1', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'musa_g0', to: 'aminata_g1', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'fatoumata_g0', to: 'aminata_g1', type: 'PARENT_OF', parentRole: 'MOTHER' },

  // Gen 1 → 2 (parents before marriages; siblings inferred from shared parents)
  { from: 'ibrahim_g1', to: 'amadou_g2', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'mariama_g1', to: 'amadou_g2', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'ibrahim_g1', to: 'bakary_g2', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'mariama_g1', to: 'bakary_g2', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'ibrahim_g1', to: 'sekou_g2', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'mariama_g1', to: 'sekou_g2', type: 'PARENT_OF', parentRole: 'MOTHER' },

  // Marriages (after parent links on existing children)
  { from: 'musa_g0', to: 'fatoumata_g0', type: 'MARRIED_TO' },
  { from: 'ibrahim_g1', to: 'mariama_g1', type: 'MARRIED_TO' },
  { from: 'amadou_g2', to: 'hawa_g2', type: 'MARRIED_TO' },
  { from: 'amadou_g2', to: 'aissatou_g2', type: 'MARRIED_TO' },
  { from: 'bakary_g2', to: 'adama_g2', type: 'MARRIED_TO' },
  { from: 'sekou_g2', to: 'nene_g2', type: 'MARRIED_TO' },

  // Amadou + Hawa → 5 children
  { from: 'amadou_g2', to: 'karamo_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'hawa_g2', to: 'karamo_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'amadou_g2', to: 'kadiatou_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'hawa_g2', to: 'kadiatou_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'amadou_g2', to: 'ibrahim2_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'hawa_g2', to: 'ibrahim2_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'amadou_g2', to: 'mariam_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'hawa_g2', to: 'mariam_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'amadou_g2', to: 'lamin_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'hawa_g2', to: 'lamin_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },

  // Amadou + Aïssatou → 1 child (co-parent only for Fatou)
  { from: 'amadou_g2', to: 'fatou_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'aissatou_g2', to: 'fatou_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },

  // Bakary branch
  { from: 'bakary_g2', to: 'mamadou_b_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'adama_g2', to: 'mamadou_b_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'bakary_g2', to: 'awa_b_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'adama_g2', to: 'awa_b_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'bakary_g2', to: 'saliou_b_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'adama_g2', to: 'saliou_b_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },

  // Sekou branch
  { from: 'sekou_g2', to: 'bintou_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'nene_g2', to: 'bintou_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'sekou_g2', to: 'mamadou_s_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'nene_g2', to: 'mamadou_s_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'sekou_g2', to: 'vasayo_g3', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'nene_g2', to: 'vasayo_g3', type: 'PARENT_OF', parentRole: 'MOTHER' },

  // Gen 4
  { from: 'karamo_g3', to: 'aminata_g4', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'karamo_g3', to: 'modou_g4', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'kadiatou_g3', to: 'hawa_g4', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'mamadou_b_g3', to: 'kadiatou_g4', type: 'MARRIED_TO' },
  { from: 'mamadou_b_g3', to: 'omar_g4', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'kadiatou_g4', to: 'omar_g4', type: 'PARENT_OF', parentRole: 'MOTHER' },
  { from: 'mamadou_b_g3', to: 'sira_g4', type: 'PARENT_OF', parentRole: 'FATHER' },
  { from: 'kadiatou_g4', to: 'sira_g4', type: 'PARENT_OF', parentRole: 'MOTHER' },
];

const { people: expansionPeople, rels: expansionRels } = buildExpansion(
  CORE_PEOPLE.length,
  DEMO_PERSON_COUNT,
);

export const PEOPLE = [...CORE_PEOPLE, ...expansionPeople];
export const RELATIONSHIPS = [...CORE_RELATIONSHIPS, ...expansionRels];

if (PEOPLE.length !== DEMO_PERSON_COUNT) {
  throw new Error(`Demo tree must have ${DEMO_PERSON_COUNT} people, got ${PEOPLE.length}`);
}
