# 專案結構說明

## 整體架構

```
NTU-Food-Map/
├── client/                 # Next.js 前端應用（包含 Serverless Functions）
├── server/                 # Express 後端（可選，用於本地開發）
├── db/                     # 資料庫相關檔案
├── scripts/                # 工具腳本
└── docs/                   # 文檔（README.md, PROJECT_ARCHITECTURE.md 等）
```

## 詳細結構

### client/ - 前端應用

```
client/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由（Serverless Functions）
│   │   ├── places/
│   │   │   ├── route.ts    # GET /api/places
│   │   │   └── [id]/
│   │   │       └── route.ts # GET /api/places/:id
│   │   ├── roulette/
│   │   │   └── route.ts    # POST /api/roulette
│   │   └── health/
│   │       └── route.ts    # GET /api/health
│   ├── [locale]/           # 多語言路由
│   │   ├── layout.tsx      # 語言布局
│   │   ├── page.tsx        # 首頁（地圖）
│   │   ├── place/
│   │   │   └── [id]/
│   │   │       └── page.tsx # 店家詳情頁
│   │   └── roulette/
│   │       └── page.tsx    # 轉盤頁面
│   ├── globals.css         # 全域樣式
│   └── layout.tsx          # 根布局
├── components/             # React 組件
│   ├── Filters.tsx         # 篩選器組件
│   ├── LanguageSwitcher.tsx # 語言切換
│   ├── Map.tsx             # 地圖組件
│   ├── PlaceCard.tsx       # 地點卡片
│   ├── ScoreBreakdown.tsx  # 分數詳情
│   └── Sidebar.tsx         # 側邊欄
├── lib/                    # 共用函式庫
│   ├── db.ts              # MongoDB 連線
│   ├── scoring.ts          # 推薦分數計算
│   └── i18n/               # 多語言資源
│       ├── en.json         # 英文翻譯
│       └── zh.json         # 中文翻譯
├── utils/                  # 工具函數
│   ├── api.ts             # API 呼叫函數
│   └── types.ts           # TypeScript 類型定義
├── middleware.ts           # Next.js 中間件（i18n）
├── i18n.ts                # 多語言配置
├── next.config.mjs        # Next.js 配置
├── tailwind.config.js     # Tailwind CSS 配置
└── tsconfig.json          # TypeScript 配置
```

### server/ - Express 後端（可選）

```
server/
├── src/
│   ├── index.ts           # 伺服器入口
│   ├── db.ts             # 資料庫連線
│   ├── types.ts          # 類型定義
│   ├── scoring.ts        # 推薦分數計算
│   └── routes/           # API 路由
│       ├── places.ts     # 地點相關路由
│       └── roulette.ts   # 轉盤路由
├── package.json
└── tsconfig.json
```

**注意：** 目前專案使用 Vercel Serverless Functions（在 `client/app/api/`），`server/` 目錄保留用於：
- 本地開發時使用獨立後端
- 未來可能需要獨立部署後端的情況

### db/ - 資料庫

```
db/
├── schema.md              # 資料庫結構說明
└── seed.json             # 範例資料
```

### scripts/ - 工具腳本

```
scripts/
├── fetch_places.js       # 從 Google Places API 獲取資料
├── import_to_db.js       # 匯入資料到 MongoDB
└── test_mongodb_connection.js # 測試 MongoDB 連線
```

## 技術架構

### 前端
- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **地圖**: Leaflet + react-leaflet
- **多語言**: next-intl
- **API**: Next.js Route Handlers (Serverless Functions)

### 後端（Serverless Functions）
- **運行環境**: Vercel Serverless Functions
- **資料庫**: MongoDB Atlas
- **API 風格**: RESTful

### 資料庫
- **類型**: MongoDB
- **索引**: 2dsphere（地理空間查詢）、rating、price_level、categories、features

## 環境變數

### 本地開發

**client/.env.local**（Serverless Functions 使用）:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
DB_NAME=ntu-foodmap-db
```

**根目錄 .env**（獨立後端使用，可選）:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
DB_NAME=ntu-foodmap-db
GOOGLE_PLACES_API_KEY=your_api_key
SERVER_PORT=3001
```

### 生產環境（Vercel）

在 Vercel Dashboard 設定：
- `MONGODB_URI`
- `DB_NAME`

## API 端點

### GET /api/places
查詢地點列表（支援篩選）

**查詢參數**:
- `lat`, `lng` - 使用者位置
- `radius` - 搜尋半徑（公尺）
- `price_max` - 最高價位（1-4）
- `rating_min` - 最低評分（0-5）
- `categories[]` - 類別篩選
- `features[]` - 特色篩選
- `open_now` - 僅顯示營業中

### GET /api/places/:id
取得特定地點詳情

**查詢參數**:
- `lat`, `lng` - 使用者位置（用於計算距離）

### POST /api/roulette
隨機選擇一個地點

**請求體**:
```json
{
  "lat": 25.0170,
  "lng": 121.5395,
  "filters": {
    "radius": 2000,
    "rating_min": 3.5
  }
}
```

### GET /api/health
健康檢查

## 開發流程

### 本地開發

1. **安裝依賴**:
   ```bash
   cd client
   npm install
   ```

2. **設定環境變數**:
   建立 `client/.env.local` 並填入 MongoDB 連線資訊

3. **啟動開發伺服器**:
   ```bash
   npm run dev
   ```

4. **開啟瀏覽器**:
   http://localhost:3000

### 部署

1. **推送到 GitHub**
2. **在 Vercel 設定環境變數**
3. **Vercel 自動部署**

詳細說明請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

