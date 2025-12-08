/**
 * useCheckIns Hook
 * 載入特定地點的登錄記錄
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * 載入地點的登錄記錄
 * @param {string} locationId - 地點 ID
 * @param {object} options - 選項
 * @param {boolean} options.includeFirstCheckIn - 是否包含首次登錄（預設 false，因為 firstCheckIn 在 location 文檔中）
 * @param {number} options.limitCount - 限制數量（預設不限制）
 * @param {string} options.status - 過濾狀態（預設 'approved'）
 * @returns {object} { checkIns, loading, error, refresh }
 */
export function useCheckIns(locationId, options = {}) {
  const {
    includeFirstCheckIn = false,
    limitCount = null,
    status = 'approved',
  } = options;

  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCheckIns = async () => {
    if (!locationId) {
      setCheckIns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const checkInsRef = collection(db, 'locations', locationId, 'check_ins');

      // 嘗試使用複合查詢，如果失敗則使用簡單查詢
      let snapshot;
      try {
        // 建立查詢
        let q = query(
          checkInsRef,
          where('status', '==', status),
          orderBy('submittedAt', 'desc')
        );

        // 加上限制數量
        if (limitCount) {
          q = query(q, limit(limitCount));
        }

        snapshot = await getDocs(q);
      } catch (indexError) {
        console.warn('複合查詢失敗，使用簡單查詢:', indexError.message);
        // 回退到簡單查詢，然後在客戶端過濾和排序
        const simpleQuery = query(checkInsRef);
        snapshot = await getDocs(simpleQuery);
      }

      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 客戶端過濾和排序（以防索引查詢失敗）
      data = data
        .filter(doc => doc.status === status)
        .sort((a, b) => {
          const aTime = a.submittedAt?.seconds || 0;
          const bTime = b.submittedAt?.seconds || 0;
          return bTime - aTime; // 降序
        });

      // 客戶端限制數量
      if (limitCount) {
        data = data.slice(0, limitCount);
      }

      setCheckIns(data);
    } catch (err) {
      console.error('Error loading check-ins:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
  }, [locationId, status, limitCount]);

  return {
    checkIns,
    loading,
    error,
    refresh: fetchCheckIns,
  };
}

/**
 * 載入待審核登錄記錄
 * @param {object} options - 選項
 * @param {string} options.locationId - 特定地點 ID（可選）
 * @returns {object} { pendingCheckIns, loading, error, refresh }
 */
export function usePendingCheckIns(options = {}) {
  const { locationId = null } = options;

  const [pendingCheckIns, setPendingCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingCheckIns = async () => {
    try {
      setLoading(true);
      setError(null);

      const pendingRef = collection(db, 'pending_check_ins');

      // 建立查詢
      let q;
      if (locationId) {
        q = query(
          pendingRef,
          where('locationId', '==', locationId),
          orderBy('submittedAt', 'desc')
        );
      } else {
        q = query(
          pendingRef,
          where('status', '==', 'pending'),
          orderBy('submittedAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPendingCheckIns(data);
    } catch (err) {
      console.error('Error loading pending check-ins:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCheckIns();
  }, [locationId]);

  return {
    pendingCheckIns,
    loading,
    error,
    refresh: fetchPendingCheckIns,
  };
}

/**
 * 載入使用者的所有登錄記錄（跨地點）
 * @param {string} userId - 使用者 UID
 * @returns {object} { userCheckIns, loading, error, refresh }
 */
export function useUserCheckIns(userId) {
  const [userCheckIns, setUserCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserCheckIns = async () => {
    if (!userId) {
      setUserCheckIns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 使用 collectionGroup 查詢所有地點的 check_ins
      const checkInsRef = collection(db, 'check_ins');

      const q = query(
        checkInsRef,
        where('submitterInfo.uid', '==', userId),
        where('status', '==', 'approved'),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        locationId: doc.ref.parent.parent.id, // 取得父文檔的 ID（地點 ID）
        ...doc.data(),
      }));

      setUserCheckIns(data);
    } catch (err) {
      console.error('Error loading user check-ins:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCheckIns();
  }, [userId]);

  return {
    userCheckIns,
    loading,
    error,
    refresh: fetchUserCheckIns,
  };
}
