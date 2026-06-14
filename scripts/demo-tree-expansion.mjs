/**
 * Expands the core Kouyaté demo tree to 100 people:
 * - Aminata's France diaspora branch
 * - Spouses and children for gen-3 members
 * - Gen 5 great-grandchildren
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
        ['nina_g3_a', 'Nina Kouyaté', 'Studying African literature in Paris.', '1998', 'FEMALE'],
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
        ['selim_a_g3_a', 'Selim Sow-Kouyaté', 'High school student; visits Bamako cousins in summer.', '2004', 'MALE'],
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
  for (const [k, name, bio, birth, sex] of [
    ['julie_g4_a', 'Julie Kouyaté', 'Léa and Pierre\'s daughter.', '2020', 'FEMALE'],
    ['lucas_g4_a', 'Lucas Kouyaté', 'Born during a family Zoom call with Columbus cousins.', '2022', 'MALE'],
  ]) {
    add(person(k, name, bio, birth, sex, { birthplace: 'Marseille, France' }));
    parent('pierre_bernard_sp', 'lea_g3_a', k);
  }

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
      kids: [['kojo_g4', 'Kojo Kouyaté', 'Learning kora from uncle recordings.', '2022', 'MALE']],
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
      kids: [['cheikh_g4', 'Cheikh Kouyaté', 'Youth league footballer.', '2020', 'MALE']],
    },
    {
      person: 'bintou_g3',
      spouse: ['idrissa_diakite_sp', 'Idrissa Diakité', 'Surgeon in Bamako.', '1987', 'MALE', 'Bamako, Mali'],
      kids: [
        ['aminata2_g4', 'Aminata Diakité-Kouyaté', 'Named for great-aunt Aminata in France.', '2015', 'FEMALE'],
        ['moussa_g4', 'Moussa Diakité-Kouyaté', 'Bintou\'s youngest.', '2018', 'MALE'],
      ],
    },
    {
      person: 'mamadou_s_g3',
      spouse: ['awa_toure_sp', 'Awa Touré', 'Vocalist; featured on Mamasu\'s first EP.', '1993', 'FEMALE', 'Bamako, Mali'],
      kids: [['djeli_g4', 'Djeli Kouyaté', 'Named for the jali tradition.', '2021', 'FEMALE']],
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

  // —— Gen 5 ——
  const gen5 = [
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
    ['pierre_bernard_sp', 'julie_g4_a', 'chloe_g5', 'Chloé Kouyaté', 'Lyon branch gen 5.', '2024', 'FEMALE'],
    ['fatoumata_kone_sp', 'saidu_g4', 'musu_g5', 'Musu Kouyaté', 'Ibrahim Jr.\'s first grandchild.', '2023', 'FEMALE'],
  ];

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

  add(person('ousmane3_g4_c', cousins[4][1], cousins[4][2], cousins[4][3], cousins[4][4]));
  parent('yusuf_nephew_g3', null, 'ousmane3_g4_c');
  add(person('fanta2_g4_c', cousins[5][1], cousins[5][2], cousins[5][3], cousins[5][4]));
  parent('tijan_g3_c', null, 'fanta2_g4_c');
  add(person('modibo_g4_c', cousins[6][1], cousins[6][2], cousins[6][3], cousins[6][4]));
  parent('tijan_g3_c', null, 'modibo_g4_c');
  add(person('safiatou_g4_c', cousins[7][1], cousins[7][2], cousins[7][3], cousins[7][4]));
  parent('mariam_cousin_g3', null, 'safiatou_g4_c');

  const targetTotal = target;
  let n = 1;
  while (coreCount + people.length < targetTotal) {
    const key = `cousin_fill_${n}`;
    add(
      person(
        key,
        `Mamadu Kouyaté ${n}`,
        `Extended cousin ${n} in the diaspora network.`,
        String(1975 + (n % 25)),
        n % 2 === 0 ? 'FEMALE' : 'MALE',
        { birthplace: CITIES[n % CITIES.length], ethnicGroup: ETHNIC[n % ETHNIC.length] },
      ),
    );
    parent('ibrahim_g1', 'mariama_g1', key);
    n++;
  }

  if (coreCount + people.length !== targetTotal) {
    throw new Error(`Expected ${targetTotal} people, got core ${coreCount} + expansion ${people.length}`);
  }

  return { people, rels };
}
