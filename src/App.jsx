import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';

// Page Components
import HomePage from './pages/HomePage';
import RegisterLocationPage from './pages/RegisterLocationPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminLayout from './pages/AdminLayout';
import PendingLocationsPage from './pages/PendingLocationsPage';
import ReportsPage from './pages/ReportsPage';
import ManageAdminsPage from './pages/ManageAdminsPage';
import ManageLocationsPage from './pages/ManageLocationsPage';
import ManageTagsPage from './pages/ManageTagsPage';
import ManageLocationTypesPage from './pages/ManageLocationTypesPage';

// Route Protection
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute';

import './App.css';

const libraries = ["places"];

function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    console.log(`[App.jsx] API Load Status: isLoaded=${isLoaded}, loadError=`, loadError);
  }, [isLoaded, loadError]);

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<HomePage isLoaded={isLoaded} loadError={loadError} />} />

      {/* User Routes */}
      <Route
        path="/register"
        element={
          <ProtectedRoute>
            <RegisterLocationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      >
        <Route path="pending" element={<PendingLocationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="locations" element={<ManageLocationsPage />} />
        <Route path="tags" element={<ManageTagsPage />} />
        <Route path="types" element={<ManageLocationTypesPage />} />
        <Route
          path="manage-admins"
          element={
            <SuperAdminRoute>
              <ManageAdminsPage />
            </SuperAdminRoute>
          }
        />
      </Route>

    </Routes>
  );
}

export default App;