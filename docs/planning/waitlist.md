# 多重登錄系統開發待辦清單

## 當前進度

✅ **Phase 1: 數據模型建立（已完成）**
- ✅ 更新 Firestore Rules
- ✅ 更新 Firestore Indexes
- ✅ 創建資料遷移腳本
- ✅ 創建 checkInDuplication.js 工具
- ✅ 創建 useCheckIns hook
- ✅ 創建 checkIns.js 服務層

---

## 待完成項目

### Phase 2: 前端組件開發（進行中）

#### 2.1 登錄表單組件
- [ ] 創建 `src/components/CheckInForm.jsx` - 登錄表單組件
  - 簡化版表單（地點資訊已預填）
  - 照片上傳
  - 描述輸入
  - 標籤選擇
  - 動態欄位

#### 2.2 相似地點檢測
- [ ] 創建 `src/components/SimilarLocationsModal.jsx` - 相似地點提示彈窗
  - 顯示相似地點列表
  - 提供「登錄此地點」和「繼續提交為新地點」選項
  - 顯示相似度、距離、已有登錄數

#### 2.3 表單整合
- [ ] 修改 `src/components/LocationFormContent.jsx`
  - 支援「新增地點」和「登錄地點」兩種模式
  - 在填寫過程中觸發相似地點檢測
  - 整合 CheckInForm

#### 2.4 地點詳情頁面
- [ ] 創建 `src/pages/LocationDetailPage.jsx` - 公開地點詳情頁
  - 路由：`/location/:id`
  - 顯示地點基本資訊
  - 整合登錄時間軸
  - 整合統計資訊
  - 任何人（包括未登入）可訪問

#### 2.5 登錄展示組件
- [ ] 創建 `src/components/CheckInTimeline.jsx` - 登錄時間軸
  - 顯示所有登錄記錄（包括 firstCheckIn）
  - 按時間倒序排列
  - 標記首次登錄

- [ ] 創建 `src/components/CheckInCard.jsx` - 登錄卡片
  - 顯示提交者資訊
  - 照片輪播
  - 描述內容
  - 標籤
  - 檢舉按鈕（登入使用者）

- [ ] 創建 `src/components/LocationStats.jsx` - 統計資訊組件
  - 總登錄次數
  - 獨立登錄者數
  - 最近登錄時間

#### 2.6 照片畫廊
- [ ] 創建 `src/components/PhotoGallery.jsx` - 照片畫廊
  - 收集所有登錄的照片
  - 網格展示
  - Lightbox 全螢幕檢視

#### 2.7 現有組件調整
- [ ] 修改 `src/components/LocationDetailSheet.jsx`
  - 新增「查看完整資訊」按鈕
  - 跳轉到 LocationDetailPage

- [ ] 修改 `src/pages/HomePage.jsx`
  - 調整地圖標記點擊行為
  - 支援跳轉到詳情頁

- [ ] 修改 `src/App.jsx`
  - 新增 `/location/:id` 路由

### Phase 3: 管理員審核界面

#### 3.1 待審核登錄頁面
- [ ] 創建 `src/pages/PendingCheckInsPage.jsx` - 待審核登錄管理
  - 按地點分組顯示
  - 檢測重複登錄並標記
  - 核准/拒絕操作
  - 並排比對重複登錄

#### 3.2 待審核地點頁面調整
- [ ] 修改 `src/pages/PendingLocationsPage.jsx`
  - 新增分頁：「待審核地點」和「待審核登錄」
  - 新增「轉為登錄記錄」操作
  - 顯示相似地點提示

#### 3.3 重複登錄檢測界面
- [ ] 創建 `src/components/DuplicateCheckInModal.jsx` - 重複登錄比對
  - 並排顯示疑似重複的登錄
  - 顯示相似度和相似原因
  - 核准/拒絕操作

### Phase 4: 檢舉系統

#### 4.1 擴展檢舉功能
- [ ] 修改 `src/components/ReportModal.jsx`
  - 支援檢舉登錄（新增 reportType）
  - 新增 checkInId 參數
  - 區分「地點資訊錯誤」和「重複/無效登錄」

#### 4.2 管理員檢舉處理
- [ ] 修改 `src/pages/ManageReportsPage.jsx`（如存在）
  - 顯示登錄檢舉
  - 快速處理介面

### Phase 5: 用戶體驗優化

#### 5.1 我的登錄
- [ ] 修改 `src/components/MyLocationsModal.jsx`
  - 新增「我的登錄」分頁
  - 顯示使用者的所有登錄記錄

#### 5.2 載入狀態
- [ ] 新增載入動畫組件
- [ ] 錯誤處理優化
- [ ] Toast 通知系統

#### 5.3 響應式設計
- [ ] 確保所有新組件支援手機版
- [ ] 優化觸控操作

---

## 部署前檢查清單

### 資料庫配置
- [ ] 部署 Firestore Rules：`firebase deploy --only firestore:rules`
- [ ] 部署 Firestore Indexes：`firebase deploy --only firestore:indexes`
- [ ] 執行資料遷移腳本：`node scripts/migrate_to_checkins.cjs migrate`
- [ ] 驗證遷移結果：`node scripts/migrate_to_checkins.cjs verify`

### 測試
- [ ] 單元測試：checkInDuplication.js
- [ ] 整合測試：提交登錄流程
- [ ] 整合測試：審核登錄流程
- [ ] 使用者測試：完整流程

### 文檔
- [ ] 更新 README.md
- [ ] 創建使用者手冊
- [ ] 創建管理員手冊

---

## 風險評估

### 高優先級風險
1. **資料遷移失敗**
   - 解決方案：在測試環境先測試，備份資料
   - 狀態：⚠️ 待處理

2. **效能問題（大量登錄）**
   - 解決方案：分頁載入、虛擬滾動
   - 狀態：⚠️ 待處理

3. **使用者誤判（該登錄卻新增）**
   - 解決方案：明確的 UI 指引、管理員可轉換
   - 狀態：⚠️ 待處理

### 中優先級風險
4. **惡意大量登錄**
   - 解決方案：7 天限制、管理員審核、內容檢測
   - 狀態：✅ 已實作（服務層）

5. **首次登錄資料丟失**
   - 解決方案：遷移腳本測試、保留原欄位
   - 狀態：✅ 已實作

---

## 預計時程

- **Phase 2（前端組件）**：3-4 天
- **Phase 3（管理員界面）**：2-3 天
- **Phase 4（檢舉系統）**：1-2 天
- **Phase 5（優化）**：1-2 天
- **測試與部署**：1-2 天

**總計**：8-13 天

---

## 當前聚焦

🎯 **正在進行**：Phase 2 - 前端組件開發
📍 **下一步**：創建 CheckInForm 登錄表單組件

---

_最後更新：2025-12-07_
