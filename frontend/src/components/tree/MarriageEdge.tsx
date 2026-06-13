import { useMemo } from 'react';
import { useStore, type EdgeProps } from '@xyflow/react';
import { buildMarriagePath, type MarriageEdgeData } from './marriageGeometry';
import styles from './MarriageEdge.module.css';

function MarriageEdge({ source, target, data }: EdgeProps) {
  const marriage = data as unknown as MarriageEdgeData;
  const nodeLookup = useStore(state => state.nodeLookup);

  const path = useMemo(() => {
    const a = nodeLookup.get(source);
    const b = nodeLookup.get(target);
    if (!a || !b) return '';
    return buildMarriagePath(a, b);
  }, [nodeLookup, source, target]);

  if (!path) return null;

  return (
    <path
      d={path}
      fill="none"
      className={styles.marriagePath}
      stroke={marriage.style.stroke}
      strokeWidth={marriage.style.strokeWidth}
      strokeDasharray={marriage.style.strokeDasharray}
    />
  );
}

export default MarriageEdge;
