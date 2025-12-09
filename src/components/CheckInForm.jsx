/**
 * CheckInForm - 登錄表單組件
 * 用於登錄現有地點（簡化版表單，地點資訊已預填）
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import DynamicForm from './DynamicForm/DynamicForm';
import { validateDynamicFields } from '../utils/fieldValidation';
import { submitCheckIn } from '../services/checkIns';
import { checkRecentCheckInByUser } from '../utils/checkInDuplication';

const CheckInForm = ({ location, onSuccess, onCancel }) => {
  const { user, userProfile } = useAuth();
  const { getTypeById } = useLocationTypes();

  const locationType = getTypeById(location.typeId);

  // Form state
  const [description, setDescription] = useState('');
  const [dynamicFields, setDynamicFields] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  const [formErrors, setFormErrors] = useState({});

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentCheckInWarning, setRecentCheckInWarning] = useState(null);

  // 載入標籤
  useEffect(() => {
    const fetchTags = async () => {
      const querySnapshot = await getDocs(collection(db, 'tags'));
      setTags(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTags();
  }, []);

  // 檢查使用者是否在 7 天內已登錄過
  useEffect(() => {
    const checkRecentCheckIn = async () => {
      if (!user?.uid || !location?.id) return;

      try {
        const checkInsRef = collection(db, 'locations', location.id, 'check_ins');
        const q = query(
          checkInsRef,
          where('submitterInfo.uid', '==', user.uid),
          where('status', '==', 'approved'),
          orderBy('submittedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const checkIns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const result = checkRecentCheckInByUser(user.uid, checkIns, 7);

        if (result.hasRecentCheckIn) {
          setRecentCheckInWarning({
            daysAgo: result.daysAgo,
            lastCheckIn: result.lastCheckIn,
          });
        }
      } catch (err) {
        console.error('Failed to check recent check-in:', err);
      }
    };

    checkRecentCheckIn();
  }, [user?.uid, location?.id]);

  // 處理照片選擇
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (imageFiles.length + files.length > 10) {
      setError('最多只能上傳 10 張照片');
      return;
    }

    // 驗證檔案大小和類型
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('照片大小不能超過 5MB');
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setError('只能上傳圖片檔案');
        return false;
      }
      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);

    // 生成預覽
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setError('');
  };

  // 移除照片
  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));

    // 調整代表圖索引
    if (selectedCoverIndex === index) {
      setSelectedCoverIndex(0);
    } else if (selectedCoverIndex > index) {
      setSelectedCoverIndex(prev => prev - 1);
    }
  };

  // 表單驗證
  const validateForm = () => {
    const errors = {};

    // 至少要有一張照片或描述
    if (imageFiles.length === 0 && !description.trim()) {
      errors.content = '請至少上傳一張照片或填寫描述';
    }

    // 驗證動態欄位
    if (locationType?.fieldSchema) {
      const dynamicErrors = validateDynamicFields(dynamicFields, locationType.fieldSchema);
      if (Object.keys(dynamicErrors).length > 0) {
        errors.dynamicFields = dynamicErrors;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 檢查是否在 7 天內已登錄過
    if (recentCheckInWarning) {
      if (!confirm(`您在 ${recentCheckInWarning.daysAgo} 天前已經登錄過此地點，確定要再次登錄嗎？`)) {
        return;
      }
    }

    if (!validateForm()) {
      setError('請填寫所有必填欄位');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 上傳照片
      const photoURLs = [];
      for (const file of imageFiles) {
        const fileName = `pending_photos/${user.uid}_${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        photoURLs.push(url);
      }

      // 調整代表圖順序
      if (selectedCoverIndex > 0 && photoURLs.length > 0) {
        const coverPhoto = photoURLs[selectedCoverIndex];
        photoURLs.splice(selectedCoverIndex, 1);
        photoURLs.unshift(coverPhoto);
      }

      // 2. 建構登錄資料
      const checkInData = {
        description,
        photoURLs,
        tags: selectedTags,
        dynamicFields,
      };

      // 3. 提交到 pending_check_ins
      await submitCheckIn(location.id, checkInData, userProfile);

      // 4. 成功提示
      alert('登錄已提交，等待管理員審核！');

      // 5. 回調
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to submit check-in:', err);
      setError(err.message || '提交失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (!locationType) {
    return <div className="text-red-500">找不到地點類型</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 地點資訊（只讀） */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span className="text-2xl">{locationType.iconEmoji}</span>
          登錄地點：{location.name}
        </h2>
        <p className="text-sm text-gray-600">{location.address}</p>
        {location.checkInStats && (
          <p className="text-xs text-gray-500 mt-2">
            已有 {location.checkInStats.totalCheckIns} 次登錄，
            {location.checkInStats.uniqueSubmitters} 位登錄者
          </p>
        )}
      </div>

      {/* 7 天內重複登錄警告 */}
      {recentCheckInWarning && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ 您在 {recentCheckInWarning.daysAgo} 天前已經登錄過此地點
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            建議等待 7 天後再次登錄，避免被判定為重複
          </p>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 表單 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 照片上傳 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            照片 <span className="text-gray-500">(最多 10 張)</span>
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
            id="check-in-photos"
            disabled={loading}
          />

          <label
            htmlFor="check-in-photos"
            className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-gray-600">點擊選擇照片</span>
          </label>

          {/* 照片預覽 */}
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`預覽 ${index + 1}`}
                    className={`w-full h-32 object-cover rounded-lg ${
                      selectedCoverIndex === index ? 'ring-4 ring-blue-500' : ''
                    }`}
                  />

                  {/* 代表圖標記 */}
                  {selectedCoverIndex === index && (
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      代表圖
                    </div>
                  )}

                  {/* 操作按鈕 */}
                  <div className="absolute top-1 right-1 flex gap-1">
                    {selectedCoverIndex !== index && (
                      <button
                        type="button"
                        onClick={() => setSelectedCoverIndex(index)}
                        className="bg-white text-blue-600 text-xs px-2 py-1 rounded shadow"
                        disabled={loading}
                      >
                        設為代表圖
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="分享您對這個地點的觀察、體驗或建議..."
            disabled={loading}
          />
        </div>

        {/* 標籤選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            標籤 <span className="text-gray-500">(選填)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <label
                key={tag.id}
                className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedTags.includes(tag.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags(prev => [...prev, tag.id]);
                    } else {
                      setSelectedTags(prev => prev.filter(id => id !== tag.id));
                    }
                  }}
                  disabled={loading}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>

        {/* 動態欄位 */}
        {locationType.fieldSchema && locationType.fieldSchema.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">其他資訊</h3>
            <DynamicForm
              schema={locationType.fieldSchema}
              values={dynamicFields}
              onChange={setDynamicFields}
              errors={formErrors.dynamicFields || {}}
              disabled={loading}
            />
          </div>
        )}

        {/* 內容警告 */}
        {formErrors.content && (
          <p className="text-sm text-red-600">{formErrors.content}</p>
        )}

        {/* 操作按鈕 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            disabled={loading}
          >
            {loading ? '提交中...' : '提交登錄'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckInForm;
