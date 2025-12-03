# MongoDB Atlas 設定指南

## 快速開始

### 1. 建立 MongoDB Atlas 帳號

1. 前往 https://www.mongodb.com/cloud/atlas/register
2. 使用 Google 帳號或 Email 註冊
3. 選擇免費方案（M0 Free Tier）

### 2. 建立 Cluster

1. 登入後，點擊 "Build a Database"
2. 選擇 **M0 Free** 方案（免費）
3. 選擇雲端供應商和地區（建議選擇離您最近的）
4. 點擊 "Create Cluster"
5. 等待 1-3 分鐘讓 cluster 建立完成

### 3. 設定資料庫使用者

1. 在左側選單點擊 "Database Access"
2. 點擊 "Add New Database User"
3. 選擇 "Password" 認證方式
4. 輸入使用者名稱和密碼（**請記住這些資訊！**）
5. 設定權限為 "Atlas admin" 或 "Read and write to any database"
6. 點擊 "Add User"

### 4. 設定網路存取

1. 在左側選單點擊 "Network Access"
2. 點擊 "Add IP Address"
3. 為了開發方便，選擇 "Allow Access from Anywhere" (0.0.0.0/0)
   - **注意：** 生產環境請只允許特定 IP
4. 點擊 "Confirm"

### 5. 取得連線字串

1. 在左側選單點擊 "Database"
2. 點擊 "Connect" 按鈕
3. 選擇 "Connect your application"
4. 選擇 "Node.js" 和最新版本
5. 複製連線字串，格式如下：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 6. 設定環境變數

在專案根目錄的 `.env` 檔案中設定：

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/ntu_food_map?retryWrites=true&w=majority
DB_NAME=ntu_food_map
```

**重要：**
- 將 `<username>` 和 `<password>` 替換為您在第 3 步建立的資料庫使用者帳密
- 在連線字串中加入資料庫名稱 `/ntu_food_map`
- 確保密碼中的特殊字元已正確編碼（如 `@` 要變成 `%40`）

### 7. 匯入範例資料

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

### 8. 驗證資料

在 MongoDB Atlas 網頁中：
1. 點擊 "Database" → "Browse Collections"
2. 您應該會看到 `ntu_food_map` 資料庫
3. 點擊 `places` collection 查看匯入的資料

## 本地 MongoDB（替代方案）

如果您想使用本地 MongoDB 而不是 Atlas：

### Windows

1. 下載 MongoDB Community Server：https://www.mongodb.com/try/download/community
2. 執行安裝程式
3. 選擇 "Complete" 安裝
4. 勾選 "Install MongoDB as a Service"
5. 完成安裝後，MongoDB 會自動啟動

設定環境變數：
```env
MONGODB_URI=mongodb://localhost:27017/ntu_food_map
DB_NAME=ntu_food_map
```

### macOS

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux

```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

## 常見問題

### Q: 連線被拒絕
**A:** 檢查：
1. MongoDB Atlas 的 Network Access 是否允許您的 IP
2. 連線字串中的使用者名稱和密碼是否正確
3. 資料庫使用者是否有正確的權限

### Q: 認證失敗
**A:** 
1. 確認使用者名稱和密碼正確
2. 檢查密碼中是否有特殊字元需要 URL 編碼
3. 確認資料庫使用者已建立且啟用

### Q: 找不到資料庫
**A:** MongoDB 會在第一次寫入時自動建立資料庫。執行 `node scripts/import_to_db.js` 後資料庫就會被建立。

### Q: 地理空間查詢不工作
**A:** 確認 `location` 欄位有建立 2dsphere 索引。匯入腳本會自動建立，但您也可以手動建立：
```javascript
db.places.createIndex({ location: "2dsphere" })
```

## 下一步

設定完成後，請參考主 README.md 繼續設定其他環境變數並啟動專案。

