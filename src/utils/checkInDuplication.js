/**
 * 登錄重複檢測工具
 * 用於檢測登錄記錄中的重複提交
 */

import { calculateStringSimilarity } from './duplicateDetection.js';

/**
 * 檢測照片相似度（URL 比對）
 * @param {array} photos1 - 第一組照片 URLs
 * @param {array} photos2 - 第二組照片 URLs
 * @returns {number} 0-1 之間的相似度，1 表示完全相同
 */
export function detectPhotoSimilarity(photos1, photos2) {
  if (!photos1 || !photos2 || photos1.length === 0 || photos2.length === 0) {
    return 0;
  }

  const set1 = new Set(photos1);
  const set2 = new Set(photos2);

  // 計算交集
  const intersection = [...set1].filter(x => set2.has(x));

  // 相似度 = 交集大小 / 最大集合大小
  return intersection.length / Math.max(set1.size, set2.size);
}

/**
 * 檢測描述相似度
 * @param {string} desc1 - 第一個描述
 * @param {string} desc2 - 第二個描述
 * @returns {number} 0-1 之間的相似度
 */
export function detectDescriptionSimilarity(desc1, desc2) {
  return calculateStringSimilarity(desc1, desc2);
}

/**
 * 檢測兩個登錄記錄是否重複
 * @param {Object} checkIn1 - 第一個登錄
 * @param {Object} checkIn2 - 第二個登錄
 * @returns {Object} { isDuplicate: boolean, similarity: number, reasons: string[] }
 */
export function detectDuplicateCheckIn(checkIn1, checkIn2) {
  const reasons = [];
  let maxSimilarity = 0;

  // 1. 檢測照片相似度
  const photoSim = detectPhotoSimilarity(
    checkIn1.photoURLs || [],
    checkIn2.photoURLs || []
  );

  if (photoSim > 0) {
    maxSimilarity = Math.max(maxSimilarity, photoSim);
    if (photoSim === 1.0) {
      reasons.push('照片完全相同 (100%)');
    } else if (photoSim > 0.5) {
      reasons.push(`照片高度相似 (${Math.round(photoSim * 100)}%)`);
    }
  }

  // 2. 檢測描述相似度
  const descSim = detectDescriptionSimilarity(
    checkIn1.description || '',
    checkIn2.description || ''
  );

  if (descSim > 0) {
    maxSimilarity = Math.max(maxSimilarity, descSim);
    if (descSim > 0.9) {
      reasons.push(`描述高度相似 (${Math.round(descSim * 100)}%)`);
    }
  }

  // 3. 檢查是否為同一提交者
  const sameSubmitter =
    checkIn1.submitterInfo?.uid &&
    checkIn2.submitterInfo?.uid &&
    checkIn1.submitterInfo.uid === checkIn2.submitterInfo.uid;

  if (sameSubmitter) {
    reasons.push('同一提交者');
  }

  // 判定標準：
  // - 照片 100% 相同，或
  // - 描述 90% 以上相似，或
  // - 同一提交者 + (照片 50% 相似 或 描述 80% 相似)
  const isDuplicate =
    photoSim === 1.0 ||
    descSim > 0.9 ||
    (sameSubmitter && (photoSim > 0.5 || descSim > 0.8));

  return {
    isDuplicate,
    similarity: maxSimilarity,
    reasons,
  };
}

/**
 * 在已有登錄列表中尋找重複
 * @param {Object} newCheckIn - 新登錄
 * @param {Array} existingCheckIns - 已有登錄列表
 * @returns {Object} 重複資訊或 null
 */
export function findDuplicateInCheckIns(newCheckIn, existingCheckIns) {
  if (!existingCheckIns || existingCheckIns.length === 0) {
    return null;
  }

  for (const existing of existingCheckIns) {
    const result = detectDuplicateCheckIn(newCheckIn, existing);

    if (result.isDuplicate) {
      return {
        isDuplicate: true,
        similarity: result.similarity,
        reasons: result.reasons,
        duplicateCheckInId: existing.id,
        duplicateCheckIn: existing,
      };
    }
  }

  return null;
}

/**
 * 檢查使用者在特定時間內是否已經登錄過
 * @param {string} userId - 使用者 UID
 * @param {Array} checkIns - 登錄記錄列表
 * @param {number} days - 天數限制（預設 7 天）
 * @returns {Object} { hasRecentCheckIn: boolean, lastCheckIn: object, daysAgo: number }
 */
export function checkRecentCheckInByUser(userId, checkIns, days = 7) {
  if (!checkIns || checkIns.length === 0) {
    return { hasRecentCheckIn: false };
  }

  const now = new Date();
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - days);

  // 尋找該使用者的登錄記錄
  const userCheckIns = checkIns
    .filter(checkIn => checkIn.submitterInfo?.uid === userId)
    .filter(checkIn => {
      const submittedAt = checkIn.submittedAt?.toDate
        ? checkIn.submittedAt.toDate()
        : new Date(checkIn.submittedAt);
      return submittedAt > limitDate;
    })
    .sort((a, b) => {
      const dateA = a.submittedAt?.toDate
        ? a.submittedAt.toDate()
        : new Date(a.submittedAt);
      const dateB = b.submittedAt?.toDate
        ? b.submittedAt.toDate()
        : new Date(b.submittedAt);
      return dateB - dateA; // 最新在前
    });

  if (userCheckIns.length > 0) {
    const lastCheckIn = userCheckIns[0];
    const lastDate = lastCheckIn.submittedAt?.toDate
      ? lastCheckIn.submittedAt.toDate()
      : new Date(lastCheckIn.submittedAt);
    const daysAgo = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    return {
      hasRecentCheckIn: true,
      lastCheckIn,
      daysAgo,
      daysLimit: days,
    };
  }

  return { hasRecentCheckIn: false };
}

/**
 * 分析登錄統計
 * @param {Array} checkIns - 登錄記錄列表（包含 firstCheckIn）
 * @returns {Object} 統計資訊
 */
export function analyzeCheckInStats(checkIns) {
  if (!checkIns || checkIns.length === 0) {
    return {
      totalCheckIns: 0,
      uniqueSubmitters: 0,
      submitterCounts: {},
    };
  }

  const submitterCounts = {};

  checkIns.forEach(checkIn => {
    const uid = checkIn.submitterInfo?.uid;
    if (uid) {
      submitterCounts[uid] = (submitterCounts[uid] || 0) + 1;
    }
  });

  return {
    totalCheckIns: checkIns.length,
    uniqueSubmitters: Object.keys(submitterCounts).length,
    submitterCounts,
    mostActiveSubmitters: Object.entries(submitterCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([uid, count]) => ({ uid, count })),
  };
}
