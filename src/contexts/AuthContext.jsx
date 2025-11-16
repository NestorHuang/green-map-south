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
        // User is logged in, check for admin/superAdmin role custom claim from their ID token.
        try {
          // Passing `true` forces a token refresh, ensuring we have the latest claims.
          const idTokenResult = await user.getIdTokenResult(true);
          // The 'role' claim is set via Cloud Function (syncAdminStatus).
          // User is admin if role is 'admin' or 'superAdmin'
          const userRole = idTokenResult.claims.role;
          setIsAdmin(userRole === 'admin' || userRole === 'superAdmin');
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
