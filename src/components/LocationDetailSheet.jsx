import React, { useState, useEffect, memo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
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


const LocationDetailSheet = ({ location, onClose }) => {
  const { user } = useAuth();
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const { getTypeById, loading: typesLoading } = useLocationTypes();

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

  if (!location) {
    return null;
  }

  const locationType = typesLoading ? null : getTypeById(location.typeId);

  // Convert tag IDs to tag objects with names
  const locationTags = location.tags?.map(tagId => {
    const tag = tags.find(t => t.id === tagId);
    return tag || { id: tagId, name: tagId }; // Fallback to ID if tag not found
  }) || [];

  // 支援多圖和單圖格式
  const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);
  
  const sortedFields = locationType?.fieldSchema?.sort((a, b) => a.order - b.order) || [];
  const fieldsToShow = sortedFields.filter(field => field.displayInDetail && location.dynamicFields?.[field.fieldId] != null);

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:bottom-4 md:rounded-2xl h-auto max-h-[75vh] bg-white rounded-t-2xl shadow-2xl p-4 transition-transform duration-300 ease-in-out transform translate-y-0 overflow-y-auto"
        style={{ zIndex: 1000 }} // 確保在 Leaflet 地圖之上
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              {locationType && <span className="mr-3 text-3xl">{locationType.iconEmoji}</span>}
              {location.name}
            </h2>
            <p className="text-gray-500 pl-10">{location.address}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 text-3xl leading-none">&times;</button>
        </div>

        {photoURLs.length > 0 && (
          <div className="mb-4 rounded-xl overflow-hidden"><ImageSlider images={photoURLs} alt={location.name} /></div>
        )}

        <div className="border-t">
          <dl className="divide-y divide-gray-200">
            <DetailRow label="基本描述">{location.description || '無'}</DetailRow>
            
            {/* Dynamic Fields Section */}
            {typesLoading && <p className="text-sm text-gray-500 py-3">載入詳細資訊中...</p>}

            {!typesLoading && locationType && fieldsToShow.map(field => (
                <DetailRow key={field.fieldId} label={field.label}>
                    {formatFieldValue(field, location.dynamicFields[field.fieldId])}
                </DetailRow>
            ))}
            
            {locationTags?.length > 0 && <DetailRow label="標籤"><div className="flex flex-wrap gap-2">{locationTags.map(tag => <span key={tag.id} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{tag.name}</span>)}</div></DetailRow>}
          </dl>
        </div>

        {location.submitterInfo && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-gray-600 mb-1">登錄者</p>
            <p className="text-sm font-medium text-gray-900">
              {location.submitterInfo.isWildernessPartner && location.submitterInfo.groupName && location.submitterInfo.naturalName
                ? `${location.submitterInfo.groupName}-${location.submitterInfo.naturalName}`
                : (location.submitterInfo.displayName || '未知使用者')}
            </p>
            {location.submitterInfo.isWildernessPartner && <p className="text-xs text-green-600 mt-1">🌿 荒野夥伴</p>}
          </div>
        )}

        {user && (
          <div className="mt-6 border-t pt-4">
            <button onClick={() => setReportModalOpen(true)} className="text-sm text-red-500 hover:underline">回報此地點資訊有誤</button>
          </div>
        )}
      </div>

      {isReportModalOpen && (
        <ReportModal location={location} onClose={() => setReportModalOpen(false)} />
      )}
    </>
  );
};

export default memo(LocationDetailSheet);
