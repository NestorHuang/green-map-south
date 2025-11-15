# 技術棧與架構 (Tech Stack & Architecture)

本文件詳述專案所使用的技術、函式庫及主要的架構決策。

## 前端 (Frontend)
- **框架**: React (v19)
- **建置工具**: Vite
- **樣式**: Tailwind CSS
- **地圖**: Leaflet / React-Leaflet
- **路由**: React Router DOM

## 後端與資料庫 (Backend & Database)
- **平台**: Firebase
- **資料庫**: Firestore
- **使用者驗證**: Firebase Authentication (Google 登入)
- **檔案儲存**: Firebase Storage
- **後端邏輯**: Firebase Cloud Functions
  - **用途**: 處理後端自動化邏輯，例如監聽資料庫變更並同步使用者權限。
- **權限管理**: Firebase Custom Claims (透過後端腳本為使用者令牌附加 `admin: true` 聲明)

## 外部服務 (External Services)
- **地理編碼 (Geocoding)**: Google Maps Geocoding API
  - **用途**: 在「上傳地點」頁面，將使用者輸入的地址字串轉換為精確的經緯度座標。
  - **決策背景**: 專案初期曾使用 OpenStreetMap 的免費 Nominatim 服務，但因其有嚴格的請求頻率限制且穩定性不足，已更換為更穩定、更可靠的 Google Maps Geocoding API。

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
