import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { DELETE_RELATIONSHIP_MUTATION } from '../../graphql/mutations';
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
  onViewPerson: (person: Person) => void;
}

const RelationshipChip = ({
  anchorId,
  related,
  role,
  canDetach,
  disputed,
  confidenceScore,
  onViewPerson,
}: Props) => {
  const [error, setError] = useState<string | null>(null);
  const client = useApolloClient();

  const [detach, { loading }] = useMutation(DELETE_RELATIONSHIP_MUTATION, {
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
        {canDetach && (
          <button
            type="button"
            className={styles.detachBtn}
            onClick={handleDetach}
            disabled={loading}
            aria-label={`Remove link to ${related.fullName}`}
            title="Remove link"
          >
            {loading ? '…' : '×'}
          </button>
        )}
      </span>
      {error && <span className={styles.chipError}>{error}</span>}
    </span>
  );
};

export default RelationshipChip;
