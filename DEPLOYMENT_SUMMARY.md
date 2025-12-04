# 部署摘要報告

## 部署時間
2025-12-04 (第六次部署)

## 部署狀態：✅ 成功 (Hosting only)

---

## 已部署的服務

### 1. ✅ Firebase Hosting（前端應用）
- **狀態**：已成功部署
- **網址**：https://green-map-7c8e1.web.app
- **版本說明**：
  - **回滾版本**：此部署基於 commit `0205974`。
  - **包含功能**：
    - **UX 優化**：`RegisterLocationModal` 可從頁首直接開啟。
    - **地址自動完成**：`PlacesAutocompleteInput` 整合至註冊表單。
    - **Bug Fix**: 修正 `PlacesAutocompleteInput` 的 `name` 和 `required` 屬性問題。
    - **UI 更新**: 將應用程式標題從「南區綠活圖」更改為「親子團綠活地圖」。
  - **移除功能** (相較於最新 commit `96b2517`)：
    - **移除** 地圖右鍵點擊註冊功能。
    - **移除** 反向地理編碼自動填入地址功能。
    - **移除** 臨時標記功能。

### 2. ✅ Firestore Database Rules
- **狀態**：未變更 (前次已部署成功)
- **版本**：最新版
- **功能**：
  - 支援 role-based 權限控制。
  - 允許超級管理員刪除地點類型。

### 3. ⚠️ Cloud Functions
- **狀態**：未變更 (保留現有版本)

### 4. ✅ Storage Rules
- **狀態**：未變更

---

## 重要提醒

### 🔑 測試重點
1. **驗證回滾**：確認地圖右鍵點擊功能已**失效**（不應出現註冊 Modal）。
2. **基本註冊**：確認從 Header 點擊「登錄地點」仍可正常開啟 Modal 並完成註冊。
3. **標題更新**：確認應用程式頁首的標題已顯示為「親子團綠活地圖」。

---

## 聯絡資訊

- **專案主控台**：https://console.firebase.google.com/project/green-map-7c8e1/overview
- **應用網址**：https://green-map-7c8e1.web.app
