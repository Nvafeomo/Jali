import { useMemo, useState } from 'react';
import FamilyTree from '../components/tree/FamilyTree';
import PersonDrawer from '../components/profile/PersonDrawer';
import { useMyTree } from '../hooks/useMyTree';
import { peopleById } from '../utils/enrichPeople';
import type { Person } from '../types';
import styles from './TreePage.module.css';

const TreePage = () => {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Fetch the logged-in user's tree from the real GraphQL API.
  // useMyTree handles the uuid→id mapping and parent derivation.
  const { people, loading, error } = useMyTree();

  const lookup = useMemo(() => peopleById(people), [people]);
  const selectedPerson = selectedPersonId ? lookup.get(selectedPersonId) ?? null : null;

  const handlePersonSelect = (person: Person) => {
    setSelectedPersonId(person.id);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Jali</span>
        <span className={styles.treeName}>My Family Tree</span>
      </header>

      <div className={styles.main}>
        <div className={styles.treeArea}>
          {loading && (
            <div className={styles.centered}>Loading your family tree…</div>
          )}

          {error && (
            <div className={styles.centered}>
              <p>Could not load tree.</p>
              <p className={styles.errorDetail}>{error.message}</p>
            </div>
          )}

          {!loading && !error && people.length === 0 && (
            <div className={styles.centered}>
              <p>Your family tree is empty.</p>
              <p className={styles.hint}>Add your first family member to get started.</p>
            </div>
          )}

          {!loading && !error && people.length > 0 && (
            <FamilyTree people={people} onPersonSelect={handlePersonSelect} />
          )}
        </div>

        {selectedPerson && (
          <aside className={styles.drawer}>
            <PersonDrawer
              person={selectedPerson}
              lookup={lookup}
              onPersonSelect={handlePersonSelect}
              onClose={() => setSelectedPersonId(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
};

export default TreePage;
