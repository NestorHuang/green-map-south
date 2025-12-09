/**
 * 登錄服務層
 * 處理登錄記錄的 CRUD 操作
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { findDuplicateInCheckIns, checkRecentCheckInByUser } from '../utils/checkInDuplication';

/**
 * 提交新登錄到待審核
 * @param {string} locationId - 地點 ID
 * @param {object} checkInData - 登錄資料
 * @param {object} userProfile - 使用者檔案
 * @returns {Promise<string>} 待審核登錄 ID
 */
export async function submitCheckIn(locationId, checkInData, userProfile) {
  // 1. 檢查地點是否存在
  const locationRef = doc(db, 'locations', locationId);
  const locationDoc = await getDoc(locationRef);

  if (!locationDoc.exists()) {
    throw new Error('地點不存在');
  }

  const locationData = locationDoc.data();

  // 2. 檢查使用者是否在 7 天內已登錄過
  const checkInsRef = collection(db, 'locations', locationId, 'check_ins');
  const recentQuery = query(
    checkInsRef,
    where('submitterInfo.uid', '==', userProfile.uid),
    where('status', '==', 'approved'),
    orderBy('submittedAt', 'desc')
  );

  const recentSnapshot = await getDocs(recentQuery);
  const recentCheckIns = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const recentCheck = checkRecentCheckInByUser(userProfile.uid, recentCheckIns, 7);

  if (recentCheck.hasRecentCheckIn) {
    throw new Error(`您在 ${recentCheck.daysAgo} 天前已經登錄過此地點，請等待 7 天後再次登錄`);
  }

  // 3. 檢查是否與近期登錄重複
  const duplicateCheck = findDuplicateInCheckIns(checkInData, recentCheckIns.slice(0, 10));

  // 4. 建立待審核登錄文檔
  const pendingCheckIn = {
    locationId,
    locationName: locationData.name,
    description: checkInData.description || '',
    photoURLs: checkInData.photoURLs || [],
    photoURL: checkInData.photoURLs?.[0] || '',
    tags: checkInData.tags || [],
    dynamicFields: checkInData.dynamicFields || {},
    submitterInfo: {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName || '',
      isWildernessPartner: userProfile.isWildernessPartner || false,
      groupName: userProfile.groupName || '',
      naturalName: userProfile.naturalName || '',
    },
    status: 'pending',
    submittedAt: Timestamp.now(),
  };

  // 5. 如果檢測到重複，加上警告標記
  if (duplicateCheck && duplicateCheck.isDuplicate) {
    pendingCheckIn.duplicateWarning = {
      isDuplicate: true,
      similarity: duplicateCheck.similarity,
      reasons: duplicateCheck.reasons,
      duplicateCheckInId: duplicateCheck.duplicateCheckInId,
    };
  }

  // 6. 提交到 pending_check_ins
  const docRef = await addDoc(collection(db, 'pending_check_ins'), pendingCheckIn);

  return docRef.id;
}

/**
 * 核准待審核登錄
 * @param {string} pendingCheckInId - 待審核登錄 ID
 * @param {string} adminUid - 管理員 UID
 * @returns {Promise<void>}
 */
