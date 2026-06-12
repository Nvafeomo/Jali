import { useMemo, useState } from 'react';
import FamilyTree from '../components/tree/FamilyTree';
import PersonDrawer from '../components/profile/PersonDrawer';
import { MOCK_PEOPLE } from '../graphql/mockData';
import { peopleById } from '../utils/enrichPeople';
import type { Person } from '../types';
import styles from './TreePage.module.css';

const TreePage = () => {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const lookup = useMemo(() => peopleById(MOCK_PEOPLE), []);
  const selectedPerson = selectedPersonId ? lookup.get(selectedPersonId) ?? null : null;

  const handlePersonSelect = (person: Person) => {
    setSelectedPersonId(person.id);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Jali</span>
        <span className={styles.treeName}>Kouyaté Family Tree</span>
      </header>

      <div className={styles.main}>
        <div className={styles.treeArea}>
          <FamilyTree people={MOCK_PEOPLE} onPersonSelect={handlePersonSelect} />
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
