import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_RELATIONSHIP_MUTATION } from '../../graphql/mutations';
import { MY_TREE_QUERY } from '../../graphql/queries';
import type { Person } from '../../types';
import styles from './LinkRelationshipForm.module.css';

type RelRole = 'parent' | 'child' | 'spouse' | 'sibling';

interface Props {
  person: Person;
  allPeople: Person[];
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

const LinkRelationshipForm = ({ person, allPeople }: Props) => {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<RelRole>('parent');
  const [otherId, setOtherId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const candidates = allPeople
    .filter(p => p.id !== person.id)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const [linkPeople, { loading }] = useMutation(CREATE_RELATIONSHIP_MUTATION, {
    refetchQueries: [{ query: MY_TREE_QUERY }],
    onCompleted: () => {
      setOpen(false);
      setOtherId('');
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otherId) {
      setError('Choose someone to link.');
      return;
    }

    await linkPeople({
      variables: toMutationVars(person.id, otherId, role),
    });
  };

  if (candidates.length === 0) {
    return (
      <p className={styles.hint}>
        Add at least one more person before linking relationships.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className={styles.toggle} onClick={() => setOpen(true)}>
        + Link to someone
      </button>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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

      <label className={styles.label}>
        Person
        <select
          className={styles.input}
          value={otherId}
          onChange={e => setOtherId(e.target.value)}
        >
          <option value="">— select —</option>
          {candidates.map(p => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancel}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancel
        </button>
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Linking…' : 'Link'}
        </button>
      </div>
    </form>
  );
};

export default LinkRelationshipForm;
