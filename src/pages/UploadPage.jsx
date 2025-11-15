import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, GeoPoint, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig';

const UploadPage = () => {
  const [formState, setFormState] = useState({ name: '', address: '', description: '' });
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('您必須登入才能上傳。');
      return;
    }
    if (!formState.name || !formState.address || !imageFile) {
      setError('請填寫地點名稱、地址並上傳一張照片。');
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

      // 2. Upload image to Firebase Storage
      const imageRef = ref(storage, `pending_photos/${auth.currentUser.uid}_${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      const photoURL = await getDownloadURL(snapshot.ref);

      // 3. Add document to 'pending_locations' in Firestore
      await addDoc(collection(db, 'pending_locations'), {
        name: formState.name,
        address: formState.address,
        description: formState.description,
        tags: selectedTags,
        position: position,
        photoURL: photoURL,
        submittedBy: auth.currentUser.uid,
        submittedAt: Timestamp.now(),
        status: 'pending',
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
      <h1 className="text-3xl font-bold mb-6">上傳新的綠活地點</h1>
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
          <label htmlFor="photo" className="block text-sm font-medium text-gray-700">照片*</label>
          <input type="file" name="photo" id="photo" required accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" onChange={handleFileChange} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
            {loading ? '提交中...' : '提交審核'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPage;

