/**
 * Expands the core Kouyaté demo tree:
 * - Aminata's France diaspora branch, gen-3/4/5 families (structured)
 * - For targets > 100: grow new branches downward (couples → children → spouses)
 *   instead of dumping hundreds of siblings under one parent pair.
 */

const ETHNIC = ['Mandinka', 'Fula', 'Vai', 'Bambara', 'Wolof'];
const CITIES = [
  'Monrovia, Liberia',
  'Bamako, Mali',
  'Conakry, Guinea',
  'Abidjan, Côte d\'Ivoire',
  'Paris, France',
  'Columbus, Ohio, USA',
  'Atlanta, Georgia, USA',
  'Dakar, Senegal',
  'Lyon, France',
];

const MALE_NAMES = ['Mamadu', 'Ousmane', 'Ibrahim', 'Lamin', 'Modibo', 'Sekou', 'Alpha', 'Saidu', 'Bakary', 'Karamo'];
const FEMALE_NAMES = ['Fatoumata', 'Aminata', 'Kadiatou', 'Hawa', 'Mariama', 'Bintou', 'Ramata', 'Awa', 'Fatou', 'Khady'];

/** Children per couple when auto-growing large trees (3–8, varies by couple). */
const MIN_CHILDREN_PER_COUPLE = 3;
const MAX_CHILDREN_PER_COUPLE = 8;

function childTargetForCouple(couple) {
  const hash = couple.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return MIN_CHILDREN_PER_COUPLE + (hash % (MAX_CHILDREN_PER_COUPLE - MIN_CHILDREN_PER_COUPLE + 1));
}

function person(key, fullName, bio, birthDate, sex, opts = {}) {
  return {
    key,
    fullName,
    bio,
    birthDate,
    deathDate: opts.deathDate ?? null,
    birthplace: opts.birthplace ?? CITIES[Math.abs(key.length) % CITIES.length],
    ethnicGroup: opts.ethnicGroup ?? 'Mandinka',
    biologicalSex: sex,
  };
}

function coupleId(father, mother) {
  return `${father}|${mother ?? ''}`;
}

/** Collect married / co-parent pairs that can grow downward. */
function buildCouplePool(rels) {
  const pool = [];
  const seen = new Set();

  const addCouple = (father, mother) => {
    const id = coupleId(father, mother);
    if (seen.has(id)) return;
    seen.add(id);
    pool.push({ father, mother, id, childCount: 0 });
  };

  for (const rel of rels) {
    if (rel.type === 'MARRIED_TO') {
      addCouple(rel.from, rel.to);
    }
  }

  // Core gen-2 branch heads (may already appear via MARRIED_TO in core rels).
  addCouple('amadou_g2', 'hawa_g2');
  addCouple('bakary_g2', 'adama_g2');
  addCouple('sekou_g2', 'nene_g2');
  addCouple('ibrahim_g1', 'mariama_g1');

  return pool;
}

/** Grow toward target by adding children to couples, then spouses + new couples. */
function growGenerationalBranches(coreCount, people, rels, add, parent, marry, targetTotal) {
  const pool = buildCouplePool(rels);
  if (pool.length === 0) {
    throw new Error('No couples available for generational expansion');
  }

  let n = 1;
  let poolIdx = 0;
  let passesWithoutAdd = 0;

  while (coreCount + people.length < targetTotal) {
    const couple = pool[poolIdx % pool.length];
    poolIdx++;

    if (couple.childCount >= childTargetForCouple(couple)) {
      passesWithoutAdd++;
      if (passesWithoutAdd > pool.length * MAX_CHILDREN_PER_COUPLE) {
        throw new Error('Ran out of couple capacity before reaching target person count');
      }
      continue;
    }
    passesWithoutAdd = 0;

    const isFemale = n % 2 === 0;
    const firstName = (isFemale ? FEMALE_NAMES : MALE_NAMES)[n % 10];
    const key = `ext_${n}`;
    const birthYear = String(1962 + (n % 58));

    add(
      person(
        key,
        `${firstName} Kouyaté ${n}`,
        `Extended family member ${n} — ${isFemale ? 'daughter' : 'son'} in a diaspora branch.`,
        birthYear,
        isFemale ? 'FEMALE' : 'MALE',
        { birthplace: CITIES[n % CITIES.length], ethnicGroup: ETHNIC[n % ETHNIC.length] },
      ),
    );
    parent(couple.father, couple.mother, key);
    couple.childCount++;

    // Every 2nd child: add spouse and register a new couple for the next generation down.
    if (n % 2 === 0 && coreCount + people.length < targetTotal) {
      const spKey = `ext_sp_${n}`;
      const spFemale = !isFemale;
      const spName = (spFemale ? FEMALE_NAMES : MALE_NAMES)[(n + 3) % 10];
      add(
        person(
          spKey,
          `${spName} Kouyaté`,
          `Spouse of ${firstName} Kouyaté ${n}.`,
          String(Number(birthYear) + 1),
          spFemale ? 'FEMALE' : 'MALE',
          { birthplace: CITIES[(n + 2) % CITIES.length], ethnicGroup: ETHNIC[(n + 1) % ETHNIC.length] },
        ),
      );
      marry(key, spKey);
      pool.push({
        father: isFemale ? spKey : key,
        mother: isFemale ? key : spKey,
        id: coupleId(isFemale ? spKey : key, isFemale ? key : spKey),
        childCount: 0,
      });
    }

    n++;
  }
}

