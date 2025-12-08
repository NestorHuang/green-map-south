# 資料模型 (Data Model)

本文件定義了 Firestore 資料庫的結構。

## `location_types` (集合) [新增]
定義地點的分類與動態欄位配置。

- **name**: `string` - 類型名稱 (例如: "團集會場地")
- **description**: `string` - 類型描述
- **icon**: `string` - 圖示 ID
- **iconEmoji**: `string` - 用於地圖標記的 Emoji
- **color**: `string` - 標記顏色 (HEX)
- **order**: `number` - 排序順序
- **isActive**: `boolean` - 是否啟用
- **commonFields**: `object` - 共同欄位配置 (例如 `{ name: true, address: true }`)
- **fieldSchema**: `array` of `object` - 動態欄位定義列表
  - **fieldId**: `string` - 欄位唯一 ID
  - **label**: `string` - 欄位標籤
  - **type**: `string` - 欄位類型 (text, number, select, etc.)
  - **required**: `boolean` - 是否必填
  - **unit**: `string` - (選填) 單位，僅適用於 number 類型
  - **validation**: `object` - 驗證規則
  - **options**: `array` - 選項 (select/radio 等適用)
- **createdAt**: `timestamp`
- **updatedAt**: `timestamp`
- **createdBy**: `string`
- **updatedBy**: `string`

## `locations` (集合)
公開顯示的綠活地點。

- **name**: `string` - 地點名稱
- **address**: `string` - 地址
- **description**: `string` - 描述
- **position**: `geopoint` - 地理座標
- **tags**: `array` of `string` - 標籤 ID 列表
- **photoURL**: `string` - 主要照片的公開 URL（第一張圖片，向下兼容）
- **photoURLs**: `array` of `string` - 所有照片的公開 URL 陣列（最多10張）
- **status**: `string` - ('approved')
- **submitterInfo**: `object` - 登錄者資訊（見下方說明）
- **approvedAt**: `timestamp` - 核准時間
- **typeId**: `string` - 關聯的地點類型 ID
- **dynamicFields**: `map` - 動態欄位資料，鍵為 fieldId，值為對應內容
- **createdBy**: `string` - 原始作者的 UID（地點創建者）
- **createdAt**: `timestamp` - 地點創建時間
- **updatedBy**: `string` - 最後編輯者的 UID
- **updatedAt**: `timestamp` - 最後編輯時間
- **locked**: `boolean` - 是否被管理員鎖定（鎖定後原作者無法編輯）

**submitterInfo 物件結構**:
- **uid**: `string` - 登錄者 UID
- **email**: `string` - 登錄者 Email
- **displayName**: `string` - 登錄者顯示名稱
- **isWildernessPartner**: `boolean` - 是否為荒野夥伴
- **groupName**: `string` - 團名或分會
- **naturalName**: `string` - 自然名

## `pending_locations` (集合)
使用者提交，待審核的地點。結構與 `locations` 類似，但包含額外的提交資訊。

- **submittedBy**: `string` - 使用者 UID
- **submittedAt**: `timestamp` - 提交時間
- **status**: `string` - ('pending')
- **submitterInfo**: `object` - 登錄者資訊（結構同 locations）
- **photoURL**: `string` - 主要照片 URL
- **photoURLs**: `array` of `string` - 所有照片 URL 陣列
- **typeId**: `string` - [新增] 關聯的地點類型 ID
- **dynamicFields**: `map` - [新增] 動態欄位資料
- *其他欄位同 locations*

## `users` (集合)
使用者個人資料。

- **文件 ID**: 使用者的 UID
- **uid**: `string` - 使用者 UID（冗餘欄位，便於查詢）
- **email**: `string` - 使用者 Email 地址
- **displayName**: `string` - 使用者顯示名稱或暱稱
- **isWildernessPartner**: `boolean` - 是否為荒野夥伴
- **groupName**: `string` - 團名或分會（荒野夥伴適用，否則為空字串）
- **naturalName**: `string` - 自然名（荒野夥伴適用，否則為空字串）
- **createdAt**: `timestamp` - 資料建立時間
- **updatedAt**: `timestamp` - 最後更新時間

**存取規則**:
- 使用者可讀取、建立、更新自己的資料
- 管理員可讀取所有使用者資料
- 禁止刪除使用者資料

