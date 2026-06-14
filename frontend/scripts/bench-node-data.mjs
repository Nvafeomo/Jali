import fs from 'fs';
import { buildLayout } from '../src/components/tree/treeLayout.ts';

const raw = JSON.parse(
  fs.readFileSync(new URL('./1demo-tree.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''),
).data.myTree;

function mapToPersons(rawList) {
  const byId = new Map();
  for (const p of rawList) {
    byId.set(p.uuid, {
      id: p.uuid,
      fullName: p.fullName,
      birthDate: p.birthDate ?? undefined,
      deathDate: p.deathDate ?? undefined,
      biologicalSex: p.biologicalSex ?? undefined,
      confidenceScore: p.confidenceScore ?? 1,
      isUnknownPlaceholder: p.isUnknownPlaceholder ?? false,
      children: [],
      parents: [],
      spouses: [],
      siblings: [],
    });
  }
  for (const p of rawList) {
    const person = byId.get(p.uuid);
    for (const edge of p.children ?? []) {
      const child = byId.get(edge.person.uuid);
      if (!child) continue;
      person.children.push({ person: child, type: 'PARENT_OF' });
      child.parents.push({ person, type: 'PARENT_OF' });
    }
    for (const edge of p.siblings ?? []) {
      const sibling = byId.get(edge.person.uuid);
      if (!sibling) continue;
      if (!person.siblings.some(s => s.person.id === sibling.id)) {
        person.siblings.push({ person: sibling, type: 'SIBLING_OF' });
      }
      if (!sibling.siblings.some(s => s.person.id === person.id)) {
        sibling.siblings.push({ person, type: 'SIBLING_OF' });
      }
    }
  }
  return [...byId.values()];
}

function slimPerson(person) {
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

const people = mapToPersons(raw);
const { nodes } = buildLayout(people);

const fatNodes = nodes.map(n => ({ id: n.id, data: { ...n.data } }));
const slimNodes = nodes.map(n => ({ id: n.id, data: slimPerson(n.data) }));

let maxSiblings = 0;
let totalSiblingRefs = 0;
for (const p of people) {
  const n = p.siblings?.length ?? 0;
  totalSiblingRefs += n;
  if (n > maxSiblings) maxSiblings = n;
}
console.log('sibling refs per person', { totalSiblingRefs, maxSiblings, avg: totalSiblingRefs / people.length });

function roughSize(obj, seen = new WeakSet()) {
  if (obj == null || typeof obj !== 'object') return 8;
  if (seen.has(obj)) return 0;
  seen.add(obj);
  let size = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) size += roughSize(item, seen);
    return size + obj.length * 8;
  }
  for (const key of Object.keys(obj)) {
    size += key.length * 2 + roughSize(obj[key], seen);
  }
  return size;
}

const t0 = performance.now();
const fatSize = fatNodes.reduce((s, n) => s + roughSize(n.data), 0);
console.log('fat node data traverse', (performance.now() - t0).toFixed(1), 'ms', 'bytes~', fatSize);

const t1 = performance.now();
const slimSize = slimNodes.reduce((s, n) => s + roughSize(n.data), 0);
console.log('slim node data traverse', (performance.now() - t1).toFixed(1), 'ms', 'bytes~', slimSize);
