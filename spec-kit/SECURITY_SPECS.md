# 資訊安全規格 (Security Specs)

本文件定義了專案的資訊安全策略，其核心是圍繞一個結合了 Firestore、Cloud Functions 與 Firebase Auth Custom Claims 的混合權限模型。

## 核心概念：以 Firestore 為單一事實來源 (Source of Truth)

本專案的權限管理，以 Firestore 中的 `admins` 集合為唯一的「單一事實來源」。管理員的身份是透過在該集合中新增或刪除一個以使用者 UID 命名的文件來定義的。

然而，為了實現高效能與高安全性，應用程式並不直接查詢此集合來判斷權限。而是透過後端的自動化流程，將此集合的狀態**同步**到 Firebase Auth 的「自訂宣告 (Custom Claims)」中。

最終，前端應用程式與後端安全規則，都統一依賴附加在使用者認證令牌 (ID Token) 中的 `admin: true` 聲明來判斷權限。

## 自動化權限同步：Cloud Functions

我們部署了一個名為 `syncAdminStatus` 的 Firestore 觸發的雲端函式，其職責如下：

- **監聽 `admins/{userId}` 路徑**: 當此路徑下的任何文件被**建立、更新或刪除**時，此函式會自動執行。
- **建立/更新時**: 當文件被寫入時，函式會取得 `userId`，並為對應的 Firebase 使用者設定 `{ admin: true }` 的自訂宣告。
- **刪除時**: 當文件被刪除時，函式會移除該使用者的自訂宣告。

這個機制確保了 `admins` 集合的狀態與使用者的實際權限（自訂宣告）始終保持最終一致。

## Firestore 安全規則 (`firestore.rules`)

安全規則是後端安全的最後一道防線。所有規則都依賴於檢查請求者令牌中的自訂宣告。

- **`isAdmin()` 輔助函式**:
  ```javascript
  function isAdmin() {
    return request.auth.token.admin == true;
  }
  ```
- **敏感操作保護**: 所有對資料庫的寫入操作（例如寫入 `locations`、刪除 `pending_locations`）都受到 `allow write: if isAdmin();` 的保護。
- **`admins` 集合安全**: 為了確保權限來源的完整性，`admins` 集合被設定為**完全禁止**來自任何客戶端的寫入操作 (`allow write: if false;`)。管理員的增刪只能透過 Firebase 控制台手動操作，然後由上述的雲端函式自動同步權限。

## Firebase Storage 安全規則 (`storage.rules`)

- **照片上傳**: 使用者只能上傳以自己 UID 開頭的檔案，防止惡意覆蓋他人檔案。
- **照片刪除**: 只有具備 `admin` 自訂宣告的使用者（即管理員）才能刪除 Storage 中的檔案。

## 重要安全實踐
- **服務帳戶私鑰**: 用於本地測試或手動執行腳本的 `serviceAccountKey.json` 檔案具有極高權限，它已被加入 `.gitignore` 中，**絕對禁止**將其提交到版本控制系統。
