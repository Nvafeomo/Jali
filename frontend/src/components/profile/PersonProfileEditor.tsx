import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_PERSON_MUTATION } from '../../graphql/mutations';
import { MY_TREE_QUERY } from '../../graphql/queries';
import type { Person } from '../../types';
import {
  birthModeFromStored,
  birthYearFromStored,
  deceasedYearFromStored,
  encodeBirthYear,
  encodeLifeStatus,
  lifeStatusFromStored,
  optionalField,
  type BirthMode,
  type LifeStatus,
} from '../../utils/vitalYears';
import { editDaysRemaining } from '../../utils/gracePeriod';
import VitalYearFields from './VitalYearFields';
import styles from './PersonProfileEditor.module.css';

interface Props {
  person: Person;
}

const PersonProfileEditor = ({ person }: Props) => {
  const daysLeft = editDaysRemaining(person.createdAt);

  const [fullName, setFullName] = useState(person.fullName);
  const [bio, setBio] = useState(person.bio ?? '');
  const [birthMode, setBirthMode] = useState<BirthMode>(() => birthModeFromStored(person.birthDate));
  const [birthYear, setBirthYear] = useState(() => birthYearFromStored(person.birthDate));
  const [lifeStatus, setLifeStatus] = useState<LifeStatus>(() => lifeStatusFromStored(person.deathDate));
  const [deathYear, setDeathYear] = useState(() => deceasedYearFromStored(person.deathDate));
  const [birthplace, setBirthplace] = useState(person.birthplace ?? '');
  const [ethnicGroup, setEthnicGroup] = useState(person.ethnicGroup ?? '');
  const [biologicalSex, setBiologicalSex] = useState(person.biologicalSex ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(person.fullName);
    setBio(person.bio ?? '');
    setBirthMode(birthModeFromStored(person.birthDate));
    setBirthYear(birthYearFromStored(person.birthDate));
    setLifeStatus(lifeStatusFromStored(person.deathDate));
    setDeathYear(deceasedYearFromStored(person.deathDate));
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

  const encodedBirth = encodeBirthYear(birthMode, birthYear);
  const encodedDeath = encodeLifeStatus(lifeStatus, deathYear);

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

    await updatePerson({
      variables: {
        uuid: person.id,
        input: {
          fullName: fullName.trim(),
          bio: optionalField(bio),
          birthDate: encodedBirth,
          deathDate: encodedDeath,
          birthplace: optionalField(birthplace),
          ethnicGroup: optionalField(ethnicGroup),
          biologicalSex: optionalField(biologicalSex) || null,
        },
      },
    });
  };

  const storedDeath = person.deathDate ?? null;
  const isDirty =
    fullName !== person.fullName ||
    bio !== (person.bio ?? '') ||
    encodedBirth !== (person.birthDate ?? null) ||
    encodedDeath !== storedDeath ||
    birthplace !== (person.birthplace ?? '') ||
    ethnicGroup !== (person.ethnicGroup ?? '') ||
    biologicalSex !== (person.biologicalSex ?? '');

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.graceBanner}>
        <span className={styles.graceIcon}>✎</span>
        <span>
          {daysLeft === 0
            ? 'Edit window closing today: fix mistakes while you can.'
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

      <VitalYearFields
        birthMode={birthMode}
        birthYear={birthYear}
        lifeStatus={lifeStatus}
        deathYear={deathYear}
        onBirthModeChange={setBirthMode}
        onBirthYearChange={setBirthYear}
        onLifeStatusChange={setLifeStatus}
        onDeathYearChange={setDeathYear}
      />

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
          <option value="">Select</option>
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
