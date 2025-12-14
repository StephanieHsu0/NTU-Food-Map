# 環境變數設定指南

## 📋 檔案位置

### 1. 根目錄 `.env`
用於 server 端和共享配置

### 2. `client/.env.local`
用於 Next.js Client 端（優先於根目錄的 `.env`）

### 3. `server/.env`（可選）
僅在使用獨立後端時需要

## 🔑 必需的環境變數

### Client 端 (`client/.env.local`)

#### ✅ `NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY` (新增)
**用途**: Google Maps JavaScript API 和 Places API

**獲取步驟**:
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或建立專案
3. 啟用以下 API：
   - **Maps JavaScript API**
   - **Places API**
4. 前往「憑證」頁面
5. 建立 API 金鑰
6. 設定 API 金鑰限制（建議）：
   - **應用程式限制**: HTTP referrer
   - **網站限制**:
     - 開發環境: `http://localhost:3000/*`
     - 生產環境: `https://your-domain.vercel.app/*`

**範例**:
```env
NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### ✅ `MONGODB_URI`
**用途**: MongoDB 資料庫連線字串

**格式**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

#### ✅ `DB_NAME`
**用途**: 資料庫名稱

**範例**:
```env
DB_NAME=ntu-foodmap-db
```

### 根目錄 `.env`（可選）

#### `GOOGLE_PLACES_API_KEY`
**用途**: 用於 `fetch_places.js` 腳本（與 `NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY` 可以是同一個）

#### `SERVER_PORT`
**用途**: 獨立後端伺服器端口（預設: 3001）

## 📝 當前設定狀態

### ✅ 已設定
- `MONGODB_URI` (根目錄和 client)
- `DB_NAME` (根目錄和 client)
- `GOOGLE_PLACES_API_KEY` (根目錄)
- `SERVER_PORT` (根目錄)

### ⚠️ 需要設定
- `NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY` (client/.env.local) - **已新增欄位，請填入實際 API Key**

## 🚀 設定步驟

1. **獲取 Google Maps API Key**（見上方說明）

2. **更新 `client/.env.local`**:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY=你的實際API金鑰
   ```

3. **重新啟動開發伺服器**:
   ```bash
   cd client
   npm run dev
   ```

## ⚠️ 注意事項

1. **API Key 安全性**:
   - 不要將 `.env` 或 `.env.local` 提交到 Git
   - 這些檔案已在 `.gitignore` 中
   - 在 Vercel 部署時，需要在 Vercel Dashboard 設定環境變數

2. **API 配額**:
   - Google Maps API 有使用限制
   - 監控 API 使用量
   - 設定預算提醒

3. **環境變數命名**:
   - Next.js 中，客戶端可用的變數必須以 `NEXT_PUBLIC_` 開頭
   - 伺服器端變數不需要前綴

## 🔍 驗證設定

啟動開發伺服器後，檢查：
1. 瀏覽器控制台沒有 API Key 相關錯誤
2. 地圖正常載入
3. 可以點擊地圖選擇位置
4. Google Places 搜索功能正常

## 📚 相關文件

- [Google Maps Platform 文件](https://developers.google.com/maps/documentation)
- [Next.js 環境變數文件](https://nextjs.org/docs/basic-features/environment-variables)

