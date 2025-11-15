import React, { useState, memo } from 'react';
import { useAuth } from '../hooks/useAuth';
import ReportModal from './ReportModal';

const LocationDetailSheet = ({ location, onClose }) => {
  const { user } = useAuth();
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  if (!location) {
    return null;
  }

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:bottom-4 md:rounded-2xl h-auto max-h-[75vh] bg-white rounded-t-2xl shadow-2xl p-4 transition-transform duration-300 ease-in-out transform translate-y-0 overflow-y-auto"
        style={{ zIndex: 1000 }} // 確保在 Leaflet 地圖之上
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{location.name}</h2>
            <p className="text-gray-500">{location.address}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 text-3xl leading-none">&times;</button>
        </div>
        
        {location.photoURL && (
          <img src={location.photoURL} alt={location.name} className="w-full h-48 object-cover rounded-lg mb-4" />
        )}

        <div>
          <p className="mt-2 text-gray-700">{location.description}</p>
        </div>

        {user && (
          <div className="mt-6 border-t pt-4">
            <button 
              onClick={() => setReportModalOpen(true)}
              className="text-sm text-red-500 hover:underline"
            >
              回報此地點資訊有誤
            </button>
          </div>
        )}
      </div>

      {isReportModalOpen && (
        <ReportModal 
          location={location}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </>
  );
};

export default memo(LocationDetailSheet);

