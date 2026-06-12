import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_PERSON_MUTATION } from '../../graphql/mutations';
import { MY_TREE_QUERY } from '../../graphql/queries';
import { optionalField } from '../../utils/formatLifeYears';
import styles from './AddPersonPanel.module.css';

interface Props {
  onClose: () => void;
  onCreated: () => void; // called after a person is successfully added
}

// AddPersonPanel is a slide-in form for creating a new Person node.
// It only handles basic details — relationships are added separately
// from the PersonDrawer once the person exists.
//
// After a successful mutation it tells Apollo to refetch myTree so
// the new node appears on the canvas immediately.
const AddPersonPanel = ({ onClose, onCreated }: Props) => {
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [ethnicGroup, setEthnicGroup] = useState('');
  const [bio, setBio] = useState('');
  const [biologicalSex, setBiologicalSex] = useState('');
  const [error, setError] = useState<string | null>(null);

  // useMutation gives us a function to call plus loading/error state.
  // refetchQueries tells Apollo: after this mutation succeeds, re-run
  // MY_TREE_QUERY so the canvas updates without a manual page refresh.
  const [createPerson, { loading }] = useMutation(CREATE_PERSON_MUTATION, {
    refetchQueries: [{ query: MY_TREE_QUERY }],
    onError: (err) => setError(err.message),
    onCompleted: () => {
      onCreated();
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    await createPerson({
      variables: {
        input: {
          fullName: fullName.trim(),
          birthDate: optionalField(birthDate),
          deathDate: optionalField(deathDate),
          birthplace: optionalField(birthplace),
          ethnicGroup: optionalField(ethnicGroup),
          bio: optionalField(bio),
          biologicalSex: optionalField(biologicalSex) || null,
        },
      },
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Add person</h2>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Full name is the only required field */}
        <label className={styles.label}>
          Full name <span className={styles.required}>*</span>
          <input
            type="text"
            className={styles.input}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="e.g. Aminata Kouyaté"
            autoFocus
            required
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label}>
            Birth year <span className={styles.optional}>(optional)</span>
            <input
              type="text"
              className={styles.input}
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              placeholder="Unknown — leave blank"
            />
          </label>

          <label className={styles.label}>
            Death year <span className={styles.optional}>(optional)</span>
            <input
              type="text"
              className={styles.input}
              value={deathDate}
              onChange={e => setDeathDate(e.target.value)}
              placeholder="Unknown — leave blank"
            />
          </label>
        </div>

        <label className={styles.label}>
          Birthplace
          <input
            type="text"
            className={styles.input}
            value={birthplace}
            onChange={e => setBirthplace(e.target.value)}
            placeholder="e.g. Conakry, Guinea"
          />
        </label>

        <label className={styles.label}>
          Ethnic group
          <input
            type="text"
            className={styles.input}
            value={ethnicGroup}
            onChange={e => setEthnicGroup(e.target.value)}
            placeholder="e.g. Mandinka"
          />
        </label>

        <label className={styles.label}>
          Bio
          <textarea
            className={styles.textarea}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A short story about this person…"
            rows={3}
          />
        </label>

        {/* Select is better than free text for a known set of options */}
        <label className={styles.label}>
          Sex
          <select
            className={styles.input}
            value={biologicalSex}
            onChange={e => setBiologicalSex(e.target.value)}
          >
            <option value="">— select —</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Adding…' : 'Add person'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPersonPanel;
