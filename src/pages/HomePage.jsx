import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { GoogleMap, Marker } from '@react-google-maps/api';

import Header from '../components/Header';
import LocationDetailSheet from '../components/LocationDetailSheet';

const KAOHSIUNG_STATION_COORDS = { lat: 22.6397, lng: 120.2999 };

const containerStyle = {
  width: '100%',
  height: '100vh'
};

function HomePage({ isLoaded, loadError }) {
  const [locations, setLocations] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [center, setCenter] = useState(KAOHSIUNG_STATION_COORDS);
  const [zoom, setZoom] = useState(16);
  const [filterTag, setFilterTag] = useState(null);

  // GPS 優先邏輯
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter({ lat: latitude, lng: longitude });
      },
      () => {
        console.log("Could not get geolocation, defaulting to Kaohsiung Station.");
      },
      {
        enableHighAccuracy: true,
      }
    );
  }, []);

  // Fetch tags for the header
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchTags = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tags'));
        const tagsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (isMounted) {
          setTags(tagsData);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error("Error fetching tags:", error);
        }
      }
    };

    fetchTags();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Fetch locations based on tag filter
  const fetchLocations = useCallback(async () => {
    try {
      let locationsQuery;

      if (filterTag) {
        locationsQuery = query(collection(db, 'locations'), where('tags', 'array-contains', filterTag));
      } else {
        locationsQuery = query(collection(db, 'locations'));
      }

      const querySnapshot = await getDocs(locationsQuery);
      const locationsData = querySnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() };
      });
      setLocations(locationsData);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching locations: ", error);
      }
    }
  }, [filterTag]);

  useEffect(() => {
    if (isLoaded) { // Only fetch locations when map is ready
      fetchLocations();
    }
  }, [fetchLocations, isLoaded]);

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  const handleCloseSheet = () => {
    setSelectedLocation(null);
  };

  const handlePlaceSelect = useCallback((coords) => {
    if (coords) {
      setCenter(coords);
      setZoom(18);
    }
  }, []);

  const handleTagFilter = useCallback((tagId) => {
    setFilterTag(tagId);
  }, []);
  
  const handleClearFilter = useCallback(() => {
    setFilterTag(null);
  }, []);

  if (loadError) return <div>地圖載入失敗，請檢查您的 API 金鑰或網路連線。</div>;
  if (!isLoaded) return <div>地圖載入中...</div>;

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
      >
        {locations.map(location => {
          const lat = location.position?._lat;
          const lng = location.position?._long;

          if (typeof lat !== 'number' || typeof lng !== 'number') {
            console.error("Invalid location data found, skipping marker render:", location);
            return null;
          }
          const position = { lat, lng };
          return (
            <Marker
              key={location.id}
              position={position}
              onClick={() => handleMarkerClick(location)}
            />
          );
        })}
      </GoogleMap>
      <Header 
        tags={tags}
        onPlaceSelect={handlePlaceSelect}
        onTagFilter={handleTagFilter}
        onClearFilter={handleClearFilter}
      />
      <LocationDetailSheet 
        location={selectedLocation}
        onClose={handleCloseSheet}
      />
    </>
  );
}

export default HomePage;






