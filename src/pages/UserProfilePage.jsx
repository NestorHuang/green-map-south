import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';

const UserProfilePage = () => {
  const { user, userProfile, loading, reloadUserProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    isWildernessPartner: false,
    groupName: '',
    naturalName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }

    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        isWildernessPartner: userProfile.isWildernessPartner || false,
        groupName: userProfile.groupName || '',
        naturalName: userProfile.naturalName || ''
      });
    } else if (user) {
      setFormData({
        displayName: user.displayName || '',
        isWildernessPartner: false,
        groupName: '',
        naturalName: ''
      });
    }
  }, [user, userProfile, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.displayName.trim()) {
      setError('請輸入您的姓名或暱稱');
      return;
    }

    if (formData.isWildernessPartner) {
      if (!formData.groupName.trim()) {
        setError('請輸入您的團名或分會');
        return;
      }
      if (!formData.naturalName.trim()) {
        setError('請輸入您的自然名');
        return;
      }
    }

    setSubmitting(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: formData.displayName.trim(),
        isWildernessPartner: formData.isWildernessPartner,
        groupName: formData.isWildernessPartner ? formData.groupName.trim() : '',
        naturalName: formData.isWildernessPartner ? formData.naturalName.trim() : '',
        updatedAt: new Date()
      }, { merge: true });

      // 重新載入使用者資料
      await reloadUserProfile();

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Error saving user profile:', err);
      setError('儲存失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600">載入中...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {userProfile ? '編輯個人資料' : '設定個人資料'}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            請填寫您的基本資料，這些資料會在您登錄地點時顯示。
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
            儲存成功！即將返回首頁...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名或暱稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="請輸入您的姓名或暱稱"
              disabled={submitting}
              autocomplete="name"
            />
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="isWildernessPartner"
                checked={formData.isWildernessPartner}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                disabled={submitting}
              />
              <span className="text-sm font-medium text-gray-700">
                我是荒野夥伴 🌿
              </span>
            </label>
          </div>

          {formData.isWildernessPartner && (
            <div className="space-y-4 pl-6 border-l-2 border-green-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  團名或分會 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="groupName"
                  value={formData.groupName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例如：台南分會"
                  disabled={submitting}
                  autocomplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自然名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="naturalName"
                  value={formData.naturalName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="請輸入您的自然名"
                  disabled={submitting}
                  autocomplete="off"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '儲存中...' : '儲存'}
            </button>
            {userProfile && (
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </form>

        {userProfile && (
          <div className="mt-6 pt-6 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>目前顯示為：</strong>
                {formData.isWildernessPartner && formData.groupName && formData.naturalName
                  ? ` ${formData.groupName}-${formData.naturalName}`
                  : ` ${formData.displayName}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
