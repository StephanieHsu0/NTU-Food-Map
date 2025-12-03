# Windows 設定指南

## PostgreSQL 安裝與設定

### 1. 安裝 PostgreSQL

1. 前往 https://www.postgresql.org/download/windows/
2. 下載 PostgreSQL 安裝程式（建議下載最新版本）
3. 執行安裝程式，按照精靈指示安裝
4. **重要：記住您設定的 postgres 使用者密碼**
5. 安裝完成後，在 Stack Builder 中選擇安裝 PostGIS 擴充功能

### 2. 將 PostgreSQL 加入 PATH（可選但建議）

**方法 1：透過系統設定**
1. 開啟「系統內容」→「進階」→「環境變數」
2. 在「系統變數」中找到 `Path`，點擊「編輯」
3. 新增 PostgreSQL bin 目錄（例如：`C:\Program Files\PostgreSQL\15\bin`）
4. 點擊「確定」儲存

**方法 2：暫時加入（僅限當前 PowerShell 視窗）**
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### 3. 建立資料庫

**使用 pgAdmin（圖形介面，推薦）：**

1. 開啟 pgAdmin 4（應該會自動啟動）
2. 輸入安裝時設定的 postgres 密碼
3. 展開「Servers」→「PostgreSQL 15」（版本可能不同）
4. 右鍵點擊「Databases」→「Create」→「Database」
5. 在「Database」欄位輸入：`ntu_food_map`
6. 點擊「Save」

**啟用 PostGIS 擴充功能：**
1. 右鍵點擊 `ntu_food_map` 資料庫 →「Query Tool」
2. 輸入以下 SQL 並執行：
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

**執行 Schema：**
1. 在 Query Tool 中，點擊「Open File」圖示
2. 選擇 `db/schema.sql` 檔案
3. 點擊執行按鈕（▶）或按 F5

**匯入範例資料（可選）：**
```powershell
node scripts/import_to_db.js
```

**使用命令列（如果已加入 PATH）：**
```powershell
# 建立資料庫
createdb -U postgres ntu_food_map

# 啟用 PostGIS
psql -U postgres -d ntu_food_map -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 執行 schema
psql -U postgres -d ntu_food_map -f db/schema.sql

# 匯入資料
node scripts/import_to_db.js
```

### 4. 設定環境變數

建立並編輯以下檔案：

**`.env`（根目錄）**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ntu_food_map
DB_USER=postgres
DB_PASSWORD=你的postgres密碼
GOOGLE_PLACES_API_KEY=example_key
SERVER_PORT=3001
```

**`client/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**`server/.env`**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ntu_food_map
DB_USER=postgres
DB_PASSWORD=你的postgres密碼
GOOGLE_PLACES_API_KEY=example_key
SERVER_PORT=3001
```

### 5. 啟動專案

開啟兩個終端視窗：

**終端 1 - 後端伺服器：**
```powershell
cd server
npm run dev
```

**終端 2 - 前端開發伺服器：**
```powershell
cd client
npm run dev
```

瀏覽器開啟 http://localhost:3000 即可看到應用程式！

## 常見問題

### Q: 找不到 createdb 或 psql 命令
**A:** PostgreSQL 未加入 PATH，請使用 pgAdmin 或參考上面的 PATH 設定步驟。

### Q: 連線資料庫時出現認證錯誤
**A:** 檢查 `.env` 檔案中的 `DB_PASSWORD` 是否正確。

### Q: PostGIS 擴充功能無法建立
**A:** 確認在安裝 PostgreSQL 時已透過 Stack Builder 安裝 PostGIS。

### Q: 無法執行 node 命令
**A:** 確認已安裝 Node.js，並在 PowerShell 中執行 `node --version` 檢查。

