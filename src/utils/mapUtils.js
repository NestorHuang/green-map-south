// 台灣各縣市的中心點座標
export const TAIWAN_CITY_COORDS = {
  '台北市': { lat: 25.0330, lng: 121.5654, zoom: 13 },
  '新北市': { lat: 25.0120, lng: 121.4650, zoom: 12 },
  '桃園市': { lat: 24.9936, lng: 121.3010, zoom: 12 },
  '台中市': { lat: 24.1477, lng: 120.6736, zoom: 12 },
  '台南市': { lat: 22.9998, lng: 120.2269, zoom: 12 },
  '高雄市': { lat: 22.6273, lng: 120.3014, zoom: 12 },
  '基隆市': { lat: 25.1276, lng: 121.7392, zoom: 13 },
  '新竹市': { lat: 24.8138, lng: 120.9675, zoom: 13 },
  '嘉義市': { lat: 23.4801, lng: 120.4491, zoom: 13 },
  '新竹縣': { lat: 24.8387, lng: 121.0177, zoom: 11 },
  '苗栗縣': { lat: 24.5602, lng: 120.8214, zoom: 11 },
  '彰化縣': { lat: 24.0518, lng: 120.5161, zoom: 11 },
  '南投縣': { lat: 23.9609, lng: 120.9719, zoom: 11 },
  '雲林縣': { lat: 23.7092, lng: 120.4313, zoom: 11 },
  '嘉義縣': { lat: 23.4518, lng: 120.2554, zoom: 11 },
  '屏東縣': { lat: 22.5519, lng: 120.5487, zoom: 11 },
  '宜蘭縣': { lat: 24.7021, lng: 121.7378, zoom: 11 },
  '花蓮縣': { lat: 23.9871, lng: 121.6015, zoom: 10 },
  '台東縣': { lat: 22.7972, lng: 121.0713, zoom: 10 },
  '澎湖縣': { lat: 23.5711, lng: 119.5794, zoom: 11 },
  '金門縣': { lat: 24.4489, lng: 118.3765, zoom: 12 },
  '連江縣': { lat: 26.1605, lng: 119.9500, zoom: 12 },
};

// 台灣中心點（全台灣地圖預設）
export const TAIWAN_CENTER = { lat: 23.5, lng: 121.0, zoom: 8 };

/**
 * 使用 Google Geocoding API 進行反向地理編碼
 * @param {number} lat - 緯度
 * @param {number} lng - 經度
 * @returns {Promise<string|null>} - 縣市名稱，如果找不到則返回 null
 */
export const getCityFromCoords = async (lat, lng) => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=zh-TW`
    );

    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      // 嘗試從地址元件中找到縣市
      for (const result of data.results) {
        const addressComponents = result.address_components || [];

        // 尋找 administrative_area_level_1 (通常是縣市)
        const cityComponent = addressComponents.find(
          component =>
            component.types.includes('administrative_area_level_1') ||
            component.types.includes('locality')
        );

        if (cityComponent) {
          const cityName = cityComponent.long_name;
          // 檢查是否在我們的縣市列表中
          if (TAIWAN_CITY_COORDS[cityName]) {
            return cityName;
          }
        }
      }

      // 如果找不到精確匹配，嘗試從完整地址中提取
      const fullAddress = data.results[0].formatted_address;
      for (const city of Object.keys(TAIWAN_CITY_COORDS)) {
        if (fullAddress.includes(city)) {
          return city;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting city from coordinates:', error);
    return null;
  }
};

/**
 * 取得使用者的 GPS 位置並返回對應的縣市中心點
 * @returns {Promise<{center: {lat: number, lng: number}, zoom: number}>}
 */
export const getUserLocationCenter = async () => {
  return new Promise((resolve) => {
    // 嘗試取得 GPS 位置
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using Taiwan center');
      resolve(TAIWAN_CENTER);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('GPS position:', latitude, longitude);

        // 取得縣市名稱
        const cityName = await getCityFromCoords(latitude, longitude);
        console.log('Detected city:', cityName);

        if (cityName && TAIWAN_CITY_COORDS[cityName]) {
          const cityCoords = TAIWAN_CITY_COORDS[cityName];
          resolve({
            center: { lat: cityCoords.lat, lng: cityCoords.lng },
            zoom: cityCoords.zoom
          });
        } else {
          // 如果找不到縣市，使用 GPS 座標本身
          resolve({
            center: { lat: latitude, lng: longitude },
            zoom: 14
          });
        }
      },
      (error) => {
        console.log('Could not get geolocation:', error.message);
        console.log('Using Taiwan center as default');
        resolve(TAIWAN_CENTER);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};
