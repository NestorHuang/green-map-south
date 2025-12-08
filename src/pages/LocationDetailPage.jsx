/**
 * LocationDetailPage - 地點詳情頁
 * 路由：/location/:id
 * 公開頁面，任何人（包括未登入）可訪問
 * 顯示地點完整資訊、登錄記錄、統計資料、照片畫廊
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import { useCheckIns } from '../hooks/useCheckIns';
import CheckInForm from '../components/CheckInForm';
import { formatFieldValue } from '../utils/fieldFormatting.jsx';

const LocationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { getTypeById } = useLocationTypes();

  // State
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [tags, setTags] = useState([]);

  // Load tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsSnapshot = await getDocs(collection(db, 'tags'));
        const tagsData = tagsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTags(tagsData);
      } catch (err) {
        console.error('Failed to load tags:', err);
      }
    };

    fetchTags();
  }, []);

  // Load location data
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        const locationRef = doc(db, 'locations', id);
        const locationDoc = await getDoc(locationRef);

        if (!locationDoc.exists()) {
          setError('找不到此地點');
          return;
        }

        const data = locationDoc.data();

        // Only show approved locations
        if (data.status !== 'approved') {
          setError('此地點尚未審核通過');
          return;
        }

        setLocation({ id: locationDoc.id, ...data });
      } catch (err) {
        console.error('Failed to load location:', err);
        setError(err.message || '載入地點資料失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [id]);

  // Handle check-in button click
  const handleCheckIn = () => {
    if (!user) {
      alert('請先登入才能登錄地點');
      return;
    }

    setShowCheckInForm(true);
  };

  // Handle successful check-in
  const handleCheckInSuccess = () => {
    setShowCheckInForm(false);
    alert('登錄已提交，等待管理員審核！');
  };

  // Handle cancel check-in
  const handleCancelCheckIn = () => {
    setShowCheckInForm(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || '發生錯誤'}</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            返回上一頁
          </button>
        </div>
      </div>
    );
  }

  // If showing check-in form
  if (showCheckInForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <CheckInForm
            location={location}
            onSuccess={handleCheckInSuccess}
            onCancel={handleCancelCheckIn}
          />
        </div>
      </div>
    );
  }

  const locationType = getTypeById(location.typeId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="mr-2">←</span> 返回
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl">
                {locationType?.iconEmoji || '📍'}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{location.name}</h1>
              <p className="text-gray-600 mt-1">{location.address}</p>

              {/* Type badge */}
              {locationType && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {locationType.name}
                  </span>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleCheckIn}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                登錄此地點
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">地點介紹</h2>

              {/* Photos */}
              {location.photoURLs && location.photoURLs.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {location.photoURLs.slice(0, 6).map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`照片 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ))}
                  {location.photoURLs.length > 6 && (
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                      +{location.photoURLs.length - 6} 張
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {location.description && (
                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{location.description}</p>
                </div>
              )}

              {/* Submitter */}
              {location.submitterInfo && (
                <div className="flex items-center gap-2 text-sm text-gray-500 border-t pt-4">
                  <span>👤</span>
                  <span>{location.submitterInfo.displayName || '匿名使用者'}</span>
                  {location.submittedAt && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(location.submittedAt.seconds * 1000).toLocaleDateString('zh-TW')}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Location Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">地點資訊</h3>

              {/* Dynamic Fields */}
              {location.dynamicFields && Object.keys(location.dynamicFields).length > 0 && (
                <div className="space-y-3">
                  {(() => {
                    // 從 fieldSchema 獲取欄位定義並排序
                    const fieldSchema = locationType?.fieldSchema || [];
                    const sortedFields = fieldSchema
                      .filter(field => location.dynamicFields[field.fieldId] != null)
                      .sort((a, b) => a.order - b.order);

                    return sortedFields.map(field => (
                      <div key={field.fieldId}>
                        <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formatFieldValue(field, location.dynamicFields[field.fieldId])}
                        </dd>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Tags */}
              {location.tags && location.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">標籤</h4>
                  <div className="flex flex-wrap gap-2">
                    {location.tags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return (
                        <span
                          key={tagId}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {tag?.name || tagId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Map placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">位置</h3>
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">地圖功能開發中</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailPage;
