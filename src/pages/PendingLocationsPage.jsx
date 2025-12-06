import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import PendingLocationDetailModal from '../components/PendingLocationDetailModal';
import DuplicateComparisonModal from '../components/DuplicateComparisonModal';
import { logLocationApproval, logLocationRejection } from '../utils/auditLog';
import { groupDuplicateLocations, analyzeSubmitters } from '../utils/duplicateDetection';

const PendingLocationsPage = () => {
  const [pending, setPending] = useState([]);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'pending_locations'));
      const pendingData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPending(pendingData);

      // 使用重複檢測工具分組
      const groups = groupDuplicateLocations(pendingData);
      setDuplicateGroups(groups);

      // 找出所有在重複組中的地點 ID
      const duplicateIds = new Set();
      groups.forEach(group => {
        duplicateIds.add(group.original.id);
        group.duplicates.forEach(d => duplicateIds.add(d.location.id));
      });

      // 剩下的是獨立地點
      const unique = pendingData.filter(loc => !duplicateIds.has(loc.id));
      setUniqueLocations(unique);

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
        createdBy: dataToApprove.submitterInfo?.uid || 'unknown',
        createdAt: dataToApprove.submittedAt || now,
        updatedBy: dataToApprove.submitterInfo?.uid || 'unknown',
        updatedAt: now,
      });

      // 3. Delete the pending document
      batch.delete(pendingDocRef);

      // 4. Commit the batch
      await batch.commit();

      // 5. Log the action
      await logLocationApproval(newLocationRef.id, dataToApprove.name);

      // 6. Refresh UI
      await fetchPending();

    } catch (err) {
      setError(`Failed to approve: ${err.message}`);
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      const pendingDocRef = doc(db, 'pending_locations', id);
      const pendingDoc = await getDoc(pendingDocRef);
      const data = pendingDoc.data();

      // Delete the document
      await deleteDoc(pendingDocRef);

      // Delete photos
      const photoURLs = data?.photoURLs || (data?.photoURL ? [data.photoURL] : []);
      for (const photoURL of photoURLs) {
        try {
          const photoRef = ref(storage, photoURL);
          await deleteObject(photoRef);
        } catch (err) {
          console.error(`Failed to delete photo: ${photoURL}`, err);
        }
      }

      // Log the action
      await logLocationRejection(id, data?.name || '未知地點');

      // Refresh UI
      await fetchPending();

    } catch (err) {
      setError(`Failed to reject: ${err.message}`);
      console.error(err);
    }
  };

  // 批量處理：核准一個並拒絕其他
  const handleApproveAndRejectOthers = async (approveLocation, rejectLocations) => {
    try {
      // 核准選中的
      await handleApprove(approveLocation.id);

      // 拒絕其他的
      for (const location of rejectLocations) {
        await handleReject(location.id);
      }

      // 關閉比對界面
      setSelectedDuplicateGroup(null);

    } catch (err) {
      setError(`批量處理失敗: ${err.message}`);
      console.error(err);
    }
  };

  const toggleGroupExpansion = (groupIndex) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupIndex]: !prev[groupIndex]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-8">{error}</div>;

  const totalPending = pending.length;
  const totalDuplicateGroups = duplicateGroups.length;
  const totalUniqueLocations = uniqueLocations.length;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">待審核地點管理</h1>
        <p className="text-gray-600 mt-2">檢視和處理使用者提交的地點登錄</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">總待審核數</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{totalPending}</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium">疑似重複組</div>
          <div className="text-2xl font-bold text-orange-900 mt-1">{totalDuplicateGroups}</div>
          {totalDuplicateGroups > 0 && (
            <div className="text-xs text-orange-600 mt-1">需要優先處理</div>
          )}
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">獨立地點</div>
          <div className="text-2xl font-bold text-green-900 mt-1">{totalUniqueLocations}</div>
        </div>
      </div>

      {totalPending === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-400 text-5xl mb-4">✓</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">沒有待審核的地點</h3>
          <p className="text-gray-600">所有地點都已處理完畢！</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 重複地點組 */}
          {totalDuplicateGroups > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">⚠️ 疑似重複地點</h2>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                  {totalDuplicateGroups} 組
                </span>
              </div>

              <div className="space-y-4">
                {duplicateGroups.map((group, groupIndex) => {
                  const allLocations = [group.original, ...group.duplicates.map(d => d.location)];
                  const submitterStats = analyzeSubmitters(allLocations);
                  const isExpanded = expandedGroups[groupIndex];

                  return (
                    <div
                      key={groupIndex}
                      className="bg-white rounded-lg shadow-md border-2 border-orange-300 overflow-hidden"
                    >
                      {/* Group Header */}
                      <div
                        className="p-5 bg-gradient-to-r from-orange-50 to-red-50 border-b cursor-pointer hover:bg-orange-100 transition-colors"
                        onClick={() => toggleGroupExpansion(groupIndex)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {group.original.name}
                              </h3>
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                                {group.totalCount} 個重複
                              </span>
                            </div>

                            {/* 統計標籤 */}
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                                👥 {submitterStats.uniqueSubmitters} 位提交者
                              </span>
                              {submitterStats.hasRepeatSubmitter && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                                  ⚠️ 有重複提交者
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDuplicateGroup(group);
                              }}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                            >
                              比對檢視
                            </button>
                            <svg
                              className={`w-6 h-6 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-200">
                          {allLocations.map((location, locIndex) => {
                            const submitter = location.submitterInfo;
                            const submitterDisplay = submitter?.isWildernessPartner && submitter?.groupName && submitter?.naturalName
                              ? `${submitter.groupName}-${submitter.naturalName}`
                              : (submitter?.displayName || '未知使用者');
                            const photoURLs = location.photoURLs || (location.photoURL ? [location.photoURL] : []);

                            return (
                              <div key={location.id} className="p-4 bg-white hover:bg-gray-50">
                                <div className="flex gap-4">
                                  <div className="flex-shrink-0">
                                    {photoURLs.length > 0 ? (
                                      <img
                                        src={photoURLs[0]}
                                        alt={location.name}
                                        className="w-24 h-24 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                                        <span className="text-gray-400 text-2xl">📷</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-gray-500">
                                        {locIndex === 0 ? '原始地點' : `重複 #${locIndex}`}
                                      </span>
                                      {locIndex > 0 && group.duplicates[locIndex - 1] && (
                                        <span className="text-xs text-orange-600 font-medium">
                                          相似度 {Math.round(group.duplicates[locIndex - 1].similarity * 100)}%
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-base font-semibold truncate">{location.name}</h4>
                                    <p className="text-sm text-gray-600 truncate">{location.address}</p>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                        登錄者：{submitterDisplay}
                                      </span>
                                      {location.submittedAt && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(location.submittedAt.seconds * 1000).toLocaleDateString('zh-TW')}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setSelectedLocation(location)}
                                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                                    >
                                      查看
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 獨立地點 */}
          {totalUniqueLocations > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">獨立地點</h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {totalUniqueLocations} 個
                </span>
              </div>

              <div className="space-y-4">
                {uniqueLocations.map(item => {
                  const submitter = item.submitterInfo;
                  const submitterDisplay = submitter?.isWildernessPartner && submitter?.groupName && submitter?.naturalName
                    ? `${submitter.groupName}-${submitter.naturalName}`
                    : (submitter?.displayName || '未知使用者');
                  const photoURLs = item.photoURLs || (item.photoURL ? [item.photoURL] : []);

                  return (
                    <div key={item.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
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

                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold truncate">{item.name}</h2>
                          <p className="text-sm text-gray-600 truncate">{item.address}</p>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{item.description || '無描述'}</p>

                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                            <span className="text-xs text-gray-600">登錄者：</span>
                            <span className="text-xs font-medium text-gray-900">{submitterDisplay}</span>
                            {submitter?.isWildernessPartner && (
                              <span className="text-xs text-green-600">🌿</span>
                            )}
                          </div>

                          {item.submittedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              提交時間：{new Date(item.submittedAt.seconds * 1000).toLocaleString('zh-TW')}
                            </p>
                          )}
                        </div>
                      </div>

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
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLocation && (
        <PendingLocationDetailModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Duplicate Comparison Modal */}
      {selectedDuplicateGroup && (
        <DuplicateComparisonModal
          duplicateGroup={selectedDuplicateGroup}
          onClose={() => setSelectedDuplicateGroup(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onApproveAndRejectOthers={handleApproveAndRejectOthers}
        />
      )}
    </div>
  );
};

export default PendingLocationsPage;
