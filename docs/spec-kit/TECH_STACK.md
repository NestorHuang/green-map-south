# 技術棧與架構 (Tech Stack & Architecture)

本文件詳述專案所使用的技術、函式庫及主要的架構決策。

## 前端 (Frontend)
- **框架**: React (v19)
- **建置工具**: Vite
- **樣式**: Tailwind CSS
- **地圖**: @react-google-maps/api
- **路由**: React Router DOM

## 地圖 API 載入策略
- **載入機制**: Google Maps API 腳本透過 `@react-google-maps/api` 提供的 `useLoadScript` Hook，在應用程式的頂層組件 (`App.jsx`) 中統一載入。這確保了 API 在整個應用程式生命週期中只被請求一次，避免了在頁面導航時重複載入或初始化導致的問題。
- **函式庫**: 載入時包含 `places` 函式庫，以支援地點搜尋功能。
- **棄用警告**:
  - **Places Autocomplete**: 目前使用的 `Autocomplete` 組件在底層會觸發 `google.maps.places.Autocomplete is not available to new customers...` 的棄用警告。此為第三方函式庫內部問題，不影響功能，待函式庫更新。
  - **Marker**: 目前使用的 `Marker` 組件會觸發 `google.maps.Marker is deprecated...` 的棄用警告。此為第三方函式庫內部問題，不影響功能，待函式庫更新或未來版本升級時替換為 `AdvancedMarkerElement`。

## 後端與資料庫 (Backend & Database)
- **平台**: Firebase
- **資料庫**: Firestore
- **使用者驗證**: Firebase Authentication (Google 登入)
- **檔案儲存**: Firebase Storage
- **後端邏輯**: Firebase Cloud Functions
  - **用途**: 處理後端自動化邏輯，例如監聽資料庫變更並同步使用者權限。
- **權限管理**: Firebase Custom Claims (透過後端腳本為使用者令牌附加 `admin: true` 聲明)

## 外部服務 (External Services)
- **地理編碼與地點搜尋**: Google Maps Platform (Places API, Geocoding API)
  - **用途**: 在「上傳地點」頁面，將使用者輸入的地址字串轉換為精確的經緯度座標；在前端提供地點自動完成搜尋功能。
  - **決策背景**: 專案初期曾使用 OpenStreetMap 的免費 Nominatim 服務，但因其有嚴格的請求頻率限制且穩定性不足，已更換為更穩定、更可靠的 Google Maps Platform 服務。

## 架構決策
- **PWA (Progressive Web App)**: 採用 PWA 模式，提供類原生的使用體驗。
- **無伺服器架構 (Serverless)**: 完全依賴 Firebase 服務，無需自行管理後端伺服器。
- **基於聲明的角色存取控制 (Claims-based RBAC)**: 採用 Firebase Custom Claims 作為權限判斷的唯一依據，此方法比傳統的資料庫查詢更高效且更安全。

## 開發環境 (Development Environment)
- **Vite 伺服器設定**: 為了處理 Firebase Google 登入彈窗與瀏覽器 `Cross-Origin-Opener-Policy` (COOP) 安全策略的衝突，`vite.config.js` 中必須加入特定的 HTTP 標頭設定：
  ```javascript
  // vite.config.js
  export default defineConfig({
    // ...
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
    },
  })
  ```
