import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, GeoPoint, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig';
import ImageSlider from '../components/ImageSlider';

const ManageLocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    selectedTags: []
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchTags();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'locations'));
      const locationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(locationsData);
    } catch (err) {
      setError('無法載入地點列表');
      console.error(err);
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
      // 編輯模式
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        description: location.description || '',
        selectedTags: location.tags || []
      });
      // 處理現有圖片 - 支援舊的單圖和新的多圖格式
      if (location.photoURLs && Array.isArray(location.photoURLs)) {
        setExistingImages(location.photoURLs);
      } else if (location.photoURL) {
        setExistingImages([location.photoURL]);
      } else {
        setExistingImages([]);
      }
    } else {
      // 新增模式
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        description: '',
        selectedTags: []
      });
      setExistingImages([]);
    }
    setImageFiles([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      description: '',
      selectedTags: []
    });
    setImageFiles([]);
    setExistingImages([]);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTagChange = (tagId) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingImages.length > 10) {
      alert('最多只能上傳 10 張圖片');
      return;
    }
    setImageFiles(files);
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      setError('請填寫地點名稱和地址');
      return;
    }

    if (existingImages.length === 0 && imageFiles.length === 0) {
      setError('請至少上傳一張圖片');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 地理編碼
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.address)}&key=${apiKey}`
      );
      const geoData = await geoResponse.json();

      if (geoData.status !== 'OK') {
        throw new Error('無法找到該地址的座標，請檢查地址是否正確');
      }

      const { lat, lng } = geoData.results[0].geometry.location;
      const position = new GeoPoint(lat, lng);

      // 上傳新圖片
      const uploadedURLs = [];
      for (const file of imageFiles) {
        const imageRef = ref(storage, `location_photos/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        const photoURL = await getDownloadURL(snapshot.ref);
        uploadedURLs.push(photoURL);
      }

      // 合併現有圖片和新上傳的圖片
      const allPhotoURLs = [...existingImages, ...uploadedURLs];

      const locationData = {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        tags: formData.selectedTags,
        position: position,
        photoURLs: allPhotoURLs,
        // 保留第一張作為主圖（向下兼容）
        photoURL: allPhotoURLs[0]
      };

      if (editingLocation) {
        // 更新現有地點
        await updateDoc(doc(db, 'locations', editingLocation.id), {
          ...locationData,
          updatedAt: Timestamp.now()
        });
        alert('地點已成功更新');
      } else {
        // 新增地點
        await addDoc(collection(db, 'locations'), {
          ...locationData,
          createdBy: auth.currentUser?.uid || 'admin',
          createdAt: Timestamp.now(),
          status: 'approved'
        });
        alert('地點已成功新增');
      }

      handleCloseModal();
      await fetchLocations();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (location) => {
    if (!confirm(`確定要刪除地點「${location.name}」嗎？\n此操作無法復原。`)) {
      return;
    }

    try {
      // 刪除所有圖片
      const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);

      for (const photoURL of photoURLs) {
        try {
          // 從 URL 解析出 Storage 路徑
          const photoPath = decodeURIComponent(photoURL.split('/o/')[1].split('?')[0]);
          const photoRef = ref(storage, photoPath);
          await deleteObject(photoRef);
        } catch (err) {
          console.error('Error deleting image:', err);
          // 繼續刪除其他圖片，不中斷流程
        }
      }

      // 刪除 Firestore 文件
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingLocation ? '編輯地點' : '新增地點'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 名稱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    地點名稱 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* 地址 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    地址 *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 標籤 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    標籤
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <label
                        key={tag.id}
                        className="inline-flex items-center cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedTags.includes(tag.id)}
                          onChange={() => handleTagChange(tag.id)}
                          className="mr-2"
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 現有圖片 */}
                {existingImages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      現有圖片
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {existingImages.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`圖片 ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 上傳新圖片 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {existingImages.length > 0 ? '新增圖片' : '圖片 *'}
                    <span className="text-xs text-gray-500 ml-2">
                      (最多 10 張，目前已有 {existingImages.length} 張)
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {imageFiles.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      已選擇 {imageFiles.length} 張新圖片
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* 按鈕 */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={submitting}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                    disabled={submitting}
                  >
                    {submitting ? '處理中...' : editingLocation ? '更新' : '新增'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLocationsPage;
