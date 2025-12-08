# 動態類型系統 - 技術規格書

**版本**: 1.1  
**最後更新**: 2025年12月3日  
**狀態**: 設計階段

---

## 目錄

1. [系統概述](#1-系統概述)
2. [核心概念](#2-核心概念)
3. [資料模型](#3-資料模型)
4. [前端架構](#4-前端架構)
5. [後端架構](#5-後端架構)
6. [使用者流程](#6-使用者流程)
7. [技術實作細節](#7-技術實作細節)
8. [API 規格](#8-api-規格)
9. [UI/UX 設計](#9-uiux-設計)
10. [測試規格](#10-測試規格)
11. [部署與維護](#11-部署與維護)

---

## 1. 系統概述

### 1.1 目標

建立一個彈性的動態類型系統，允許管理員自由定義不同類型的地點（如團集會場地、綠生活店家等），並為每種類型配置專屬的欄位。

### 1.2 核心價值

**彈性擴展**:
- 無需修改程式碼即可新增類型
- 動態配置欄位滿足不同需求
- 支援未來業務變化

**使用者體驗**:
- 依類型自動生成對應表單
- 地圖上視覺化區分不同類型
- 精確的資訊呈現

**管理效率**:
- 視覺化的類型管理介面
- 拖拉式欄位配置器
- 即時預覽功能

### 1.3 系統邊界

**包含**:
- 類型的 CRUD 操作
- 欄位配置與管理
- 動態表單生成
- 類型視覺化（圖示、顏色）
- 資料驗證機制

**不包含**:
- 複雜的工作流程引擎
- 跨類型的關聯查詢
- 即時協作編輯

### 1.4 技術挑戰

| 挑戰 | 解決方案 |
|------|---------|
| 動態表單生成 | 使用 React 組件映射 + Schema 驅動 |
| 欄位驗證 | Schema 定義驗證規則 + 統一驗證引擎 |
| Firestore 查詢限制 | 動態欄位僅用於顯示，不支援複雜查詢 |
| 向後相容性 | 預設類型 + 資料遷移腳本 |
| 效能優化 | 快取類型配置 + 索引優化 |

---

## 2. 核心概念

### 2.1 類型 (Location Type)

**定義**: 一種地點的分類，定義了該類別地點應該包含哪些資訊欄位。

**範例**:
- 團集會場地（需要：容納人數、設備、費用等）
- 綠生活店家（需要：營業時間、服務項目、付款方式等）
- 戶外活動場域（需要：開放時間、難度等級、適合年齡等）

### 2.2 欄位 (Field)

**定義**: 類型中的一個資訊項目，具有特定的資料類型和驗證規則。

**屬性**:
- **基本屬性**: ID、標籤、類型、必填、排序
- **驗證規則**: 範圍、長度、格式等
- **顯示控制**: 列表顯示、詳情顯示、地圖顯示
- **格式化**: 前綴、後綴、選項等
- **特殊屬性**: 單位 (Unit) - 用於數字類型，定義數值的計量單位

### 2.3 欄位類型 (Field Type)

支援的欄位類型及其用途：

| 類型 | 用途 | 範例 |
|------|------|------|
| text | 短文字輸入 | 聯絡人姓名 |
| textarea | 長文字輸入 | 場地使用說明 |
| number | 數值輸入 | 容納人數 |
| select | 單選下拉 | 停車場類型 |
| multi-select | 多選下拉 | 可用設備 |
| radio | 單選按鈕組 | 無障礙等級 |
| checkbox | 多選核取方塊 | 付款方式 |
| boolean | 開關 | 是否提供WiFi |
| date | 日期選擇 | 開放日期 |
| time | 時間選擇 | 營業時間 |
| url | 網址輸入 | 官方網站 |
| email | Email輸入 | 聯絡Email |
| phone | 電話輸入 | 聯絡電話 |

### 2.4 共同欄位 vs 專屬欄位

**共同欄位** (所有類型都有):
- 地點名稱 *
- 地址 *
- 基本描述
- 照片 *
- 標籤

**專屬欄位** (依類型配置):
- 由管理員為每個類型自訂
- 儲存在 `dynamicFields` 物件中
- 可自由新增、編輯、刪除、排序

### 2.5 資料流程

```
管理員配置類型
    ↓
定義欄位 Schema
    ↓
使用者選擇類型
    ↓
動態生成表單
    ↓
填寫並驗證
    ↓
儲存到 dynamicFields
    ↓
依 Schema 顯示
```

---

## 3. 資料模型

### 3.1 location_types 集合

**路徑**: `/location_types/{typeId}`

**完整結構**:

```javascript
{
  // ==================== 基本資訊 ====================
  
  id: "team-gathering",              // 文檔 ID（自動生成或自訂）
  name: "團集會場地",                 // 顯示名稱（必填）
  description: "荒野團集會場地",      // 類型描述（選填）
  
  
  // ==================== 視覺配置 ====================
  
  icon: "meeting-room",              // 圖示 ID（從圖示庫選擇）
  iconEmoji: "🏢",                   // Emoji 表示（用於地圖標記）
  color: "#4CAF50",                  // 標記顏色（HEX 格式）
  
  
  // ==================== 顯示控制 ====================
  
  order: 1,                          // 排序順序（數字越小越前面）
  isActive: true,                    // 是否啟用（false 時不顯示在前端）
  
  
  // ==================== 欄位配置 (核心) ====================
  
  fieldSchema: [
    {
      // --- 基本屬性 ---
      fieldId: "capacity",           // 欄位唯一 ID（自動生成或自訂）
      label: "場地容納人數",          // 顯示標籤（必填）
      type: "number",                // 欄位類型（必填）
      required: true,                // 是否必填
      order: 1,                      // 顯示順序
      
      // --- 使用者提示 ---
      placeholder: "請輸入人數",      // 輸入框提示文字
      helpText: "預估可容納人數",     // 說明文字（顯示在欄位下方）
      
      // --- 驗證規則 ---
      validation: {
        min: 1,                      // 最小值（number 專用）
        max: 1000,                   // 最大值（number 專用）
        minLength: null,             // 最小長度（text/textarea 專用）
        maxLength: null,             // 最大長度（text/textarea 專用）
        pattern: null,               // 正則表達式（text 專用）
        integer: true,               // 是否只接受整數（number 專用）
        minDate: null,               // 最小日期（date 專用）
        maxDate: null,               // 最大日期（date 專用）
        errorMessage: "人數必須在 1-1000 之間"  // 自訂錯誤訊息
      },
      
      // --- 顯示控制 ---
      displayInList: true,           // 是否在列表中顯示
      displayInDetail: true,         // 是否在詳情中顯示
      displayOnMap: true,            // 是否在地圖標記上顯示
      
      // --- 格式化 ---
      prefix: "",                    // 前綴（如：$ 或 NT$）
      suffix: " 人",                 // 後綴（已廢棄，改用 unit）
      unit: "人",                    // 單位（number 專用，如：人、公尺、間）
      
      // --- 選項配置（select/multi-select/radio/checkbox 專用）---
      options: null                  // 此欄位不需要選項
    },
    
    // ... 其他欄位配置 ...
  ],
  
  // ... 其他共同欄位與元資料 ...
}
```

**欄位說明**:

| 欄位路徑 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| `name` | string | ✓ | 類型名稱，顯示在選擇介面 |
| `description` | string | - | 類型描述，幫助使用者理解 |
| `icon` | string | ✓ | 圖示 ID，對應圖示庫 |
| `iconEmoji` | string | ✓ | Emoji，用於地圖標記 |
| `color` | string | ✓ | HEX 顏色碼 |
| `order` | number | ✓ | 排序順序 |
| `isActive` | boolean | ✓ | 是否啟用 |
| `fieldSchema` | array | ✓ | 欄位配置陣列 |
| `fieldSchema[].fieldId` | string | ✓ | 欄位唯一 ID |
| `fieldSchema[].label` | string | ✓ | 欄位顯示標籤 |
| `fieldSchema[].type` | string | ✓ | 欄位類型 |
| `fieldSchema[].required` | boolean | ✓ | 是否必填 |
| `fieldSchema[].order` | number | ✓ | 顯示順序 |
| `fieldSchema[].validation` | object | - | 驗證規則 |
| `fieldSchema[].options` | array | - | 選項（選擇類型必填） |
| `fieldSchema[].unit` | string | - | 單位（數字類型專用） |
| `commonFields` | object | ✓ | 共同欄位設定 |

---

### 3.2 locations 集合（修改）

**(無變更，同上)**

---

### 3.3 資料關聯

**(無變更，同上)**

---

## 4. 前端架構

### 4.1 目錄結構

**(無變更，同上)**

### 4.2 核心組件

#### 4.2.1 DynamicForm

**(無變更，同上)**

#### 4.2.2 DynamicFieldInput

**用途**: 依據欄位類型渲染對應的輸入組件

**組件映射**: (無變更)

**更新重點**:
- 增加 `unit` (單位) 顯示支援
- 優化數字輸入框寬度

```javascript
// NumberInput 更新
function NumberInput({ field, value, onChange, validation, prefix, suffix, ...props }) {
  return (
    <div className="number-input-wrapper flex items-center gap-2">
      {prefix && <span className="prefix">{prefix}</span>}
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        min={validation?.min}
        max={validation?.max}
        step={validation?.integer ? 1 : 'any'}
        className="w-40 border border-gray-400 rounded-md p-2 text-right" // 限制寬度
        {...props}
      />
      {/* 優先顯示 unit，若無則顯示 suffix */}
      {(field.unit || suffix) && <span className="text-gray-600">{field.unit || suffix}</span>}
    </div>
  );
}
```

#### 4.2.3 FieldConfigurator

**(無變更，同上)**

#### 4.2.4 FieldEditor (更新)

**架構變更**:
- 移除內層 `<form>` 標籤，改用 `<div>` 容器。
- 提交按鈕改為 `type="button"` 並綁定 `onClick` 事件。
- 使用 `Portal` 將模態框渲染至 `document.body`。
- 新增 `onKeyDown` 監聽器以支援 Enter 鍵提交。
- 新增 `unit` 欄位配置輸入框 (僅當類型為 `number` 時顯示)。

**目的**: 解決 Modal 嵌套導致的 Hydration Error 及表單事件冒泡導致父層意外提交的問題。

---

### 4.3 狀態管理

**(無變更，同上)**

### 4.4 驗證引擎

**(無變更，同上)**

---

## 5. 後端架構

### 5.1 Firestore Security Rules

**更新**: 明確允許管理員讀取所有狀態的地點，以修復後台管理介面載入錯誤。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... 輔助函數 (isAdmin 等) ...
    
    // ==================== locations 規則 ====================
    
    match /locations/{locationId} {
      // 所有人可讀取已核准的地點，管理員可讀取所有 (含 unapproved)
      allow read: if resource.data.status == 'approved' || isAdmin();
      
      // 管理員可讀寫
      allow write: if isAdmin();
      
      // 額外驗證 typeId
      allow create: if isAdmin() &&
        typeExists(request.resource.data.typeId);
      
      allow update: if isAdmin() &&
        typeExists(request.resource.data.typeId);
    }
    
    // ... 其他規則 ...
  }
}
```

### 5.2 Cloud Functions

**(無變更，同上)**

---

## 6. 使用者流程

### 6.2 使用者提交地點 (UI 更新)

**介面風格**: 採用現代化卡片式設計，優化視覺層次。

```
1. 使用者登入
   ↓
2. 點擊「登錄地點」
   ↓
3. 步驟 1：選擇類型
   ├─ 頁面標題置中
   ├─ 顯示所有啟用的類型卡片 (Grid Layout)
   ├─ 卡片包含：大尺寸 Emoji、粗體名稱、兩行描述
   ├─ Hover 效果：邊框變色、陰影浮起
   └─ 點擊卡片進入下一步
   ↓
4. 進入表單頁面 (單一頁面流暢體驗)
   ├─ 頂部 Header：顯示當前類型圖示與名稱、返回按鈕
   ├─ 表單主體：白色卡片容器，帶有陰影
   ↓
5. 區塊 1：基本資訊
   ├─ 標題帶有數字編號 (1)
   ├─ 地點名稱 * (圓角輸入框)
   ├─ 地址 * (Google Autocomplete)
   └─ 描述 (Textarea)
   ↓
6. 區塊 2：標籤與照片
   ├─ 綠活標籤：Pill (藥丸) 形狀按鈕，選中變色
   └─ 照片上傳：寬版拖放區域 (Drag & Drop Zone)，帶有圖示提示
   ↓
7. 區塊 3：類型專屬資訊
   ├─ 標題帶有數字編號 (2)
   ├─ 灰色背景區塊區分
   └─ 動態欄位：
       ├─ 數字欄位顯示單位 (如：[   ] 人)
       └─ 輸入框寬度優化
   ↓
8. 底部操作區
   ├─ 提交按鈕：大尺寸、明顯顏色、Hover 放大效果
   └─ 提示文字：說明審核流程
```

---

## 7. 技術實作細節

**(其餘部分保持不變)**