import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import { formatFieldValue } from '../utils/fieldFormatting.jsx';
import ImageSlider from './ImageSlider';

const DetailRow = ({ label, children }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-gray-200 last:border-0">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{children}</dd>
  </div>
);

const PendingLocationDetailModal = ({ location, onClose, onApprove, onReject }) => {
  const [tags, setTags] = useState([]);
  const { getTypeById, loading: typesLoading } = useLocationTypes();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tags'));
        const tagsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTags(tagsData);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, []);

  if (!location) {
    return null;
  }

  const locationType = typesLoading ? null : getTypeById(location.typeId);

  // Convert tag IDs to tag objects with names
  const locationTags = location.tags?.map(tagId => {
    const tag = tags.find(t => t.id === tagId);
    return tag || { id: tagId, name: tagId };
  }) || [];

  // 支援多圖和單圖格式
  const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);

  // 取得需要顯示的動態欄位
  const sortedFields = locationType?.fieldSchema?.sort((a, b) => a.order - b.order) || [];
  const fieldsToShow = sortedFields.filter(field => location.dynamicFields?.[field.fieldId] != null);

  const submitter = location.submitterInfo;
  const submitterDisplay = submitter?.isWildernessPartner && submitter?.groupName && submitter?.naturalName
    ? `${submitter.groupName}-${submitter.naturalName}`
    : (submitter?.displayName || '未知使用者');

  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            &times;
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                {locationType && <span className="mr-3 text-3xl">{locationType.iconEmoji}</span>}
                {location.name}
              </h2>
              <p className="text-gray-500 mt-1">{location.address}</p>
              {locationType && (
                <p className="text-sm text-gray-600 mt-2">
                  類型：{locationType.name}
                </p>
              )}
            </div>

            {/* Images */}
            {photoURLs.length > 0 && (
              <div className="mb-6 rounded-xl overflow-hidden">
                <ImageSlider images={photoURLs} alt={location.name} />
              </div>
            )}

            {/* Details */}
            <div className="border rounded-lg overflow-hidden">
              <dl className="divide-y divide-gray-200">
                {/* 基本描述 */}
                <DetailRow label="基本描述">
                  {location.description || '無'}
                </DetailRow>

                {/* Dynamic Fields */}
                {typesLoading && (
                  <div className="py-3 px-4 text-sm text-gray-500">
                    載入詳細資訊中...
                  </div>
                )}

                {!typesLoading && locationType && fieldsToShow.map(field => (
                  <DetailRow key={field.fieldId} label={field.label}>
                    {formatFieldValue(field, location.dynamicFields[field.fieldId])}
                  </DetailRow>
                ))}

                {/* Tags */}
                {locationTags?.length > 0 && (
                  <DetailRow label="標籤">
                    <div className="flex flex-wrap gap-2">
                      {locationTags.map(tag => (
                        <span
                          key={tag.id}
                          className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                )}
              </dl>
            </div>

            {/* Submitter Info */}
            {submitter && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">登錄者</p>
                <p className="text-sm font-medium text-gray-900">{submitterDisplay}</p>
                {submitter.email && (
                  <p className="text-xs text-gray-600 mt-1">{submitter.email}</p>
                )}
                {submitter.isWildernessPartner && (
                  <p className="text-xs text-green-600 mt-1">🌿 荒野夥伴</p>
                )}
              </div>
            )}

            {/* Submission Date */}
            {location.submittedAt && (
              <div className="mt-4 text-xs text-gray-500">
                提交時間：{new Date(location.submittedAt.seconds * 1000).toLocaleString('zh-TW')}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 pt-6 border-t flex gap-4">
              <button
                onClick={() => {
                  onApprove(location.id);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                核准
              </button>
              <button
                onClick={() => {
                  if (confirm('確定要拒絕此地點嗎？此操作無法復原。')) {
                    onReject(location.id);
                    onClose();
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                拒絕
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
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

export default PendingLocationDetailModal;
