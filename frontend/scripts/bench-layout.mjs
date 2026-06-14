import { PEOPLE, RELATIONSHIPS } from '../../scripts/demo-tree-data.mjs';

const uuidByKey = new Map(PEOPLE.map(p => [p.key, `uuid-${p.key}`]));
const people = PEOPLE.map(p => ({
  id: uuidByKey.get(p.key),
  fullName: p.fullName,
  birthDate: p.birthDate ?? undefined,
  biologicalSex: p.biologicalSex ?? undefined,
  confidenceScore: 1,
  isUnknownPlaceholder: false,
  children: [],
  parents: [],
  spouses: [],
  siblings: [],
}));
const byId = new Map(people.map(p => [p.id, p]));

for (const rel of RELATIONSHIPS) {
  const from = uuidByKey.get(rel.from);
  const to = uuidByKey.get(rel.to);
  if (!from || !to) continue;
  const a = byId.get(from);
  const b = byId.get(to);
  if (rel.type === 'PARENT_OF') {
    a.children.push({
      person: b,
      type: 'PARENT_OF',
      confidenceScore: 1,
      disputed: false,
      parentRole: rel.parentRole,
    });
    b.parents.push({
      person: a,
      type: 'PARENT_OF',
      confidenceScore: 1,
      disputed: false,
      parentRole: rel.parentRole,
    });
  } else if (rel.type === 'MARRIED_TO') {
    a.spouses.push({ person: b, type: 'MARRIED_TO', confidenceScore: 1, disputed: false });
    b.spouses.push({ person: a, type: 'MARRIED_TO', confidenceScore: 1, disputed: false });
  }
}

console.log('people', people.length, 'rels', RELATIONSHIPS.length);

const { buildLayout } = await import('../src/components/tree/treeLayout.ts');
const t0 = performance.now();
const { nodes, edges } = buildLayout(people);
console.log('done', (performance.now() - t0).toFixed(1), 'ms', 'nodes', nodes.length, 'edges', edges.length);
