import { useState } from 'react';
import FamilyTree from '../components/tree/FamilyTree';
import type { Person } from '../types';
import styles from './TreePage.module.css';

const TreePage = () => {
  // selectedPerson drives the drawer. null = drawer closed.
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  return (
    <div className={styles.page}>
      {/* Header bar */}
      <header className={styles.header}>
        <span className={styles.logo}>Jali</span>
        <span className={styles.treeName}>Kouyaté Family Tree</span>
      </header>

      {/* Main area: tree canvas + optional drawer side by side */}
      <div className={styles.main}>
        <div className={styles.treeArea}>
          <FamilyTree onPersonSelect={setSelectedPerson} />
        </div>

        {/* Drawer slides in when a person is selected */}
        {selectedPerson && (
          <aside className={styles.drawer}>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedPerson(null)}
            >
              ✕
            </button>
            {/* PersonDrawer component goes here - building next */}
            <div className={styles.drawerPlaceholder}>
              <h2>{selectedPerson.fullName}</h2>
              <p>Profile drawer coming next...</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default TreePage;
