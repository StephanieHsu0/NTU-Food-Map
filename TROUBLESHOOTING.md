# 故障排除指南

## 問題：無法載入應用程式

### 快速檢查清單

1. **檢查環境變數**
   ```bash
   cd client
   npm run check-env
   ```

2. **檢查診斷**
   ```bash
   cd client
   node scripts/diagnose.js
   ```

3. **快速修復（自動產生 AUTH_SECRET）**
   ```bash
   cd client
   node scripts/quick-fix.js
   ```

### 常見問題

#### 1. NextAuth Configuration 錯誤

**錯誤訊息**: `Server error: There is a problem with the server configuration`

**解決方法**:
1. 確認 `client/.env.local` 存在
2. 確認 `AUTH_SECRET` 已設定
3. 執行快速修復腳本：
   ```bash
   cd client
   node scripts/quick-fix.js
   ```

#### 2. MongoDB 連線失敗

**錯誤訊息**: `Failed to connect to MongoDB`

**解決方法**:
1. 檢查 `MONGODB_URI` 是否正確
2. 確認 MongoDB Atlas 網路存取設定（允許您的 IP）
3. 測試連線：
   ```bash
   node scripts/test_mongodb_connection.js
   ```

#### 3. 開發伺服器無法啟動

**檢查步驟**:
1. 確認已安裝依賴：
   ```bash
   cd client
   npm install
   ```

2. 清除 Next.js 快取：
   ```bash
   cd client
   rm -rf .next
   npm run dev
   ```

3. 檢查端口是否被占用：
   - 預設使用 3000 端口
   - 如果被占用，可以設定 `PORT=3001 npm run dev`

#### 4. 環境變數未載入

**解決方法**:
1. 確認 `.env.local` 在 `client/` 目錄下
2. 確認檔案名稱正確（不是 `.env.local.txt`）
3. 重新啟動開發伺服器（環境變數只在啟動時載入）

### 最小配置

如果只想測試應用是否能啟動，最少需要：

```env
# client/.env.local
AUTH_SECRET=your-generated-secret-here
AUTH_URL=http://localhost:3000
MONGODB_URI=your-mongodb-connection-string
DB_NAME=ntu_food_map
```

### 產生 AUTH_SECRET

**Windows PowerShell**:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**或使用 OpenSSL** (如果已安裝):
```bash
openssl rand -base64 32
```

### 測試 API 端點

啟動伺服器後，測試以下端點：

1. **健康檢查**: `http://localhost:3000/api/health`
2. **Auth 除錯**: `http://localhost:3000/api/auth/debug` (僅開發環境)

### 查看詳細錯誤

1. **終端機輸出**: 檢查 `npm run dev` 的輸出
2. **瀏覽器控制台**: 按 F12 開啟開發者工具
3. **Next.js 錯誤頁面**: 查看完整的錯誤堆疊

### 重置環境

如果所有方法都失敗，可以嘗試：

```bash
cd client
# 清除快取
rm -rf .next
rm -rf node_modules
# 重新安裝
npm install
# 重新啟動
npm run dev
```

