# Vercel 部署指南

## 🌐 部署網址

**Production URL:** https://ntu-food-map.vercel.app

## 📋 部署前準備

### 1. 設定 Root Directory

在 Vercel Dashboard → **Settings** → **General**：
- **Root Directory**: `client`

### 2. 設定環境變數

在 Vercel Dashboard → **Settings** → **Environment Variables**：

**必須設定的環境變數：**

- `MONGODB_URI`: MongoDB Atlas 連線字串
  ```
  mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
  ```
  
- `DB_NAME`: 資料庫名稱
  ```
  ntu-food-map-db
  ```

**重要：** 三個環境（Production, Preview, Development）都要設定！

### 3. 確認 Framework 設定

在 Vercel Dashboard → **Settings** → **General** → **Framework Settings**：
- **Framework Preset**: Next.js（應該自動偵測）

## 🚀 部署流程

### 自動部署（推薦）

1. **推送程式碼到 GitHub**：
   ```bash
   git push
   ```

2. **Vercel 會自動偵測並部署**
   - 推送到 GitHub 後，Vercel 會自動偵測
   - 通常 1-3 分鐘內會自動開始部署

### 手動部署

如果自動部署沒有觸發：

1. **前往 Vercel Dashboard → Deployments**
2. **使用現有部署的 Redeploy**：
   - 找到任何一個部署
   - 點擊 "..." → "Redeploy"
   - 不要勾選 "Use existing Build Cache"
   - 點擊 "Redeploy"

## 🔧 常見問題

### MIDDLEWARE_INVOCATION_FAILED

**原因：**
- 環境變數未設定
- 翻譯檔案路徑錯誤
- Framework 設定錯誤

**解決方案：**
1. 確認環境變數已設定（三個環境都要）
2. 確認 `client/lib/i18n/zh.json` 和 `en.json` 存在
3. 確認 Framework 設為 "Next.js"

### 建置失敗

**檢查：**
1. 查看 Build Logs 找出具體錯誤
2. 確認 Root Directory 設為 `client`
3. 確認所有依賴已正確安裝

### 環境變數未載入

**確認：**
1. 環境變數已設定（三個環境都要）
2. 變數名稱正確（`MONGODB_URI`, `DB_NAME`）
3. 重新部署以載入新環境變數

## 📝 檢查清單

部署前確認：

- [ ] Root Directory 設為 `client`
- [ ] 環境變數已設定（MONGODB_URI, DB_NAME）
- [ ] 三個環境（Production, Preview, Development）都已設定
- [ ] Framework 設為 "Next.js"
- [ ] 最新程式碼已推送到 GitHub

## 🔗 相關資源

- [Vercel 官方文檔](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)

