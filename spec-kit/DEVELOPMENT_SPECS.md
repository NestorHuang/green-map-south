# 開發規格書 (Development Specs)

本文檔為「南區綠活圖」前端應用程式的詳細開發規格與指南，旨在提供開發者所需的核心架構、程式碼慣例與工作流程資訊。

---

## 1. 專案概覽

本專案是一個使用 React 和 Firebase 建構的漸進式網頁應用 (PWA)，核心功能是提供一個由社群貢獻的綠色生活地圖。

- **主要技術棧**: React, Vite, Tailwind CSS, Firebase
- **核心理念**:
  - **元件化**: UI 切分為可重用的元件。
  - **狀態集中管理**: 使用 React Context 進行全域身份驗證狀態管理。
  - **宣告式路由**: 使用 React Router DOM 進行頁面導航。
  - **無伺服器架構**: 所有後端邏輯與資料庫均由 Firebase 處理。

---

## 2. 專案結構 (`/src`)

```
/src
├── assets/              # 靜態資源 (SVG, etc.)
├── components/          # 可重用的 React 元件
│   ├── AdminRoute.jsx
│   ├── Header.jsx
│   ├── ImageSlider.jsx
│   ├── LocationDetailSheet.jsx
│   ├── PlacesAutocomplete.jsx
│   ├── ProtectedRoute.jsx
│   ├── ReportModal.jsx
│   ├── SuperAdminRoute.jsx
│   └── UserProfileModal.jsx
├── contexts/            # React Context (全域狀態管理)
│   ├── AuthContext.jsx
│   └── AuthContextDefinition.js
├── hooks/               # 自定義 React Hooks (邏輯複用)
│   ├── useAdmin.js
│   ├── useAuth.js
│   ├── useDebounce.js
│   └── useSuperAdmin.js
├── pages/               # 頁面級元件 (對應路由)
│   ├── AdminLayout.jsx
│   ├── HomePage.jsx
│   └── ...
├── utils/               # 通用工具函式 (目前為空)
├── App.jsx              # 應用程式主入口與路由設定
├── firebaseConfig.js    # Firebase 初始化與服務導出
├── main.jsx             # React 應用程式掛載點
└── ... (CSS files)
```

### 2.1. 核心目錄職責

- **`/components`**: 存放可跨頁面重用的 UI 元件。例如 `Header.jsx` 是網站頂部導覽列，`LocationDetailSheet.jsx` 是地圖下方彈出的地點資訊卡。
- **`/pages`**: 存放與路由直接對應的頁面級元件。例如 `HomePage.jsx` 對應首頁，`RegisterLocationPage.jsx` 對應地點登錄頁。
- **`/contexts`**: 存放全域狀態管理邏輯。`AuthContext.jsx` 是身份驗證的核心，提供使用者登入狀態、個人資料及管理員權限等資訊。
- **`/hooks`**: 存放自定義 Hooks，用於封裝與重用業務邏輯。`useAuth.js` 是最常用的 Hook，用於在任何元件中快速取得 `AuthContext` 的狀態。

### 2.2. 關鍵檔案

- **`App.jsx`**:
  - **路由定義中心**: 使用 `react-router-dom` 的 `<Routes>` 和 `<Route>` 設定所有應用程式的 URL 路徑。
  - **路由守衛**: 在此處使用 `ProtectedRoute`, `AdminRoute`, `SuperAdminRoute` 來保護需要特定權限才能存取的頁面。
  - **Google Maps API 載入**: 使用 `@react-google-maps/api` 的 `useLoadScript` 在應用程式頂層統一載入 Google Maps API，確保 API 在所有頁面中都可用。

- **`main.jsx`**:
  - **應用程式根**: 這是 React 應用程式的起點。
  - **Provider 包裹**: 在這裡使用 `<AuthProvider>` 將整個 `<App />` 包裹起來，使得所有子元件都能透過 `useAuth` Hook 存取到身份驗證的狀態。

- **`firebaseConfig.js`**:
  - **Firebase 初始化**: 從 `.env` 環境變數讀取 Firebase 設定並初始化 Firebase App。
  - **服務導出**: 導出 `db` (Firestore), `auth` (Authentication), `storage` (Storage) 等實例，供整個應用程式使用。

---

## 3. 核心架構與模式

### 3.1. 身份驗證與權限控制 (Authentication & Authorization)

本專案的權限系統是核心，其流程如下：

1.  **登入**: 使用者透過 `Header.jsx` 中的按鈕，使用 Firebase Authentication 的 Google 登入彈窗進行登入。
2.  **狀態監聽**: `AuthProvider` (`/contexts/AuthContext.jsx`) 中的 `onAuthStateChanged` 監聽器會捕捉到登入狀態的變化。
3.  **取得 Custom Claims**:
    - 登入成功後，`AuthProvider` 會強制刷新使用者的 ID Token (`user.getIdTokenResult(true)`)。
    - ID Token 中包含了由後端 Cloud Function (`syncAdminStatus`) 設定的 Custom Claims，例如 `{ role: 'admin' }` 或 `{ role: 'superAdmin' }`。
