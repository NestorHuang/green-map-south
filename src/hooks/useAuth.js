import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextDefinition';

/**
 * Provides the current user, user profile, admin status, authentication loading state, and reload function.
 * Data is sourced from the central AuthContext.
 */
export const useAuth = () => {
  const { user, userProfile, isAdmin, loading, reloadUserProfile } = useContext(AuthContext);
  return { user, userProfile, isAdmin, loading, reloadUserProfile };
};