## `tags` (集合)
可用的綠活標籤。

- **name**: `string` - 標籤顯示名稱 (例如: "全素/蔬食店")

## `reports` (集合)
使用者提交的錯誤回報。

- **locationId**: `string` - 被回報的地點 ID
- **locationName**: `string` - 被回報的地點名稱
- **reportText**: `string` - 回報內容
- **reportedBy**: `string` - 使用者 UID
- **reportedAt**: `timestamp` - 回報時間
- **status**: `string` - ('new' 或 'resolved')
- **resolvedAt**: `timestamp` - 解決時間（選填，僅當 status 為 'resolved' 時存在）

**特殊說明**:
- 同一地點可能有多個回報
- 回報頁面會按 `locationId` 分組顯示
- 每個回報可以獨立標記為已解決

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

## `audit_logs` (集合)
系統操作記錄。僅供超級管理員查看，任何人都無法修改或刪除。

- **action**: `string` - 操作類型代碼（例如：`approve_location`, `update_user`, `add_admin`）
- **actionLabel**: `string` - 操作類型中文標籤（例如：「核准地點」、「更新使用者」）
- **timestamp**: `timestamp` - 操作時間（伺服器時間）
- **operatorId**: `string` - 操作者 UID
- **operatorEmail**: `string` - 操作者 Email
- **operatorRole**: `string` - 操作者角色（`'user'`, `'admin'`, `'superAdmin'`）
- **targetId**: `string` - 操作對象 ID（選填）
- **targetName**: `string` - 操作對象名稱（選填）
- **targetType**: `string` - 操作對象類型（例如：`'location'`, `'user'`, `'admin'`）
- **changes**: `object` - 變更詳情（選填，JSON 格式）
- **reason**: `string` - 操作原因（選填，僅部分操作適用）

**操作類型列表**:
- `approve_location` - 核准地點
- `reject_location` - 拒絕地點
- `create_location` - 新增地點
- `update_location` - 更新地點（管理員或使用者編輯）
- `delete_location` - 刪除地點
- `lock_location` - 鎖定地點
- `unlock_location` - 解鎖地點
- `update_user` - 更新使用者資料
- `add_admin` - 新增管理員
- `remove_admin` - 移除管理員

**存取規則**:
- **讀取**: 僅限超級管理員（`request.auth.token.role == 'superAdmin'`）
- **新增**: 管理員（`request.auth.token.role in ['admin', 'superAdmin']`）
- **更新/刪除**: 禁止任何人執行（`allow update, delete: if false`）

**特殊說明**:
- 所有操作記錄由系統自動產生，透過 `src/utils/auditLog.js` 工具函數記錄
- 操作者資訊自動從 Firebase Auth 當前使用者取得
- 記錄不可變更，確保稽核追蹤的完整性與可信度

## `user_drafts` (集合) [新增]
使用者的地點登錄草稿，用於暫存尚未完成的表單資料。

- **文件 ID**: 使用者的 UID
- **內含子集合**: `location_drafts`

### `location_drafts` (子集合)
每個地點類型的草稿。

- **文件 ID**: 地點類型 ID (`typeId`)
- **commonFields**: `object` - 基本欄位資料
  - **name**: `string` - 地點名稱
  - **address**: `string` - 地址
  - **description**: `string` - 描述
- **dynamicFields**: `map` - 動態欄位資料
- **selectedTags**: `array` of `string` - 選中的標籤 ID 列表
- **selectedCoverIndex**: `number` - 選中的代表圖索引
- **savedAt**: `timestamp` - 最後儲存時間
- **expiresAt**: `timestamp` - 過期時間（30 天後自動刪除）

**存取規則**:
- **讀寫**: 使用者只能存取自己的草稿（`request.auth.uid == userId`）
- **自動清理**: 草稿在 30 天後過期（可透過 Firebase TTL Policy 自動刪除）

**儲存機制**:
- **自動儲存**: 使用者填寫表單時，每 3 秒自動儲存一次
- **跨裝置同步**: 使用者可在不同裝置上繼續填寫同一份草稿
- **提交後清除**: 成功提交地點後，草稿會自動刪除
- **僅限新增**: 編輯現有地點時不會儲存草稿