# NTU Food Map - 專案架構說明

## 📋 專案概述

**NTU Food Map（台大美食推薦平台）** 是一個為台大學生與外籍生設計的雙語美食推薦平台。使用者可以在地圖上瀏覽台大附近的美食店家，透過多種條件篩選，並使用「食物轉盤」功能幫助選擇餐廳。

**部署網址：** https://ntu-food-map.vercel.app

---

## 🏗️ 整體架構

```
┌─────────────────┐
│   Frontend      │  Next.js 14 (App Router)
│   (Vercel)      │  TypeScript + Tailwind CSS
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│   Backend       │  Express.js (TypeScript)
│   (Node.js)     │  Port: 3001
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │  MongoDB Atlas
│   (Cloud)       │  PostGIS Geospatial Queries
└─────────────────┘
```

---

## 🎨 前端架構 (Frontend)

### 技術棧
- **框架：** Next.js 14 (App Router)
- **語言：** TypeScript
- **樣式：** Tailwind CSS
- **地圖：** Leaflet + React-Leaflet
- **國際化：** next-intl (支援中文/英文)
- **狀態管理：** React Hooks (useState, useEffect)

### 專案結構
```
client/
├── app/
│   ├── [locale]/              # 多語言路由
│   │   ├── page.tsx           # 首頁（地圖 + 側邊欄）
│   │   ├── place/[id]/        # 店家詳情頁
│   │   └── roulette/          # 食物轉盤頁
│   ├── layout.tsx             # 根 Layout
│   └── globals.css            # 全域樣式
├── components/
│   ├── Map.tsx                # Leaflet 地圖組件
│   ├── Sidebar.tsx            # 店家列表側邊欄
│   ├── Filters.tsx            # 篩選器組件
│   ├── PlaceCard.tsx          # 店家卡片
│   ├── ScoreBreakdown.tsx     # 推薦分數分解顯示
│   └── LanguageSwitcher.tsx   # 語言切換器
├── lib/i18n/
│   ├── zh.json                # 中文翻譯
│   └── en.json                # 英文翻譯
├── utils/
│   ├── api.ts                 # API 呼叫函數
│   └── types.ts               # TypeScript 型別定義
└── middleware.ts              # Next.js middleware (i18n 路由)
```

### 前端核心功能

#### 1. **地圖首頁** (`app/[locale]/page.tsx`)
- 整合 Leaflet 地圖顯示台大附近美食
- 左側篩選器與店家列表
- 右側互動式地圖
- 點擊地圖標記或列表項目可查看詳情
- 支援即時篩選與地圖更新

#### 2. **店家詳情頁** (`app/[locale]/place/[id]/page.tsx`)
- 顯示店家完整資訊（名稱、地址、電話、評分、價位）
- 顯示推薦分數分解（評分、距離、人氣、營業狀態、使用情境）
- 顯示類別與特色標籤
- 顯示營業時間

#### 3. **食物轉盤頁** (`app/[locale]/roulette/page.tsx`)
- 轉盤動畫效果
- 從篩選後的店家池中隨機選擇
- 顯示選中店家的基本資訊
- 可連結到店家詳情頁

#### 4. **篩選功能** (`components/Filters.tsx`)
- **距離篩選：** 滑桿調整最大搜尋半徑（500-5000 公尺）
- **評分篩選：** 設定最低評分（0-5）
- **價位篩選：** 選擇最高價位等級（$ - $$$$）
- **類別篩選：** 多選（餐廳、咖啡廳、小吃、夜市等）
- **特色篩選：** 多選（外籍生友善、素食、WiFi 等）
- **營業狀態：** 僅顯示營業中的店家

#### 5. **國際化 (i18n)**
- 使用 next-intl 實現雙語切換
- 支援中文（zh）與英文（en）
- URL 路由包含語言前綴（`/zh/...` 或 `/en/...`）
- 所有 UI 文字、錯誤訊息、表單標籤皆支援雙語

---

## ⚙️ 後端架構 (Backend)

### 技術棧
- **框架：** Express.js
- **語言：** TypeScript
- **資料庫：** MongoDB Atlas
- **地理查詢：** MongoDB Geospatial Queries ($near)
- **CORS：** 支援跨域請求

### 專案結構
```
server/
├── src/
│   ├── index.ts              # Express 伺服器入口
│   ├── db.ts                 # MongoDB 連線與索引設定
│   ├── types.ts              # TypeScript 型別定義
│   ├── scoring.ts            # 推薦分數計算邏輯
│   └── routes/
│       ├── places.ts         # 地點相關 API
│       └── roulette.ts       # 轉盤 API
└── tsconfig.json
```

