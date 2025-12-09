import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const UserProfileModal = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    isWildernessPartner: false,
    groupName: '',
    naturalName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.displayName.trim()) {
      setError('請輸入姓名或暱稱');
      return;
    }

    if (formData.isWildernessPartner) {
      if (!formData.groupName.trim() || !formData.naturalName.trim()) {
        setError('荒野夥伴請填寫團名/分會和自然名');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      // 儲存使用者資料到 Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: formData.displayName.trim(),
        isWildernessPartner: formData.isWildernessPartner,
        groupName: formData.isWildernessPartner ? formData.groupName.trim() : '',
        naturalName: formData.isWildernessPartner ? formData.naturalName.trim() : '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      onComplete();
    } catch (err) {
      setError(`儲存失敗：${err.message}`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-2">歡迎加入綠活地圖！</h2>
        <p className="text-gray-600 mb-6">請完成您的個人資料設定</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 姓名/暱稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名/暱稱 *
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="請輸入您的姓名或暱稱"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              autoFocus
            />
          </div>

          {/* 是否為荒野夥伴 */}
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="isWildernessPartner"
                checked={formData.isWildernessPartner}
                onChange={handleInputChange}
                className="mt-1 mr-3"
              />
              <div>
                <span className="font-medium text-gray-900">我是荒野夥伴</span>
                <p className="text-sm text-gray-600 mt-1">
                  荒野保護協會的志工或會員
                </p>
              </div>
            </label>
          </div>

          {/* 荒野夥伴額外資訊 */}
          {formData.isWildernessPartner && (
            <div className="space-y-3 pl-4 border-l-4 border-green-500">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  團名/分會 *
                </label>
                <input
                  type="text"
                  name="groupName"
                  value={formData.groupName}
                  onChange={handleInputChange}
                  placeholder="例如：台南分會、炫蜂團"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required={formData.isWildernessPartner}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自然名 *
                </label>
                <input
                  type="text"
                  name="naturalName"
                  value={formData.naturalName}
                  onChange={handleInputChange}
                  placeholder="例如：樹蛙、黑熊"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required={formData.isWildernessPartner}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? '儲存中...' : '完成設定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