export async function approveCheckIn(pendingCheckInId, adminUid) {
  const batch = writeBatch(db);

  // 1. 獲取待審核登錄資料
  const pendingRef = doc(db, 'pending_check_ins', pendingCheckInId);
  const pendingDoc = await getDoc(pendingRef);

  if (!pendingDoc.exists()) {
    throw new Error('待審核登錄不存在');
  }

  const pendingData = pendingDoc.data();
  const { locationId } = pendingData;

  // 2. 在 check_ins subcollection 創建新文檔
  const checkInRef = doc(collection(db, 'locations', locationId, 'check_ins'));

  const checkInData = {
    description: pendingData.description,
    photoURLs: pendingData.photoURLs,
    photoURL: pendingData.photoURL,
    tags: pendingData.tags,
    dynamicFields: pendingData.dynamicFields,
    submitterInfo: pendingData.submitterInfo,
    status: 'approved',
    submittedAt: pendingData.submittedAt,
    approvedAt: Timestamp.now(),
    approvedBy: adminUid,
    locked: false,
  };

  batch.set(checkInRef, checkInData);

  // 3. 更新地點統計
  const locationRef = doc(db, 'locations', locationId);

  // 先獲取現有的 check_ins 來計算 uniqueSubmitters
  const checkInsSnapshot = await getDocs(
    collection(db, 'locations', locationId, 'check_ins')
  );

  const submitterUids = new Set();
  submitterUids.add(pendingData.submitterInfo.uid); // 加入新的提交者

  checkInsSnapshot.forEach(doc => {
    const uid = doc.data().submitterInfo?.uid;
    if (uid) submitterUids.add(uid);
  });

  batch.update(locationRef, {
    'checkInStats.totalCheckIns': increment(1),
    'checkInStats.uniqueSubmitters': submitterUids.size,
    'checkInStats.lastCheckInAt': Timestamp.now(),
    updatedAt: Timestamp.now(),
    updatedBy: adminUid,
  });

  // 4. 刪除待審核登錄
  batch.delete(pendingRef);

  // 5. 提交批次操作
  await batch.commit();
}

/**
 * 拒絕待審核登錄
 * @param {string} pendingCheckInId - 待審核登錄 ID
 * @param {string} adminUid - 管理員 UID
 * @param {string} reason - 拒絕原因（可選）
 * @returns {Promise<void>}
 */
export async function rejectCheckIn(pendingCheckInId, adminUid, reason = '') {
  // 1. 獲取待審核登錄資料
  const pendingRef = doc(db, 'pending_check_ins', pendingCheckInId);
  const pendingDoc = await getDoc(pendingRef);

  if (!pendingDoc.exists()) {
    throw new Error('待審核登錄不存在');
  }

  const pendingData = pendingDoc.data();

  // 2. 刪除照片
  const photoURLs = pendingData.photoURLs || [];
  for (const photoURL of photoURLs) {
    try {
      const photoRef = ref(storage, photoURL);
      await deleteObject(photoRef);
    } catch (err) {
      console.error(`Failed to delete photo: ${photoURL}`, err);
    }
  }

  // 3. 刪除待審核登錄文檔
  await deleteDoc(pendingRef);
}

/**
 * 更新已核准的登錄（僅限提交者或管理員）
 * @param {string} locationId - 地點 ID
 * @param {string} checkInId - 登錄 ID
 * @param {object} updates - 更新內容
 * @param {string} updaterUid - 更新者 UID
 * @returns {Promise<void>}
 */
export async function updateCheckIn(locationId, checkInId, updates, updaterUid) {
  const checkInRef = doc(db, 'locations', locationId, 'check_ins', checkInId);
  const checkInDoc = await getDoc(checkInRef);

  if (!checkInDoc.exists()) {
    throw new Error('登錄不存在');
  }

  const checkInData = checkInDoc.data();

  // 檢查權限：只有提交者或管理員可以更新
  if (checkInData.submitterInfo?.uid !== updaterUid) {
    // 這裡應該檢查是否為管理員，但這需要在前端層面處理
    // Firestore Rules 會負責最終的權限檢查
  }

  // 檢查是否被鎖定
  if (checkInData.locked) {
    throw new Error('此登錄已被鎖定，無法編輯');
  }

  await updateDoc(checkInRef, {
    ...updates,
    updatedAt: Timestamp.now(),
    updatedBy: updaterUid,
  });
}

/**
 * 刪除登錄（管理員）
 * @param {string} locationId - 地點 ID
 * @param {string} checkInId - 登錄 ID
 * @param {string} adminUid - 管理員 UID
 * @returns {Promise<void>}
 */
