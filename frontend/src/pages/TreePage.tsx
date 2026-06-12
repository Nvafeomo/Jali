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
    setShowAddPanel(false); // close add panel if open
  };

  const handleOpenAdd = () => {
    setSelectedPersonId(null); // close drawer if open
    setShowAddPanel(true);
  };

  // Determine what's showing in the right panel
  const rightPanel = showAddPanel
    ? 'add'
    : selectedPerson
    ? 'drawer'
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Jali</span>
        <EditableTreeName
          name={treeName}
          canEdit={canEditTreeName}
          onSave={updateTreeName}
        />

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
              <button className={styles.emptyAddButton} onClick={handleOpenAdd}>
                + Add your first family member
              </button>
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
