import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_RELATIONSHIP_MUTATION } from '../../graphql/mutations';
import { MY_TREE_QUERY } from '../../graphql/queries';
import type { Person } from '../../types';
import { formatLifeYears } from '../../utils/vitalYears';
import styles from './LinkRelationshipForm.module.css';

function graphQLErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'graphQLErrors' in error) {
    const gqlErrors = (error as { graphQLErrors?: Array<{ message?: string }> }).graphQLErrors;
    if (gqlErrors?.[0]?.message) return gqlErrors[0].message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Could not create relationship.';
}

type RelRole = 'parent' | 'child' | 'spouse' | 'sibling';

interface Props {
  person: Person;
  allPeople: Person[];
  treeMemberIds: Set<string>;
  isUnlinked: boolean;
  lookup: Map<string, Person>;
  linkTargetId: string | null;
  linkPickActive: boolean;
  onLinkTargetChange: (id: string | null) => void;
  onStartLinkPick: () => void;
  onCancelLinkPick: () => void;
  onViewPerson: (person: Person) => void;
  onLinked: () => void;
}

function toMutationVars(anchorId: string, otherId: string, role: RelRole) {
  switch (role) {
    case 'parent':
      return { fromUuid: otherId, toUuid: anchorId, relationshipType: 'PARENT_OF' };
    case 'child':
      return { fromUuid: anchorId, toUuid: otherId, relationshipType: 'PARENT_OF' };
    case 'spouse':
      return { fromUuid: anchorId, toUuid: otherId, relationshipType: 'MARRIED_TO' };
    case 'sibling':
      return { fromUuid: anchorId, toUuid: otherId, relationshipType: 'SIBLING_OF' };
  }
}

function candidateLabel(person: Person, onTree: boolean): string {
  const dates = formatLifeYears(person.birthDate, person.deathDate, person.birthDateApproximate);
  const suffix = dates ? ` · ${dates}` : '';
  const treeTag = onTree ? '' : ' · unlinked';
  const place = person.birthplace ? ` · ${person.birthplace}` : '';
  return `${person.fullName}${suffix}${place}${treeTag}`;
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const LinkRelationshipForm = ({
  person,
  allPeople,
  treeMemberIds,
  isUnlinked,
  lookup,
  linkTargetId,
  linkPickActive,
  onLinkTargetChange,
  onStartLinkPick,
  onCancelLinkPick,
  onViewPerson,
  onLinked,
}: Props) => {
  const [open, setOpen] = useState(isUnlinked);
  const [role, setRole] = useState<RelRole>('parent');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOpen(isUnlinked);
    setError(null);
  }, [person.id, isUnlinked]);

  const candidates = allPeople
    .filter(p => p.id !== person.id)
    .filter(p => !isUnlinked || treeMemberIds.has(p.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const selectedTarget = linkTargetId ? lookup.get(linkTargetId) ?? null : null;

  const [linkPeople, { loading }] = useMutation(CREATE_RELATIONSHIP_MUTATION, {
    refetchQueries: [{ query: MY_TREE_QUERY }],
    onCompleted: () => {
      setOpen(false);
      onLinkTargetChange(null);
      setError(null);
      onLinked();
    },
    onError: (err) => setError(graphQLErrorMessage(err)),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!linkTargetId) {
      setError('Choose someone on the tree to link to.');
      return;
    }

    await linkPeople({
      variables: toMutationVars(person.id, linkTargetId, role),
    });
  };

  if (candidates.length === 0) {
    return (
      <p className={styles.hint}>
        {isUnlinked
          ? 'Add someone to the tree first, then link this person to them.'
          : 'Add at least one more person before linking relationships.'}
      </p>
    );
  }

  if (!open) {
    return (
      <>
        {isUnlinked && (
          <p className={styles.unlinkedNotice}>
            Not on the tree yet — link to someone already on the canvas.
          </p>
        )}
        <button type="button" className={styles.toggle} onClick={() => setOpen(true)}>
          + Link to someone{isUnlinked ? ' on the tree' : ''}
        </button>
      </>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {isUnlinked && (
        <p className={styles.unlinkedNotice}>
          Pick someone on the tree by clicking their node — best when names match.
        </p>
      )}

      <label className={styles.label}>
        Relationship
        <select
          className={styles.input}
          value={role}
          onChange={e => setRole(e.target.value as RelRole)}
        >
          <option value="parent">Parent of {person.fullName}</option>
          <option value="child">Child of {person.fullName}</option>
          <option value="spouse">Spouse of {person.fullName}</option>
          <option value="sibling">Sibling of {person.fullName}</option>
        </select>
      </label>

      <div className={styles.targetSection}>
        <span className={styles.label}>Person on tree</span>

        {selectedTarget ? (
          <div className={styles.selectedTarget}>
            <div className={styles.selectedAvatar}>
              {selectedTarget.photoUrl ? (
                <img src={selectedTarget.photoUrl} alt="" className={styles.selectedPhoto} />
              ) : (
                <span>{initials(selectedTarget.fullName)}</span>
              )}
            </div>
            <div className={styles.selectedInfo}>
              <span className={styles.selectedName}>{selectedTarget.fullName}</span>
              {formatLifeYears(
                selectedTarget.birthDate,
                selectedTarget.deathDate,
                selectedTarget.birthDateApproximate,
              ) && (
                <span className={styles.selectedDates}>
                  {formatLifeYears(
                    selectedTarget.birthDate,
                    selectedTarget.deathDate,
                    selectedTarget.birthDateApproximate,
                  )}
                </span>
              )}
            </div>
            <div className={styles.selectedActions}>
              <button
                type="button"
                className={styles.viewProfile}
                onClick={() => onViewPerson(selectedTarget)}
              >
                View
              </button>
              <button
                type="button"
                className={styles.clearTarget}
                onClick={() => onLinkTargetChange(null)}
                aria-label="Clear selection"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.noTarget}>No one selected yet</p>
        )}

        <div className={styles.pickActions}>
          <button
            type="button"
            className={[styles.pickBtn, linkPickActive ? styles.pickBtnActive : ''].join(' ')}
            onClick={linkPickActive ? onCancelLinkPick : onStartLinkPick}
          >
            {linkPickActive ? 'Cancel pick mode' : 'Pick from tree'}
          </button>
        </div>

        <details className={styles.listFallback}>
          <summary>Or choose from list</summary>
          <select
            className={styles.input}
            value={linkTargetId ?? ''}
            onChange={e => onLinkTargetChange(e.target.value || null)}
          >
            <option value="">— select —</option>
            {candidates.map(p => (
              <option key={p.id} value={p.id}>
                {candidateLabel(p, treeMemberIds.has(p.id))}
              </option>
            ))}
          </select>
        </details>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancel}
          onClick={() => {
            setOpen(false);
            onCancelLinkPick();
            setError(null);
          }}
        >
          Cancel
        </button>
        <button type="submit" className={styles.submit} disabled={loading || !linkTargetId}>
          {loading ? 'Linking…' : 'Link'}
        </button>
      </div>
    </form>
  );
};

export default LinkRelationshipForm;
