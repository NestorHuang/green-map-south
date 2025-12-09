import React, { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

const PlacesAutocomplete = ({ onPlaceSelect }) => {
  const [autocomplete, setAutocomplete] = useState(null);

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        onPlaceSelect(coords);
      }
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        types: ['establishment'],
        componentRestrictions: { country: 'tw' },
      }}
    >
      <input
        type="text"
        placeholder="搜尋地點..."
        className="w-full p-2 border border-gray-300 rounded-md hidden"
        autocomplete="off"
      />
    </Autocomplete>
  );
};

export default PlacesAutocomplete;