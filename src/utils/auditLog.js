import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

/**
 * 操作類型定義
 */
export const AuditAction = {
  // 地點審核相關
  APPROVE_LOCATION: 'approve_location',
  REJECT_LOCATION: 'reject_location',

  // 地點管理相關
  CREATE_LOCATION: 'create_location',
  UPDATE_LOCATION: 'update_location',
  DELETE_LOCATION: 'delete_location',
  LOCK_LOCATION: 'lock_location',
  UNLOCK_LOCATION: 'unlock_location',

  // 使用者管理相關
  UPDATE_USER: 'update_user',

  // 管理員管理相關
  ADD_ADMIN: 'add_admin',
  REMOVE_ADMIN: 'remove_admin',

  // 標籤管理相關
  CREATE_TAG: 'create_tag',
  UPDATE_TAG: 'update_tag',
  DELETE_TAG: 'delete_tag',

  // 類型管理相關
  CREATE_TYPE: 'create_type',
  UPDATE_TYPE: 'update_type',
  DELETE_TYPE: 'delete_type',
};

/**
 * 操作類型中文名稱
 */
export const AuditActionLabels = {
  [AuditAction.APPROVE_LOCATION]: '核准地點',
  [AuditAction.REJECT_LOCATION]: '拒絕地點',
  [AuditAction.CREATE_LOCATION]: '新增地點',
  [AuditAction.UPDATE_LOCATION]: '更新地點',
  [AuditAction.DELETE_LOCATION]: '刪除地點',
  [AuditAction.LOCK_LOCATION]: '鎖定地點',
  [AuditAction.UNLOCK_LOCATION]: '解鎖地點',
  [AuditAction.UPDATE_USER]: '更新使用者',
  [AuditAction.ADD_ADMIN]: '新增管理員',
  [AuditAction.REMOVE_ADMIN]: '移除管理員',
  [AuditAction.CREATE_TAG]: '新增標籤',
  [AuditAction.UPDATE_TAG]: '更新標籤',
  [AuditAction.DELETE_TAG]: '刪除標籤',
  [AuditAction.CREATE_TYPE]: '新增類型',
  [AuditAction.UPDATE_TYPE]: '更新類型',
  [AuditAction.DELETE_TYPE]: '刪除類型',
};

/**
 * 記錄操作日誌
 * @param {string} action - 操作類型（使用 AuditAction 常數）
 * @param {Object} details - 操作詳情
 * @param {string} details.targetId - 操作對象的 ID
 * @param {string} details.targetName - 操作對象的名稱
 * @param {string} details.targetType - 操作對象的類型（location, user, admin, tag, type）
 * @param {Object} details.changes - 變更內容（可選）
 * @param {string} details.reason - 操作原因（可選）
 * @returns {Promise<void>}
 */
export const logAuditAction = async (action, details = {}) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.warn('No authenticated user, skipping audit log');
      return;
    }

    // 取得使用者的 ID Token 以獲取角色資訊
    const idTokenResult = await currentUser.getIdTokenResult();
    const userRole = idTokenResult.claims.role || 'user';

    const logEntry = {
      // 操作資訊
      action,
      actionLabel: AuditActionLabels[action] || action,

      // 操作者資訊
      operatorId: currentUser.uid,
      operatorEmail: currentUser.email,
      operatorRole: userRole,

      // 操作對象資訊
      targetId: details.targetId || null,
      targetName: details.targetName || null,
      targetType: details.targetType || null,

      // 操作詳情
      changes: details.changes || null,
      reason: details.reason || null,
      metadata: details.metadata || null,

      // 時間戳記
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, 'audit_logs'), logEntry);

    console.log('Audit log recorded:', action, details.targetName || details.targetId);
  } catch (error) {
    console.error('Error recording audit log:', error);
    // 不拋出錯誤，避免影響主要操作
  }
};

/**
 * 便捷方法：記錄地點核准
 */
export const logLocationApproval = async (locationId, locationName) => {
  return logAuditAction(AuditAction.APPROVE_LOCATION, {
    targetId: locationId,
    targetName: locationName,
    targetType: 'location',
  });
};

/**
 * 便捷方法：記錄地點拒絕
 */
export const logLocationRejection = async (locationId, locationName, reason) => {
  return logAuditAction(AuditAction.REJECT_LOCATION, {
    targetId: locationId,
    targetName: locationName,
    targetType: 'location',
    reason,
  });
};

/**
 * 便捷方法：記錄地點鎖定/解鎖
 */
export const logLocationLockChange = async (locationId, locationName, isLocked) => {
  return logAuditAction(
    isLocked ? AuditAction.LOCK_LOCATION : AuditAction.UNLOCK_LOCATION,
    {
      targetId: locationId,
      targetName: locationName,
      targetType: 'location',
    }
  );
};

/**
 * 便捷方法：記錄地點刪除
 */
export const logLocationDeletion = async (locationId, locationName) => {
  return logAuditAction(AuditAction.DELETE_LOCATION, {
    targetId: locationId,
    targetName: locationName,
    targetType: 'location',
  });
};

/**
 * 便捷方法：記錄使用者更新
 */
export const logUserUpdate = async (userId, userEmail, changes) => {
  return logAuditAction(AuditAction.UPDATE_USER, {
    targetId: userId,
    targetName: userEmail,
    targetType: 'user',
    changes,
  });
};

/**
 * 便捷方法：記錄管理員新增
 */
export const logAdminAdd = async (adminEmail, role) => {
  return logAuditAction(AuditAction.ADD_ADMIN, {
    targetName: adminEmail,
    targetType: 'admin',
    metadata: { role },
  });
};

/**
 * 便捷方法：記錄管理員移除
 */
export const logAdminRemove = async (adminEmail) => {
  return logAuditAction(AuditAction.REMOVE_ADMIN, {
    targetName: adminEmail,
    targetType: 'admin',
  });
};
