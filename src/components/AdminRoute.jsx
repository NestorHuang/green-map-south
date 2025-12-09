import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    // This effect will run whenever the loading or isAdmin state changes.
    const isReady = !loading;
    if (isReady && !isAdmin) {
      // If the check is complete and the user is not an admin, navigate away.
      console.log('[AdminRoute] Not an admin. Redirecting to home.');
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    // While checking, show a loading indicator.
    return <div>Checking admin privileges...</div>;
  }

  // If the check is complete and the user is an admin, render the children.
  // Otherwise, render null and let the useEffect handle the redirect.
  return isAdmin ? children : null;
};

export default AdminRoute;


