import React, { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

/**
 * PlacesAutocompleteInput - 可填充地點資訊的自動完成輸入框
 * @param {Function} onPlaceSelect - 當選擇地點時的回調，返回 { name, address, position }
 * @param {string} value - 輸入框的值
 * @param {Function} onChange - 輸入框變化的回調
 * @param {string} name - 輸入框的 name 屬性
 * @param {string} placeholder - 輸入框提示文字
 * @param {string} className - 自訂樣式
 * @param {boolean} required - 是否為必填欄位
 */
const PlacesAutocompleteInput = ({
  onPlaceSelect,
  value,
  onChange,
  name = "name",
  placeholder = "搜尋地點...",
  className = "w-full p-2 border border-gray-300 rounded-md",
  required = false
}) => {
  const [autocomplete, setAutocomplete] = useState(null);

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();

      if (place && place.geometry && place.geometry.location) {
        const placeData = {
          name: place.name || '',
          address: place.formatted_address || '',
          position: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
        };

        onPlaceSelect(placeData);
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
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        required={required}
      />
    </Autocomplete>
  );
};

export default PlacesAutocompleteInput;