4.  **設定 Context 狀態**: `AuthProvider` 根據 ID Token 中的 `claims.role` 來設定 `isAdmin` 或 `isSuperAdmin` 狀態，並將使用者物件、個人資料、權限狀態等存入 Context 中。
5.  **消費狀態**:
    - **UI 顯示**: `Header.jsx` 等元件使用 `useAuth()` 取得使用者名稱、`useAdmin()` 取得管理員狀態，以決定是否顯示「管理後台」按鈕。
    - **路由保護**: `AdminRoute.jsx` 和 `SuperAdminRoute.jsx` 等路由守衛元件，使用 `useAdmin()` 或 `useSuperAdmin()` 檢查權限。如果權限不足或正在檢查中，它們會顯示載入訊息或將使用者重導向回首頁。

### 3.2. 自定義 Hooks (Custom Hooks)

- **`useAuth()`**:
  - **用途**: 提供對 `AuthContext` 的單一存取點。
  - **回傳值**: `{ user, userProfile, isAdmin, loading, reloadUserProfile }`
  - **最佳實踐**: 在任何需要使用者登入狀態或個人資料的元件中，都應使用此 Hook。

- **`useAdmin()`** & **`useSuperAdmin()`**:
  - **用途**: 專門用於檢查管理員與超級管理員權限。它們是對 `useAuth()` 的一層薄封裝，使權限檢查的意圖更明確。
  - **最佳實踐**: 在需要特定權限的元件或路由守衛中，應優先使用這兩個 Hooks。

### 3.3. 狀態管理 (State Management)

- **全域狀態**: 僅限於「身份驗證」相關的狀態 (使用者、個人資料、權限) 由 `AuthContext` 管理。
- **本地狀態**: 頁面或元件的自身狀態（例如表單輸入、API 請求的載入狀態、地圖中心點等）應使用 `useState` 在各自的元件內部管理。例如 `HomePage.jsx` 使用多個 `useState` 來管理地圖位置、篩選標籤和地點資料。

### 3.4. 資料流 (Data Flow) - 以地點登錄為例

1.  **使用者操作**: 使用者在 `RegisterLocationPage.jsx` 填寫表單並點擊「提交」。
2.  **事件處理**: `handleSubmit` 函式被觸發。
3.  **外部 API 呼叫**:
    - 函式首先呼叫 Google Geocoding API 將地址轉換為經緯度。
    - 接著，將使用者上傳的圖片檔案上傳到 Firebase Storage，並取得回傳的公開 URL。
4.  **資料庫寫入**:
    - 函式將表單資料、地理座標、圖片 URL 陣列以及從 `useAuth()` 取得的 `userProfile` 資訊，組合成一個物件。
    - 使用 `addDoc` 將此物件寫入 Firestore 的 `pending_locations` 集合中。
5.  **UI 反饋**: 顯示成功訊息 (`alert`)，並使用 `useNavigate()` 將使用者導航回首頁。

---

## 4. 程式碼慣例與樣式

- **命名**:
  - **元件**: 使用 `PascalCase` (e.g., `LocationDetailSheet.jsx`)。
  - **Hooks**: 使用 `camelCase` 並以 `use` 開頭 (e.g., `useAuth.js`)。
  - **變數/函式**: 使用 `camelCase` (e.g., `handleSignOut`)。
- **樣式**:
  - **主要方案**: Tailwind CSS。所有樣式應優先使用 Tailwind 的 utility classes。
  - **全域樣式**: `index.css` 包含基礎樣式與 Tailwind 的 `@tailwind` 指令。
  - **元件特定樣式**: `App.css` 包含一些無法輕易用 Tailwind 實現的特定樣式（應盡量減少）。
- **ESLint**:
  - 專案已設定 ESLint (`eslint.config.js`) 來強制執行程式碼風格和品質。
  - 開發前請確保您的編輯器已整合 ESLint，並在提交前執行 `npm run lint`。
- **環境變數**:
  - 所有需要在前端使用的環境變數（如 API 金鑰）都必須以 `VITE_` 作為前綴，並定義在根目錄的 `.env` 檔案中。
  - **絕對禁止**將敏感資訊（如私鑰）直接寫入程式碼。

---

## 5. 維護與注意事項

- **相依性管理**:
  - `@react-google-maps/api`: 此函式庫目前存在一些關於 `Marker` 和 `Autocomplete` 的棄用警告 (deprecation warnings)。這些警告源於函式庫內部，暫時不影響功能，但未來升級時需特別關注。
- **開發伺服器設定**:
  - `vite.config.js` 中的 `server.headers` 設定對於解決 Google 登入的 `Cross-Origin-Opener-Policy` (COOP) 問題至關重要。若登入功能異常，請優先檢查此設定。
- **權限變更**:
  - 由於 Custom Claims 是附加在 ID Token 上的，當管理員權限變更後（例如被新增或移除），該使用者必須**登出並重新登入**，新的權限才會生效。
