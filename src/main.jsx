import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // Import the AuthProvider
import { LocationTypesProvider } from './contexts/LocationTypesContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* Wrap App with AuthProvider */}
        <LocationTypesProvider>
          <App />
        </LocationTypesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);