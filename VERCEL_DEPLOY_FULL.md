# Vercel 完整部署指南（前後端一起部署）

## 概述

現在後端已整合到前端專案中，使用 Vercel Serverless Functions。前後端可以一起部署在同一個 Vercel 專案中。

## 專案結構

```
client/
├── app/
│   ├── api/                # Vercel Serverless Functions (後端 API)
│   │   ├── places/
│   │   │   ├── route.ts    # GET /api/places
│   │   │   └── [id]/
│   │   │       └── route.ts # GET /api/places/:id
│   │   ├── roulette/
│   │   │   └── route.ts    # POST /api/roulette
│   │   └── health/
│   │       └── route.ts    # GET /api/health
│   └── [locale]/           # 多語言路由
├── lib/
│   ├── db.ts              # MongoDB 連線（共用）
│   └── scoring.ts          # 推薦分數計算（共用）
└── ...                     # 其他前端檔案
```

## 部署步驟

### 1. 設定 Vercel 專案

1. 前往 Vercel Dashboard
2. 選擇您的專案（或建立新專案）
3. 進入 **Settings** → **General**
4. 設定 **Root Directory** 為：`client`
5. 儲存設定

### 2. 設定環境變數

在 Vercel Dashboard → **Settings** → **Environment Variables** 中新增：

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map
```

**重要：**
- 選擇 **Production**, **Preview**, **Development** 環境
- `MONGODB_URI` 必須包含資料庫名稱（`/ntu_food_map`）
- 確保 MongoDB Atlas Network Access 允許所有 IP（`0.0.0.0/0`）

### 3. 部署

1. 推送程式碼到 GitHub
2. Vercel 會自動偵測並部署
3. 或手動觸發部署：**Deployments** → **Redeploy**

### 4. 驗證部署

1. **測試健康檢查**：
   ```
   https://your-project.vercel.app/api/health
   ```
   應該回傳：
   ```json
   {"status":"ok","message":"NTU Food Map API is running"}
   ```

2. **測試前端**：
   ```
   https://your-project.vercel.app
   ```
   應該可以正常載入並顯示地圖

3. **測試 API**：
   ```
   https://your-project.vercel.app/api/places?lat=25.0170&lng=121.5395&radius=2000
   ```

## 本地開發

### 選項 1：使用 Serverless Functions（推薦）

前端和 API 都在 Next.js 中：

```bash
cd client
npm install
npm run dev
```

前端：http://localhost:3000
API：http://localhost:3000/api/health

### 選項 2：使用獨立後端伺服器

如果您想繼續使用獨立的 Express 後端：

1. 在 `client/.env.local` 中設定：
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

2. 啟動後端：
   ```bash
   cd server
   npm run dev
   ```

3. 啟動前端：
   ```bash
   cd client
   npm run dev
   ```

## 環境變數說明

### 生產環境（Vercel）

在 Vercel Dashboard 設定：
- `MONGODB_URI` - MongoDB Atlas 連線字串
- `DB_NAME` - 資料庫名稱

### 本地開發

在 `client/.env.local` 中設定（可選）：
- `NEXT_PUBLIC_API_URL` - 如果使用獨立後端，設定為 `http://localhost:3001`
- 如果不設定，會使用相對路徑（Serverless Functions）

在根目錄 `.env` 中設定（如果使用獨立後端）：
- `MONGODB_URI` - MongoDB 連線字串
- `DB_NAME` - 資料庫名稱

## 常見問題

### Q: API 回傳 500 錯誤
**A:** 檢查：
1. Vercel 環境變數 `MONGODB_URI` 是否正確設定
2. MongoDB Atlas Network Access 是否允許所有 IP
3. Vercel 部署日誌中的錯誤訊息

### Q: 前端無法連接到 API
**A:** 
- 確認 API 路由正確（`/api/places`, `/api/roulette` 等）
- 檢查瀏覽器控制台的錯誤訊息
- 確認 `client/utils/api.ts` 中的 API_URL 設定

### Q: MongoDB 連線失敗
**A:**
1. 檢查連線字串格式是否正確
2. 確認 MongoDB Atlas 使用者權限
3. 確認 Network Access 設定

### Q: 本地開發時 API 無法使用
**A:**
- 確認已安裝 `mongodb` 套件：`cd client && npm install`
- 確認 `.env.local` 或根目錄 `.env` 中的 `MONGODB_URI` 設定正確

## 優勢

✅ **單一部署**：前後端一起部署，不需要管理兩個專案
✅ **自動擴展**：Vercel Serverless Functions 自動處理流量
✅ **統一域名**：不需要處理 CORS 問題
✅ **簡單維護**：所有程式碼在同一個專案中

## 注意事項

⚠️ **Serverless Functions 限制**：
- 執行時間限制（Hobby 方案：10 秒，Pro 方案：60 秒）
- 冷啟動延遲（首次請求可能較慢）
- 記憶體限制（Hobby 方案：1024 MB）

⚠️ **MongoDB 連線**：
- Serverless Functions 會重用連線（已實作連線快取）
- 確保 MongoDB Atlas 允許來自 Vercel 的連線

