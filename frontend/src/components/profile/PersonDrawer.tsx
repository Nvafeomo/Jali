import type { Person, RelationshipEdge } from '../../types';
import styles from './PersonDrawer.module.css';

interface Props {
  person: Person;
  /** Full tree records keyed by id — chip clicks resolve through this. */
  lookup: Map<string, Person>;
  onPersonSelect: (person: Person) => void;
  onClose: () => void;
}

function confidenceLabel(score: number): { label: string; cls: string } {
  if (score >= 0.7) return { label: `${Math.round(score * 100)}% confidence`, cls: styles.scoreHigh };
  if (score >= 0.4) return { label: `${Math.round(score * 100)}% confidence`, cls: styles.scoreMedium };
  return { label: `${Math.round(score * 100)}% confidence`, cls: styles.scoreLow };
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function RelationshipChips({
  title,
  relationships,
  lookup,
  onPersonSelect,
}: {
  title: string;
  relationships: RelationshipEdge[];
  lookup: Map<string, Person>;
  onPersonSelect: (person: Person) => void;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.chips}>
        {relationships.map(rel => {
          const resolved = lookup.get(rel.person.id) ?? rel.person;
          const label = resolved.isUnknownPlaceholder ? 'Unknown Ancestor' : resolved.fullName;

          return (
            <button
              key={rel.person.id}
              type="button"
              className={[styles.chip, rel.disputed ? styles.chipDisputed : ''].join(' ')}
              onClick={() => onPersonSelect(resolved)}
              title={`${Math.round(rel.confidenceScore * 100)}% confidence${rel.disputed ? ' · disputed' : ''}`}
            >
              {label}
              {rel.disputed && <span className={styles.disputedDot}>⚠</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const PersonDrawer = ({ person, lookup, onPersonSelect, onClose }: Props) => {
  const { label: scoreLabel, cls: scoreCls } = confidenceLabel(person.confidenceScore);

  return (
    <div className={styles.drawer}>
      <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close profile">
        ✕
      </button>

      <div className={styles.header}>
        <div className={[styles.avatar, person.isUnknownPlaceholder ? styles.avatarPlaceholder : ''].join(' ')}>
          {person.isUnknownPlaceholder ? (
            <span className={styles.avatarUnknown}>?</span>
          ) : person.photoUrl ? (
            <img src={person.photoUrl} alt={person.fullName} className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarInitials}>{initials(person.fullName)}</span>
          )}
        </div>

        <div className={styles.headerInfo}>
          <h2 className={styles.name}>
            {person.isUnknownPlaceholder ? 'Unknown Ancestor' : person.fullName}
          </h2>
          {person.aliases && person.aliases.length > 0 && (
            <p className={styles.aliases}>Also known as: {person.aliases.join(', ')}</p>
          )}
          <span className={[styles.scoreBadge, scoreCls].join(' ')}>{scoreLabel}</span>
          {person.isUnknownPlaceholder && (
            <span className={styles.placeholderBadge}>Placeholder node</span>
          )}
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Details</h3>
        <div className={styles.vitals}>
          {(person.birthDate || person.birthplace) && (
            <div className={styles.vitalRow}>
              <span className={styles.vitalLabel}>Born</span>
              <span className={styles.vitalValue}>
                {person.birthDate ?? '?'}
                {person.birthDateApproximate ? ' (approx.)' : ''}
                {person.birthplace ? ` · ${person.birthplace}` : ''}
              </span>
            </div>
          )}
          {person.deathDate && (
            <div className={styles.vitalRow}>
              <span className={styles.vitalLabel}>Died</span>
              <span className={styles.vitalValue}>{person.deathDate}</span>
            </div>
          )}
          {!person.deathDate && !person.isUnknownPlaceholder && (
            <div className={styles.vitalRow}>
              <span className={styles.vitalLabel}>Status</span>
              <span className={[styles.vitalValue, styles.living].join(' ')}>Living</span>
            </div>
          )}
          {person.ethnicGroup && (
            <div className={styles.vitalRow}>
              <span className={styles.vitalLabel}>Ethnic group</span>
              <span className={styles.vitalValue}>{person.ethnicGroup}</span>
            </div>
          )}
          {person.language && (
            <div className={styles.vitalRow}>
              <span className={styles.vitalLabel}>Language</span>
              <span className={styles.vitalValue}>{person.language}</span>
            </div>
          )}
          {person.biologicalSex && (
            <div className={styles.vitalRow}>
              <span className={styles.vitalLabel}>Sex</span>
              <span className={styles.vitalValue}>
                {person.biologicalSex === 'MALE' ? 'Male' : 'Female'}
              </span>
            </div>
          )}
        </div>
      </section>

      {person.parents && person.parents.length > 0 && (
        <RelationshipChips
          title="Parents"
          relationships={person.parents}
          lookup={lookup}
          onPersonSelect={onPersonSelect}
        />
      )}

      {person.children && person.children.length > 0 && (
        <RelationshipChips
          title="Children"
          relationships={person.children}
          lookup={lookup}
          onPersonSelect={onPersonSelect}
        />
      )}

      {person.spouses && person.spouses.length > 0 && (
        <RelationshipChips
          title={person.spouses.length > 1 ? 'Spouses' : 'Spouse'}
          relationships={person.spouses}
          lookup={lookup}
          onPersonSelect={onPersonSelect}
        />
      )}

      {person.siblings && person.siblings.length > 0 && (
        <RelationshipChips
          title="Siblings"
          relationships={person.siblings}
          lookup={lookup}
          onPersonSelect={onPersonSelect}
        />
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Voice Memos</h3>
        <p className={styles.emptyState}>No voice memos yet.</p>
        <button type="button" className={styles.addBtn}>
          + Record or upload memo
        </button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Photos</h3>
        <p className={styles.emptyState}>No photos uploaded yet.</p>
        <button type="button" className={styles.addBtn}>
          + Upload photo
        </button>
      </section>
    </div>
  );
};

export default PersonDrawer;
