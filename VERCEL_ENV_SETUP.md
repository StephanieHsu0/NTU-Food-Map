# Vercel 環境變數設定指南

## 🎯 必須設定的環境變數

在 Vercel Dashboard → **Settings** → **Environment Variables** 中新增：

### 1. MONGODB_URI

**Name**: `MONGODB_URI`

**Value**: 
```
mongodb+srv://ntu-foodmap-user:您的密碼@ntu-foodmap-db.8qyrjzs.mongodb.net/ntu-foodmap-db?retryWrites=true&w=majority
```

**Environment**: ✅ Production ✅ Preview ✅ Development（三個都要選！）

### 2. DB_NAME

**Name**: `DB_NAME`

**Value**: 
```
ntu-foodmap-db
```

**Environment**: ✅ Production ✅ Preview ✅ Development（三個都要選！）

## ⚠️ 重要注意事項

### 1. 三個環境都要設定

**必須在以下三個環境都設定相同的環境變數：**
- ✅ Production（生產環境）
- ✅ Preview（預覽環境）
- ✅ Development（開發環境）

**為什麼？** Vercel 會為每個環境建立不同的部署，如果只設定 Production，Preview 和 Development 部署會失敗。

### 2. 連線字串格式

**正確格式：**
```
mongodb+srv://用戶名:密碼@主機/資料庫名稱?retryWrites=true&w=majority
```

**範例：**
```
mongodb+srv://ntu-foodmap-user:password123@ntu-foodmap-db.8qyrjzs.mongodb.net/ntu-foodmap-db?retryWrites=true&w=majority
```

**注意：**
- `/ntu-foodmap-db` 是資料庫名稱，必須包含
- 密碼如果包含特殊字元，需要 URL 編碼：
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `&` → `%26`
  - `=` → `%3D`

### 3. MongoDB Atlas 設定

**Network Access：**
1. 前往 MongoDB Atlas → **Network Access**
2. 點擊 **Add IP Address**
3. 選擇 **Allow Access from Anywhere**（`0.0.0.0/0`）
4. 點擊 **Confirm**

**Database Access：**
1. 確認使用者 `ntu-foodmap-user` 存在
2. 確認使用者權限為 **Atlas admin** 或 **Read and write to any database**

## 📋 設定步驟（詳細）

### 步驟 1: 進入環境變數設定

1. 登入 Vercel Dashboard
2. 選擇您的專案（`NTU-Food-Map`）
3. 點擊 **Settings**（左側選單）
4. 點擊 **Environment Variables**（在 Settings 下方）

### 步驟 2: 新增 MONGODB_URI

1. 點擊 **Add New** 按鈕
2. **Key**: 輸入 `MONGODB_URI`
3. **Value**: 貼上您的 MongoDB 連線字串
4. **Environment**: 
   - ✅ 勾選 **Production**
   - ✅ 勾選 **Preview**
   - ✅ 勾選 **Development**
5. 點擊 **Save**

### 步驟 3: 新增 DB_NAME

1. 再次點擊 **Add New** 按鈕
2. **Key**: 輸入 `DB_NAME`
3. **Value**: 輸入 `ntu-foodmap-db`
4. **Environment**: 
   - ✅ 勾選 **Production**
   - ✅ 勾選 **Preview**
   - ✅ 勾選 **Development**
5. 點擊 **Save**

### 步驟 4: 確認設定

您應該會看到兩個環境變數，每個都有三個環境標籤（Production, Preview, Development）。

## 🔍 驗證環境變數

### 方法 1: 檢查部署日誌

1. 前往 **Deployments**
2. 點擊最新的部署
3. 查看 **Build Logs**
4. 搜尋 `MONGODB_URI` 或 `DB_NAME`（應該不會顯示完整值，但會確認已載入）

### 方法 2: 使用 API 測試

部署後，訪問：
```
https://ntu-foodmap.vercel.app/api/health
```

如果環境變數正確，應該會回傳：
```json
{"status":"ok","message":"NTU Food Map API is running"}
```

如果 MongoDB 連線失敗，會回傳 500 錯誤。

## 🚨 常見錯誤

### 錯誤 1: 只設定了 Production 環境

**症狀：** Preview 和 Development 部署失敗

**解決：** 確保三個環境都設定了環境變數

### 錯誤 2: 連線字串格式錯誤

**症狀：** `MongoServerError: bad auth` 或連線失敗

**解決：** 
- 檢查連線字串是否包含資料庫名稱
- 檢查使用者名稱和密碼是否正確
- 檢查密碼是否需要 URL 編碼

### 錯誤 3: Network Access 未設定

**症狀：** `MongoServerError: connection timeout`

**解決：** 在 MongoDB Atlas → Network Access 中允許 `0.0.0.0/0`

## ✅ 快速檢查清單

部署前確認：

- [ ] Root Directory 設為 `client`
- [ ] `MONGODB_URI` 已設定（三個環境）
- [ ] `DB_NAME` 已設定（三個環境）
- [ ] 連線字串包含資料庫名稱
- [ ] MongoDB Atlas Network Access 允許 `0.0.0.0/0`
- [ ] 使用者權限正確

## 📝 範例：完整的環境變數設定

在 Vercel Dashboard 中，您應該看到：

```
Environment Variables (2)

MONGODB_URI
  Production, Preview, Development
  mongodb+srv://ntu-foodmap-user:***@ntu-foodmap-db.8qyrjzs.mongodb.net/ntu-foodmap-db?retryWrites=true&w=majority

DB_NAME
  Production, Preview, Development
  ntu-foodmap-db
```

## 🔗 相關文件

- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - 完整部署指南
- [VERCEL_DEPLOY_FULL.md](./VERCEL_DEPLOY_FULL.md) - 部署說明

