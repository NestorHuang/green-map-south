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
管理員列表。

- **文件 ID**: 使用者的 UID
- **name**: `string` - 管理員名稱 (或其他識別欄位)
