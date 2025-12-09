import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import LocationFormContent from './LocationFormContent';
import { logAuditAction, AuditAction } from '../utils/auditLog';

const MyLocationsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { getTypeById } = useLocationTypes();
  const [myLocations, setMyLocations] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState('list'); // 'list' or 'edit'
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedTypeForForm, setSelectedTypeForForm] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchMyLocations();
      fetchTags();
    }
  }, [isOpen, user]);

  const fetchMyLocations = async () => {
    setLoading(true);
    try {
      // 同時查詢已核准和待審核的地點
      const approvedQuery = query(
        collection(db, 'locations'),
        where('submitterInfo.uid', '==', user.uid)
      );

      const pendingQuery = query(
        collection(db, 'pending_locations'),
        where('submitterInfo.uid', '==', user.uid)
      );

      const [approvedSnapshot, pendingSnapshot] = await Promise.all([
        getDocs(approvedQuery),
        getDocs(pendingQuery)
      ]);

      // 處理已核准的地點
      const approvedLocations = approvedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'approved',
        collectionType: 'locations' // 標記來自哪個集合
      }));

      // 處理待審核的地點
      const pendingLocations = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'pending',
        collectionType: 'pending_locations' // 標記來自哪個集合
      }));

      // 合併並按提交時間排序（最新的在前）
      const allLocations = [...approvedLocations, ...pendingLocations].sort((a, b) => {
        const timeA = a.submittedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const timeB = b.submittedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setMyLocations(allLocations);
    } catch (err) {
      setError(`無法載入您的地點: ${err.message}`);
      console.error("Error fetching my locations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'tags'));
      const tagsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTags(tagsData);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleEditClick = (location) => {
    if (location.status === 'pending') {
      alert('待審核的地點暫時無法編輯，請等待管理員核准後再進行編輯');
      return;
    }

    if (location.locked) {
      alert('此地點已被管理員鎖定，無法編輯');
      return;
    }

    setEditingLocation(location);
    const type = getTypeById(location.typeId);
    if (!type) {
      setError('錯誤：找不到地點類型');
      return;
    }
    setSelectedTypeForForm(type);
    setStep('edit');
    setError('');
  };

  const handleSaveLocation = async (locationData) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'locations', editingLocation.id), {
        ...locationData,
        updatedBy: user.uid,
        updatedAt: Timestamp.now(),
      });

      // Log the action
      await logAuditAction(AuditAction.UPDATE_LOCATION, {
        targetId: editingLocation.id,
        targetName: locationData.name,
        targetType: 'location',
      });

      alert('地點已成功更新！');
      handleBack();
      await fetchMyLocations();
    } catch (err) {
      setError(`更新地點失敗: ${err.message}`);
      console.error("Error updating location:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('list');
    setEditingLocation(null);
    setSelectedTypeForForm(null);
    setError('');
    onClose();
  };

  const handleBack = () => {
    setStep('list');
    setEditingLocation(null);
    setSelectedTypeForForm(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            &times;
          </button>

          {/* Content */}
          <div className="p-6">
            {loading && step === 'list' ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : step === 'list' ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-extrabold text-gray-900">我的地點</h2>
                  <p className="mt-2 text-lg text-gray-600">管理您登錄的所有地點</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                {myLocations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">尚未登錄任何地點</h3>
                    <p className="text-gray-600 mb-6">開始分享您發現的綠活地點吧！</p>
                    <button
                      onClick={handleClose}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      關閉
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myLocations.map(location => {
                      const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);
                      const isLocked = location.locked || false;
                      const locationType = getTypeById(location.typeId);

                      return (
                        <div
                          key={location.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex gap-4">
                            {/* 圖片 */}
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 rounded overflow-hidden">
                                {photoURLs.length > 0 ? (
                                  <img
                                    src={photoURLs[0]}
                                    alt={location.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">無圖</span>
                                  </div>
                                )}
                              </div>
                              {photoURLs.length > 1 && (
                                <span className="text-xs text-gray-500">+{photoURLs.length - 1} 張</span>
                              )}
                            </div>

                            {/* 內容 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                                    {locationType?.iconEmoji} {location.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">{location.address}</p>

                                  {/* 標籤 */}
                                  {location.tags && location.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {location.tags.map(tagId => {
                                        const tag = tags.find(t => t.id === tagId);
                                        return tag ? (
                                          <span
                                            key={tagId}
                                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                          >
                                            {tag.name}
                                          </span>
                                        ) : null;
                                      })}
                                    </div>
                                  )}

                                  {/* 狀態 */}
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {location.status === 'pending' ? (
                                      <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded font-medium">
                                        ⏳ 待審核
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded font-medium">
                                        ✓ 已核准
                                      </span>
                                    )}
                                    {isLocked && (
                                      <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                        🔒 已鎖定
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 操作按鈕 */}
                                <div className="ml-4">
                                  <button
                                    onClick={() => handleEditClick(location)}
                                    disabled={isLocked || location.status === 'pending'}
                                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                                      isLocked || location.status === 'pending'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                  >
                                    編輯
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
              </>
            ) : step === 'edit' && selectedTypeForForm ? (
              <>
                <div className="mb-4">
                  <button
                    onClick={handleBack}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    返回列表
                  </button>
                </div>
                <LocationFormContent
                  selectedType={selectedTypeForForm}
                  initialData={editingLocation}
                  onSave={handleSaveLocation}
                  onCancel={handleBack}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLocationsModal;
