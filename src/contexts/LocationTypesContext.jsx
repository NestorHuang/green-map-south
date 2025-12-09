import React, { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { getAllTypes } from '../services/locationTypes';
import { useAuth } from '../hooks/useAuth';

// Create the context
export const LocationTypesContext = createContext();

/**
 * Provides location types data to its children components.
 * This provider fetches all types (active and inactive) for admin purposes
 * and provides memoized lists of all types and active types.
 */
export function LocationTypesProvider({ children }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { loading: authLoading } = useAuth();

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const typesData = await getAllTypes();
      setTypes(typesData);
    } catch (err) {
      console.error("Failed to fetch location types:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch data once the user's authentication status is resolved.
    // This ensures that custom claims (like admin roles) are available.
    if (!authLoading) {
      fetchTypes();
    }
  }, [fetchTypes, authLoading]);

  // Memoized value for active types, useful for non-admin pages
  const activeTypes = useMemo(
    () => types.filter(t => t.isActive),
    [types]
  );

  // Memoized function to get a type by its ID
  const getTypeById = useCallback(
    (typeId) => types.find(t => t.id === typeId),
    [types]
  );

  const value = {
    types,
    activeTypes,
    loading,
    error,
    getTypeById,
    refreshTypes: fetchTypes, // Allow consumers to trigger a refresh
  };

  return (
    <LocationTypesContext.Provider value={value}>
      {children}
    </LocationTypesContext.Provider>
  );
}

/**
 * Custom hook to use the LocationTypesContext.
 * @returns {Object} The context value.
 */
export const useLocationTypes = () => {
  const context = useContext(LocationTypesContext);
  if (context === undefined) {
    throw new Error('useLocationTypes must be used within a LocationTypesProvider');
  }
  return context;
};
