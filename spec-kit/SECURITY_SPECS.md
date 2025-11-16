# 資訊安全規格 (Security Specs)

本文件定義了專案的資訊安全策略，其核心是圍繞一個結合了 Firestore、Cloud Functions 與 Firebase Auth Custom Claims 的混合權限模型。

## 核心概念：以 Firestore 為單一事實來源 (Source of Truth)

本專案的權限管理，以 Firestore 中的 `admins` 集合為唯一的「單一事實來源」。管理員的身份與角色是透過在該集合中新增或刪除一個以使用者 UID 命名的文件來定義的。

然而，為了實現高效能與高安全性，應用程式並不直接查詢此集合來判斷權限。而是透過後端的自動化流程，將此集合的狀態**同步**到 Firebase Auth 的「自訂宣告 (Custom Claims)」中。

最終，前端應用程式與後端安全規則，都統一依賴附加在使用者認證令牌 (ID Token) 中的 `role` 聲明來判斷權限。

## 角色定義

系統採用兩級權限架構：

- **`superAdmin`**: 超級管理員
  - 具備最高權限
  - 可以管理其他管理員帳號（新增、刪除、同步權限）
  - 可以執行所有管理員操作（審核地點、處理回報）
  - Custom Claim: `{ role: 'superAdmin' }`

- **`admin`**: 一般管理員
  - 可以審核待處理地點
  - 可以處理錯誤回報
  - **無法**管理其他管理員
  - Custom Claim: `{ role: 'admin' }`

## 自動化權限同步：Cloud Functions

我們部署了以下雲端函式來管理權限：

### 1. `syncAdminStatus` (自動觸發)
Firestore 觸發的雲端函式，職責如下：

- **監聽 `admins/{userId}` 路徑**: 當此路徑下的任何文件被**建立、更新或刪除**時，此函式會自動執行。
- **建立/更新時**: 當文件被寫入時，函式會取得文件中的 `role` 欄位（`admin` 或 `superAdmin`），並為對應的 Firebase 使用者設定 Custom Claim `{ role: 'admin' }` 或 `{ role: 'superAdmin' }`。
- **刪除時**: 當文件被刪除時，函式會移除該使用者的自訂宣告（設為 `null`）。

這個機制確保了 `admins` 集合的狀態與使用者的實際權限（自訂宣告）始終保持最終一致。

### 2. `getAdminStatus` (可呼叫函式)
取得管理員的詳細狀態資訊：

- **權限**: 僅限 `admin` 或 `superAdmin` 角色可呼叫
- **功能**: 查詢指定 UID 的使用者，返回其 Custom Claims、Firestore 資料、以及同步狀態
- **用途**: 管理員管理介面用於顯示即時同步狀態

### 3. `syncAdminClaim` (可呼叫函式)
手動同步單一管理員的 Custom Claims：

- **權限**: 僅限 `superAdmin` 角色可呼叫
- **功能**: 從 Firestore `admins` 集合讀取該使用者的 `role`，並強制同步到 Custom Claims
- **用途**: 當自動同步失敗或狀態不一致時，由超級管理員手動觸發修復

### 4. `addAdminByEmail` (可呼叫函式)
透過 Email 新增管理員：

- **權限**: 僅限 `superAdmin` 角色可呼叫
- **功能**: 根據提供的 Email 查找使用者，在 `admins` 集合中建立文件，自動觸發 `syncAdminStatus` 同步權限
- **用途**: 超級管理員可直接從網頁介面新增管理員，無需手動操作 Firestore

## Firestore 安全規則 (`firestore.rules`)

安全規則是後端安全的最後一道防線。所有規則都依賴於檢查請求者令牌中的自訂宣告。

- **`isSuperAdmin()` 輔助函式**:
  ```javascript
  function isSuperAdmin() {
    return request.auth.token.role == 'superAdmin';
  }
  ```

- **`isAdmin()` 輔助函式**:
  ```javascript
  function isAdmin() {
    return request.auth.token.role == 'admin' || isSuperAdmin();
  }
  ```

- **敏感操作保護**: 所有對資料庫的寫入操作（例如寫入 `locations`、刪除 `pending_locations`）都受到 `allow write: if isAdmin();` 的保護。

- **`admins` 集合安全**:
  - **讀取**: 僅限管理員（一般管理員或超級管理員）可讀取 (`allow read: if isAdmin();`)
  - **寫入**: 僅限超級管理員可寫入 (`allow write: if isSuperAdmin();`)
  - 一般管理員**無法**新增或移除其他管理員，確保權限控制的完整性

## Firebase Storage 安全規則 (`storage.rules`)

- **照片上傳**: 使用者只能上傳以自己 UID 開頭的檔案，防止惡意覆蓋他人檔案。
- **照片刪除**: 只有具備 `admin` 自訂宣告的使用者（即管理員）才能刪除 Storage 中的檔案。

## 重要安全實踐
- **服務帳戶私鑰**: 用於本地測試或手動執行腳本的 `serviceAccountKey.json` 檔案具有極高權限，它已被加入 `.gitignore` 中，**絕對禁止**將其提交到版本控制系統。
