import { useMemo } from 'react';
import { useStore, type EdgeProps } from '@xyflow/react';
import { buildPedigreePaths, type PedigreeEdgeData } from './pedigreeGeometry';
import styles from './PedigreeEdge.module.css';

function PedigreeEdge({ id, data }: EdgeProps) {
  const pedigree = data as unknown as PedigreeEdgeData;
  const nodeLookup = useStore(state => state.nodeLookup);

  const { trunk, drops } = useMemo(() => {
    const parents = pedigree.parentIds
      .map(pid => nodeLookup.get(pid))
      .filter((n): n is NonNullable<typeof n> => n != null);
    const children = pedigree.childIds
      .map(cid => nodeLookup.get(cid))
      .filter((n): n is NonNullable<typeof n> => n != null);
    return buildPedigreePaths(parents, children);
  }, [nodeLookup, pedigree.parentIds, pedigree.childIds]);

  if (!trunk && drops.length === 0) return null;

  const markerId = `pedigree-arrow-${id}`;
  const strokeProps = {
    fill: 'none' as const,
    className: styles.pedigreePath,
    stroke: pedigree.style.stroke,
    strokeWidth: pedigree.style.strokeWidth,
    strokeDasharray: pedigree.style.strokeDasharray,
  };

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill={pedigree.style.stroke} />
        </marker>
      </defs>
      {trunk && <path d={trunk} {...strokeProps} />}
      {drops.map((dropPath, i) => (
        <path
          key={i}
          d={dropPath}
          {...strokeProps}
          markerEnd={`url(#${markerId})`}
        />
      ))}
    </>
  );
}

export default PedigreeEdge;