export async function deleteCheckIn(locationId, checkInId, adminUid) {
  const batch = writeBatch(db);

  // 1. 獲取登錄資料
  const checkInRef = doc(db, 'locations', locationId, 'check_ins', checkInId);
  const checkInDoc = await getDoc(checkInRef);

  if (!checkInDoc.exists()) {
    throw new Error('登錄不存在');
  }

  const checkInData = checkInDoc.data();

  // 2. 刪除照片
  const photoURLs = checkInData.photoURLs || [];
  for (const photoURL of photoURLs) {
    try {
      const photoRef = ref(storage, photoURL);
      await deleteObject(photoRef);
    } catch (err) {
      console.error(`Failed to delete photo: ${photoURL}`, err);
    }
  }

  // 3. 刪除登錄文檔
  batch.delete(checkInRef);

  // 4. 更新地點統計
  const locationRef = doc(db, 'locations', locationId);

  // 重新計算 uniqueSubmitters
  const checkInsSnapshot = await getDocs(
    collection(db, 'locations', locationId, 'check_ins')
  );

  const submitterUids = new Set();
  checkInsSnapshot.forEach(doc => {
    if (doc.id !== checkInId) {
      // 排除即將刪除的登錄
      const uid = doc.data().submitterInfo?.uid;
      if (uid) submitterUids.add(uid);
    }
  });

  batch.update(locationRef, {
    'checkInStats.totalCheckIns': increment(-1),
    'checkInStats.uniqueSubmitters': submitterUids.size,
    updatedAt: Timestamp.now(),
    updatedBy: adminUid,
  });

  // 5. 提交批次操作
  await batch.commit();
}

/**
 * 鎖定/解鎖登錄（管理員）
 * @param {string} locationId - 地點 ID
 * @param {string} checkInId - 登錄 ID
 * @param {boolean} locked - 是否鎖定
 * @param {string} adminUid - 管理員 UID
 * @returns {Promise<void>}
 */
export async function toggleCheckInLock(locationId, checkInId, locked, adminUid) {
  const checkInRef = doc(db, 'locations', locationId, 'check_ins', checkInId);

  await updateDoc(checkInRef, {
    locked,
    updatedAt: Timestamp.now(),
    updatedBy: adminUid,
  });
}

/**
 * 將待審核地點轉為登錄記錄（管理員）
 * @param {string} pendingLocationId - 待審核地點 ID
 * @param {string} targetLocationId - 目標地點 ID
 * @param {string} adminUid - 管理員 UID
 * @returns {Promise<string>} 待審核登錄 ID
 */
export async function convertLocationToCheckIn(
  pendingLocationId,
  targetLocationId,
  adminUid
) {
  // 1. 獲取待審核地點資料
  const pendingLocationRef = doc(db, 'pending_locations', pendingLocationId);
  const pendingLocationDoc = await getDoc(pendingLocationRef);

  if (!pendingLocationDoc.exists()) {
    throw new Error('待審核地點不存在');
  }

  const pendingData = pendingLocationDoc.data();

  // 2. 獲取目標地點資料
  const targetLocationRef = doc(db, 'locations', targetLocationId);
  const targetLocationDoc = await getDoc(targetLocationRef);

  if (!targetLocationDoc.exists()) {
    throw new Error('目標地點不存在');
  }

  const targetLocationData = targetLocationDoc.data();

  // 3. 創建待審核登錄
  const pendingCheckIn = {
    locationId: targetLocationId,
    locationName: targetLocationData.name,
    description: pendingData.description || '',
    photoURLs: pendingData.photoURLs || [],
    photoURL: pendingData.photoURL || '',
    tags: pendingData.tags || [],
    dynamicFields: pendingData.dynamicFields || {},
    submitterInfo: pendingData.submitterInfo,
    status: 'pending',
    submittedAt: pendingData.submittedAt || Timestamp.now(),
    convertedFrom: pendingLocationId, // 記錄來源
    convertedBy: adminUid,
    convertedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'pending_check_ins'), pendingCheckIn);

  // 4. 刪除待審核地點
  await deleteDoc(pendingLocationRef);

  return docRef.id;
}
