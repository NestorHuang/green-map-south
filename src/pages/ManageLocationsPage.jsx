import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, GeoPoint, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import LocationFormContent from '../components/LocationFormContent';
import TypeSelector from '../components/TypeSelector';

const ManageLocationsPage = () => {
  const { types: allLocationTypes, loading: typesLoading, getTypeById } = useLocationTypes();
  const [locations, setLocations] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocationFormContentOpen, setIsLocationFormContentOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedTypeForForm, setSelectedTypeForForm] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      auth.currentUser.getIdTokenResult().then(idTokenResult => {
        console.log("Current User Role:", idTokenResult.claims.role);
        console.log("Full Claims:", idTokenResult.claims);
      });
    }

    fetchLocations();
    fetchTags();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      console.log("Fetching locations...");
      const querySnapshot = await getDocs(collection(db, 'locations'));
      console.log("Locations fetched, count:", querySnapshot.size);
      const locationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(locationsData);
    } catch (err) {
      setError(`無法載入地點列表: ${err.message}`);
      console.error("Detailed Fetch Error:", err);
      if (err.code === 'permission-denied') {
        console.error("Permission denied. Check Firestore rules and user claims.");
      }
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

  const handleOpenModal = (location = null) => {
    if (location) {
      setEditingLocation(location);
      const type = getTypeById(location.typeId);
      if (!type) {
        setError('Error: Location type not found for editing.');
        return;
      }
      setSelectedTypeForForm(type);
      setIsLocationFormContentOpen(true);
    } else {
      setEditingLocation(null);
      setSelectedTypeForForm(null);
      setIsLocationFormContentOpen(false);
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsLocationFormContentOpen(false);
    setEditingLocation(null);
    setSelectedTypeForForm(null);
    setError('');
  };

  const handleSelectType = (type) => {
    setSelectedTypeForForm(type);
    setIsLocationFormContentOpen(true);
  };

  const handleSaveLocationInAdmin = async (locationData, isEditing) => {
    setLoading(true);
    try {
      const finalLocationData = {
        ...locationData,
        createdBy: auth.currentUser?.uid || 'admin',
        updatedBy: auth.currentUser?.uid || 'admin',
        status: 'approved',
      };

      if (isEditing && editingLocation?.id) {
        await updateDoc(doc(db, 'locations', editingLocation.id), {
          ...finalLocationData,
          updatedAt: Timestamp.now(),
        });
        alert('地點已成功更新！');
      } else {
        await addDoc(collection(db, 'locations'), {
          ...finalLocationData,
          createdAt: Timestamp.now(),
        });
        alert('地點已成功新增！');
      }
      handleCloseModal();
      await fetchLocations();
    } catch (err) {
      setError(`儲存地點失敗: ${err.message}`);
      console.error("Error saving location in admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (location) => {
    if (!confirm(`確定要刪除地點「${location.name}」嗎？\n此操作無法復原。`)) {
      return;
    }

    try {
      const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);

      for (const photoURL of photoURLs) {
        try {
          const photoPath = decodeURIComponent(photoURL.split('/o/')[1].split('?')[0]);
          const photoRef = ref(storage, photoPath);
          await deleteObject(photoRef);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }

      await deleteDoc(doc(db, 'locations', location.id));

      alert('地點已成功刪除');
      await fetchLocations();
    } catch (err) {
      setError(`刪除失敗：${err.message}`);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8">載入中...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">地點管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          新增地點
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 地點列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  圖片
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  標籤
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    目前沒有地點
                  </td>
                </tr>
              ) : (
                locations.map(location => {
                  const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);
                  return (
                    <tr key={location.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-20 h-20 rounded overflow-hidden">
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
                          {photoURLs.length > 1 && (
                            <span className="text-xs text-gray-500">+{photoURLs.length - 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{location.address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {location.tags?.map(tagId => {
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleOpenModal(location)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(location)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增/編輯地點 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {!isLocationFormContentOpen ? (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">選擇地點類型</h2>
                <TypeSelector onSelectType={handleSelectType} />
                <div className="flex justify-end mt-4">
                  <button 
                    type="button" 
                    onClick={handleCloseModal} 
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              selectedTypeForForm && (
                <LocationFormContent
                  selectedType={selectedTypeForForm}
                  initialData={editingLocation}
                  onSave={handleSaveLocationInAdmin}
                  onCancel={() => {
                    if (!editingLocation) {
                      setIsLocationFormContentOpen(false);
                      setSelectedTypeForForm(null);
                    } else {
                      handleCloseModal();
                    }
                  }}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLocationsPage;