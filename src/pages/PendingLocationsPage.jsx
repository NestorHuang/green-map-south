import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

const PendingLocationsPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      batch.set(newLocationRef, {
        ...dataToApprove,
        status: 'approved',
        approvedAt: new Date(),
      });

      // 3. Delete the pending document
      batch.delete(pendingDocRef);

      // 4. Commit the batch
      await batch.commit();

      // 5. Update UI
      setPending(prev => prev.filter(item => item.id !== id));

    } catch (err) {
      setError(`Failed to approve: ${err.message}`);
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      // Get the photoURL before deleting the document
      const pendingDocRef = doc(db, 'pending_locations', id);
      const pendingDoc = await getDoc(pendingDocRef);
      const photoURL = pendingDoc.data()?.photoURL;

      // 1. Delete the document from Firestore
      await deleteDoc(pendingDocRef);

      // 2. Delete the photo from Storage
      if (photoURL) {
        const photoRef = ref(storage, photoURL);
        await deleteObject(photoRef);
      }

      // 3. Update UI
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

            return (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-bold">{item.name}</h2>
                <p className="text-sm text-gray-600">{item.address}</p>
                <p className="text-sm my-2">{item.description}</p>

                {/* 登錄者資訊 */}
                <div className="my-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-gray-600 mb-1">登錄者</p>
                  <p className="text-sm font-medium text-gray-900">{submitterDisplay}</p>
                  {submitter?.isWildernessPartner && (
                    <p className="text-xs text-green-600 mt-1">🌿 荒野夥伴</p>
                  )}
                </div>

                {/* 圖片連結 */}
                {item.photoURLs && item.photoURLs.length > 0 ? (
                  <div className="my-2">
                    <p className="text-xs text-gray-600 mb-1">圖片 ({item.photoURLs.length} 張):</p>
                    <div className="flex gap-2 flex-wrap">
                      {item.photoURLs.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 text-sm hover:underline"
                        >
                          圖片 {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : item.photoURL && (
                  <a href={item.photoURL} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline">查看照片</a>
                )}

                <div className="mt-4 flex gap-4">
                  <button onClick={() => handleApprove(item.id)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">核准</button>
                  <button onClick={() => handleReject(item.id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">拒絕</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PendingLocationsPage;

