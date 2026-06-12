import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_PERSON_MUTATION } from '../../graphql/mutations';
import { MY_TREE_QUERY } from '../../graphql/queries';
import type { Person } from '../../types';
import { editDaysRemaining } from '../../utils/gracePeriod';
import styles from './PersonProfileEditor.module.css';

interface Props {
  person: Person;
}

const PersonProfileEditor = ({ person }: Props) => {
  const daysLeft = editDaysRemaining(person.createdAt);

  const [fullName, setFullName] = useState(person.fullName);
  const [bio, setBio] = useState(person.bio ?? '');
  const [birthDate, setBirthDate] = useState(person.birthDate ?? '');
  const [deathDate, setDeathDate] = useState(person.deathDate ?? '');
  const [birthplace, setBirthplace] = useState(person.birthplace ?? '');
  const [ethnicGroup, setEthnicGroup] = useState(person.ethnicGroup ?? '');
  const [biologicalSex, setBiologicalSex] = useState(person.biologicalSex ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(person.fullName);
    setBio(person.bio ?? '');
    setBirthDate(person.birthDate ?? '');
    setDeathDate(person.deathDate ?? '');
    setBirthplace(person.birthplace ?? '');
    setEthnicGroup(person.ethnicGroup ?? '');
    setBiologicalSex(person.biologicalSex ?? '');
    setError(null);
    setSaved(false);
  }, [person]);

  const [updatePerson, { loading }] = useMutation(UPDATE_PERSON_MUTATION, {
    refetchQueries: [{ query: MY_TREE_QUERY }],
    onCompleted: () => {
      setSaved(true);
      setError(null);
      window.setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    await updatePerson({
      variables: {
        uuid: person.id,
        input: {
          fullName: fullName.trim(),
          bio: bio.trim() || null,
          birthDate: birthDate || null,
          deathDate: deathDate || null,
          birthplace: birthplace || null,
          ethnicGroup: ethnicGroup || null,
          biologicalSex: biologicalSex || null,
        },
      },
    });
  };

  const isDirty =
    fullName !== person.fullName ||
    bio !== (person.bio ?? '') ||
    birthDate !== (person.birthDate ?? '') ||
    deathDate !== (person.deathDate ?? '') ||
    birthplace !== (person.birthplace ?? '') ||
    ethnicGroup !== (person.ethnicGroup ?? '') ||
    biologicalSex !== (person.biologicalSex ?? '');

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.graceBanner}>
        <span className={styles.graceIcon}>✎</span>
        <span>
          {daysLeft === 0
            ? 'Edit window closing today — fix mistakes while you can.'
            : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to edit this person's details.`}
        </span>
        {saved && <span className={styles.saved}>Saved</span>}
      </div>

      <label className={styles.label}>
        Full name <span className={styles.required}>*</span>
        <input
          className={styles.input}
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
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

      <div className={styles.row}>
        <label className={styles.label}>
          Birth year
          <input
            className={styles.input}
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            placeholder="e.g. 1952"
          />
        </label>
        <label className={styles.label}>
          Death year
          <input
            className={styles.input}
            value={deathDate}
            onChange={e => setDeathDate(e.target.value)}
            placeholder="e.g. 2018"
          />
        </label>
      </div>

      <label className={styles.label}>
        Birthplace
        <input
          className={styles.input}
          value={birthplace}
          onChange={e => setBirthplace(e.target.value)}
        />
      </label>

      <label className={styles.label}>
        Ethnic group
        <input
          className={styles.input}
          value={ethnicGroup}
          onChange={e => setEthnicGroup(e.target.value)}
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

      <button type="submit" className={styles.saveBtn} disabled={loading || !isDirty}>
        {loading ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
};

export default PersonProfileEditor;
