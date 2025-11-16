# 管理員管理指南

本指南說明如何管理系統中的管理員帳號。

## 快速開始

### 查看所有管理員

以超級管理員身份登入後，前往 `/admin/manage-admins` 頁面即可查看所有管理員列表。

### 新增一般管理員

使用命令列工具新增管理員：

```bash
node add_admin.cjs <email>
```

**範例：**
```bash
node add_admin.cjs user@example.com
```

**重要：**
- 使用者必須先使用該 Email 登入過系統至少一次
- 新增完成後，該使用者需要登出並重新登入才能獲得管理員權限

### 新增超級管理員

如果要新增超級管理員，請在命令中指定 role：

```bash
node add_admin.cjs <email> superAdmin
```

**範例：**
```bash
node add_admin.cjs admin@example.com superAdmin
```

### 刪除管理員

1. 前往 `/admin/manage-admins` 頁面
2. 找到要刪除的管理員
3. 點擊「移除」按鈕
4. 確認刪除

**注意：**
- 無法刪除超級管理員帳號
- 刪除後該使用者需要重新整理頁面，權限即會立即失效

## 命令列工具說明

### add_admin.cjs

新增或更新管理員帳號。

**語法：**
```bash
node add_admin.cjs <email> [role]
```

**參數：**
- `email`: 必填，使用者的 Email 地址
- `role`: 選填，可以是 `admin` 或 `superAdmin`（預設為 `admin`）

**範例：**
```bash
# 新增一般管理員
node add_admin.cjs user@example.com

# 新增超級管理員
node add_admin.cjs admin@example.com superAdmin

# 將一般管理員升級為超級管理員
node add_admin.cjs user@example.com superAdmin
```

### setup_nestor_super_admin.cjs

設定預設超級管理員（nestor@systemlead.com）。

**語法：**
```bash
node setup_nestor_super_admin.cjs
```

### verify_super_admin.cjs

驗證並修正超級管理員設定。

**語法：**
```bash
node verify_super_admin.cjs
```

## 權限說明

### 超級管理員 (superAdmin)

可以執行：
- ✅ 審核待審核地點
- ✅ 處理錯誤回報
- ✅ 查看所有管理員列表
- ✅ 新增一般管理員
- ✅ 刪除一般管理員

### 一般管理員 (admin)

可以執行：
- ✅ 審核待審核地點
- ✅ 處理錯誤回報
- ❌ 無法管理管理員帳號

## 資料結構

管理員資訊儲存在 Firestore 的 `admins` 集合中：

```javascript
{
  // Document ID = 使用者 UID
  "nNKhqEn2EuYmAseyRSvcuyFgICk1": {
    "email": "nestor@systemlead.com",
    "role": "superAdmin",  // 或 "admin"
    "addedAt": Timestamp
  }
}
```

## 權限同步機制

當 `admins` 集合中的文件被建立、更新或刪除時：

1. `syncAdminStatus` Cloud Function 會自動觸發
2. Function 會將 `role` 寫入使用者的 Custom Claims
3. 使用者的 ID Token 會包含 `role` claim
4. 前端透過 `useAuth()` 和 `useSuperAdmin()` 讀取這些 claims

## 故障排除

### 問題：使用者找不到

**錯誤訊息：** `User with email xxx not found`

**解決方法：**
1. 確認該使用者已使用 Google 登入過系統
2. 在 Firebase Console > Authentication 中確認使用者存在

### 問題：權限未生效

**解決方法：**
1. 確認 `syncAdminStatus` Cloud Function 已部署
2. 檢查 Firebase Console > Functions 的日誌
3. 使用者必須登出後重新登入
4. 執行 `verify_super_admin.cjs` 檢查設定

### 問題：無法新增管理員

**解決方法：**
1. 確認 Firestore Rules 已正確部署
2. 確認執行命令的使用者有 `serviceAccountKey.json`
3. 檢查網路連線

## 安全性提醒

1. **妥善保管 serviceAccountKey.json**
   - 此檔案擁有完整的 Firebase 權限
   - 不要提交到 Git
   - 不要公開分享

2. **謹慎授予超級管理員權限**
   - 超級管理員可以新增/刪除其他管理員
   - 建議只設定少數信任的人員為超級管理員

3. **定期檢查管理員列表**
   - 移除不再需要權限的帳號
   - 確保沒有未授權的管理員

## 相關檔案

- `/add_admin.cjs` - 新增管理員腳本
- `/setup_nestor_super_admin.cjs` - 設定預設超級管理員
- `/verify_super_admin.cjs` - 驗證超級管理員設定
- `/src/pages/ManageAdminsPage.jsx` - 管理員管理頁面
- `/functions/index.js` - syncAdminStatus Cloud Function
- `/firestore.rules` - Firestore 安全規則
