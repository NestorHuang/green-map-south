# 綠地圖南方 Green Map South

荒野保護協會南方分會的綠地圖平台，幫助夥伴們記錄與分享南台灣的綠色空間與自然教育場域。

## 🌿 專案簡介

綠地圖南方是一個為荒野保護協會南方分會設計的地圖平台，讓荒野夥伴可以：
- 📍 標記和分享南台灣的綠色空間
- 🗺️ 查看並探索其他夥伴推薦的場域
- 📝 記錄場域的詳細資訊（容納人數、交通方式、注意事項等）
- 👥 分享活動經驗與使用心得

## 🚀 快速開始

### 環境需求

- Node.js 16+
- npm 或 yarn
- Firebase 專案（需配置 Firestore、Authentication、Storage）

### 安裝

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build
```

### 配置

1. 在專案根目錄創建 `.env` 文件
2. 添加 Firebase 配置：

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📚 文件

完整的文件資料請參考 [文件中心](docs/README.md)

### 快速連結

- **使用指南**
  - [📖 使用者操作手冊](docs/user-manuals/user_operation_guide.md) - 圖文並茂完整指南
  - [訪客指南](docs/guides/visitor_guide.md)
  - [夥伴指南](docs/guides/partner_guide.md)
  - [管理員指南](docs/guides/admin_guide.md)

- **開發文件**
  - [技術棧](docs/spec-kit/TECH_STACK.md)
  - [開發指南](docs/spec-kit/DEVELOPMENT_GUIDE.md)
  - [數據模型](docs/spec-kit/DATA_MODEL.md)

- **規格文件**
  - [專案簡介](docs/spec-kit/PROJECT_BRIEF.md)
  - [功能規格](docs/spec-kit/FUNCTIONAL_SPECS.md)
  - [用戶故事](docs/spec-kit/USER_STORIES.md)

## 🏗️ 技術架構

- **前端**: React 18 + Vite
- **樣式**: Tailwind CSS
- **地圖**: Google Maps API
- **後端**: Firebase (Firestore, Auth, Storage, Hosting)
- **狀態管理**: React Context API
- **部署**: Firebase Hosting

## 📁 專案結構

```
green-map-south/
├── src/                    # 原始碼
│   ├── components/        # React 組件
│   ├── contexts/          # Context 提供者
│   ├── hooks/             # 自訂 Hooks
│   ├── pages/             # 頁面組件
│   ├── services/          # API 服務
│   └── utils/             # 工具函數
├── docs/                   # 完整文件
│   ├── guides/            # 使用指南
│   ├── user-manuals/      # 使用手冊
│   ├── technical/         # 技術文件
│   ├── spec-kit/          # 規格文件
│   └── planning/          # 規劃文件
├── scripts/               # 管理腳本
└── public/                # 靜態資源
```

## 🔐 權限系統

系統採用三級權限設計：

1. **訪客** - 瀏覽已核准的地點
2. **荒野夥伴** - 提交新地點、編輯自己的地點
3. **管理員** - 審核地點、管理內容
4. **超級管理員** - 管理管理員、系統設定

詳情請參考 [安全規格](docs/spec-kit/SECURITY_SPECS.md)

## 🎯 核心功能

### ✅ 已實現
- 📍 地點標記與展示
- 🗂️ 動態類型系統（可自訂欄位）
- 📸 照片上傳與管理
- 🔐 用戶認證與權限管理
- ✏️ 地點審核流程
- 🏷️ 標籤系統
- 🔍 重複地點檢測與 Slider 顯示
- 💾 草稿儲存功能
- 📊 操作記錄（Audit Logs）

### 🚧 開發中
請參考 [功能待辦清單](docs/planning/waitlist.md)

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

在提交 PR 前，請確保：
- 代碼符合 ESLint 規範
- 已測試新功能
- 更新相關文件

## 📄 授權

本專案為荒野保護協會南方分會內部使用。

## 👥 聯絡方式

- 專案負責人：[待補充]
- Email：[待補充]
- 組織：荒野保護協會南方分會

---

**荒野保護協會** - 守護台灣的自然生態環境

最後更新：2025-12-08
