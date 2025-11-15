import { useAuth } from './useAuth';

/**
 * Provides the admin status and authentication loading state.
 * Data is sourced from the central AuthContext via the useAuth hook.
 */
export const useAdmin = () => {
  const { isAdmin, loading } = useAuth();
  return { isAdmin, loading };
};




