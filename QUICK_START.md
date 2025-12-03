# 快速啟動指南

## 步驟 1: 取得 MongoDB 連線字串

1. 在 MongoDB Atlas 中，點擊您的 cluster "ntu-foodmap-db" 旁的 **"Connect"** 按鈕
2. 選擇 **"Connect your application"**
3. 選擇 **"Node.js"** 和最新版本
4. 複製連線字串（看起來像這樣）：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 步驟 2: 設定環境變數

在專案根目錄建立 `.env` 檔案：

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map
GOOGLE_PLACES_API_KEY=example_key
SERVER_PORT=3001
```

在 `server/` 目錄建立 `.env` 檔案（相同內容）：

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map
GOOGLE_PLACES_API_KEY=example_key
SERVER_PORT=3001
```

在 `client/` 目錄建立 `.env.local` 檔案：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**重要提示：**
- 將 `<username>` 和 `<password>` 替換為您的資料庫使用者帳密
- 在連線字串中加入資料庫名稱 `/ntu_food_map`
- 如果密碼包含特殊字元（如 `@`, `#`, `%`），需要進行 URL 編碼：
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`

## 步驟 3: 安裝依賴

```bash
# 安裝所有依賴
npm run install:all

# 或分別安裝
cd server && npm install
cd ../client && npm install
```

## 步驟 4: 匯入範例資料

```bash
node scripts/import_to_db.js
```

如果成功，您會看到：
```
Connected to MongoDB
Indexes created

✓ Imported: 台大小福 (NTU Xiao Fu)
✓ Imported: 公館夜市 (Gongguan Night Market)
...

✅ Successfully imported X places!
```

## 步驟 5: 啟動專案

開啟兩個終端視窗：

**終端 1 - 後端伺服器：**
```bash
cd server
npm run dev
```

應該會看到：
```
Connected to MongoDB
MongoDB indexes created
Server is running on http://localhost:3001
```

**終端 2 - 前端開發伺服器：**
```bash
cd client
npm run dev
```

應該會看到：
```
- ready started server on 0.0.0.0:3000
```

## 步驟 6: 開啟應用程式

在瀏覽器中開啟：http://localhost:3000

您應該會看到台大美食地圖的首頁！

## 常見問題

### Q: 連線失敗
**A:** 檢查：
1. MongoDB Atlas 的 Network Access 是否允許您的 IP（或設定為 0.0.0.0/0）
2. 連線字串中的使用者名稱和密碼是否正確
3. 資料庫名稱是否正確加入連線字串

### Q: 匯入資料失敗
**A:** 確認：
1. `.env` 檔案中的 `MONGODB_URI` 是否正確
2. 資料庫使用者是否有寫入權限

### Q: 前端無法連接到後端
**A:** 確認：
1. 後端伺服器是否正在運行（http://localhost:3001）
2. `client/.env.local` 中的 `NEXT_PUBLIC_API_URL` 是否正確

