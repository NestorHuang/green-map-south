import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { AuthContext } from './AuthContextDefinition';

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // User is logged in, check for admin custom claim from their ID token.
        try {
          // Passing `true` forces a token refresh, ensuring we have the latest claims.
          const idTokenResult = await user.getIdTokenResult(true);
          // The 'admin' claim is set via a backend script (Cloud Function).
          setIsAdmin(!!idTokenResult.claims.admin);
        } catch (error) {
          console.error("Error getting ID token result:", error);
          setIsAdmin(false);
        }
      } else {
        // User is logged out, they are not an admin.
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    isAdmin,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
