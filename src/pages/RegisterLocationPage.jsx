import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, GeoPoint, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import LocationFormContent from '../components/LocationFormContent'; // Import the new component


const RegisterLocationPage = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { activeTypes, loading: typesLoading } = useLocationTypes();
  const navigate = useNavigate();

  // Page state
  const [step, setStep] = useState('selectType'); // 'selectType' or 'fillForm'
  const [selectedType, setSelectedType] = useState(null);
  
  // Submission state (handled by LocationFormContent now)
  const [loading, setLoading] = useState(false); // Keep for TypeSelector if it needs loading

  useEffect(() => {
    if (!authLoading && user && !userProfile) {
      navigate('/profile');
    }
  }, [authLoading, user, userProfile, navigate]);

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep('fillForm');
    window.scrollTo(0, 0);
  };

  const handleSaveLocation = async (locationData) => {
    setLoading(true); // Indicate submission is in progress
    try {
      await addDoc(collection(db, 'pending_locations'), {
        ...locationData,
        submittedAt: Timestamp.now(),
        status: 'pending',
        // submitterInfo is now passed from LocationFormContent
        // typeId is now passed from LocationFormContent
        // dynamicFields is now passed from LocationFormContent
      });
      alert('地點已成功提交審核！');
      navigate('/');
    } catch (err) {
      console.error("Error submitting new location:", err);
      alert(`提交失敗: ${err.message}`);
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
            <LocationFormContent
              selectedType={selectedType}
              onSave={handleSaveLocation}
              onCancel={() => setStep('selectType')}
              initialData={null} // For new location, initialData is null
            />
          )
        )}
      </div>
    </div>
  );
};

export default RegisterLocationPage;