import type { InternalNode } from '@xyflow/react';
import { LAYOUT_NODE_HEIGHT, LAYOUT_NODE_WIDTH } from './pedigreeGeometry';

export interface MarriageEdgeData extends Record<string, unknown> {
  style: { stroke: string; strokeWidth: number; strokeDasharray?: string };
}

function nodeSize(node: InternalNode) {
  return {
    width: node.measured?.width ?? LAYOUT_NODE_WIDTH,
    height: node.measured?.height ?? LAYOUT_NODE_HEIGHT,
  };
}

/** Single straight horizontal line between two spouses at mid-height. */
export function buildMarriagePath(a: InternalNode, b: InternalNode): string {
  const { width, height } = nodeSize(a);
  const bSize = nodeSize(b);

  const aMidY = a.position.y + height / 2;
  const bMidY = b.position.y + bSize.height / 2;
  const y = (aMidY + bMidY) / 2;

  const aRight = a.position.x + width;
  const bLeft = b.position.x;
  const bRight = b.position.x + bSize.width;
  const aLeft = a.position.x;

  if (a.position.x <= b.position.x) {
    return `M ${aRight} ${y} L ${bLeft} ${y}`;
  }
  return `M ${bRight} ${y} L ${aLeft} ${y}`;
}
