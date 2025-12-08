/**
 * SimilarLocationsModal - 相似地點提示彈窗
 * 當使用者填寫新地點時，如果檢測到相似地點，提示使用者選擇登錄或新增
 */

import React, { useState } from 'react';
import { useLocationTypes } from '../contexts/LocationTypesContext';

const SimilarLocationsModal = ({ similarLocations, onCheckIn, onContinueAsNew, onClose }) => {
  const { getTypeById } = useLocationTypes();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showingDetails, setShowingDetails] = useState(false);

  if (!similarLocations || similarLocations.length === 0) return null;

  const handleCheckInClick = (location) => {
    if (onCheckIn) {
      onCheckIn(location);
    }
  };

  const handleViewDetails = (location) => {
    setSelectedLocation(location);
    setShowingDetails(true);
  };

  // 格式化距離
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📍</span>
                發現相似地點
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                附近可能已有此地點，您可以選擇登錄現有地點或繼續提交為新地點
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showingDetails && selectedLocation ? (
            // 詳情視圖
            <div>
              <button
                onClick={() => setShowingDetails(false)}
                className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                ← 返回列表
              </button>

              <LocationDetailsView
                location={selectedLocation}
                onCheckIn={() => handleCheckInClick(selectedLocation)}
              />
            </div>
          ) : (
            // 列表視圖
            <div className="space-y-4">
              {similarLocations.map((item, index) => {
                const { location, similarity, distance, reasons } = item;
                const locationType = getTypeById(location.typeId);
                const photoURL = location.firstCheckIn?.photoURL || location.photoURL;
                const totalCheckIns = location.checkInStats?.totalCheckIns || 1;
                const uniqueSubmitters = location.checkInStats?.uniqueSubmitters || 1;

                return (
                  <div
                    key={location.id}
                    className="border-2 border-orange-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* 照片 */}
                        <div className="flex-shrink-0">
                          {photoURL ? (
                            <img
                              src={photoURL}
                              alt={location.name}
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-4xl">{locationType?.iconEmoji || '📍'}</span>
                            </div>
                          )}
                        </div>

                        {/* 資訊 */}
                        <div className="flex-1 min-w-0">
                          {/* 標題 */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-xl">{locationType?.iconEmoji}</span>
                                {location.name}
                              </h3>
                              <p className="text-sm text-gray-600">{location.address}</p>
                            </div>

                            {/* 相似度標記 */}
                            <div className="flex-shrink-0 ml-4">
                              <div className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-bold rounded-full">
                                相似度 {Math.round(similarity * 100)}%
                              </div>
                            </div>
                          </div>

                          {/* 統計資訊 */}
                          <div className="flex flex-wrap gap-3 mb-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span>📊</span>
                              <span>{totalCheckIns} 次登錄</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span>👥</span>
                              <span>{uniqueSubmitters} 位登錄者</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span>📏</span>
                              <span>距離 {formatDistance(distance)}</span>
                            </div>
                          </div>

                          {/* 相似原因 */}
                          {reasons && reasons.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {reasons.map((reason, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 操作按鈕 */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetails(location)}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                            >
                              查看詳情
                            </button>
                            <button
                              onClick={() => handleCheckInClick(location)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                            >
                              登錄此地點
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <strong>提示：</strong>
              如果您確定這是一個新地點，請點擊右側按鈕繼續提交
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                關閉
              </button>
              <button
                onClick={onContinueAsNew}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
              >
                繼續提交為新地點
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 地點詳情視圖（在 Modal 內顯示）
 */
const LocationDetailsView = ({ location, onCheckIn }) => {
  const { getTypeById } = useLocationTypes();
  const locationType = getTypeById(location.typeId);

  const firstCheckIn = location.firstCheckIn || {
    description: location.description,
    photoURLs: location.photoURLs || [],
    photoURL: location.photoURL,
  };

  return (
    <div className="space-y-6">
      {/* 地點基本資訊 */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <span className="text-3xl">{locationType?.iconEmoji}</span>
          {location.name}
        </h3>
        <p className="text-gray-600">{location.address}</p>
      </div>

      {/* 統計 */}
      {location.checkInStats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">總登錄次數</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">
              {location.checkInStats.totalCheckIns}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">登錄者</div>
            <div className="text-2xl font-bold text-green-900 mt-1">
              {location.checkInStats.uniqueSubmitters}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">最近登錄</div>
            <div className="text-sm font-bold text-purple-900 mt-1">
              {location.checkInStats.lastCheckInAt
                ? new Date(location.checkInStats.lastCheckInAt.seconds * 1000).toLocaleDateString('zh-TW')
                : '未知'}
            </div>
          </div>
        </div>
      )}

      {/* 首次登錄資訊 */}
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-3">首次登錄</h4>

        {/* 照片 */}
        {firstCheckIn.photoURLs && firstCheckIn.photoURLs.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {firstCheckIn.photoURLs.slice(0, 6).map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`照片 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
            {firstCheckIn.photoURLs.length > 6 && (
              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                +{firstCheckIn.photoURLs.length - 6} 張
              </div>
            )}
          </div>
        )}

        {/* 描述 */}
        {firstCheckIn.description && (
          <div>
            <p className="text-gray-700">{firstCheckIn.description}</p>
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="pt-4 border-t">
        <button
          onClick={onCheckIn}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg transition-colors"
        >
          登錄此地點
        </button>
      </div>
    </div>
  );
};

export default SimilarLocationsModal;