export function buildExpansion(coreCount, target = 100) {
  const people = [];
  const rels = [];
  const keys = new Set();

  const add = p => {
    if (keys.has(p.key)) throw new Error(`Duplicate key: ${p.key}`);
    keys.add(p.key);
    people.push(p);
    return p.key;
  };

  const parent = (father, mother, child) => {
    rels.push({ from: father, to: child, type: 'PARENT_OF', parentRole: 'FATHER' });
    if (mother) {
      rels.push({ from: mother, to: child, type: 'PARENT_OF', parentRole: 'MOTHER' });
    }
  };

  const marry = (a, b) => rels.push({ from: a, to: b, type: 'MARRIED_TO' });

  // —— Aminata's France branch ——
  add(
    person(
      'ousmane_coulibaly_sp',
      'Ousmane Coulibaly',
      'Aminata\'s husband. Retired postal worker in Lyon; met Aminata at a diaspora cultural night in the 1960s.',
      '1938',
      'MALE',
      { birthplace: 'Lyon, France', ethnicGroup: 'Mandinka' },
    ),
  );
  marry('aminata_g1', 'ousmane_coulibaly_sp');

  const aminataChildren = [
    {
      key: 'sophie_g2_a',
      name: 'Sophie Kouyaté-Coulibaly',
      bio: 'Eldest of Aminata\'s children. Translator in Paris; keeps the French branch connected to Monrovia.',
      birth: '1968',
      sex: 'FEMALE',
      spouse: ['marc_dupont_sp', 'Marc Dupont', 'Sophie\'s husband. Architect; learned Mandinka greetings for reunions.', '1965', 'MALE', 'Paris, France', 'French'],
      kids: [
        ['lea_g3_a', 'Léa Kouyaté', 'Medical student in Marseille.', '1992', 'FEMALE'],
        ['thomas_g3_a', 'Thomas Kouyaté', 'Software designer; built a private family photo archive.', '1995', 'MALE'],
      ],
    },
    {
      key: 'mamadou_a_g2',
      name: 'Mamadou-Aminata Kouyaté',
      bio: 'Named for both parents\' lineages. Logistics coordinator between France and West Africa.',
      birth: '1971',
      sex: 'MALE',
      spouse: ['claire_martin_sp', 'Claire Martin', 'Teacher; organizes the Kouyaté cousins\' summer camp in Guinea.', '1973', 'FEMALE', 'Lyon, France', 'French'],
      kids: [
        ['ousmane_jr_g3_a', 'Ousmane Kouyaté Jr.', 'Plays djembe in a Lyon ensemble.', '1996', 'MALE'],
        ['fatim_a_g3_a', 'Fatimata Kouyaté', 'Pharmacology intern in Lyon.', '1999', 'FEMALE'],
        ['ali_a_g3_a', 'Ali Kouyaté', 'Youngest of Mamadou-Aminata\'s three; still in lycée.', '2002', 'MALE'],
      ],
    },
    {
      key: 'khady_g2_a',
      name: 'Khady Kouyaté',
      bio: 'Youngest of Aminata\'s three. Nurse in Dakar before moving back to Lyon.',
      birth: '1974',
      sex: 'FEMALE',
      spouse: ['ibrahima_sow_sp', 'Ibrahima Sow', 'Accountant from a Sow family in Dakar.', '1970', 'MALE', 'Dakar, Senegal', 'Wolof'],
      kids: [
        ['mariam_a_g3_a', 'Mariam Sow-Kouyaté', 'Event planner for diaspora weddings.', '1997', 'FEMALE'],
        ['karim_a_g3_a', 'Karim Sow-Kouyaté', 'Football coach in Lyon suburbs.', '2000', 'MALE'],
      ],
    },
  ];

  for (const branch of aminataChildren) {
    add(person(branch.key, branch.name, branch.bio, branch.birth, branch.sex, { birthplace: 'Lyon, France' }));
    parent('aminata_g1', 'ousmane_coulibaly_sp', branch.key);

    const [sk, sname, sbio, sbirth, ssex, scity, sethnic] = branch.spouse;
    add(person(sk, sname, sbio, sbirth, ssex, { birthplace: scity, ethnicGroup: sethnic ?? 'Mandinka' }));
    marry(branch.key, sk);

    for (const [k, name, bio, birth, sex] of branch.kids) {
      add(person(k, name, bio, birth, sex, { birthplace: 'Lyon, France' }));
      parent(branch.key, sk, k);
    }
  }

  add(person('pierre_bernard_sp', 'Pierre Bernard', 'Léa\'s husband. Civil engineer in Marseille.', '1990', 'MALE', { birthplace: 'Marseille, France', ethnicGroup: 'French' }));
  marry('lea_g3_a', 'pierre_bernard_sp');

  add(person('camille_roux_sp', 'Camille Roux', 'Thomas\'s partner. Photographer who documented Ibrahim Sr.\'s funeral.', '1994', 'FEMALE', { birthplace: 'Paris, France', ethnicGroup: 'French' }));
  marry('thomas_g3_a', 'camille_roux_sp');
  for (const [k, name, bio, birth, sex] of [
    ['emma_g4_a', 'Emma Kouyaté', 'Thomas and Camille\'s first child.', '2021', 'FEMALE'],
    ['noah_g4_a', 'Noah Kouyaté', 'Youngest in the Paris branch for now.', '2023', 'MALE'],
  ]) {
    add(person(k, name, bio, birth, sex, { birthplace: 'Paris, France' }));
    parent('thomas_g3_a', 'camille_roux_sp', k);
  }

  // —— Gen-3 spouses and children ——
  const gen3Families = [
    {
      person: 'karamo_g3',
      spouse: ['aisha_jalloh_sp', 'Aisha Jalloh', 'Karamo\'s wife. Public health researcher in Columbus.', '1985', 'FEMALE', 'Columbus, Ohio, USA'],
      kids: [],
    },
    {
      person: 'ibrahim2_g3',
      spouse: ['fatoumata_kone_sp', 'Fatoumata Koné', 'Ibrahim Jr.\'s wife. Midwife in Monrovia.', '1990', 'FEMALE', 'Monrovia, Liberia'],
      kids: [
        ['saidu_g4', 'Saidu Kouyaté', 'Ibrahim Jr.\'s eldest son.', '2017', 'MALE'],
        ['hawa2_g4', 'Hawa Kouyaté II', 'Named for great-grandmother Hawa Diallo.', '2020', 'FEMALE'],
        ['mamadou_i_g4', 'Mamadou Kouyaté III', 'Middle child; wants to study medicine.', '2022', 'MALE'],
        ['fatim_i_g4', 'Fatimata Kouyaté III', 'Youngest of Ibrahim Jr.\'s four.', '2024', 'FEMALE'],
      ],
    },
    {
      person: 'mariam_g3',
      spouse: ['ousmane_bah_sp', 'Ousmane Bah', 'Mariam\'s husband. Runs a shipping office in Monrovia.', '1988', 'MALE', 'Monrovia, Liberia'],
      kids: [
        ['alpha_g4', 'Alpha Bah-Kouyaté', 'Mariam\'s eldest son.', '2013', 'MALE'],
        ['binta_g4', 'Binta Bah-Kouyaté', 'Keeps cousins updated on Monrovia news.', '2016', 'FEMALE'],
        ['fanta_g4', 'Fanta Bah-Kouyaté', 'Youngest of Mariam\'s three.', '2019', 'FEMALE'],
      ],
    },
    {
      person: 'lamin_g3',
      spouse: ['yaa_mensah_sp', 'Yaa Mensah', 'Lamin\'s partner. Graphic designer for reunion T-shirts.', '1995', 'FEMALE', 'Accra, Ghana'],
      kids: [
        ['kojo_g4', 'Kojo Kouyaté', 'Learning kora from uncle recordings.', '2022', 'MALE'],
        ['kadi_l_g4', 'Kadiatou Kouyaté III', 'Lamin\'s second child.', '2024', 'FEMALE'],
        ['amadou_l_g4', 'Amadou Kouyaté III', 'Youngest of Lamin\'s three.', '2026', 'MALE'],
      ],
    },
    {
      person: 'fatou_g3',
      spouse: ['kouadio_yao_sp', 'Kouadio Yao', 'Ivorian businessman; met Fatou through Amadou\'s network.', '1994', 'MALE', 'Abidjan, Côte d\'Ivoire'],
      kids: [
        ['adjoa_g4', 'Adjoa Kouyaté', 'Bilingual in French and Mandinka.', '2018', 'FEMALE'],
        ['kwame_g4', 'Kwame Kouyaté', 'School breaks split between Monrovia and Abidjan.', '2021', 'MALE'],
      ],
    },
    {
      person: 'awa_b_g3',
      spouse: ['emmanuel_sankoh_sp', 'Emmanuel Sankoh', 'Tailor with a shop on Waterside.', '1986', 'MALE', 'Monrovia, Liberia'],
      kids: [
        ['zainab_g4', 'Zainab Kouyaté', 'Already sketching like her mother Awa.', '2012', 'FEMALE'],
        ['mohamed_g4', 'Mohamed Kouyaté', 'Plays on Saliou\'s old football team.', '2015', 'MALE'],
      ],
    },
    {
      person: 'saliou_b_g3',
      spouse: ['ndeye_fall_sp', 'Ndeye Fall', 'Runs a café near the stadium in Dakar.', '1995', 'FEMALE', 'Dakar, Senegal'],
      kids: [
        ['cheikh_g4', 'Cheikh Kouyaté', 'Youth league footballer.', '2020', 'MALE'],
        ['ndeye2_g4', 'Ndeye Kouyaté', 'Saliou\'s daughter; studies in Dakar.', '2022', 'FEMALE'],
        ['alpha_s_g4', 'Alpha Kouyaté IV', 'Youngest of Saliou\'s three.', '2025', 'MALE'],
      ],
    },
    {
      person: 'bintou_g3',
      spouse: ['idrissa_diakite_sp', 'Idrissa Diakité', 'Surgeon in Bamako.', '1987', 'MALE', 'Bamako, Mali'],
      kids: [
        ['aminata2_g4', 'Aminata Diakité-Kouyaté', 'Named for great-aunt Aminata in France.', '2015', 'FEMALE'],
        ['moussa_g4', 'Moussa Diakité-Kouyaté', 'Bintou\'s second child.', '2018', 'MALE'],
        ['hawa_bint_g4', 'Hawa Diakité-Kouyaté', 'Third of Bintou\'s four.', '2020', 'FEMALE'],
        ['sekou_bint_g4', 'Sekou Diakité-Kouyaté', 'Youngest of Bintou\'s four.', '2023', 'MALE'],
      ],
    },
    {
      person: 'mamadou_s_g3',
      spouse: ['awa_toure_sp', 'Awa Touré', 'Vocalist; featured on Mamasu\'s first EP.', '1993', 'FEMALE', 'Bamako, Mali'],
      kids: [
        ['djeli_g4', 'Djeli Kouyaté', 'Named for the jali tradition.', '2021', 'FEMALE'],
        ['alpha_m_g4', 'Alpha Mamasu Kouyaté', 'Mamasu\'s son; already mixing beats.', '2023', 'MALE'],
        ['bintou_m_g4', 'Bintou Mamasu Kouyaté', 'Youngest of Mamasu\'s three.', '2025', 'FEMALE'],
      ],
    },
  ];

  for (const fam of gen3Families) {
    const [sk, sname, sbio, sbirth, ssex, scity] = fam.spouse;
    add(person(sk, sname, sbio, sbirth, ssex, { birthplace: scity, ethnicGroup: ETHNIC[sk.length % ETHNIC.length] }));
    marry(fam.person, sk);
    for (const [k, name, bio, birth, sex] of fam.kids) {
      add(person(k, name, bio, birth, sex));
      parent(fam.person, sk, k);
    }
  }

  add(person('samba_traore_sp', 'Samba Traoré', 'Kadiatou\'s former partner and co-parent of her second child.', '1984', 'MALE', { birthplace: 'Abidjan, Côte d\'Ivoire' }));
  add(person('ibrahima_g4', 'Ibrahima Kouyaté', 'Kadiatou\'s second child; half-brother to Hawa.', '2018', 'MALE', { birthplace: 'Atlanta, Georgia, USA' }));
  parent('samba_traore_sp', 'kadiatou_g3', 'ibrahima_g4');

  add(person('tyler_webb_sp', 'Tyler Webb', 'Aminata (gen 4)\'s partner in Columbus.', '1991', 'MALE', { birthplace: 'Columbus, Ohio, USA', ethnicGroup: 'American' }));
  add(person('erica_jones_sp', 'Erica Jones', 'Modou\'s partner in Columbus.', '1993', 'FEMALE', { birthplace: 'Columbus, Ohio, USA', ethnicGroup: 'American' }));

  // Sekou's second wife — co-wife alongside Nene (realistic for Mandinka extended households)
  add(
    person(
      'fanta_w_g2',
      'Fanta Sidibé',
      'Sekou\'s second wife. From a Sidibé trading family in Bamako; shares parenting with Nene.',
      '1970',
      'FEMALE',
      { birthplace: 'Bamako, Mali', ethnicGroup: 'Mandinka' },
    ),
  );
  marry('sekou_g2', 'fanta_w_g2');
  for (const [k, name, bio, birth, sex] of [
    ['lamine_sw_g3', 'Lamine Kouyaté', 'Eldest child of Sekou and Fanta Sidibé.', '1993', 'MALE'],
    ['mariam_sw_g3', 'Mariam Kouyaté II', 'Daughter of Sekou and Fanta; close to Vasayo.', '1996', 'FEMALE'],
  ]) {
    add(person(k, name, bio, birth, sex, { birthplace: 'Bamako, Mali' }));
    parent('sekou_g2', 'fanta_w_g2', k);
  }

  // —— Gen 5 ——
  const gen5All = [
    ['tyler_webb_sp', 'aminata_g4', 'zara_g5', 'Zara Kouyaté', 'Aminata and Tyler\'s daughter.', '2024', 'FEMALE'],
    ['erica_jones_sp', 'modou_g4', 'malick_g5', 'Malick Kouyaté', 'Modou and Erica\'s son.', '2025', 'MALE'],
    ['samba_traore_sp', 'hawa_g4', 'nana_g5', 'Nana Kouyaté', 'Hawa\'s daughter.', '2023', 'FEMALE'],
    ['kadiatou_g4', 'mamadou_b_g3', 'fatou2_g5', 'Fatou Kouyaté II', 'Omar\'s eldest.', '2022', 'FEMALE'],
    ['kadiatou_g4', 'mamadou_b_g3', 'lamin2_g5', 'Lamin Kouyaté II', 'Sira\'s brother.', '2024', 'MALE'],
    ['ousmane_bah_sp', 'alpha_g4', 'mariam2_g5', 'Mariam Kouyaté III', 'Alpha\'s daughter.', '2023', 'FEMALE'],
    ['emmanuel_sankoh_sp', 'zainab_g4', 'awa2_g5', 'Awa Kouyaté II', 'Zainab\'s daughter.', '2022', 'FEMALE'],
    ['idrissa_diakite_sp', 'aminata2_g4', 'bintou2_g5', 'Bintou Kouyaté II', 'Named for her mother.', '2021', 'FEMALE'],
    ['ndeye_fall_sp', 'cheikh_g4', 'saliou2_g5', 'Saliou Kouyaté II', 'Cheikh\'s son.', '2023', 'MALE'],
    ['awa_toure_sp', 'djeli_g4', 'kora_g5', 'Kora Kouyaté', 'Djeli\'s son.', '2024', 'MALE'],
    ['fatoumata_kone_sp', 'saidu_g4', 'musu_g5', 'Musu Kouyaté', 'Ibrahim Jr.\'s first grandchild.', '2023', 'FEMALE'],
  ];
  const gen5 = target <= 100 ? gen5All.slice(0, 5) : gen5All;

  for (const [mother, father, key, name, bio, birth, sex] of gen5) {
    add(person(key, name, bio, birth, sex));
    parent(father, mother, key);
  }

  // Parent links for existing gen-4 nodes (core tree)
  rels.push({ from: 'karamo_g3', to: 'aminata_g4', type: 'PARENT_OF', parentRole: 'FATHER' });
  rels.push({ from: 'aisha_jalloh_sp', to: 'aminata_g4', type: 'PARENT_OF', parentRole: 'MOTHER' });
  rels.push({ from: 'karamo_g3', to: 'modou_g4', type: 'PARENT_OF', parentRole: 'FATHER' });
  rels.push({ from: 'aisha_jalloh_sp', to: 'modou_g4', type: 'PARENT_OF', parentRole: 'MOTHER' });
  rels.push({ from: 'kadiatou_g3', to: 'hawa_g4', type: 'PARENT_OF', parentRole: 'MOTHER' });

  // Extended cousins (Ibrahim branch)
  const cousins = [
    ['yusuf_nephew_g3', 'Abubakar Kouyaté', 'Raised close to Yusuf; part of Ibrahim\'s wider household.', '1980', 'MALE'],
    ['tijan_g3_c', 'Tijan Kouyaté', 'Abubakar\'s brother. Musician in Monrovia.', '1983', 'MALE'],
    ['mariam_cousin_g3', 'Ramata Keita', 'Cousin through Nene\'s Keita lineage.', '1987', 'FEMALE'],
    ['kadiatou_cousin_g3', 'Hawa Keita', 'Sekou branch cousin; pharmacist like Bintou.', '1993', 'FEMALE'],
    ['ousmane3_g4_c', 'Ousmane Kouyaté III', 'Abubakar\'s son.', '2006', 'MALE'],
    ['fanta2_g4_c', 'Fanta Kouyaté', 'Tijan\'s daughter.', '2009', 'FEMALE'],
    ['modibo_g4_c', 'Modibo Kouyaté', 'Tijan\'s son.', '2011', 'MALE'],
    ['safiatou_g4_c', 'Safiatou Keita', 'Ramata\'s daughter.', '2014', 'FEMALE'],
  ];

  for (const [key, name, bio, birth, sex] of cousins.slice(0, 4)) {
    add(person(key, name, bio, birth, sex));
  }
  parent('ibrahim_g1', 'mariama_g1', 'yusuf_nephew_g3');
  parent('ibrahim_g1', 'mariama_g1', 'tijan_g3_c');
  parent('sekou_g2', 'nene_g2', 'mariam_cousin_g3');
  parent('sekou_g2', 'nene_g2', 'kadiatou_cousin_g3');

  if (target > 100) {
    add(person('ousmane3_g4_c', cousins[4][1], cousins[4][2], cousins[4][3], cousins[4][4]));
    parent('yusuf_nephew_g3', null, 'ousmane3_g4_c');
    add(person('fanta2_g4_c', cousins[5][1], cousins[5][2], cousins[5][3], cousins[5][4]));
    parent('tijan_g3_c', null, 'fanta2_g4_c');
    add(person('modibo_g4_c', cousins[6][1], cousins[6][2], cousins[6][3], cousins[6][4]));
    parent('tijan_g3_c', null, 'modibo_g4_c');
    add(person('safiatou_g4_c', cousins[7][1], cousins[7][2], cousins[7][3], cousins[7][4]));
    parent('mariam_cousin_g3', null, 'safiatou_g4_c');
  }

  const targetTotal = target;
  if (coreCount + people.length < targetTotal) {
    growGenerationalBranches(coreCount, people, rels, add, parent, marry, targetTotal);
  }

  if (coreCount + people.length !== targetTotal) {
    throw new Error(`Expected ${targetTotal} people, got core ${coreCount} + expansion ${people.length}`);
  }

  return { people, rels };
}
