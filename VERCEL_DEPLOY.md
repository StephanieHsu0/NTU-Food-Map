# Vercel 部署指南

## 問題解決

Vercel 無法找到 Next.js 是因為專案結構中 Next.js 位於 `client/` 目錄，而不是根目錄。

## 解決方案

### 方法 1：在 Vercel 專案設定中指定 Root Directory（推薦）

1. 前往 Vercel Dashboard
2. 選擇您的專案
3. 進入 **Settings** → **General**
4. 找到 **Root Directory** 設定
5. 設定為：`client`
6. 儲存設定
7. 重新部署

### 方法 2：使用 vercel.json（已建立）

已建立 `vercel.json` 檔案。**重要：** 如果已在 Vercel 設定中將 Root Directory 設為 `client`，則 `vercel.json` 中的命令不需要 `cd client`，因為 Vercel 已經在 `client` 目錄下執行命令。

## 環境變數設定

在 Vercel Dashboard 中設定以下環境變數：

### 前端環境變數（在 Vercel 專案設定中）

```
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
```

### 後端環境變數（如果後端也部署在 Vercel）

如果後端也要部署在 Vercel，需要建立另一個專案：

1. 建立新的 Vercel 專案
2. Root Directory 設定為：`server`
3. 環境變數：
   ```
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=ntu_food_map
   SERVER_PORT=3001
   ```

## 部署步驟

### 前端部署

1. 在 Vercel 專案設定中將 **Root Directory** 設為 `client`
2. 設定環境變數 `NEXT_PUBLIC_API_URL`
3. 點擊 **Deploy**

### 後端部署（可選）

如果後端也要部署：

1. 建立新的 Vercel 專案
2. Root Directory 設為 `server`
3. 設定 MongoDB 連線字串等環境變數
4. 部署

## 注意事項

- 前端需要後端 API 的 URL
- 確保 MongoDB Atlas 的 Network Access 允許 Vercel 的 IP
- 建議將 MongoDB Network Access 設為 `0.0.0.0/0`（允許所有 IP）用於開發

