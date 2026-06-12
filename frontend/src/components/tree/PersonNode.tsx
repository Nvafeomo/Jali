import { Handle, Position } from '@xyflow/react';
import type { Person } from '../../types';
import { formatLifeDisplay } from '../../utils/vitalYears';
import styles from './PersonNode.module.css';

type PersonNodeData = Person & {
  linkPickTarget?: boolean;
  linkPickDimmed?: boolean;
  linkPickHover?: boolean;
};

interface PersonNodeProps {
  data: PersonNodeData;
  selected: boolean;
}

function confidenceColor(score: number): string {
  if (score >= 0.7) return styles.high;
  if (score >= 0.4) return styles.medium;
  return styles.low;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const PersonNode = ({ data, selected }: PersonNodeProps) => {
  const { linkPickTarget, linkPickDimmed, linkPickHover, ...person } = data;
  const life = formatLifeDisplay(
    person.birthDate,
    person.deathDate,
    person.birthDateApproximate,
  );

  return (
    <div
      className={[
        styles.node,
        confidenceColor(person.confidenceScore),
        person.isUnknownPlaceholder ? styles.placeholder : '',
        selected || linkPickTarget ? styles.selected : '',
        linkPickTarget ? styles.linkPickTarget : '',
        linkPickDimmed ? styles.linkPickDimmed : '',
        linkPickHover && !linkPickDimmed ? styles.linkPickHover : '',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <Handle
        id="spouse-in"
        type="target"
        position={Position.Left}
        className={styles.handle}
      />

      <div className={styles.avatar}>
        {person.isUnknownPlaceholder ? (
          <span className={styles.unknown}>?</span>
        ) : person.photoUrl ? (
          <img src={person.photoUrl} alt={person.fullName} className={styles.photo} />
        ) : (
          <span className={styles.initials}>{initials(person.fullName)}</span>
        )}
      </div>

      <div className={styles.name}>
        {person.isUnknownPlaceholder ? 'Unknown' : person.fullName}
      </div>

      {life.primary && (
        <div className={styles.dates}>{life.primary}</div>
      )}

      {life.showLivingBadge && (
        <div className={styles.livingBadge}>Living</div>
      )}

      <Handle type="source" position={Position.Bottom} className={styles.handle} />
      <Handle
        id="spouse-out"
        type="source"
        position={Position.Right}
        className={styles.handle}
      />
    </div>
  );
};

export default PersonNode;
