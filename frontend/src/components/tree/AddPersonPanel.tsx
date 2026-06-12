import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_PERSON_MUTATION } from '../../graphql/mutations';
import { MY_TREE_QUERY } from '../../graphql/queries';
import {
  encodeBirthYear,
  encodeDeathYear,
  optionalField,
  type BirthMode,
  type DeathStatus,
} from '../../utils/vitalYears';
import VitalYearFields from '../profile/VitalYearFields';
import styles from './AddPersonPanel.module.css';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const AddPersonPanel = ({ onClose, onCreated }: Props) => {
  const [fullName, setFullName] = useState('');
  const [birthMode, setBirthMode] = useState<BirthMode>('unknown');
  const [birthYear, setBirthYear] = useState('');
  const [deathStatus, setDeathStatus] = useState<DeathStatus>('living');
  const [deathYear, setDeathYear] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [ethnicGroup, setEthnicGroup] = useState('');
  const [bio, setBio] = useState('');
  const [biologicalSex, setBiologicalSex] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    if (birthMode === 'year' && !birthYear.trim()) {
      setError('Enter a birth year or choose Unknown.');
      return;
    }
    if (deathStatus === 'year' && !deathYear.trim()) {
      setError('Enter a death year or choose another status.');
      return;
    }

    await createPerson({
      variables: {
        input: {
          fullName: fullName.trim(),
          birthDate: encodeBirthYear(birthMode, birthYear),
          deathDate: encodeDeathYear(deathStatus, deathYear),
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

        <VitalYearFields
          birthMode={birthMode}
          birthYear={birthYear}
          deathStatus={deathStatus}
          deathYear={deathYear}
          onBirthModeChange={setBirthMode}
          onBirthYearChange={setBirthYear}
          onDeathStatusChange={setDeathStatus}
          onDeathYearChange={setDeathYear}
        />

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
