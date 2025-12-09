# 文件整理記錄

## 整理日期
2025-12-08

## 整理目的
將散落在專案各處的文件統一整理到 `docs/` 目錄，建立清晰的文件結構，方便查閱和維護。

## 變更內容

### 📁 新建目錄結構

```
docs/
├── README.md              # 文件中心主索引
├── guides/                # 使用指南
├── user-manuals/          # 使用手冊
├── technical/             # 技術文件
├── spec-kit/              # 規格文件
└── planning/              # 規劃文件
```

### 📝 文件移動記錄

#### 從根目錄移入 `docs/guides/`
- `SUPER_ADMIN_SETUP.md` → `docs/guides/super_admin_setup.md`
- `ADMIN_MANAGEMENT_GUIDE.md` → `docs/guides/admin_management.md`

#### 從根目錄移入 `docs/user-manuals/`
- `UserManual.md` → `docs/user-manuals/user_manual.md`
- `ManualDesign.md` → `docs/user-manuals/manual_design.md`

#### 從根目錄移入 `docs/technical/`
- `DEPLOYMENT_SUMMARY.md` → `docs/technical/deployment_summary.md`

#### 從根目錄移入 `docs/planning/`
- `waitlist.md` → `docs/planning/waitlist.md`

#### 從 `docs/` 移入子目錄
- `docs/visitor_guide.md` → `docs/guides/visitor_guide.md`
- `docs/partner_guide.md` → `docs/guides/partner_guide.md`
- `docs/admin_guide.md` → `docs/guides/admin_guide.md`
- `docs/dynamic-type-system-spec.md` → `docs/technical/dynamic-type-system-spec.md`

#### spec-kit 整合
- 將根目錄的 `spec-kit/` 與 `docs/spec-kit/` 合併
- 移除重複的臨時文件（New_spen.txt, 新文件 1.txt）
- 統一保存在 `docs/spec-kit/`

### 🗑️ 清理的文件
- `docs/spec-kit/New_spen.txt` (臨時文件)
- `docs/spec-kit/新文件 1.txt` (臨時文件)
- `spec-kit/` (根目錄，已合併到 docs/spec-kit/)

### ✨ 新建的文件
- `docs/README.md` - 文件中心主索引，提供完整的文件導航
- `README.md` (更新) - 專案主頁，添加文件中心連結
- `docs/DOCS_REORGANIZATION.md` - 本文件，記錄整理過程

## 文件命名規範

為保持一致性，採用以下命名規範：
- 使用小寫字母 + 底線：`user_manual.md`
- spec-kit 保持大寫：`FUNCTIONAL_SPECS.md`
- 描述性名稱，避免縮寫

## 最終文件清單

共 22 個文件，分類如下：

### 📖 使用指南 (5)
1. visitor_guide.md
2. partner_guide.md
3. admin_guide.md
4. admin_management.md
5. super_admin_setup.md

### 📱 使用手冊 (2)
1. user_manual.md
2. manual_design.md

### 🛠️ 技術文件 (2)
1. dynamic-type-system-spec.md
2. deployment_summary.md

### 📋 規格文件 (12)
1. README.md
2. PROJECT_BRIEF.md
3. PERSONAS.md
4. USER_STORIES.md
5. CONSTITUTION.md
6. FUNCTIONAL_SPECS.md
7. DEVELOPMENT_SPECS.md
8. SECURITY_SPECS.md
9. DATA_MODEL.md
10. TECH_STACK.md
11. DEVELOPMENT_GUIDE.md
12. (其他 spec-kit 文件)

### 📅 規劃文件 (1)
1. waitlist.md

## 維護建議

1. **新增文件時**：根據文件性質放入對應的子目錄
2. **更新文件時**：同步更新 `docs/README.md` 索引
3. **定期檢查**：確保沒有文件散落在根目錄或其他位置
4. **保持命名一致**：遵循命名規範

## 下一步

- [ ] 檢視各文件內容，確保內部連結正確
- [ ] 統一文件格式和風格
- [ ] 添加文件版本控制機制
- [ ] 考慮使用 MkDocs 或類似工具建立文件網站

---

整理者：Claude Code
日期：2025-12-08
