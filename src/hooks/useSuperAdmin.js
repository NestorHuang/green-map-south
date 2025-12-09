import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Custom hook to check if the current user is a super admin
 */
export const useSuperAdmin = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Force token refresh to get latest claims
          const idTokenResult = await user.getIdTokenResult(true);
          // Check if the user has the 'superAdmin' role claim
          setIsSuperAdmin(idTokenResult.claims.role === 'superAdmin');
        } catch (error) {
          console.error("Error getting ID token result:", error);
          setIsSuperAdmin(false);
        }
      } else {
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isSuperAdmin, loading };
};
