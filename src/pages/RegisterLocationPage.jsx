import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, GeoPoint, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import DynamicForm from '../components/DynamicForm/DynamicForm';
import { validateDynamicFields } from '../utils/fieldValidation';

// Step 1: Type Selection Component
const TypeSelector = ({ onSelectType, activeTypes, loading }) => {
  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">步驟 1: 選擇地點類型</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {activeTypes.map(type => (
          <button
            key={type.id}
            onClick={() => onSelectType(type)}
            className="group relative flex flex-col items-center p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200"
          >
            <div className="h-20 w-20 flex items-center justify-center bg-gray-50 rounded-full mb-4 group-hover:bg-green-50 transition-colors">
              <span className="text-5xl">{type.iconEmoji}</span>
            </div>
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-700">{type.name}</h3>
            <p className="text-sm text-gray-500 mt-2 text-center line-clamp-2">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const RegisterLocationPage = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { activeTypes, loading: typesLoading } = useLocationTypes();
  const navigate = useNavigate();

  // Page state
  const [step, setStep] = useState('selectType'); // 'selectType' or 'fillForm'
  const [selectedType, setSelectedType] = useState(null);
  
  // Form state
  const [commonFields, setCommonFields] = useState({ name: '', address: '', description: '' });
  const [dynamicFields, setDynamicFields] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  
  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSelectType = (type) => {
    setSelectedType(type);
    setDynamicFields({}); // Reset dynamic fields when type changes
    setFormErrors({});
    setStep('fillForm');
    window.scrollTo(0, 0);
  };

  const handleCommonInputChange = (e) => {
    setCommonFields({ ...commonFields, [e.target.name]: e.target.value });
  };
  
  const handleDynamicInputChange = (updatedValues) => {
    setDynamicFields(updatedValues);
  };

  const handleTagChange = (tagId) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
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
    setError('');
    setFormErrors({});

    // Basic validation
    if (!commonFields.name || !commonFields.address || imageFiles.length === 0) {
      setError('請填寫地點名稱、地址並至少上傳一張照片。');
      window.scrollTo(0, 0);
      return;
    }
    
    // Dynamic fields validation
    const dynamicErrors = validateDynamicFields(selectedType.fieldSchema, dynamicFields);
    if (Object.keys(dynamicErrors).length > 0) {
        setFormErrors(dynamicErrors);
        setError('請修正表單中的錯誤。');
        window.scrollTo(0, 0);
        return;
    }

    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) throw new Error('Google Maps API 金鑰未設定，請聯繫管理員。');
      
      const geoResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(commonFields.address)}&key=${apiKey}`);
      const geoData = await geoResponse.json();
      if (geoData.status !== 'OK') throw new Error(`地理編碼失敗：${geoData.status} - ${geoData.error_message || '請檢查地址'}`);
      const { lat, lng } = geoData.results[0].geometry.location;

      const photoURLs = await Promise.all(
        imageFiles.map(async (file) => {
          const imageRef = ref(storage, `pending_photos/${user.uid}_${Date.now()}_${file.name}`);
          await uploadBytes(imageRef, file);
          return getDownloadURL(imageRef);
        })
      );

      await addDoc(collection(db, 'pending_locations'), {
        ...commonFields,
        tags: selectedTags,
        position: new GeoPoint(lat, lng),
        photoURLs: photoURLs,
        photoURL: photoURLs[0],
        submittedBy: user.uid,
        submittedAt: Timestamp.now(),
        status: 'pending',
        submitterInfo: {
          uid: user.uid,
          email: user.email,
          displayName: userProfile.displayName,
          isWildernessPartner: userProfile.isWildernessPartner || false,
          groupName: userProfile.groupName || '',
          naturalName: userProfile.naturalName || ''
        },
        // Dynamic Type System Fields
        typeId: selectedType.id,
        dynamicFields: dynamicFields,
      });

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {step === 'selectType' ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-gray-900">登錄新的綠活地點</h1>
              <p className="mt-2 text-lg text-gray-600">選擇最適合的地點類型，開始分享您的發現</p>
            </div>
            <TypeSelector onSelectType={handleSelectType} activeTypes={activeTypes} loading={typesLoading} />
          </>
        ) : (
          selectedType && (
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
              {/* Header Section */}
              <div className="bg-indigo-600 px-6 py-8 sm:p-10 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <button 
                    onClick={() => setStep('selectType')} 
                    className="mb-4 flex items-center text-indigo-100 hover:text-white transition-colors text-sm font-medium"
                  >
                    <span className="mr-1">←</span> 返回選擇類型
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-white/30">
                      {selectedType.iconEmoji}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">您正在登錄: {selectedType.name}</h2>
                      <p className="text-indigo-100 mt-1 max-w-xl">{selectedType.description}</p>
                    </div>
                  </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-indigo-500/50 rounded-full blur-2xl"></div>
              </div>

              {/* Form Section */}
              <div className="p-6 sm:p-10">
                <form onSubmit={handleSubmit} className="space-y-10">
                  
                  {/* Step 2: Basic Info */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-2 mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <span className="bg-indigo-100 text-indigo-600 h-8 w-8 rounded-full flex items-center justify-center text-sm mr-3 font-bold">1</span>
                        基本資訊
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4">
                      <div className="col-span-1">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">地點名稱 <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          name="name" 
                          id="name" 
                          required 
                          value={commonFields.name} 
                          onChange={handleCommonInputChange} 
                          autoComplete="name"
                          placeholder="例如：綠色生活咖啡館"
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                        />
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">地址 <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          name="address" 
                          id="address" 
                          required 
                          value={commonFields.address} 
                          onChange={handleCommonInputChange} 
                          autoComplete="street-address"
                          placeholder="請輸入完整地址"
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                        />
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                        <textarea 
                          name="description" 
                          id="description" 
                          rows="4" 
                          value={commonFields.description} 
                          onChange={handleCommonInputChange} 
                          autoComplete="off"
                          placeholder="請簡短描述這個地點的特色..."
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Step 2.5: Tags & Photos */}
                  <div className="space-y-8">
                     {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">綠活標籤</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {tags.map(tag => (
                          <label 
                            key={tag.id} 
                            className={`
                              cursor-pointer relative flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 select-none
                              ${selectedTags.includes(tag.id) 
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}
                            `}
                          >
                            <input 
                              type="checkbox" 
                              value={tag.id} 
                              onChange={() => handleTagChange(tag.id)} 
                              className="sr-only"
                            />
                            <span>{tag.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Photos */}
                    <div>
                      <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">照片 <span className="text-red-500">*</span> <span className="text-xs text-gray-500 font-normal">(最多 10 張)</span></label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors relative">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label htmlFor="photo" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                              <span>上傳照片</span>
                              <input id="photo" name="photo" type="file" required accept="image/*" multiple onChange={handleFileChange} className="sr-only" />
                            </label>
                            <p className="pl-1">或拖放至此</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB
                          </p>
                          {imageFiles.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                              {imageFiles.map((file, idx) => (
                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {file.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Dynamic Info */}
                  <div className="space-y-6 pt-6 border-t border-gray-100">
                    <div className="border-b border-gray-100 pb-2 mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <span className="bg-indigo-100 text-indigo-600 h-8 w-8 rounded-full flex items-center justify-center text-sm mr-3 font-bold">2</span>
                        {selectedType.name} 專屬資訊
                      </h3>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      <DynamicForm
                        fieldSchema={selectedType.fieldSchema}
                        values={dynamicFields}
                        onChange={handleDynamicInputChange}
                        errors={formErrors}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">提交時發生錯誤</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          提交處理中...
                        </span>
                      ) : '確認提交地點'}
                    </button>
                    <p className="mt-4 text-center text-sm text-gray-500">
                      提交後需要管理員審核，審核通過後將會顯示在地圖上。
                    </p>
                  </div>
                </form>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RegisterLocationPage;