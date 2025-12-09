/**
 * 重複地點檢測工具
 * 用於檢測待審核地點中的重複提交
 */

/**
 * 計算兩個字串的相似度（使用 Levenshtein Distance）
 * @param {string} str1
 * @param {string} str2
 * @returns {number} 0-1 之間的相似度，1 表示完全相同
 */
export function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  // 正規化：轉小寫、移除空格
  const s1 = str1.toLowerCase().replace(/\s+/g, '');
  const s2 = str2.toLowerCase().replace(/\s+/g, '');

  if (s1 === s2) return 1;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

/**
 * Levenshtein Distance 演算法
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * 計算兩個地理座標之間的距離（米）
 * 使用 Haversine 公式
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球半徑（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 距離（米）
}

/**
 * 檢測兩個地點是否可能重複
 * @param {Object} location1
 * @param {Object} location2
 * @returns {Object} { isDuplicate: boolean, similarity: number, reasons: string[] }
 */
export function detectDuplicate(location1, location2) {
  const reasons = [];
  let totalScore = 0;
  let maxScore = 0;

  // 1. 檢查名稱相似度（權重: 40）
  if (location1.name && location2.name) {
    const nameSimilarity = calculateStringSimilarity(location1.name, location2.name);
    totalScore += nameSimilarity * 40;
    maxScore += 40;

    if (nameSimilarity > 0.8) {
      reasons.push(`名稱相似 (${Math.round(nameSimilarity * 100)}%)`);
    }
  }

  // 2. 檢查地址相似度（權重: 30）
  if (location1.address && location2.address) {
    const addressSimilarity = calculateStringSimilarity(location1.address, location2.address);
    totalScore += addressSimilarity * 30;
    maxScore += 30;

    if (addressSimilarity > 0.7) {
      reasons.push(`地址相似 (${Math.round(addressSimilarity * 100)}%)`);
    }
  }

  // 3. 檢查 GPS 座標距離（權重: 30）
  if (location1.position && location2.position) {
    const lat1 = location1.position._lat || location1.position.lat;
    const lng1 = location1.position._long || location1.position.lng;
    const lat2 = location2.position._lat || location2.position.lat;
    const lng2 = location2.position._long || location2.position.lng;

    if (lat1 && lng1 && lat2 && lng2) {
      const distance = calculateDistance(lat1, lng1, lat2, lng2);

      // 距離小於 50 米視為同一地點
      let distanceScore = 0;
      if (distance < 10) distanceScore = 1;
      else if (distance < 50) distanceScore = 0.8;
      else if (distance < 100) distanceScore = 0.5;
      else if (distance < 200) distanceScore = 0.3;

      totalScore += distanceScore * 30;
      maxScore += 30;

      if (distance < 200) {
        reasons.push(`距離很近 (${Math.round(distance)}m)`);
      }
    }
  }

  // 計算綜合相似度
  const similarity = maxScore > 0 ? totalScore / maxScore : 0;

  // 相似度 > 0.6 視為可能重複
  const isDuplicate = similarity > 0.6;

  return {
    isDuplicate,
    similarity,
    reasons,
  };
}

/**
 * 將地點列表分組（找出所有可能重複的地點組）
 * @param {Array} locations 地點列表
 * @returns {Array} 分組結果 [{original: [...], duplicates: [...]}, ...]
 */
export function groupDuplicateLocations(locations) {
  const groups = [];
  const processed = new Set();

  for (let i = 0; i < locations.length; i++) {
    if (processed.has(locations[i].id)) continue;

    const group = {
      original: locations[i],
      duplicates: [],
      totalCount: 1,
    };

    // 找出所有與當前地點重複的地點
    for (let j = i + 1; j < locations.length; j++) {
      if (processed.has(locations[j].id)) continue;

      const result = detectDuplicate(locations[i], locations[j]);

      if (result.isDuplicate) {
        group.duplicates.push({
          location: locations[j],
          similarity: result.similarity,
          reasons: result.reasons,
        });
        group.totalCount++;
        processed.add(locations[j].id);
      }
    }

    // 只保留有重複的組
    if (group.duplicates.length > 0) {
      groups.push(group);
      processed.add(locations[i].id);
    }
  }

  return groups;
}

/**
 * 檢查待審核地點是否與已核准地點重複
 * @param {Object} pendingLocation 待審核地點
 * @param {Array} approvedLocations 已核准地點列表
 * @returns {Array} 重複的已核准地點列表
 */
export function checkDuplicateWithApproved(pendingLocation, approvedLocations) {
  const duplicates = [];

  for (const approved of approvedLocations) {
    const result = detectDuplicate(pendingLocation, approved);

    if (result.isDuplicate) {
      duplicates.push({
        location: approved,
        similarity: result.similarity,
        reasons: result.reasons,
      });
    }
  }

  return duplicates;
}

/**
 * 分析重複組中的提交者
 * @param {Array} locations 地點列表
 * @returns {Object} 提交者統計
 */
export function analyzeSubmitters(locations) {
  const submitterCounts = {};
  const submitterEmails = {};

  locations.forEach(loc => {
    const uid = loc.submitterInfo?.uid;
    const email = loc.submitterInfo?.email || loc.submitterInfo?.displayName;

    if (uid) {
      submitterCounts[uid] = (submitterCounts[uid] || 0) + 1;
      submitterEmails[uid] = email;
    }
  });

  const uniqueSubmitters = Object.keys(submitterCounts).length;
  const hasRepeatSubmitter = Object.values(submitterCounts).some(count => count > 1);

  // 找出重複提交者
  const repeatSubmitters = Object.entries(submitterCounts)
    .filter(([uid, count]) => count > 1)
    .map(([uid, count]) => ({
      uid,
      email: submitterEmails[uid],
      count,
    }));

  return {
    uniqueSubmitters,
    hasRepeatSubmitter,
    repeatSubmitters,
    submitterCounts,
  };
}
