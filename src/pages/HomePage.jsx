import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import Header from '../components/Header';
import MapView from '../components/MapView';
import LocationDetailSheet from '../components/LocationDetailSheet';

function HomePage() {
  const [locations, setLocations] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState(null);

  // Fetch tags for the header
  useEffect(() => {
    let isMounted = true;
    const fetchTags = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tags'));
        const tagsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (isMounted) {
          setTags(tagsData);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching tags:", error);
        }
      }
    };
    fetchTags();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch locations based on search and filter
  const fetchLocations = useCallback(async () => {
    try {
      let locationsQuery = query(collection(db, 'locations'));

      // Apply filters
      if (filterTag) {
        locationsQuery = query(locationsQuery, where('tags', 'array-contains', filterTag));
      }
      if (searchTerm) {
        // Basic prefix search
        locationsQuery = query(locationsQuery, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
      }

      const querySnapshot = await getDocs(locationsQuery);
      const locationsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const position = [data.position.latitude, data.position.longitude];
        return { id: doc.id, ...data, position };
      });
      setLocations(locationsData);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching locations: ", error);
        console.log("Please ensure you have created the necessary composite indexes in Firestore.");
      }
    }
  }, [searchTerm, filterTag]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  const handleCloseSheet = () => {
    setSelectedLocation(null);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleTagFilter = (tagId) => {
    setFilterTag(tagId);
  };
  
  const handleClearFilter = () => {
    setFilterTag(null);
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Header 
        tags={tags}
        onSearch={handleSearch}
        onTagFilter={handleTagFilter}
        onClearFilter={handleClearFilter}
      />
      <MapView 
        locations={locations}
        onMarkerClick={handleMarkerClick} 
      />
      <LocationDetailSheet 
        location={selectedLocation}
        onClose={handleCloseSheet}
      />
    </div>
  );
}

export default HomePage;




