import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import TypeSelector from './TypeSelector';
import LocationFormContent from './LocationFormContent';

const RegisterLocationModal = ({ isOpen, onClose }) => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [step, setStep] = useState('selectType'); // 'selectType' or 'fillForm'
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);

  // 如果使用者未完成個人資料設定，顯示提示
  const needsProfileSetup = user && !userProfile;

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep('fillForm');
  };

  const handleSaveLocation = async (locationData) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'pending_locations'), {
        ...locationData,
        submittedAt: Timestamp.now(),
        status: 'pending',
      });
      alert('地點已成功提交審核！');
      handleClose();
    } catch (err) {
      console.error("Error submitting new location:", err);
      alert(`提交失敗: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('selectType');
    setSelectedType(null);
    onClose();
  };

  const handleBack = () => {
    setStep('selectType');
    setSelectedType(null);
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
            {authLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : needsProfileSetup ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">請先完成個人資料設定</h3>
                <p className="text-gray-600 mb-6">在登錄地點前，您需要先設定個人資料。</p>
                <a
                  href="/profile"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleClose}
                >
                  前往設定個人資料
                </a>
              </div>
            ) : step === 'selectType' ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-extrabold text-gray-900">登錄新的綠活地點</h2>
                  <p className="mt-2 text-lg text-gray-600">選擇最適合的地點類型，開始分享您的發現</p>
                </div>
                <TypeSelector onSelectType={handleSelectType} />
              </>
            ) : (
              selectedType && (
                <LocationFormContent
                  selectedType={selectedType}
                  onSave={handleSaveLocation}
                  onCancel={handleBack}
                  initialData={null}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterLocationModal;
