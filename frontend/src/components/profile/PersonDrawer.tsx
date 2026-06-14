import { useState } from 'react';
import type { Person, StoryMemory } from '../../types';
import {
  formatBirthDisplay,
  formatLifeStatusDisplay,
  isLiving,
} from '../../utils/vitalYears';
import LinkRelationshipForm from './LinkRelationshipForm';
import RelationshipChip from './RelationshipChip';
import PersonProfileEditor from './PersonProfileEditor';
import lockedStyles from './PersonProfileEditor.module.css';
import styles from './PersonDrawer.module.css';

interface Props {
  person: Person;
  allPeople: Person[];
  lookup: Map<string, Person>;
  treeMemberIds: Set<string>;
  isUnlinked: boolean;
  linkTargetId: string | null;
  linkPickActive: boolean;
  onLinkTargetChange: (id: string | null) => void;
  onStartLinkPick: () => void;
  onCancelLinkPick: () => void;
  onViewPerson: (person: Person) => void;
  onLinked: () => void;
  onPersonSelect: (person: Person) => void;
  onClose: () => void;
  onDeleted?: () => void;
}

function confidenceLabel(score: number): { label: string; cls: string } {
  if (score >= 0.7) return { label: `${Math.round(score * 100)}% confidence`, cls: styles.scoreHigh };
  if (score >= 0.4) return { label: `${Math.round(score * 100)}% confidence`, cls: styles.scoreMedium };
  return { label: `${Math.round(score * 100)}% confidence`, cls: styles.scoreLow };
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Derives a display title for a story:
// uses the user-set title if present, otherwise the first sentence of transcript.
function storyTitle(story: StoryMemory): string {
  if (story.title) return story.title;
  if (story.transcript) {
    const first = story.transcript.split(/[.!?]/)[0].trim();
    return first.length > 60 ? first.slice(0, 60) + '…' : first;
  }
  return 'Untitled memory';
}

// ── Accordion item for a single story ──────────────────────────────────────
const StoryItem = ({ story }: { story: StoryMemory }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.storyItem}>
      <button className={styles.storyHeader} onClick={() => setOpen(o => !o)}>
        <span className={styles.storyIcon}>
          {story.memoryType === 'AUDIO' ? '🎙' : '✍️'}
        </span>
        <span className={styles.storyTitle}>{storyTitle(story)}</span>
        <span className={styles.storyMeta}>
          {story.recordedBy && <span>{story.recordedBy} · </span>}
          {story.createdAt}
        </span>
        <span className={styles.storyChevron}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.storyBody}>
          {/* Audio player stub — will use <audio> tag once S3 URLs are real */}
          {story.memoryType === 'AUDIO' && story.audioUrl && (
            <audio controls src={story.audioUrl} className={styles.audioPlayer} />
          )}
          {story.memoryType === 'AUDIO' && !story.audioUrl && (
            <div className={styles.audioPlaceholder}>Audio not yet available</div>
          )}

          {story.transcript && (
            <p className={styles.transcript}>"{story.transcript}"</p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main drawer ─────────────────────────────────────────────────────────────
const PersonDrawer = ({
  person,
  allPeople,
  lookup,
  treeMemberIds,
  isUnlinked,
  linkTargetId,
  linkPickActive,
  onLinkTargetChange,
  onStartLinkPick,
  onCancelLinkPick,
  onViewPerson,
  onLinked,
  onPersonSelect,
  onClose,
  onDeleted,
}: Props) => {
  const { label: scoreLabel, cls: scoreCls } = confidenceLabel(person.confidenceScore);

  // When a chip is clicked, look up the full enriched Person from the lookup map.
  // The chip only has a stub Person (id + fullName), so we need the full record.
  const handleChipClick = (stubPerson: Person) => {
    const full = lookup.get(stubPerson.id);
    if (full) onPersonSelect(full);
  };

  return (
    <div className={styles.drawer}>
      <button className={styles.closeBtn} onClick={onClose}>✕</button>

      {/* ── Header ──────────────────────────────────────── */}
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
          {isUnlinked && (
            <span className={styles.unlinkedBadge}>Not on tree: link below</span>
          )}
        </div>
      </div>

      {person.canEditDetails ? (
        <PersonProfileEditor person={person} onDeleted={onDeleted} />
      ) : (
        <>
          <p className={lockedStyles.lockedNotice}>
            <strong>Details locked.</strong> Names and vitals can only be changed within
            the first 7 days after adding someone. You can still add relationship links.
          </p>
          {person.bio && <p className={lockedStyles.readOnlyBio}>{person.bio}</p>}
        </>
      )}

      {/* ── Vitals (read-only summary when editable form is shown above) ── */}
      {!person.canEditDetails && (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Details</h3>
        <div className={styles.vitals}>
          <div className={styles.vitalRow}>
            <span className={styles.vitalLabel}>Born</span>
            <span className={styles.vitalValue}>
              {formatBirthDisplay(person.birthDate, person.birthDateApproximate)}
              {person.birthplace ? ` · ${person.birthplace}` : ''}
            </span>
          </div>
          <div className={styles.vitalRow}>
            <span className={styles.vitalLabel}>Status</span>
            <span
              className={[
                styles.vitalValue,
                isLiving(person.deathDate) ? styles.living : '',
              ].join(' ')}
            >
              {formatLifeStatusDisplay(person.deathDate)}
            </span>
          </div>
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
              <span className={styles.vitalValue}>{person.biologicalSex === 'MALE' ? 'Male' : 'Female'}</span>
            </div>
          )}
        </div>
      </section>
      )}

      {/* ── Relationships ───────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Relationships</h3>

        {person.canEditDetails &&
          (person.parents?.length ||
            person.children?.length ||
            person.spouses?.length ||
            person.siblings?.length) && (
            <p className={styles.relHint}>Click × next to a name to remove a link.</p>
          )}

        {person.parents && person.parents.length > 0 && (
          <>
            <p className={styles.relGroupLabel}>Parents</p>
            <div className={styles.chips}>
              {person.parents.map(rel => (
                <RelationshipChip
                  key={rel.person.id}
                  anchorId={person.id}
                  related={rel.person}
                  role="parent"
                  canDetach={!!person.canEditDetails}
                  disputed={rel.disputed}
                  confidenceScore={rel.confidenceScore}
                  parentRole={rel.parentRole}
                  onViewPerson={handleChipClick}
                />
              ))}
            </div>
          </>
        )}

        {person.children && person.children.length > 0 && (
          <>
            <p className={styles.relGroupLabel}>Children</p>
            <div className={styles.chips}>
              {person.children.map(rel => (
                <RelationshipChip
                  key={rel.person.id}
                  anchorId={person.id}
                  related={rel.person}
                  role="child"
                  canDetach={!!person.canEditDetails}
                  parentRole={rel.parentRole}
                  onViewPerson={handleChipClick}
                />
              ))}
            </div>
          </>
        )}

        {person.spouses && person.spouses.length > 0 && (
          <>
            <p className={styles.relGroupLabel}>Spouse{person.spouses.length > 1 ? 's' : ''}</p>
            <div className={styles.chips}>
              {person.spouses.map(rel => (
                <RelationshipChip
                  key={rel.person.id}
                  anchorId={person.id}
                  related={rel.person}
                  role="spouse"
                  canDetach={!!person.canEditDetails}
                  onViewPerson={handleChipClick}
                />
              ))}
            </div>
          </>
        )}

        {person.siblings && person.siblings.length > 0 && (
          <>
            <p className={styles.relGroupLabel}>Siblings</p>
            <div className={styles.chips}>
              {person.siblings.map(rel => (
                <RelationshipChip
                  key={rel.person.id}
                  anchorId={person.id}
                  related={rel.person}
                  role="sibling"
                  canDetach={!!person.canEditDetails}
                  onViewPerson={handleChipClick}
                />
              ))}
            </div>
          </>
        )}

        {!person.parents?.length &&
          !person.children?.length &&
          !person.spouses?.length &&
          !person.siblings?.length && (
            <p className={styles.emptyState}>No relationships linked yet.</p>
          )}

        <LinkRelationshipForm
          key={person.id}
          person={person}
          allPeople={allPeople}
          treeMemberIds={treeMemberIds}
          isUnlinked={isUnlinked}
          lookup={lookup}
          linkTargetId={linkTargetId}
          linkPickActive={linkPickActive}
          onLinkTargetChange={onLinkTargetChange}
          onStartLinkPick={onStartLinkPick}
          onCancelLinkPick={onCancelLinkPick}
          onViewPerson={onViewPerson}
          onLinked={onLinked}
        />
      </section>

      {/* ── Stories & memories ──────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Stories &amp; Memories</h3>
        {person.stories && person.stories.length > 0 ? (
          <div className={styles.storyList}>
            {person.stories.map(story => (
              <StoryItem key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>No stories recorded yet.</p>
        )}
        <div className={styles.addBtns}>
          <button className={styles.addBtn}>🎙 Record audio</button>
          <button className={styles.addBtn}>✍️ Write memory</button>
        </div>
      </section>

      {/* ── Photos ──────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Photos</h3>
        <p className={styles.emptyState}>No photos uploaded yet.</p>
        <button className={styles.addBtn}>+ Upload photo</button>
      </section>
    </div>
  );
};

export default PersonDrawer;
