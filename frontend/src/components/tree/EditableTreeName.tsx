import { useEffect, useState } from 'react';
import styles from './EditableTreeName.module.css';

interface Props {
  name: string;
  canEdit: boolean;
  onSave: (name: string) => Promise<boolean>;
}

const EditableTreeName = ({ name, canEdit, onSave }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  const startEditing = () => {
    if (!canEdit) return;
    setDraft(name);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(name);
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    const ok = await onSave(trimmed);
    setSaving(false);

    if (ok) {
      setEditing(false);
    } else {
      setError('Could not save tree name.');
    }
  };

  if (editing) {
    return (
      <form
        className={styles.editForm}
        onSubmit={e => {
          e.preventDefault();
          void save();
        }}
      >
        <input
          className={styles.input}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          autoFocus
          maxLength={120}
          disabled={saving}
        />
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? '…' : 'Save'}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={cancel} disabled={saving}>
          Cancel
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </form>
    );
  }

  return (
    <button
      type="button"
      className={[styles.display, canEdit ? styles.editable : ''].join(' ')}
      onClick={startEditing}
      title={canEdit ? 'Click to rename your family tree' : undefined}
      disabled={!canEdit}
    >
      {name}
      {canEdit && <span className={styles.pencil} aria-hidden>✎</span>}
    </button>
  );
};

export default EditableTreeName;
