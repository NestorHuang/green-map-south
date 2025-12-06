import React, { useState } from 'react';
import { useLocationTypes } from '../contexts/LocationTypesContext';

/**
 * 重複地點比對界面
 * 用於並排顯示疑似重複的地點，方便管理員比對和處理
 */
const DuplicateComparisonModal = ({
  duplicateGroup,
  onClose,
  onApprove,
  onReject,
  onApproveAndRejectOthers
}) => {
  const { getTypeById } = useLocationTypes();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [processing, setProcessing] = useState(false);

  if (!duplicateGroup) return null;

  // 收集所有地點（包括原始地點和重複地點）
  const allLocations = [
    duplicateGroup.original,
    ...duplicateGroup.duplicates.map(d => d.location)
  ];

  const handleApproveOne = async (location) => {
    if (!confirm(`確定要核准「${location.name}」並自動拒絕其他 ${allLocations.length - 1} 個重複地點嗎？`)) {
      return;
    }

    setProcessing(true);
    try {
      // 核准選中的，拒絕其他的
      const toReject = allLocations.filter(loc => loc.id !== location.id);
      await onApproveAndRejectOthers(location, toReject);
      onClose();
    } catch (err) {
      alert(`處理失敗：${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  重複地點比對
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  共 {allLocations.length} 個疑似重複的地點，請仔細比對後選擇要核准的版本
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={processing}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none disabled:opacity-50"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Content - 並排比對 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allLocations.map((location, index) => {
                const locationType = getTypeById(location.typeId);
                const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);
                const isDuplicate = index > 0;
                const duplicateInfo = isDuplicate
                  ? duplicateGroup.duplicates[index - 1]
                  : null;

                return (
                  <div
                    key={location.id}
                    className={`border-2 rounded-lg overflow-hidden transition-all ${
                      selectedLocation?.id === location.id
                        ? 'border-green-500 shadow-lg'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* 卡片 Header */}
                    <div className={`p-3 ${
                      index === 0 ? 'bg-blue-50' : 'bg-orange-50'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-600">
                          {index === 0 ? '原始地點' : `重複 #${index}`}
                        </span>
                        {duplicateInfo && (
                          <span className="text-xs font-medium text-orange-600">
                            相似度 {Math.round(duplicateInfo.similarity * 100)}%
                          </span>
                        )}
                      </div>

                      {/* 相似原因標籤 */}
                      {duplicateInfo && duplicateInfo.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {duplicateInfo.reasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 提交者資訊 */}
                      <div className="text-xs text-gray-600">
                        <div>提交者：{location.submitterInfo?.displayName || location.submitterInfo?.email || '未知'}</div>
                        <div className="text-gray-500">
                          {location.submittedAt?.toDate().toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                    </div>

                    {/* 照片 */}
                    <div className="relative h-48 bg-gray-100">
                      {photoURLs.length > 0 ? (
                        <img
                          src={photoURLs[0]}
                          alt={location.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-4xl">📷</span>
                        </div>
                      )}
                      {photoURLs.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                          +{photoURLs.length - 1} 張
                        </div>
                      )}
                    </div>

                    {/* 地點資訊 */}
                    <div className="p-4 space-y-3">
                      {/* 名稱 */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">名稱</div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <span className="text-xl">{locationType?.iconEmoji}</span>
                          {location.name}
                        </div>
                      </div>

                      {/* 地址 */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">地址</div>
                        <div className="text-sm text-gray-700">{location.address}</div>
                      </div>

                      {/* 描述 */}
                      {location.description && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">描述</div>
                          <div className="text-sm text-gray-700 line-clamp-3">
                            {location.description}
                          </div>
                        </div>
                      )}

                      {/* 標籤 */}
                      {location.tags && location.tags.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">標籤</div>
                          <div className="flex flex-wrap gap-1">
                            {location.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 操作按鈕 */}
                      <div className="pt-3 border-t space-y-2">
                        <button
                          onClick={() => handleApproveOne(location)}
                          disabled={processing}
                          className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium transition-colors"
                        >
                          {processing ? '處理中...' : '核准此版本'}
                        </button>
                        <button
                          onClick={() => onReject(location.id)}
                          disabled={processing}
                          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:bg-gray-100 text-sm font-medium transition-colors"
                        >
                          拒絕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <strong>提示：</strong>點擊「核准此版本」會自動拒絕其他重複的地點
              </div>
              <button
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 font-medium transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateComparisonModal;
