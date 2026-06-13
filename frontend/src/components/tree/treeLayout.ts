import type { Person, RelationshipEdge } from '../../types';
import { edgeStyle } from './relationshipStyles';
import { groupPedigreeFamilies } from './pedigreeGeometry';
import type { PedigreeEdgeData } from './pedigreeGeometry';
import type { MarriageEdgeData } from './marriageGeometry';
import { layoutChildrenUnderParents } from './childGenerationLayout';
import {
  clusterPixelWidth,
  collectSpouseComponent,
  H_GAP,
  layoutSpouseCluster,
  NODE_HEIGHT,
  V_GAP,
} from './spouseLayout';
import {
  collectSiblingBand,
  comparePeopleByBirthOldestFirst,
} from './siblingOrder';

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: Person;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  type: 'step' | 'pedigree' | 'marriage';
  animated: boolean;
  selectable?: boolean;
  focusable?: boolean;
  data:
    | {
        relationshipType: 'PARENT_OF' | 'MARRIED_TO';
        confidenceScore: number;
        disputed: boolean;
      }
    | PedigreeEdgeData
    | MarriageEdgeData;
  style?: { stroke: string; strokeWidth: number; strokeDasharray?: string };
}

/** Spouse-connected component across all generations (for generation alignment). */
function collectSpouseComponentAll(
  start: Person,
  byId: Map<string, Person>,
): Person[] {
  const component: Person[] = [];
  const seen = new Set<string>();
  const queue = [start.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);

    const person = byId.get(id);
    if (!person) continue;

    component.push(person);

    for (const rel of person.spouses ?? []) {
      if (!seen.has(rel.person.id)) {
        queue.push(rel.person.id);
      }
    }
  }

  return component;
}

function assignGenerations(people: Person[]): Map<string, number> {
  const byId = new Map(people.map(p => [p.id, p]));
  const genMap = new Map<string, number>();

  const hasParents = new Set<string>();
  people.forEach(p => {
    p.parents?.forEach(() => hasParents.add(p.id));
  });

  const roots = people.filter(p => !hasParents.has(p.id));
  roots.forEach(p => genMap.set(p.id, 0));

  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentGen = genMap.get(current.id) ?? 0;

    people
      .filter(p => p.parents?.some(rel => rel.person.id === current.id))
      .forEach(child => {
        const existing = genMap.get(child.id) ?? -1;
        const newGen = Math.max(existing, currentGen + 1);
        genMap.set(child.id, newGen);
        if (!queue.includes(child)) queue.push(child);
      });
  }

  people.forEach(p => {
    if (!genMap.has(p.id)) genMap.set(p.id, 0);
  });

  // When someone gains a parent, their spouses must move down to the same row;
  // then re-push children so they stay one generation below their parents.
  let changed = true;
  while (changed) {
    changed = false;

    const visited = new Set<string>();
    for (const person of people) {
      if (visited.has(person.id)) continue;

      const component = collectSpouseComponentAll(person, byId);
      component.forEach(p => visited.add(p.id));

      const maxGen = Math.max(...component.map(p => genMap.get(p.id) ?? 0));
      for (const p of component) {
        const current = genMap.get(p.id) ?? 0;
        if (maxGen > current) {
          genMap.set(p.id, maxGen);
          changed = true;
        }
      }
    }

    for (const child of people) {
      for (const rel of child.parents ?? []) {
        const newGen = (genMap.get(rel.person.id) ?? 0) + 1;
        const current = genMap.get(child.id) ?? 0;
        if (newGen > current) {
          genMap.set(child.id, newGen);
          changed = true;
        }
      }
    }
  }

  return genMap;
}

