import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can return a loading spinner here
    return <div>Loading...</div>;
  }

  if (!user) {
    // User not authenticated, redirect to home page
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
