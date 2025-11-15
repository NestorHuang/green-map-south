import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon issue with webpack
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const KAOHSIUNG_STATION_COORDS = [22.6397, 120.2999];
const DEFAULT_ZOOM = 16; // 根據規格書，顯示半徑約 500 公尺的範圍

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const MapView = ({ locations, onMarkerClick }) => {
  const [position, setPosition] = useState(KAOHSIUNG_STATION_COORDS);

  useEffect(() => {
    // F-A1: 互動地圖初始化 - GPS 優先邏輯
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        // TODO: 根據規格書，儲存「最後已知位置」
      },
      () => {
        // 若失敗，維持預設位置（高雄火車站）
        console.log("Could not get geolocation, defaulting to Kaohsiung Station.");
      },
      {
        enableHighAccuracy: true,
      }
    );
  }, []);

  return (
    <MapContainer center={position} zoom={DEFAULT_ZOOM} style={{ height: '100vh', width: '100%' }}>
      <ChangeView center={position} zoom={DEFAULT_ZOOM} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {locations.map(location => (
        <Marker 
          key={location.id} 
          position={location.position}
          eventHandlers={{
            click: () => {
              onMarkerClick(location);
            },
          }}
        >
          <Popup>
            {location.name}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
