import { useCallback, useEffect, useState } from 'react';
import {
  fetchCurrentUser,
  getAuthToken,
  updateFamilyTreeName as saveFamilyTreeName,
} from '../auth/session';

const DEFAULT_NAME = 'My Family Tree';

export function useFamilyTree() {
  const [treeName, setTreeName] = useState(DEFAULT_NAME);
  const [loading, setLoading] = useState(() => !!getAuthToken());
  const isAuthenticated = !!getAuthToken();

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    fetchCurrentUser().then(user => {
      if (user?.familyTreeName) setTreeName(user.familyTreeName);
      setLoading(false);
    });
  }, []);

  const updateTreeName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const saved = await saveFamilyTreeName(trimmed);
    if (saved) {
      setTreeName(saved);
      return true;
    }
    return false;
  }, []);

  return {
    treeName,
    setTreeName,
    updateTreeName,
    loading,
    canEdit: isAuthenticated,
  };
}
