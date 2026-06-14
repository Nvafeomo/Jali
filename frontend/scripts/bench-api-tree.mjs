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
      bio: p.bio ?? undefined,
      birthDate: p.birthDate ?? undefined,
      deathDate: p.deathDate ?? undefined,
      birthplace: p.birthplace ?? undefined,
      ethnicGroup: p.ethnicGroup ?? undefined,
      biologicalSex: p.biologicalSex ?? undefined,
      confidenceScore: p.confidenceScore ?? 1,
      isUnknownPlaceholder: p.isUnknownPlaceholder ?? false,
      createdAt: p.createdAt ?? undefined,
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
      person.children.push({
        person: child,
        type: 'PARENT_OF',
        confidenceScore: edge.confidenceScore,
        disputed: edge.disputed,
        parentRole: edge.parentRole,
      });
      child.parents.push({
        person,
        type: 'PARENT_OF',
        confidenceScore: edge.confidenceScore,
        disputed: edge.disputed,
        parentRole: edge.parentRole,
      });
    }
    for (const edge of p.spouses ?? []) {
      const spouse = byId.get(edge.person.uuid);
      if (!spouse) continue;
      if (!person.spouses.some(s => s.person.id === spouse.id)) {
        person.spouses.push({
          person: spouse,
          type: 'MARRIED_TO',
          confidenceScore: edge.confidenceScore,
          disputed: edge.disputed,
        });
      }
      if (!spouse.spouses.some(s => s.person.id === person.id)) {
        spouse.spouses.push({
          person,
          type: 'MARRIED_TO',
          confidenceScore: edge.confidenceScore,
          disputed: edge.disputed,
        });
      }
    }
    for (const edge of p.siblings ?? []) {
      const sibling = byId.get(edge.person.uuid);
      if (!sibling) continue;
      if (!person.siblings.some(s => s.person.id === sibling.id)) {
        person.siblings.push({
          person: sibling,
          type: 'SIBLING_OF',
          confidenceScore: edge.confidenceScore,
          disputed: edge.disputed,
          halfSibling: edge.halfSibling,
        });
      }
      if (!sibling.siblings.some(s => s.person.id === person.id)) {
        sibling.siblings.push({
          person,
          type: 'SIBLING_OF',
          confidenceScore: edge.confidenceScore,
          disputed: edge.disputed,
          halfSibling: edge.halfSibling,
        });
      }
    }
  }

  return [...byId.values()];
}

let childEdges = 0;
let spouseEdges = 0;
let sibEdges = 0;
for (const p of raw) {
  childEdges += p.children?.length ?? 0;
  spouseEdges += p.spouses?.length ?? 0;
  sibEdges += p.siblings?.length ?? 0;
}
console.log('api edges', { childEdges, spouseEdges, sibEdges });

const t0 = performance.now();
const people = mapToPersons(raw);
console.log('map', (performance.now() - t0).toFixed(1), 'ms');

const t1 = performance.now();
const { nodes, edges } = buildLayout(people);
console.log('layout', (performance.now() - t1).toFixed(1), 'ms', 'nodes', nodes.length, 'edges', edges.length);
