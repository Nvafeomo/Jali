/** Shared colors for confidence on nodes and parent-child edges. */
export function confidenceStroke(score: number): string {
  if (score >= 0.7) return '#4ade80';
  if (score >= 0.4) return '#facc15';
  return '#f87171';
}

export const MARRIAGE_STROKE = '#a78bfa';

export function edgeStyle(
  relationshipType: 'PARENT_OF' | 'MARRIED_TO',
  confidenceScore: number,
  disputed: boolean,
): { stroke: string; strokeWidth: number; strokeDasharray?: string } {
  const stroke =
    relationshipType === 'MARRIED_TO'
      ? MARRIAGE_STROKE
      : confidenceStroke(confidenceScore);

  return {
    stroke,
    strokeWidth: relationshipType === 'MARRIED_TO' ? 2 : 2,
    ...(disputed ? { strokeDasharray: '5,5' } : {}),
  };
}
