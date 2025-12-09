import React, { useState, useEffect } from 'react';
import { checkTypeUsage } from '../../../services/locationTypes';

const DeleteTypeModal = ({ isOpen, onClose, onConfirm, typeData }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen && typeData) {
      setLoading(true);
      checkTypeUsage(typeData.id)
        .then(data => {
          setUsage(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error checking type usage:', err);
          setLoading(false);
        });
    }
  }, [isOpen, typeData]);

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const handleConfirm = () => {
    if (confirmText === typeData.name) {
      onConfirm();
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose}></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">刪除地點類型</h3>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">檢查使用情況...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 font-semibold">
                        警告：此操作無法撤銷！
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">
                  您即將刪除地點類型 <span className="font-bold text-red-600">「{typeData.name}」</span>
                </p>

                {usage && usage.total > 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <p className="text-sm font-semibold text-red-800 mb-2">以下資料將被永久刪除：</p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>地點類型本身</li>
                      {usage.approved > 0 && (
                        <li>{usage.approved} 個已核准的地點</li>
                      )}
                      {usage.pending > 0 && (
                        <li>{usage.pending} 個待審核的地點</li>
                      )}
                      <li className="font-bold">共 {usage.total} 個地點</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-blue-700">
                      此類型目前沒有被任何地點使用，可以安全刪除。
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    請輸入類型名稱 <span className="text-red-600">「{typeData.name}」</span> 以確認刪除
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={typeData.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmText !== typeData.name}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  確認刪除
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteTypeModal;
