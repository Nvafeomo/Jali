import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { DELETE_RELATIONSHIP_MUTATION, UPDATE_PARENT_ROLE_MUTATION } from '../../graphql/mutations';
import { MY_TREE_QUERY } from '../../graphql/queries';
import type { Person } from '../../types';
import { toDeleteRelationshipVars, type RelRole } from '../../utils/relationshipMutation';
import styles from './PersonDrawer.module.css';

function graphQLErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const withErrors = error as {
      errors?: Array<{ message?: string }>;
      graphQLErrors?: Array<{ message?: string }>;
    };
    const first = withErrors.errors?.[0]?.message ?? withErrors.graphQLErrors?.[0]?.message;
    if (first && !first.startsWith('INTERNAL_ERROR for')) return first;
    if (first) return 'Something went wrong on the server. Try again or check backend logs.';
  }
  if (error instanceof Error && error.message && !error.message.startsWith('INTERNAL_ERROR for')) {
    return error.message;
  }
  return 'Could not remove relationship.';
}

interface Props {
  anchorId: string;
  related: Person;
  role: RelRole;
  canDetach: boolean;
  disputed?: boolean;
  confidenceScore?: number;
  /** parentRole only applies when role === 'parent'. fromUuid is the parent (related.id), toUuid is the anchor. */
  parentRole?: 'MOTHER' | 'FATHER';
  onViewPerson: (person: Person) => void;
}

const ROLE_LABELS: Record<string, string> = { MOTHER: 'Mother', FATHER: 'Father' };

const RelationshipChip = ({
  anchorId,
  related,
  role,
  canDetach,
  disputed,
  confidenceScore,
  parentRole,
  onViewPerson,
}: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const client = useApolloClient();

  const [detach, { loading: detachLoading }] = useMutation(DELETE_RELATIONSHIP_MUTATION, {
    errorPolicy: 'all',
    onError: (err) => setError(graphQLErrorMessage(err)),
  });

  const [updateRole, { loading: roleLoading }] = useMutation(UPDATE_PARENT_ROLE_MUTATION, {
    errorPolicy: 'all',
    onError: (err) => setError(graphQLErrorMessage(err)),
  });

  const handleDetach = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);

    if (!window.confirm(`Remove the link to ${related.fullName}?`)) return;

    try {
      const result = await detach({
        variables: toDeleteRelationshipVars(anchorId, related.id, role),
      });

      if (result.error) {
        setError(graphQLErrorMessage(result.error));
        return;
      }

      client.cache.evict({ fieldName: 'myTree' });
      client.cache.gc();
      await client.refetchQueries({ include: [MY_TREE_QUERY] });
      setError(null);
    } catch (err) {
      setError(graphQLErrorMessage(err));
    }
  };

  const handleRoleSelect = async (newRole: 'MOTHER' | 'FATHER' | null) => {
    setShowRolePicker(false);
    setError(null);

    // fromUuid = the parent (related), toUuid = the child (anchor)
    try {
      const result = await updateRole({
        variables: { fromUuid: related.id, toUuid: anchorId, parentRole: newRole },
      });

      if (result.error) {
        setError(graphQLErrorMessage(result.error));
        return;
      }

      client.cache.evict({ fieldName: 'myTree' });
      client.cache.gc();
      await client.refetchQueries({ include: [MY_TREE_QUERY] });
    } catch (err) {
      setError(graphQLErrorMessage(err));
    }
  };

  const title =
    confidenceScore != null
      ? `${Math.round(confidenceScore * 100)}% confidence${disputed ? ' · disputed' : ''}`
      : undefined;

  return (
    <span className={styles.chipWrap}>
      <span className={styles.chipInner}>
        <button
          type="button"
          className={[styles.chip, disputed ? styles.chipDisputed : ''].join(' ')}
          onClick={() => onViewPerson(related)}
          title={title}
        >
          {related.fullName}
          {disputed && <span className={styles.disputedDot}>⚠</span>}
        </button>

        {/* Mother / Father label + picker — only for parent chips */}
        {role === 'parent' && (
          <span className={styles.parentRoleWrap}>
            <button
              type="button"
              className={styles.parentRoleBtn}
              onClick={(e) => { e.stopPropagation(); setShowRolePicker(v => !v); }}
              disabled={roleLoading}
              title="Set as Mother or Father"
            >
              {roleLoading ? '…' : (parentRole ? ROLE_LABELS[parentRole] : '+ role')}
            </button>

            {showRolePicker && (
              <span className={styles.parentRolePicker}>
                <button onClick={() => handleRoleSelect('MOTHER')}>Mother</button>
                <button onClick={() => handleRoleSelect('FATHER')}>Father</button>
                {parentRole && (
                  <button className={styles.parentRoleClear} onClick={() => handleRoleSelect(null)}>
                    Clear
                  </button>
                )}
              </span>
            )}
          </span>
        )}

        {canDetach && (
          <button
            type="button"
            className={styles.detachBtn}
            onClick={handleDetach}
            disabled={detachLoading}
            aria-label={`Remove link to ${related.fullName}`}
            title="Remove link"
          >
            {detachLoading ? '…' : '×'}
          </button>
        )}
      </span>
      {error && <span className={styles.chipError}>{error}</span>}
    </span>
  );
};

export default RelationshipChip;