### 後端核心功能

#### 1. **資料庫連線** (`src/db.ts`)
- 連接到 MongoDB Atlas
- 自動建立地理空間索引（2dsphere）
- 建立其他查詢索引（rating, price_level, categories, features）
- 優雅關閉連線處理

#### 2. **地點查詢 API** (`GET /api/places`)
**功能：** 根據多種條件查詢並排序美食店家

**查詢參數：**
- `lat`, `lng` - 使用者位置（必填）
- `radius` - 搜尋半徑（公尺，預設 2000）
- `price_max` - 最高價位（1-4）
- `rating_min` - 最低評分（0-5）
- `categories[]` - 類別篩選（陣列）
- `features[]` - 特色篩選（陣列）
- `open_now` - 僅顯示營業中（true/false）

**處理流程：**
1. 使用 MongoDB `$near` 進行地理空間查詢
2. 套用價位、評分、類別、特色篩選
3. 計算每個店家的距離（使用 Haversine 公式）
4. 計算推薦分數（使用 `scoring.ts`）
5. 依推薦分數排序
6. 回傳結果（最多 100 筆）

**回傳資料：**
```typescript
{
  id: string;
  name_zh: string;
  name_en: string;
  rating: number;
  price_level: number;
  distance_m: number;
  score: number;              // 推薦分數 (0-1)
  score_breakdown: {          // 分數分解
    rating: number;
    distance: number;
    popularity: number;
    open: number;
    context: number;
    total: number;
  };
  // ... 其他欄位
}
```

#### 3. **店家詳情 API** (`GET /api/places/:id`)
**功能：** 取得單一店家的完整資訊

**處理流程：**
1. 根據 ID 查詢店家
2. 計算與使用者位置的距離
3. 計算推薦分數
4. 回傳完整店家資料

#### 4. **轉盤 API** (`POST /api/roulette`)
**功能：** 從篩選後的店家池中隨機選擇一間

**請求 Body：**
```json
{
  "lat": 25.0170,
  "lng": 121.5395,
  "filters": {
    "radius": 2000,
    "price_max": 3,
    "rating_min": 4.0
  }
}
```

**處理流程：**
1. 套用與 `/api/places` 相同的篩選邏輯
2. 從符合條件的店家列表中隨機選擇一間
3. 計算距離與推薦分數
4. 回傳選中的店家

#### 5. **推薦分數計算** (`src/scoring.ts`)
**功能：** 智能推薦系統，綜合多個因素計算推薦分數

**計算公式：**
```
總分 = (評分分數 × 0.3) + (距離分數 × 0.25) + (人氣分數 × 0.2) + 
       (營業狀態分數 × 0.15) + (使用情境分數 × 0.1)
```

**各項分數計算：**
- **評分分數：** `rating / 5`（正規化到 0-1）
- **距離分數：** `e^(-distance_km / 2)`（指數衰減，越近分數越高）
- **人氣分數：** `log(rating_count + 1) / log(10001)`（對數正規化）
- **營業狀態分數：** 營業中=1.0，已關閉=0.3，未知=0.5
- **使用情境分數：** 基礎 0.5，外籍生友善+0.2，素食+0.15，WiFi+0.1

**回傳：**
- `score`: 總分（0-1）
- `score_breakdown`: 各項分數分解（用於前端顯示）

---

## 🗄️ 資料庫架構 (Database)

### MongoDB Atlas
- **類型：** NoSQL 文件資料庫
- **部署：** MongoDB Atlas 雲端服務
- **地理查詢：** 使用 2dsphere 索引支援地理空間查詢

### 資料集合 (Collections)

#### 1. **places** - 店家資料
```typescript
{
  _id: ObjectId,
  id: string,                    // 唯一識別碼
  name_zh: string,               // 中文店名
  name_en: string,               // 英文店名
  address_zh: string,            // 中文地址
  address_en: string,            // 英文地址
  phone?: string,                 // 電話
  price_level: number,            // 價位 (1-4)
  rating: number,                 // 評分 (0-5)
  rating_count: number,           // 評分數量
  lat: number,                    // 緯度
  lng: number,                    // 經度
  location: {                     // 地理空間資料
    type: "Point",
    coordinates: [lng, lat]       // MongoDB 使用 [經度, 緯度]
  },
  categories: string[],           // 類別陣列
  features: string[],             // 特色陣列
  open_hours?: {                  // 營業時間
    "Monday": ["11:00-21:00"],
    ...
  },
  photos?: string[],              // 照片 URL
  website?: string,               // 網站
  created_at: Date,
  updated_at: Date
}
```

