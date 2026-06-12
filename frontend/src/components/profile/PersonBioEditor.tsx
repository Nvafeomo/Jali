import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_PERSON_MUTATION } from '../../graphql/mutations';
import { MY_TREE_QUERY } from '../../graphql/queries';
import styles from './PersonBioEditor.module.css';

interface Props {
  personId: string;
  bio?: string;
}

const PersonBioEditor = ({ personId, bio }: Props) => {
  const [draft, setDraft] = useState(bio ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(bio ?? '');
    setError(null);
    setSaved(false);
  }, [personId, bio]);

  const [updatePerson, { loading }] = useMutation(UPDATE_PERSON_MUTATION, {
    refetchQueries: [{ query: MY_TREE_QUERY }],
    onCompleted: () => {
      setSaved(true);
      setError(null);
      window.setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => setError(err.message),
  });

  const handleSave = async () => {
    setError(null);
    await updatePerson({
      variables: {
        uuid: personId,
        input: { bio: draft.trim() || null },
      },
    });
  };

  const isDirty = draft !== (bio ?? '');

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Bio</h3>
        {saved && <span className={styles.saved}>Saved</span>}
      </div>
      <textarea
        className={styles.textarea}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="A short story about this person…"
        rows={4}
      />
      {error && <p className={styles.error}>{error}</p>}
      <button
        type="button"
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={loading || !isDirty}
      >
        {loading ? 'Saving…' : 'Save bio'}
      </button>
    </section>
  );
};

export default PersonBioEditor;