function layoutGenerationRow(
  genPeople: Person[],
  genY: number,
  byId: Map<string, Person>,
): LayoutNode[] {
  const genIds = new Set(genPeople.map(p => p.id));
  const placed = new Set<string>();
  const nodes: LayoutNode[] = [];
  let rowCursor = 0;

  const bands: Person[][] = [];
  for (const person of genPeople) {
    if (placed.has(person.id)) continue;
    const band = collectSiblingBand(person, genIds, genPeople, byId);
    band.forEach(p => placed.add(p.id));
    bands.push(band);
  }

  bands.sort((a, b) => comparePeopleByBirthOldestFirst(a[0]!, b[0]!));

  const clusterPlaced = new Set<string>();

  for (const band of bands) {
    for (const person of band) {
      if (clusterPlaced.has(person.id)) continue;

      const cluster = collectSpouseComponent(person, genIds, byId);
      cluster.forEach(p => clusterPlaced.add(p.id));

      const clusterPositions = layoutSpouseCluster(cluster);
      const clusterWidth = clusterPixelWidth(clusterPositions);

      for (const { id, x } of clusterPositions) {
        const p = byId.get(id);
        if (!p) continue;
        nodes.push({
          id,
          position: { x: rowCursor + x, y: genY },
          data: p,
        });
      }

      rowCursor += clusterWidth + H_GAP;
    }
  }

  if (nodes.length === 0) return nodes;

  const totalWidth = rowCursor - H_GAP;
  const rowOffset = -totalWidth / 2;
  return nodes.map(n => ({
    ...n,
    position: { x: n.position.x + rowOffset, y: n.position.y },
  }));
}

function addMarriageEdge(
  edges: LayoutEdge[],
  edgeSeen: Set<string>,
  sourceId: string,
  targetId: string,
  rel: RelationshipEdge,
) {
  const edgeId = `marriage:${[sourceId, targetId].sort().join(':')}`;
  if (edgeSeen.has(edgeId)) return;
  edgeSeen.add(edgeId);

  const style = edgeStyle('MARRIED_TO', rel.confidenceScore, rel.disputed);

  edges.push({
    id: edgeId,
    source: sourceId,
    target: targetId,
    type: 'marriage',
    animated: false,
    selectable: false,
    focusable: false,
    data: { style },
  });
}

function addPedigreeEdges(edges: LayoutEdge[], people: Person[]) {
  for (const group of groupPedigreeFamilies(people)) {
    edges.push({
      id: `pedigree:${group.key}`,
      source: group.parentIds[0]!,
      target: group.childIds[0]!,
      type: 'pedigree',
      animated: false,
      selectable: false,
      focusable: false,
      data: {
        parentIds: group.parentIds,
        childIds: group.childIds,
        style: group.style,
      },
    });
  }
}

export function buildLayout(people: Person[]): {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
} {
  const genMap = assignGenerations(people);
  const byId = new Map(people.map(p => [p.id, p]));
  const pedigreeGroups = groupPedigreeFamilies(people);

  const byGen = new Map<number, Person[]>();
  people.forEach(p => {
    const gen = genMap.get(p.id) ?? 0;
    if (!byGen.has(gen)) byGen.set(gen, []);
    byGen.get(gen)!.push(p);
  });

  const nodes: LayoutNode[] = [];
  const sortedGens = [...byGen.keys()].sort((a, b) => a - b);

  for (const gen of sortedGens) {
    const genPeople = byGen.get(gen)!;
    const genY = gen * (NODE_HEIGHT + V_GAP);

    if (gen === 0) {
      nodes.push(...layoutGenerationRow(genPeople, genY, byId));
      continue;
    }

    const parentPositions = new Map(
      nodes.filter(n => (genMap.get(n.id) ?? -1) === gen - 1).map(n => [n.id, n.position]),
    );

    const { nodes: childNodes, assigned } = layoutChildrenUnderParents(
      pedigreeGroups,
      genPeople,
      genY,
      gen - 1,
      genMap,
      parentPositions,
      byId,
    );

    nodes.push(...childNodes);

    const remaining = genPeople.filter(p => !assigned.has(p.id));
    if (remaining.length > 0) {
      nodes.push(...layoutGenerationRow(remaining, genY, byId));
    }
  }

  const edges: LayoutEdge[] = [];
  const edgeSeen = new Set<string>();

  people.forEach(person => {
    person.spouses?.forEach(rel => {
      addMarriageEdge(edges, edgeSeen, person.id, rel.person.id, rel);
    });
  });

  addPedigreeEdges(edges, people);

  return { nodes, edges };
}
