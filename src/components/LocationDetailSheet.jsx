import React, { useState, useEffect, memo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useCheckIns } from '../hooks/useCheckIns';
import ReportModal from './ReportModal';
import ImageSlider from './ImageSlider';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import { formatFieldValue } from '../utils/fieldFormatting.jsx';

const DetailRow = ({ label, children }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{children}</dd>
    </div>
);


const LocationDetailSheet = ({ location, locations = null, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { getTypeById, loading: typesLoading } = useLocationTypes();

  // If locations array is provided, use it for slider
  const hasMultipleLocations = locations && locations.length > 1;
  const currentLocation = hasMultipleLocations ? locations[currentIndex] : location;

  // Reset index when locations change
  useEffect(() => {
    setCurrentIndex(0);
  }, [locations]);

  // Navigation functions
  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : locations.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < locations.length - 1 ? prev + 1 : 0));
  };

  // Fetch tags
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
        if (isMounted) {
          console.error("Error fetching tags:", error);
        }
      }
    };

    fetchTags();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!currentLocation) {
    return null;
  }

  const locationType = typesLoading ? null : getTypeById(currentLocation.typeId);

  // Convert tag IDs to tag objects with names
  const locationTags = currentLocation.tags?.map(tagId => {
    const tag = tags.find(t => t.id === tagId);
    return tag || { id: tagId, name: tagId }; // Fallback to ID if tag not found
  }) || [];

  // 支援多圖和單圖格式
  const photoURLs = currentLocation.photoURLs || (currentLocation.photoURL ? [currentLocation.photoURL] : []);

  const sortedFields = locationType?.fieldSchema?.sort((a, b) => a.order - b.order) || [];
  const fieldsToShow = sortedFields.filter(field => field.displayInDetail && currentLocation.dynamicFields?.[field.fieldId] != null);

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:bottom-4 md:rounded-2xl h-auto max-h-[75vh] bg-white rounded-t-2xl shadow-2xl p-4 transition-transform duration-300 ease-in-out transform translate-y-0 overflow-y-auto"
        style={{ zIndex: 1000 }} // 確保在 Leaflet 地圖之上
      >
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold flex items-center">
                {locationType && <span className="mr-3 text-3xl">{locationType.iconEmoji}</span>}
                {currentLocation.name}
              </h2>
              <p className="text-gray-500 pl-10">{currentLocation.address}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 text-3xl leading-none">&times;</button>
          </div>

          {/* Multiple locations navigation */}
          {hasMultipleLocations && (
            <div className="mt-4 -mx-4 px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-y border-indigo-100">
              <div className="flex items-center justify-center gap-3 mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-base font-bold text-indigo-900">
                  此位置有 {locations.length} 筆資料
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handlePrevious}
                  className="flex-shrink-0 p-2.5 rounded-full bg-white hover:bg-indigo-100 shadow-md hover:shadow-lg transition-all duration-200 border border-indigo-200 group"
                  aria-label="Previous location"
                >
                  <svg className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex-1 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-indigo-200">
                    <span className="text-2xl font-bold text-indigo-600">{currentIndex + 1}</span>
                    <span className="text-gray-400 font-medium">/</span>
                    <span className="text-lg font-semibold text-gray-600">{locations.length}</span>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="flex-shrink-0 p-2.5 rounded-full bg-white hover:bg-indigo-100 shadow-md hover:shadow-lg transition-all duration-200 border border-indigo-200 group"
                  aria-label="Next location"
                >
                  <svg className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {locations.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-8 bg-indigo-600'
                        : 'w-2 bg-indigo-300 hover:bg-indigo-400'
                    }`}
                    aria-label={`Go to location ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {photoURLs.length > 0 && (
          <div className="mb-4 rounded-xl overflow-hidden"><ImageSlider images={photoURLs} alt={currentLocation.name} /></div>
        )}

        <div className="border-t">
          <dl className="divide-y divide-gray-200">
            <DetailRow label="基本描述">{currentLocation.description || '無'}</DetailRow>

            {/* Dynamic Fields Section */}
            {typesLoading && <p className="text-sm text-gray-500 py-3">載入詳細資訊中...</p>}

            {!typesLoading && locationType && fieldsToShow.map(field => (
                <DetailRow key={field.fieldId} label={field.label}>
                    {formatFieldValue(field, currentLocation.dynamicFields[field.fieldId])}
                </DetailRow>
            ))}

            {locationTags?.length > 0 && <DetailRow label="標籤"><div className="flex flex-wrap gap-2">{locationTags.map(tag => <span key={tag.id} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{tag.name}</span>)}</div></DetailRow>}
          </dl>
        </div>

        {currentLocation.submitterInfo && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-gray-600 mb-1">登錄者</p>
            <p className="text-sm font-medium text-gray-900">
              {(() => {
                const submitter = currentLocation.submitterInfo;
                return submitter.isWildernessPartner && submitter.groupName && submitter.naturalName
                  ? `${submitter.groupName}-${submitter.naturalName}`
                  : (submitter.displayName || '未知使用者');
              })()}
            </p>
            {currentLocation.submitterInfo.isWildernessPartner && (
              <p className="text-xs text-green-600 mt-1">🌿 荒野夥伴</p>
            )}
          </div>
        )}

        {/* 顯示最後修改資訊 */}
        {(currentLocation.updatedByInfo || (currentLocation.updatedAt && currentLocation.updatedBy && currentLocation.updatedBy !== currentLocation.submitterInfo?.uid)) && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-gray-600 mb-1">最後修改</p>
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-gray-900">
                {(() => {
                  if (currentLocation.updatedByInfo) {
                    const modifier = currentLocation.updatedByInfo;
                    return modifier.isWildernessPartner && modifier.groupName && modifier.naturalName
                      ? `${modifier.groupName}-${modifier.naturalName}`
                      : (modifier.displayName || '未知使用者');
                  }
                  return '其他使用者';
                })()}
              </p>
              {currentLocation.updatedByInfo?.isWildernessPartner && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">荒野夥伴</span>
              )}
            </div>
            {currentLocation.updatedAt && (
              <p className="text-xs text-gray-500 mt-1">
                {currentLocation.updatedAt.toDate().toLocaleString('zh-TW')}
              </p>
            )}
          </div>
        )}

        {user && (
          <div className="mt-6 border-t pt-4">
            <button onClick={() => setReportModalOpen(true)} className="text-sm text-red-500 hover:underline">回報此地點資訊有誤</button>
          </div>
        )}
      </div>

      {isReportModalOpen && (
        <ReportModal location={currentLocation} onClose={() => setReportModalOpen(false)} />
      )}
    </>
  );
};

export default memo(LocationDetailSheet);