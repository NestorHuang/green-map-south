# 資料模型 (Data Model)

本文件定義了 Firestore 資料庫的結構。

*(詳細內容待補充)*

## `locations` (集合)
公開顯示的綠活地點。

- **name**: `string` - 地點名稱
- **address**: `string` - 地址
- **description**: `string` - 描述
- **position**: `geopoint` - 地理座標
- **tags**: `array` of `string` - 標籤 ID 列表
- **photoURL**: `string` - 照片的公開 URL
- **status**: `string` - ('approved')
- ...

## `pending_locations` (集合)
使用者提交，待審核的地點。結構與 `locations` 類似，但包含額外的提交資訊。

- **submittedBy**: `string` - 使用者 UID
- **submittedAt**: `timestamp` - 提交時間
- **status**: `string` - ('pending')
- ...

## `tags` (集合)
可用的綠活標籤。

- **name**: `string` - 標籤顯示名稱 (例如: "全素/蔬食店")

## `reports` (集合)
使用者提交的錯誤回報。

- **locationId**: `string` - 被回報的地點 ID
- **reportText**: `string` - 回報內容
- **reportedBy**: `string` - 使用者 UID
- **status**: `string` - ('new' 或 'resolved')
- ...

## `admins` (集合)
管理員列表。此集合為權限管理的單一事實來源 (Source of Truth)。

- **文件 ID**: 使用者的 UID
- **email**: `string` - 管理員的 Email 地址
- **role**: `string` - 管理員角色
  - `'admin'`: 一般管理員，可審核地點、處理回報
  - `'superAdmin'`: 超級管理員，具備管理員管理權限
- **addedAt**: `timestamp` - 新增時間 (自動設定為伺服器時間)

**權限同步機制**:
- 當此集合中的文件被建立、更新或刪除時，Cloud Function `syncAdminStatus` 會自動將 `role` 欄位同步到 Firebase Auth 的 Custom Claims
- Custom Claim 格式: `{ role: 'admin' }` 或 `{ role: 'superAdmin' }`
- 使用者必須登出並重新登入後，新的 Custom Claim 才會生效

**管理方式**:
- **網頁介面**: 超級管理員可透過 `/admin/manage-admins` 頁面新增、刪除、同步管理員
- **命令列工具**: 提供 `add_admin.cjs`、`check_user_claims.cjs` 等 CLI 工具供離線管理
