import React, { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const ReportModal = ({ location, onClose }) => {
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportText) {
      setError('請填寫回報內容。');
      return;
    }
    if (!auth.currentUser) {
      setError('請先登入。');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'reports'), {
        locationId: location.id,
        locationName: location.name,
        reportText: reportText,
        reportedBy: auth.currentUser.uid,
        reportedAt: Timestamp.now(),
        status: 'new',
      });
      alert('感謝您的回報，我們將會盡快處理！');
      onClose();
    } catch (err) {
      setError('提交失敗，請稍後再試。');
      console.error("Error submitting report: ", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" style={{ zIndex: 1100 }}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">回報「{location.name}」的問題</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            rows="4"
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="請詳細說明您發現的問題（例如：店家已歇業、資訊有誤...）"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            required
          ></textarea>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">
              取消
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-red-500 text-white rounded-md disabled:bg-gray-400">
              {loading ? '傳送中...' : '送出回報'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
