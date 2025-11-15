import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextDefinition';

/**
 * Provides the current user, admin status, and authentication loading state.
 * Data is sourced from the central AuthContext.
 */
export const useAuth = () => {
  const { user, isAdmin, loading } = useContext(AuthContext);
  return { user, isAdmin, loading };
};
