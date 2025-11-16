import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, GeoPoint, Timestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';

const RegisterLocationPage = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [formState, setFormState] = useState({ name: '', address: '', description: '' });
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 檢查用戶是否需要設定個人資料
  useEffect(() => {
    if (!authLoading && user && !userProfile) {
      navigate('/profile');
    }
  }, [authLoading, user, userProfile, navigate]);

  useEffect(() => {
    const fetchTags = async () => {
      const querySnapshot = await getDocs(collection(db, 'tags'));
      setTags(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTags();
  }, []);

  const handleInputChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleTagChange = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      alert('最多只能上傳 10 張圖片');
      return;
    }
    setImageFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('您必須登入才能登錄地點。');
      return;
    }
    if (!userProfile) {
      setError('請先完成個人資料設定。');
      return;
    }
    if (!formState.name || !formState.address || imageFiles.length === 0) {
      setError('請填寫地點名稱、地址並至少上傳一張照片。');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Geocode address using Google Maps API
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API 金鑰未設定，請聯繫管理員。');
      }
      const geoResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formState.address)}&key=${apiKey}`);
      const geoData = await geoResponse.json();

      if (geoData.status !== 'OK') {
        if (geoData.status === 'ZERO_RESULTS') {
          throw new Error('無法找到該地址的座標，請檢查地址是否正確。');
        }
        throw new Error(`地理編碼失敗：${geoData.status} - ${geoData.error_message || ''}`);
      }

      const { lat, lng } = geoData.results[0].geometry.location;
      const position = new GeoPoint(lat, lng);

      // 2. Upload all images to Firebase Storage
      const photoURLs = [];
      for (const file of imageFiles) {
        const imageRef = ref(storage, `pending_photos/${auth.currentUser.uid}_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        const photoURL = await getDownloadURL(snapshot.ref);
        photoURLs.push(photoURL);
      }

      // 3. Add document to 'pending_locations' in Firestore
      await addDoc(collection(db, 'pending_locations'), {
        name: formState.name,
        address: formState.address,
        description: formState.description,
        tags: selectedTags,
        position: position,
        photoURLs: photoURLs,
        photoURL: photoURLs[0], // 第一張作為主圖（向下兼容）
        submittedBy: auth.currentUser.uid,
        submittedAt: Timestamp.now(),
        status: 'pending',
        // 登錄者資訊
        submitterInfo: {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: userProfile.displayName,
          isWildernessPartner: userProfile.isWildernessPartner || false,
          groupName: userProfile.groupName || '',
          naturalName: userProfile.naturalName || ''
        }
      });

      // 4. Success and redirect
      alert('地點已成功提交審核！');
      navigate('/');

    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">登錄新的綠活地點</h1>

      {/* 登錄者資訊顯示 */}
      {userProfile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">登錄者資訊</h3>
          <p className="text-sm text-gray-700">
            {userProfile.isWildernessPartner && userProfile.groupName && userProfile.naturalName
              ? `${userProfile.groupName} - ${userProfile.naturalName}`
              : userProfile.displayName}
          </p>
          {userProfile.isWildernessPartner && (
            <p className="text-xs text-green-600 mt-1">🌿 荒野夥伴</p>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">地點名稱*</label>
          <input type="text" name="name" id="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">地址*</label>
          <input type="text" name="address" id="address" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">描述</label>
          <textarea name="description" id="description" rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" onChange={handleInputChange}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">綠活標籤</label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tags.map(tag => (
              <label key={tag.id} className="flex items-center space-x-2">
                <input type="checkbox" value={tag.id} onChange={() => handleTagChange(tag.id)} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500" />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
            照片* <span className="text-xs text-gray-500">(最多 10 張)</span>
          </label>
          <input
            type="file"
            name="photo"
            id="photo"
            required
            accept="image/*"
            multiple
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
            onChange={handleFileChange}
          />
          {imageFiles.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">已選擇 {imageFiles.length} 張圖片</p>
          )}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400">
            {loading ? '登錄中...' : '提交登錄'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterLocationPage;

