import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const ManageTagsPage = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'tags'));
      const tagsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTags(tagsData);
    } catch (err) {
      setError('無法載入標籤列表');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tag = null) => {
    if (tag) {
      // 編輯模式
      setEditingTag(tag);
      setTagName(tag.name);
    } else {
      // 新增模式
      setEditingTag(null);
      setTagName('');
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
    setTagName('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tagName.trim()) {
      setError('請輸入標籤名稱');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingTag) {
        // 更新現有標籤
        await updateDoc(doc(db, 'tags', editingTag.id), {
          name: tagName.trim()
        });
        alert('標籤已成功更新');
      } else {
        // 新增標籤
        await addDoc(collection(db, 'tags'), {
          name: tagName.trim()
        });
        alert('標籤已成功新增');
      }

      handleCloseModal();
      await fetchTags();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tag) => {
    if (!confirm(`確定要刪除標籤「${tag.name}」嗎？\n\n注意：刪除後，所有使用此標籤的地點將不再顯示此標籤。`)) {
      return;
    }

    try {
      // 檢查是否有地點使用此標籤
      const locationsQuery = query(
        collection(db, 'locations'),
        where('tags', 'array-contains', tag.id)
      );
      const locationsSnapshot = await getDocs(locationsQuery);

      const pendingLocationsQuery = query(
        collection(db, 'pending_locations'),
        where('tags', 'array-contains', tag.id)
      );
      const pendingLocationsSnapshot = await getDocs(pendingLocationsQuery);

      const totalUsingLocations = locationsSnapshot.size + pendingLocationsSnapshot.size;

      if (totalUsingLocations > 0) {
        if (!confirm(
          `警告：有 ${totalUsingLocations} 個地點正在使用此標籤。\n\n` +
          `刪除後這些地點的標籤列表將不再包含「${tag.name}」。\n\n` +
          `確定要繼續刪除嗎？`
        )) {
          return;
        }
      }

      // 刪除標籤
      await deleteDoc(doc(db, 'tags', tag.id));

      alert('標籤已成功刪除');
      await fetchTags();
    } catch (err) {
      setError(`刪除失敗：${err.message}`);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8">載入中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">標籤管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          新增標籤
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 標籤列表 */}
      <div className="bg-white rounded-lg shadow">
        {tags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            目前沒有標籤
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {tag.name}
                  </span>
                  <span className="text-xs text-gray-400">ID: {tag.id}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(tag)}
                    className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(tag)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 說明文字 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">提示</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 標籤用於分類綠活地點，例如：全素/蔬食店、環保商店、二手市集等</li>
          <li>• 使用者可以透過標籤篩選地圖上的地點</li>
          <li>• 刪除標籤前，系統會檢查是否有地點正在使用</li>
          <li>• 修改標籤名稱後，所有使用此標籤的地點會自動更新顯示</li>
        </ul>
      </div>

      {/* 新增/編輯標籤 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingTag ? '編輯標籤' : '新增標籤'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  標籤名稱 *
                </label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="例如：全素/蔬食店"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                  disabled={submitting}
                >
                  {submitting ? '處理中...' : editingTag ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTagsPage;
