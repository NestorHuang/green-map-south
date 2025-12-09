# 開發與設定指南 (Development Guide)

本文件旨在為開發者提供設定、執行與維護此專案的完整指南。

## 1. 首次環境設定

1.  **安裝依賴套件**:
    在專案根目錄下執行：
    ```bash
    npm install
    ```

2.  **設定環境變數**:
    - 將專案根目錄下的 `.env.example` 檔案 (如果存在) 複製一份，並重新命名為 `.env`。
    - 開啟 `.env` 檔案，填寫所有必要的環境變數。這包括：
      - **Firebase 設定變數** (所有以 `VITE_FIREBASE_` 開頭的變數)，這些變數可以從您的 Firebase 專案設定中找到。
      - **Google Maps API 金鑰** (`VITE_GOOGLE_MAPS_API_KEY`)，這是「上傳地點」功能將地址轉換為經緯度所必需的。您需要到 Google Cloud Platform 啟用 Geocoding API 並取得金鑰。

3.  **執行開發伺服器**:
    ```bash
    npm run dev
    ```
    伺服器啟動後，即可在瀏覽器中開啟對應的 `localhost` 網址。

## 2. 資料庫與管理員設定 (首次)

一個全新的 Firebase 專案需要進行一次性的初始化，才能讓應用程式正常運作。

### 2.1) 初始化資料庫 (Seeding)

我們提供了一個腳本，可以自動建立必要的集合 (`tags`, `locations`) 並填入範例資料。

1.  **安裝依賴**:
    ```bash
    npm install dotenv
    ```
2.  **執行腳本**:
    ```bash
    node seed_database.cjs
    ```
    執行成功後，您的 Firestore 中將會出現 `tags` 和 `locations` 集合。

### 2.2) 設定您的第一位管理員

本專案的權限由後端的 Cloud Function 自動同步。要將一位使用者設為管理員，您只需要將該使用者的 UID 加入到 Firestore 的 `admins` 集合中。

1.  **取得您的 UID**:
    - 使用您想設為管理員的 Google 帳號，在應用程式中**至少登入一次**。
    - 前往 Firebase 控制台 -> **Authentication** -> Users 分頁，找到該帳號並複製其 **User UID**。

2.  **在 Firestore 中新增管理員文件**:
    - 前往 Firebase 控制台 -> **Firestore Database**。
    - 選擇 `admins` 集合。
    - 點擊「**新增文件**」。
    - 在「**文件 ID**」欄位中，**貼上您剛剛複製的使用者 UID**。
    - 您可以為文件新增任何欄位（例如 `email: "your-email@example.com"`），或者將其留空。文件的存在本身即代表權限。
    - 點擊「儲存」。

3.  **等待權限同步**:
    - 文件儲存後，後端的 `syncAdminStatus` 雲端函式會被自動觸發，為該使用者設定管理員的自訂宣告 (Custom Claim)。

4.  **重新登入**:
    - 回到應用程式，**登出**後再**重新登入**，新的管理員權限才會生效。

## 3. 注意事項 (Cautions & Gotchas)

我們在開發過程中遇到了一些由本地環境引起的關鍵問題，記錄如下：

### Cross-Origin-Opener-Policy (COOP) 錯誤

- **症狀**: 瀏覽器主控台出現 `Cross-Origin-Opener-Policy policy would block the window.closed call.` 或 `AbortError` 錯誤，導致 Google 登入失敗或所有對 Firestore 的請求均失敗。
- **原因**: 本地開發伺服器 (Vite) 預設的 HTTP 標頭，與 Google OAuth 彈出式視窗的瀏覽器安全策略產生衝突。
- **解決方案**: 必須在 `vite.config.js` 中加入 `server.headers` 設定，以放寬此策略。詳細設定請參考 `spec-kit/TECH_STACK.md`。修改後**必須重啟**開發伺服器。

### 瀏覽器追蹤防護 (Tracking Prevention)

- **症狀**: 即使 `vite.config.js` 設定正確，在某些瀏覽器（特別是 Microsoft Edge）上，登入狀態依然會在頁面跳轉後遺失，導致管理員被導向回首頁。
- **原因**: Edge 預設的「追蹤防護」功能，可能會阻止 Firebase 將登入狀態儲存到瀏覽器中。
- **解決方案**:
  - **建議**: 在 Edge 的「隱私權」設定中，將您的開發網站 (`http://localhost:xxxx`) 加入追蹤防護的「**例外**」清單。
  - **替代方案**: 將追蹤防護等級調降為「基本」，或使用乾淨的 Google Chrome / Firefox 進行開發。
