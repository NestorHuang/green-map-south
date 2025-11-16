import React, { useState, memo } from 'react';
import { useAuth } from '../hooks/useAuth';
import ReportModal from './ReportModal';
import ImageSlider from './ImageSlider';

const LocationDetailSheet = ({ location, onClose }) => {
  const { user } = useAuth();
  const [isReportModalOpen, setReportModalOpen] = useState(false);

  if (!location) {
    return null;
  }

  // 支援多圖和單圖格式
  const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);

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

        {/* 使用圖片輪播元件顯示圖片 */}
        {photoURLs.length > 0 && (
          <div className="mb-4">
            <ImageSlider images={photoURLs} alt={location.name} />
          </div>
        )}

        <div>
          <p className="mt-2 text-gray-700">{location.description}</p>
        </div>

        {/* 登錄者資訊 */}
        {location.submitterInfo && (
          <div className="my-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-gray-600 mb-1">登錄者</p>
            <p className="text-sm font-medium text-gray-900">
              {location.submitterInfo.isWildernessPartner &&
               location.submitterInfo.groupName &&
               location.submitterInfo.naturalName
                ? `${location.submitterInfo.groupName}-${location.submitterInfo.naturalName}`
                : (location.submitterInfo.displayName || '未知使用者')}
            </p>
            {location.submitterInfo.isWildernessPartner && (
              <p className="text-xs text-green-600 mt-1">🌿 荒野夥伴</p>
            )}
          </div>
        )}

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

