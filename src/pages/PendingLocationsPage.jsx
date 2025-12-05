import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import PendingLocationDetailModal from '../components/PendingLocationDetailModal';
import { logLocationApproval, logLocationRejection } from '../utils/auditLog';

const PendingLocationsPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'pending_locations'));
      const pendingData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPending(pendingData);
    } catch (err) {
      setError('Failed to fetch pending locations.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id) => {
    try {
      const batch = writeBatch(db);

      // 1. Get the pending document
      const pendingDocRef = doc(db, 'pending_locations', id);
      const pendingDoc = await getDoc(pendingDocRef);
      if (!pendingDoc.exists()) throw new Error("Document not found.");
      const dataToApprove = pendingDoc.data();

      // 2. Create a new document in the public 'locations' collection
      const newLocationRef = doc(collection(db, 'locations'));
      const now = new Date();
      batch.set(newLocationRef, {
        ...dataToApprove,
        status: 'approved',
        approvedAt: now,
        // Set createdBy to the original submitter
        createdBy: dataToApprove.submitterInfo?.uid || 'unknown',
        createdAt: dataToApprove.submittedAt || now,
        // Initially, updatedBy is same as createdBy
        updatedBy: dataToApprove.submitterInfo?.uid || 'unknown',
        updatedAt: now,
      });

      // 3. Delete the pending document
      batch.delete(pendingDocRef);

      // 4. Commit the batch
      await batch.commit();

      // 5. Log the action
      await logLocationApproval(newLocationRef.id, dataToApprove.name);

      // 6. Update UI
      setPending(prev => prev.filter(item => item.id !== id));

    } catch (err) {
      setError(`Failed to approve: ${err.message}`);
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      // Get the document data before deleting
      const pendingDocRef = doc(db, 'pending_locations', id);
      const pendingDoc = await getDoc(pendingDocRef);
      const data = pendingDoc.data();
      const photoURL = data?.photoURL;

      // 1. Delete the document from Firestore
      await deleteDoc(pendingDocRef);

      // 2. Delete the photo from Storage
      if (photoURL) {
        const photoRef = ref(storage, photoURL);
        await deleteObject(photoRef);
      }

      // 3. Log the action
      await logLocationRejection(id, data?.name || '未知地點');

      // 4. Update UI
      setPending(prev => prev.filter(item => item.id !== id));

    } catch (err) {
      setError(`Failed to reject: ${err.message}`);
      console.error(err);
    }
  };

  if (loading) return <div>Loading pending locations...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">待審核地點 ({pending.length})</h1>
      <div className="space-y-4">
        {pending.length === 0 ? (
          <p>目前沒有待審核的地點。</p>
        ) : (
          pending.map(item => {
            const submitter = item.submitterInfo;
            const submitterDisplay = submitter?.isWildernessPartner && submitter?.groupName && submitter?.naturalName
              ? `${submitter.groupName}-${submitter.naturalName}`
              : (submitter?.displayName || '未知使用者');

            const photoURLs = item.photoURLs || (item.photoURL ? [item.photoURL] : []);

            return (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* 縮圖 */}
                  {photoURLs.length > 0 && (
                    <div className="flex-shrink-0">
                      <img
                        src={photoURLs[0]}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                      {photoURLs.length > 1 && (
                        <span className="text-xs text-gray-500 mt-1 block">+{photoURLs.length - 1} 張</span>
                      )}
                    </div>
                  )}

                  {/* 內容 */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold truncate">{item.name}</h2>
                    <p className="text-sm text-gray-600 truncate">{item.address}</p>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{item.description || '無描述'}</p>

                    {/* 登錄者資訊 */}
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                      <span className="text-xs text-gray-600">登錄者：</span>
                      <span className="text-xs font-medium text-gray-900">{submitterDisplay}</span>
                      {submitter?.isWildernessPartner && (
                        <span className="text-xs text-green-600">🌿</span>
                      )}
                    </div>

                    {/* 提交時間 */}
                    {item.submittedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        提交時間：{new Date(item.submittedAt.seconds * 1000).toLocaleString('zh-TW')}
                      </p>
                    )}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="mt-4 flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedLocation(item)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    查看完整內容
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                  >
                    核准
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                  >
                    拒絕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedLocation && (
        <PendingLocationDetailModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default PendingLocationsPage;

