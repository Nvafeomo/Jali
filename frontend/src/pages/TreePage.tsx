import { useMemo, useState } from 'react';
import FamilyTree from '../components/tree/FamilyTree';
import EditableTreeName from '../components/tree/EditableTreeName';
import PersonDrawer from '../components/profile/PersonDrawer';
import AddPersonPanel from '../components/tree/AddPersonPanel';
import { useAuth } from '../hooks/useAuth';
import { useFamilyTree } from '../hooks/useFamilyTree';
import { useMyTree } from '../hooks/useMyTree';
import { peopleById } from '../utils/enrichPeople';
import type { Person } from '../types';
import styles from './TreePage.module.css';

const EmptyTreeGraphic = () => (
  <svg
    className={styles.emptyGraphic}
    viewBox="0 0 88 64"
    fill="none"
    aria-hidden
  >
    <circle cx="44" cy="14" r="9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="22" cy="44" r="8" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="66" cy="44" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M44 23v11M44 34l-18 10M44 34l18 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const TreePage = () => {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const { email, isAuthenticated, logout } = useAuth();
  const { treeName, updateTreeName, canEdit: canEditTreeName } = useFamilyTree();
  const { people, loading, error } = useMyTree();

  const lookup = useMemo(() => peopleById(people), [people]);
  const selectedPerson = selectedPersonId ? lookup.get(selectedPersonId) ?? null : null;

  const handlePersonSelect = (person: Person) => {
    setSelectedPersonId(person.id);
    setShowAddPanel(false);
  };

  const handleOpenAdd = () => {
    setSelectedPersonId(null);
    setShowAddPanel(true);
  };

  const rightPanel = showAddPanel ? 'add' : selectedPerson ? 'drawer' : null;
  const memberLabel = people.length === 1 ? '1 member' : `${people.length} members`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <span className={styles.logo}>Jali</span>
        </div>
        <div className={styles.headerDivider} aria-hidden />
        <div className={styles.headerMain}>
          <EditableTreeName
            name={treeName}
            canEdit={canEditTreeName}
            onSave={updateTreeName}
          />
          {!loading && !error && people.length > 0 && (
            <span className={styles.memberCount}>{memberLabel}</span>
          )}
        </div>

        <div className={styles.headerActions}>
          {isAuthenticated && email && (
            <span className={styles.userEmail} title={email}>
              {email}
            </span>
          )}
          {isAuthenticated && (
            <button type="button" className={styles.logoutButton} onClick={logout}>
              Log out
            </button>
          )}
          <button className={styles.addButton} onClick={handleOpenAdd}>
            + Add person
          </button>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.treeArea}>
          {loading && (
            <div className={`${styles.centered} ${styles.loadingState}`}>
              <div className={styles.spinner} aria-hidden />
              <p>Loading your family tree…</p>
            </div>
          )}

          {error && (
            <div className={`${styles.centered} ${styles.errorState}`}>
              <p className={styles.errorTitle}>Could not load tree</p>
              <p className={styles.errorDetail}>{error.message}</p>
            </div>
          )}

          {!loading && !error && people.length === 0 && (
            <div className={styles.centered}>
              <div className={styles.emptyState}>
                <EmptyTreeGraphic />
                <h2 className={styles.emptyTitle}>Your family tree is empty</h2>
                <p className={styles.emptyHint}>
                  Add your first person to begin mapping your lineage and preserving their story.
                </p>
                <button className={styles.emptyAddButton} onClick={handleOpenAdd}>
                  + Add your first family member
                </button>
              </div>
            </div>
          )}

          {!loading && !error && people.length > 0 && (
            <FamilyTree people={people} onPersonSelect={handlePersonSelect} />
          )}
        </div>

        {rightPanel === 'add' && (
          <aside className={styles.drawer}>
            <AddPersonPanel
              onClose={() => setShowAddPanel(false)}
              onCreated={() => setShowAddPanel(false)}
            />
          </aside>
        )}

        {rightPanel === 'drawer' && selectedPerson && (
          <aside className={styles.drawer}>
            <PersonDrawer
              person={selectedPerson}
              allPeople={people}
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
