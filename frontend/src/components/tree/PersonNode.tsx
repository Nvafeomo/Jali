import { Handle, Position } from '@xyflow/react';
import type { Person } from '../../types';
import styles from './PersonNode.module.css';

interface PersonNodeProps {
  data: Person;
  selected: boolean;
}

// Maps a 0-1 confidence score to a CSS color class.
// This drives the colored ring around the node.
function confidenceColor(score: number): string {
  if (score >= 0.7) return styles.high;
  if (score >= 0.4) return styles.medium;
  return styles.low;
}

// Generates initials from a full name. "Ibrahim Kouyaté" → "IK"
function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const PersonNode = ({ data, selected }: PersonNodeProps) => {
  const person = data;

  return (
    // The outer wrapper applies the confidence ring color and
    // a dashed border for unknown placeholder nodes.
    <div
      className={[
        styles.node,
        confidenceColor(person.confidenceScore),
        person.isUnknownPlaceholder ? styles.placeholder : '',
        selected ? styles.selected : '',
      ].join(' ')}
    >
      {/* Handle = the connection point React Flow uses to draw edges.
          'target' handle is on top (parents connect down into it).
          'source' handle is on bottom (children connect up from it). */}
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <Handle
        id="spouse-in"
        type="target"
        position={Position.Left}
        className={styles.handle}
      />

      {/* Avatar: photo if available, initials otherwise */}
      <div className={styles.avatar}>
        {person.isUnknownPlaceholder ? (
          <span className={styles.unknown}>?</span>
        ) : person.photoUrl ? (
          <img src={person.photoUrl} alt={person.fullName} className={styles.photo} />
        ) : (
          <span className={styles.initials}>{initials(person.fullName)}</span>
        )}
      </div>

      {/* Name below the circle */}
      <div className={styles.name}>
        {person.isUnknownPlaceholder ? 'Unknown' : person.fullName}
      </div>

      {/* Birth/death years in small text */}
      {(person.birthDate || person.deathDate) && (
        <div className={styles.dates}>
          {person.birthDate ?? '?'}
          {person.deathDate ? ` – ${person.deathDate}` : ''}
          {person.birthDateApproximate ? ' (approx.)' : ''}
        </div>
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
