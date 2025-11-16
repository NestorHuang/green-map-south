import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { AuthContext } from './AuthContextDefinition';

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 重新載入使用者資料的函數
  const reloadUserProfile = async () => {
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error reloading user profile:", error);
      }
    }
  };

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

        // Load user profile from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data());
          } else {
            // First time user, no profile yet
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile(null);
        }
      } else {
        // User is logged out, they are not an admin.
        setIsAdmin(false);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    isAdmin,
    loading,
    reloadUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
