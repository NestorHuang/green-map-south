# 功能規格書 (Functional Specs)

本文件詳述系統 A, B, C 三大模組的具體功能規格。

## 模組 A: 地圖與搜尋 (Map & Search)
此為使用者查找資訊的核心介面。

| ID   | 功能規格描述 (依據 Q&A 決議) |
| :--- | :--- |
| **F-A1** | **互動地圖初始化**<br> **平台類型**: PWA (Web App)，使用 **Google Maps Platform**。<br> **地圖邏輯**: 必須採用 **GPS 優先** 邏輯。<br> 1. (優先) 請求 `navigator.geolocation` 取得使用者 GPS。<br> 2. (預設) 若失敗，預設中心點為「高雄市火車站」。<br> 3. **縮放尺度**: 初始地圖縮放等級應顯示中心點半徑約 500 公尺的範圍。<br> 4. **API 載入**: Google Maps API 腳本在應用程式啟動時於頂層統一載入，確保跨頁面導航時的穩定性。 |
| **F-A2** | *(待補充)* |
| **F-A3** | **地點詳情互動介面**<br> **模式**: 必須採用「**資訊面板模式 (Bottom Sheet)**」。<br> 1. 使用者點擊地圖上的圖釘 (Pin)。<br> 2. **禁止**彈出傳統小資訊卡或跳轉頁面。<br> 3. 應由螢幕下方滑出「資訊面板」，直接顯示 F-A3 的完整詳情。 |
| **F-A4** | **關鍵字搜尋**<br>1. 在 Header UI 中提供一個文字輸入框。<br>2. 使用 **Google Places Autocomplete** 服務，使用者輸入文字時，動態提供地點建議。<br>3. 使用者選擇地點後，地圖中心點會移動到該地點，並放大顯示。<br>4. **注意**: Google Places Autocomplete 服務目前會顯示棄用警告 (`google.maps.places.Autocomplete is not available to new customers...`)，此為第三方函式庫內部問題，不影響功能，待函式庫更新。 |
| **F-A5** | **分類與標籤篩選**<br>1. 在 Header UI 中提供一組標籤按鈕。<br>2. 點擊標籤按鈕後，地圖應只顯示包含該標籤的地點。<br>3. 需提供「清除篩選」的選項。 |
| **F-A6** | **標記點棄用警告**<br>目前使用的 `google.maps.Marker` 會顯示棄用警告 (`google.maps.Marker is deprecated...`)。此為第三方函式庫內部問題，不影響功能，待函式庫更新或未來版本升級時替換為 `AdvancedMarkerElement`。 |
| **F-A-RWD** | **響應式介面 (RWD)**<br>應用程式的所有核心介面均已進行響應式設計優化。<br>1. **Header**: 在手機版視圖下，導覽選項（如登入、上傳）會收合在一個漢堡選單中，確保搜尋和篩選功能的可見性。<br>2. **管理後台**: 在手機版視圖下，側邊導覽列會預設隱藏，並可透過漢堡選單按鈕喚出，以適應較小的螢幕寬度。 |

## 模組 B: 伙伴貢獻 (Partner Contribution)
此為「綠活伙伴」貢獻資料的核心功能。

| ID   | 功能規格描述 |
| :--- | :--- |
| **F-B1** | **快速上傳**<br>1. 提供一個 `/upload` 頁面，僅限登入使用者存取。<br>2. 表單應包含：名稱、地址、描述、照片、標籤。<br>3. 系統需將地址轉換為地理座標。**此功能依賴外部服務 [OpenStreetMap Nominatim API](https://nominatim.org/)**。<br>4. 提交的資料應進入 `pending_locations` 集合等待審核。 |
| **F-B1 Auth** | **社交帳號登入**<br>1. 提供 Google 帳號快速登入選項。<br>2. 登入後，UI 應顯示使用者資訊與登出選項。 |
| **F-B1 Photos**| **照片上傳**<br>1. 上傳表單中需包含圖片上傳功能。<br>2. 圖片應上傳至 Firebase Storage，並將 URL 存入對應的文件中。 |
| **F-B3** | **回報錯誤**<br>1. 在地點詳情面板 (F-A3) 中，為登入使用者提供「回報錯誤」按鈕。<br>2. 點擊後彈出一個表單，讓使用者填寫問題描述。<br>3. 提交的回報應存入 `reports` 集合。 |

## 模組 C: 管理員功能 (Admin)
此為「平台管理員」維護資料品質的後台功能。

| ID   | 功能規格描述 |
| :--- | :--- |
| **F-C1** | **審核待處理地點**<br>1. 提供一個 `/admin/pending` 頁面，顯示 `pending_locations` 集合中的所有文件。<br>2. 提供「核准」與「拒絕」按鈕。<br>3. **核准**: 將文件複製到 `locations` 集合，並從 `pending_locations` 刪除。<br>4. **拒絕**: 從 `pending_locations` 刪除文件，並刪除 Storage 中的對應圖片。 |
| **F-C2** | **管理回報與資料**<br>1. 提供一個 `/admin/reports` 頁面，顯示 `reports` 集合中的文件。<br>2. 提供「標示為已解決」功能，更新文件狀態。<br>3. (未來) 提供管理現有地點與標籤的介面。 |
| **F-C3** | **管理標籤**<br> (未來) 提供新增、修改、刪除「綠活標籤」的介面。 |
| **F-C4** | **超級管理員系統**<br>系統採用「**超級管理員**」(Super Admin) 與「**一般管理員**」(Admin) 兩級權限分離架構。<br>1. **角色定義**:<br>   - `superAdmin`: 最高權限，能夠管理其他管理員帳號<br>   - `admin`: 一般管理員，僅能審核地點、處理回報<br>2. **權限同步**: 後端的雲端函式 `syncAdminStatus` 會自動將 Firestore 中 `admins` 集合的 `role` 欄位同步到 Firebase Auth 的 Custom Claims (`role: 'admin'` 或 `role: 'superAdmin'`)。<br>3. **初始設定**: 預設超級管理員需透過命令列工具 (`setup_nestor_super_admin.cjs`) 或手動操作 Firebase 控制台設定。 |
| **F-C5** | **管理員帳號管理介面** (`/admin/manage-admins`)<br>僅限超級管理員存取的管理員管理頁面，提供以下功能：<br>1. **列出管理員**: 顯示所有管理員的列表，包含 Email、角色、同步狀態。<br>2. **同步狀態檢查**: 即時顯示每個管理員的 Custom Claim 是否與 Firestore 同步。<br>   - ✓ 已同步: Firestore `role` 與 Custom Claim 一致<br>   - ⚠ 未同步: 兩者不一致，顯示「同步權限」按鈕<br>3. **手動同步**: 當同步狀態異常時，超級管理員可點擊「同步權限」按鈕，呼叫 Cloud Function `syncAdminClaim` 手動觸發同步。<br>4. **新增管理員**: 透過網頁表單輸入 Email 地址新增一般管理員，呼叫 Cloud Function `addAdminByEmail`。<br>5. **移除管理員**: 刪除一般管理員（無法刪除超級管理員）。<br>6. **詳細資訊**: 可展開查看每個管理員的完整 Custom Claims 與 Firestore 資料。<br>7. **命令列工具**: 另提供 CLI 工具 (`add_admin.cjs`, `check_user_claims.cjs`) 供離線管理。 |
