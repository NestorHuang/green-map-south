# 超級管理員設定指南

本指南說明如何設定超級管理員帳號以及管理一般管理員。

## 系統架構

### 角色說明

- **一般訪客**：可以瀏覽地圖、搜尋地點、查看詳細資訊
- **綠活伙伴（已登入用戶）**：可以上傳新地點、回報錯誤
- **一般管理員 (admin)**：可以審核待審核地點、處理錯誤回報
- **超級管理員 (superAdmin)**：擁有一般管理員的所有權限，另外可以：
  - 列出所有管理員
  - 新增一般管理員
  - 刪除一般管理員

### 技術實作

權限系統使用 Firebase Custom Claims 中的 `role` 欄位：
- `role: 'admin'` - 一般管理員
- `role: 'superAdmin'` - 超級管理員

## 初次設定超級管理員

### 前置條件

1. **使用者必須已登入過系統**
   - nestor@systemlead.com 必須先使用 Google 登入到網站至少一次
   - 這樣 Firebase Authentication 才會有該使用者的記錄

2. **準備 Firebase Service Account Key**
   - 前往 [Firebase Console](https://console.firebase.google.com/)
   - 選擇你的專案
   - 點擊「專案設定」(Project Settings) > 「服務帳戶」(Service Accounts)
   - 點擊「產生新的私密金鑰」(Generate New Private Key)
   - 下載的 JSON 檔案重新命名為 `serviceAccountKey.json`
   - 將檔案放在專案根目錄

### 執行設定腳本

```bash
# 確保在專案根目錄
cd /path/to/green-map-south

# 執行設定腳本
node setup_super_admin.js
```

### 預期輸出

```
🔍 Looking up user with email: nestor@systemlead.com
✅ Found user with UID: xxxxxxxxxxxxx
📝 Creating super admin document in Firestore...
✅ Super admin document created successfully!
⏳ Waiting for Cloud Function to sync custom claims...
📋 Custom claims: { role: 'superAdmin' }
✅ SUCCESS! nestor@systemlead.com is now a super admin!

📌 Next steps:
   1. The user should log out and log back in to get the new permissions
   2. Navigate to /admin/manage-admins to manage other admins
```

### 重要提醒

設定完成後，超級管理員必須：
1. **登出**目前的登入狀態
2. **重新登入**
3. 新的權限才會生效

## 使用超級管理員功能

### 存取管理員管理頁面

1. 以超級管理員帳號登入系統
2. 點擊右上角的「管理後台」
3. 在左側導航欄中，會看到紅色背景的「管理員管理」選項（僅超級管理員可見）
4. 點擊進入 `/admin/manage-admins`

### 新增一般管理員

1. 在「管理員帳號管理」頁面中
2. 在「新增一般管理員」區塊輸入使用者的 Email
3. **注意：該使用者必須已經使用此 Email 登入過系統至少一次**
4. 點擊「新增管理員」按鈕
5. 系統會：
   - 透過 Cloud Function 查詢該 Email 對應的 UID
   - 在 Firestore 的 `admins` 集合中建立文件
   - Cloud Function 自動設定 Custom Claim
6. 新增的管理員需要登出後重新登入才能獲得權限

### 刪除一般管理員

1. 在管理員列表中找到要刪除的管理員
2. 點擊「移除」按鈕
3. 確認刪除
4. 系統會：
   - 刪除 Firestore 中的 `admins` 文件
   - Cloud Function 自動移除 Custom Claim
5. 被移除的管理員在下次重新整理頁面後將失去管理權限

### 限制

- **無法刪除超級管理員**：系統會顯示「無法移除」
- **無法降級超級管理員**：需要手動修改 Firestore

## 手動管理（透過 Firebase Console）

如果需要手動管理，可以直接操作 Firestore：

1. 前往 Firebase Console > Firestore Database
2. 找到 `admins` 集合
3. 新增/編輯/刪除文件：
   ```
   Document ID: <使用者的 UID>
   Fields:
     - email: string (使用者 Email)
     - role: string ('admin' 或 'superAdmin')
     - addedAt: timestamp
   ```
4. Cloud Function 會自動同步 Custom Claims

## 安全性說明

### Firestore Security Rules

系統已設定以下安全規則：

```javascript
// 檢查是否為超級管理員
function isSuperAdmin() {
  return request.auth.token.role == 'superAdmin';
}

// 檢查是否為管理員（包含超級管理員）
function isAdmin() {
  return request.auth.token.role == 'admin' || isSuperAdmin();
}

// admins 集合只有超級管理員可以寫入
match /admins/{userId} {
  allow read: if isAdmin();
  allow write: if isSuperAdmin();
}
```

### Cloud Functions

`syncAdminStatus` Function 會在 `admins` 集合變更時自動觸發：
- 新增/更新文件 → 設定對應的 Custom Claim
- 刪除文件 → 移除 Custom Claim

## 故障排除

### 問題：找不到使用者

**錯誤訊息**：`User with email xxx not found`

**解決方法**：
1. 確認該使用者已使用 Google 登入過系統
2. 在 Firebase Console > Authentication 中確認使用者存在

### 問題：Custom Claim 未生效

**解決方法**：
1. 檢查 Firebase Console > Functions 的日誌，確認 `syncAdminStatus` 有被觸發
2. 確認使用者已登出並重新登入
3. 在瀏覽器的開發者工具中執行：
   ```javascript
   firebase.auth().currentUser.getIdTokenResult(true).then(result => console.log(result.claims))
   ```

### 問題：沒有權限執行操作

**錯誤訊息**：`permission-denied`

**解決方法**：
1. 確認執行操作的使用者確實是超級管理員
2. 檢查 Firestore Rules 是否正確部署
3. 確認 Custom Claims 已正確設定

## 預設超級管理員

- **Email**: nestor@systemlead.com
- **設定方式**: 透過 `setup_super_admin.js` 腳本

## 相關檔案

- `/setup_super_admin.js` - 初始化腳本
- `/src/pages/ManageAdminsPage.jsx` - 管理員管理頁面
- `/src/components/SuperAdminRoute.jsx` - 超級管理員路由保護
- `/src/hooks/useSuperAdmin.js` - 超級管理員狀態 Hook
- `/functions/index.js` - Cloud Functions（syncAdminStatus）
- `/firestore.rules` - Firestore 安全規則
