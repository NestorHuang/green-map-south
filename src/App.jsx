import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Page Components
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import AdminLayout from './pages/AdminLayout';
import PendingLocationsPage from './pages/PendingLocationsPage';
import ReportsPage from './pages/ReportsPage';

// Route Protection
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import './App.css';

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<HomePage />} />

      {/* User Route */}
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <UploadPage />
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
      </Route>

    </Routes>
  );
}

export default App;