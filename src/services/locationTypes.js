import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Assuming firebaseConfig.js is in the src root
import { getAuth } from 'firebase/auth';

const locationTypesCollection = collection(db, 'location_types');

// Helper to get current user UID
const getCurrentUserId = () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User is not authenticated.');
  }
  return auth.currentUser.uid;
};

/**
 * Fetches all location types, ordered by the 'order' field.
 * For admins, this includes active and inactive types.
 * For regular users, this only includes active types.
 * @returns {Promise<Array>} A promise that resolves to an array of location type objects.
 */
export async function getAllTypes() {
  // First, fetch active types, which are public.
  const activeQuery = query(
    locationTypesCollection,
    where('isActive', '==', true),
    orderBy('order', 'asc')
  );
  const activeSnapshot = await getDocs(activeQuery);
  const activeTypes = activeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const auth = getAuth();
  const user = auth.currentUser;
  let allTypes = activeTypes;

  // If a user is logged in, check if they are an admin.
  if (user) {
    try {
      const idTokenResult = await user.getIdTokenResult();
      const isAdmin = ['admin', 'superAdmin'].includes(idTokenResult.claims.role);

      // If they are an admin, fetch the inactive types as well.
      if (isAdmin) {
        const inactiveQuery = query(
          locationTypesCollection,
          where('isActive', '==', false),
          orderBy('order', 'asc')
        );
        const inactiveSnapshot = await getDocs(inactiveQuery);
        const inactiveTypes = inactiveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Combine, sort, and return all types.
        allTypes = [...activeTypes, ...inactiveTypes].sort((a, b) => a.order - b.order);
      }
    } catch (error) {
        console.error("Error getting user token for admin check:", error);
        // Fallback to only showing active types if token check fails
    }
  }

  return allTypes;
}

/**
 * Fetches all active location types.
 * @returns {Promise<Array>} A promise that resolves to an array of active location type objects.
 */
export async function getActiveTypes() {
  const q = query(
    locationTypesCollection,
    where('isActive', '==', true),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetches a single location type by its ID.
 * @param {string} typeId - The ID of the location type to fetch.
 * @returns {Promise<Object|null>} A promise that resolves to the location type object, or null if not found.
 */
export async function getTypeById(typeId) {
  const docRef = doc(db, 'location_types', typeId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    console.error('Location type not found:', typeId);
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Creates a new location type.
 * @param {Object} typeData - The data for the new location type.
 * @returns {Promise<Object>} A promise that resolves to the newly created location type object.
 */
export async function createType(typeData) {
  const newType = {
    ...typeData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: getCurrentUserId(),
    updatedBy: getCurrentUserId(),
  };

  const docRef = await addDoc(locationTypesCollection, newType);
  return { id: docRef.id, ...newType };
}

/**
 * Updates an existing location type.
 * @param {string} typeId - The ID of the location type to update.
 * @param {Object} updates - An object containing the fields to update.
 * @returns {Promise<void>}
 */
export async function updateType(typeId, updates) {
  const typeRef = doc(db, 'location_types', typeId);
  await updateDoc(typeRef, {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: getCurrentUserId(),
  });
}

/**
 * Checks how many locations (approved and pending) are using a specific type.
 * @param {string} typeId - The ID of the location type to check.
 * @returns {Promise<Object>} A promise that resolves to an object with usage counts.
 */
export async function checkTypeUsage(typeId) {
    const locationsQuery = query(collection(db, 'locations'), where('typeId', '==', typeId));
    const pendingLocationsQuery = query(collection(db, 'pending_locations'), where('typeId', '==', typeId));

    const [approvedSnapshot, pendingSnapshot] = await Promise.all([
        getDocs(locationsQuery),
        getDocs(pendingLocationsQuery)
    ]);

    return {
        approved: approvedSnapshot.size,
        pending: pendingSnapshot.size,
        total: approvedSnapshot.size + pendingSnapshot.size
    };
}

/**
 * Deletes a location type.
 * Throws an error if the type is still in use.
 * @param {string} typeId - The ID of the location type to delete.
 * @returns {Promise<void>}
 */
export async function deleteType(typeId) {
  const usage = await checkTypeUsage(typeId);
  if (usage.total > 0) {
    throw new Error(`This type is currently in use by ${usage.total} location(s) and cannot be deleted.`);
  }
  await deleteDoc(doc(db, 'location_types', typeId));
}

/**
 * Deletes a location type and all associated locations (approved and pending).
 * This is a forceful delete that removes all related data.
 * @param {string} typeId - The ID of the location type to delete.
 * @returns {Promise<Object>} A promise that resolves to an object with deletion counts.
 */
export async function deleteTypeWithLocations(typeId) {
  const batch = writeBatch(db);

  // Get all locations using this type
  const locationsQuery = query(collection(db, 'locations'), where('typeId', '==', typeId));
  const pendingLocationsQuery = query(collection(db, 'pending_locations'), where('typeId', '==', typeId));

  const [approvedSnapshot, pendingSnapshot] = await Promise.all([
    getDocs(locationsQuery),
    getDocs(pendingLocationsQuery)
  ]);

  // Delete all approved locations
  approvedSnapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });

  // Delete all pending locations
  pendingSnapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });

  // Delete the type itself
  batch.delete(doc(db, 'location_types', typeId));

  // Commit all deletions
  await batch.commit();

  return {
    deletedApprovedLocations: approvedSnapshot.size,
    deletedPendingLocations: pendingSnapshot.size,
    totalDeleted: approvedSnapshot.size + pendingSnapshot.size
  };
}
