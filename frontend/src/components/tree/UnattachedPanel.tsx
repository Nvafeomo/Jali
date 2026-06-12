import { useState } from 'react';
import type { Person } from '../../types';
import { formatLifeYears } from '../../utils/vitalYears';
import styles from './UnattachedPanel.module.css';

interface Props {
  people: Person[];
  onSelect: (person: Person) => void;
}

const UnattachedPanel = ({ people, onSelect }: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  if (people.length === 0) return null;

  return (
    <aside className={styles.panel} aria-label="Unlinked family members">
      <button
        type="button"
        className={styles.header}
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={!collapsed}
      >
        <span className={styles.title}>
          Unlinked
          <span className={styles.count}>{people.length}</span>
        </span>
        <span className={styles.chevron}>{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && (
        <>
          <p className={styles.hint}>
            Connect each person to someone on the tree. Names can repeat: link by
            relationship, not name alone.
          </p>
          <ul className={styles.list}>
            {people.map(person => {
              const dates = formatLifeYears(
                person.birthDate,
                person.deathDate,
                person.birthDateApproximate,
              );
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => onSelect(person)}
                  >
                    <span className={styles.name}>{person.fullName}</span>
                    {dates && <span className={styles.dates}>{dates}</span>}
                    <span className={styles.action}>Link to tree →</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </aside>
  );
};

export default UnattachedPanel;
