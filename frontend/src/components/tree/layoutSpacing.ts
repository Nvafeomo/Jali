import { LAYOUT_NODE_WIDTH } from './pedigreeGeometry';
import { H_GAP } from './spouseLayout';
import type { PositionedNode } from './branchLayout';

export { H_GAP as MIN_H_GAP };

export function nodeSpan(node: PositionedNode): { min: number; max: number } {
  return { min: node.position.x, max: node.position.x + LAYOUT_NODE_WIDTH };
}

export function rowSpan(nodes: PositionedNode[]): { min: number; max: number } | null {
  if (nodes.length === 0) return null;
  return {
    min: Math.min(...nodes.map(n => n.position.x)),
    max: Math.max(...nodes.map(n => n.position.x)) + LAYOUT_NODE_WIDTH,
  };
}

/** Minimum left edge so this span clears every obstacle with at least gap. */
export function minStartAfterObstacles(
  width: number,
  obstacles: PositionedNode[],
  gap = H_GAP,
): number {
  if (obstacles.length === 0) return 0;

  let cursor = Math.min(...obstacles.map(n => n.position.x));
  const sorted = [...obstacles].sort((a, b) => a.position.x - b.position.x);

  for (const obs of sorted) {
    const obsSpan = nodeSpan(obs);
    if (cursor + width <= obsSpan.min - gap) break;
    cursor = obsSpan.max + gap;
  }

  return cursor;
}

/** Push nodes right until no pair on this row overlaps (min gap between boxes). */
export function resolveRowOverlaps(nodes: PositionedNode[], genY: number, gap = H_GAP): void {
  const row = nodes.filter(n => n.position.y === genY);
  if (row.length <= 1) return;

  row.sort((a, b) => a.position.x - b.position.x);

  for (let i = 1; i < row.length; i++) {
    const prev = row[i - 1]!;
    const curr = row[i]!;
    const overlap = nodeSpan(prev).max + gap - curr.position.x;
    if (overlap > 0) {
      for (let j = i; j < row.length; j++) {
        row[j]!.position.x += overlap;
      }
    }
  }
}

export function shiftNodes(nodes: PositionedNode[], deltaX: number): void {
  if (deltaX === 0) return;
  for (const node of nodes) {
    node.position.x += deltaX;
  }
}

export function nodesAtY(nodes: PositionedNode[], genY: number): PositionedNode[] {
  return nodes.filter(n => n.position.y === genY);
}

/** Shift a block right until it clears all nodes already on this row. */
export function placeBlockOnRow(
  block: PositionedNode[],
  genY: number,
  existingOnRow: PositionedNode[],
  gap = H_GAP,
): void {
  if (block.length === 0) return;

  const span = rowSpan(block);
  if (!span) return;

  const width = span.max - span.min;
  const obstacles = existingOnRow.filter(n => !block.some(b => b.id === n.id));
  const targetLeft = minStartAfterObstacles(width, obstacles, gap);
  shiftNodes(block, targetLeft - span.min);

  for (const node of block) {
    node.position.y = genY;
  }
}