**索引：**
- `location` (2dsphere) - 地理空間查詢
- `rating` (降序) - 評分排序
- `price_level` (升序) - 價位篩選
- `categories` - 類別篩選
- `features` - 特色篩選

### 地理空間查詢範例
```javascript
// 查詢距離指定位置 2000 公尺內的店家
db.places.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [121.5395, 25.0170]  // [經度, 緯度]
      },
      $maxDistance: 2000  // 公尺
    }
  }
})
```

---

## 🔄 資料流程

### 使用者瀏覽店家流程
```
1. 使用者開啟首頁
   ↓
2. 前端發送 GET /api/places?lat=25.0170&lng=121.5395&radius=2000
   ↓
3. 後端查詢 MongoDB（地理空間查詢 + 篩選）
   ↓
4. 後端計算每個店家的距離與推薦分數
   ↓
5. 後端依推薦分數排序
   ↓
6. 回傳 JSON 資料給前端
   ↓
7. 前端在地圖上顯示標記，側邊欄顯示列表
```

### 使用者使用轉盤流程
```
1. 使用者點擊「轉動」按鈕
   ↓
2. 前端發送 POST /api/roulette
   Body: { lat, lng, filters }
   ↓
3. 後端套用篩選條件查詢符合的店家
   ↓
4. 後端隨機選擇一間店家
   ↓
5. 計算距離與推薦分數
   ↓
6. 回傳選中的店家
   ↓
7. 前端顯示轉盤動畫與結果
```

---

## 📦 專案結構總覽

```
FINAL PROJECT/
├── client/                    # Next.js 前端
│   ├── app/                   # App Router 頁面
│   ├── components/            # React 組件
│   ├── lib/i18n/              # 國際化翻譯檔
│   ├── utils/                 # 工具函數
│   └── package.json
│
├── server/                    # Express 後端
│   ├── src/
│   │   ├── routes/            # API 路由
│   │   ├── db.ts              # 資料庫連線
│   │   ├── scoring.ts         # 推薦分數計算
│   │   └── index.ts           # 伺服器入口
│   └── package.json
│
├── db/                        # 資料庫相關
│   ├── schema.md              # Schema 說明
│   └── seed.json              # 範例資料
│
├── scripts/                    # 工具腳本
│   ├── fetch_places.js        # Google Places API 資料抓取
│   └── import_to_db.js        # 資料匯入 MongoDB
│
├── README.md                   # 專案說明
├── plan.md                     # 開發計畫
├── vercel.json                 # Vercel 部署設定
└── package.json                # 根目錄 package.json
```

---

## 🎯 核心功能總結

### ✅ 已實現功能

1. **互動式地圖**
   - Leaflet 地圖整合
   - 標記顯示店家位置
   - 點擊標記查看詳情

2. **智能篩選系統**
   - 距離、評分、價位、類別、特色多維度篩選
   - 即時更新地圖與列表

3. **推薦系統**
   - 綜合評分、距離、人氣、營業狀態、使用情境
   - 可解釋的分數分解顯示

4. **食物轉盤**
   - 隨機選擇功能
   - 轉盤動畫效果

5. **雙語介面**
   - 完整的中英文支援
   - URL 路由包含語言前綴

6. **店家詳情頁**
   - 完整資訊顯示
   - 推薦分數分解

### 🚀 規劃中功能（見 plan.md）

1. **會員系統** - Google OAuth 登入
2. **評價系統** - 使用者評價與評論
3. **收藏功能** - 收藏喜愛的店家
4. **搜尋功能** - 關鍵字搜尋店家

---

## 🔧 技術亮點

1. **地理空間查詢：** 使用 MongoDB 2dsphere 索引實現高效能的地理查詢
2. **智能推薦：** 多因素加權評分系統，提供可解釋的推薦結果
3. **雙語架構：** 完整的 i18n 實作，支援 URL 路由層級的語言切換
4. **型別安全：** 前後端皆使用 TypeScript，確保型別一致性
5. **雲端部署：** 前端部署在 Vercel，資料庫使用 MongoDB Atlas

---

## 📝 API 文件

詳細 API 文件請參考 [README.md](./README.md#api-endpoints) 的 API Endpoints 章節。

---

## 🛠️ 開發環境

- **前端開發：** `cd client && npm run dev` (http://localhost:3000)
- **後端開發：** `cd server && npm run dev` (http://localhost:3001)
- **資料庫：** MongoDB Atlas（雲端）

---

## 📚 相關文件

- [README.md](./README.md) - 專案說明與設定指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Vercel 部署指南
- [ENV_SETUP.md](./ENV_SETUP.md) - 環境變數設定指南
- [plan.md](./plan.md) - 開發計畫與待辦事項

