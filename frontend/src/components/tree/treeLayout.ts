import { Person } from '../../types';

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: Person;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  type: 'parent' | 'spouse';
  animated: boolean;
  style: { stroke: string; strokeWidth: number; strokeDasharray?: string };
}

// Spacing constants - tweak these to change how spread out the tree looks.
const NODE_WIDTH = 120;
const NODE_HEIGHT = 140;
const H_GAP = 60;   // horizontal gap between siblings
const V_GAP = 100;  // vertical gap between generations

// ── Step 1: Assign each person a generation level ─────────────────────────
// Generation 0 = the oldest ancestors we have (great-grandparents).
// We find roots (people with no parents in our dataset), assign them gen 0,
// then walk downward assigning children gen = parent_gen + 1.
// People with parents from multiple generations get the max of their parents.
function assignGenerations(people: Person[]): Map<string, number> {
  const genMap = new Map<string, number>();
  const personMap = new Map(people.map(p => [p.id, p]));

  // Collect all IDs that appear as children (i.e. have known parents)
  const hasParents = new Set<string>();
  people.forEach(p => {
    p.parents?.forEach(rel => hasParents.add(p.id));
  });

  // Roots are people with no parents listed in our dataset
  const roots = people.filter(p => !hasParents.has(p.id));
  roots.forEach(p => genMap.set(p.id, 0));

  // BFS downward from roots
  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentGen = genMap.get(current.id) ?? 0;

    people
      .filter(p => p.parents?.some(rel => rel.person.id === current.id))
      .forEach(child => {
        const existing = genMap.get(child.id) ?? -1;
        // Take the max generation among all parents, so the child sits
        // below all their parents in the layout
        const newGen = Math.max(existing, currentGen + 1);
        genMap.set(child.id, newGen);
        if (!queue.includes(child)) queue.push(child);
      });
  }

  // Any remaining unvisited people default to generation 0
  people.forEach(p => {
    if (!genMap.has(p.id)) genMap.set(p.id, 0);
  });

  return genMap;
}

// ── Step 2: Convert people + generation map → React Flow nodes + edges ─────
export function buildLayout(people: Person[]): {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
} {
  const genMap = assignGenerations(people);

  // Group people by generation so we can center each row
  const byGen = new Map<number, Person[]>();
  people.forEach(p => {
    const gen = genMap.get(p.id) ?? 0;
    if (!byGen.has(gen)) byGen.set(gen, []);
    byGen.get(gen)!.push(p);
  });

  // Build nodes - calculate x,y for each person
  const nodes: LayoutNode[] = [];
  byGen.forEach((genPeople, gen) => {
    const rowWidth = genPeople.length * (NODE_WIDTH + H_GAP) - H_GAP;
    genPeople.forEach((person, i) => {
      nodes.push({
        id: person.id,
        position: {
          // Center the row horizontally; space nodes evenly
          x: i * (NODE_WIDTH + H_GAP) - rowWidth / 2,
          // Each generation is one row lower
          y: gen * (NODE_HEIGHT + V_GAP),
        },
        data: person,
      });
    });
  });

  // Build edges - one edge per parent-child relationship
  // We derive edges from the 'parents' field on each person rather than
  // storing them separately, keeping the data model simple.
  const edges: LayoutEdge[] = [];
  const edgeSeen = new Set<string>();

  people.forEach(person => {
    person.parents?.forEach(rel => {
      const edgeId = `${rel.person.id}->${person.id}`;
      if (edgeSeen.has(edgeId)) return;
      edgeSeen.add(edgeId);

      // Color the edge based on confidence score:
      //   green  = high confidence (>= 0.7)
      //   yellow = medium (0.4 - 0.7)
      //   red    = low (< 0.4)
      const score = rel.confidenceScore;
      const stroke = score >= 0.7 ? '#4ade80' : score >= 0.4 ? '#facc15' : '#f87171';

      edges.push({
        id: edgeId,
        source: rel.person.id,  // parent
        target: person.id,      // child
        type: 'parent',
        animated: false,
        style: {
          stroke,
          strokeWidth: 2,
          // Disputed relationships get a dashed line
          ...(rel.disputed ? { strokeDasharray: '5,5' } : {}),
        },
      });
    });
  });

  return { nodes, edges };
}
