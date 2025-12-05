# Vercel 部署問題排除指南

## 🔄 Vercel 自動部署機制

### 自動部署觸發條件

Vercel 會在以下情況**自動部署**：
1. ✅ 推送到 GitHub 的 `main` 分支（或其他連接的分支）
2. ✅ 建立 Pull Request
3. ✅ 合併 Pull Request

### Redeploy vs 自動部署

#### ❌ 直接按 Redeploy（不推薦）

**問題：**
- Redeploy 會使用**相同的 commit**
- 不會抓取 GitHub 上的新更改
- 只會重新執行部署，使用舊的程式碼

**何時使用：**
- 環境變數剛更新，需要重新部署以載入新環境變數
- 部署失敗但程式碼沒變，想重試
- 清除快取重新部署

#### ✅ 推送到 GitHub（推薦）

**正確流程：**
1. 本地修改程式碼
2. `git add .`
3. `git commit -m "訊息"`
4. `git push` ← **這會觸發 Vercel 自動部署**
5. Vercel 會自動偵測並部署最新 commit

## 🚨 您的情況

### 問題診斷

如果已經推送到 GitHub 但 Vercel 沒有自動部署：

1. **檢查 Vercel 專案連接**
   - Vercel Dashboard → Settings → Git
   - 確認 GitHub 倉庫已正確連接
   - 確認連接的分支是 `main`

2. **檢查最新 commit 是否已推送**
   ```bash
   git log --oneline -1
   git status
   ```
   確認沒有未推送的更改

3. **手動觸發部署**
   - 如果自動部署沒觸發，可以：
     - 前往 Vercel Dashboard → Deployments
     - 點擊 **Create Deployment**
     - 選擇最新的 commit
     - 點擊 **Deploy**

## ✅ 正確的部署流程

### 步驟 1: 確認更改已推送

```bash
# 檢查狀態
git status

# 如果有未推送的更改
git add .
git commit -m "Your commit message"
git push
```

### 步驟 2: 等待自動部署

- Vercel 會在推送後自動開始部署
- 通常需要 1-3 分鐘
- 可以在 Vercel Dashboard → Deployments 查看進度

### 步驟 3: 如果自動部署沒觸發

1. 前往 Vercel Dashboard
2. 點擊 **Deployments**
3. 點擊 **Create Deployment**（右上角）
4. 選擇 **GitHub** 作為來源
5. 選擇最新的 commit（應該是最新的）
6. 選擇 **Production** 環境
7. 點擊 **Deploy**

## 🔍 檢查清單

部署前確認：

- [ ] 所有更改已 commit
- [ ] 已推送到 GitHub（`git push`）
- [ ] Vercel 專案已連接 GitHub 倉庫
- [ ] 連接的分支是 `main`（或您使用的分支）
- [ ] 環境變數已設定（三個環境）
- [ ] Root Directory 設為 `client`

## 📝 關於 MIDDLEWARE_INVOCATION_FAILED

如果仍然出現此錯誤，即使已推送最新程式碼：

### 可能原因

1. **翻譯檔案問題**
   - 確認 `client/lib/i18n/zh.json` 和 `en.json` 已推送到 GitHub
   - 確認檔案格式正確（有效 JSON）

2. **Middleware 配置問題**
   - 確認 `client/middleware.ts` 已更新
   - 確認 `client/i18n.ts` 配置正確

3. **環境變數問題**
   - 即使 middleware 不需要環境變數，但如果有其他錯誤也可能觸發

### 檢查步驟

1. **確認檔案已推送**：
   ```bash
   git ls-files | grep -E "(middleware|i18n|lib/i18n)"
   ```

2. **檢查 GitHub 上的檔案**：
   - 前往 GitHub 倉庫
   - 確認 `client/middleware.ts` 存在
   - 確認 `client/i18n.ts` 存在
   - 確認 `client/lib/i18n/zh.json` 存在
   - 確認 `client/lib/i18n/en.json` 存在

3. **查看 Vercel 部署日誌**：
   - Vercel Dashboard → Deployments
   - 點擊失敗的部署
   - 查看 **Build Logs** 和 **Function Logs**
   - 尋找具體錯誤訊息

## 🛠️ 快速修復步驟

### 如果已經推送但 Vercel 沒自動部署

1. **手動建立部署**：
   - Vercel Dashboard → Deployments → **Create Deployment**
   - 選擇最新的 commit
   - 部署

### 如果自動部署但失敗

1. **檢查部署日誌**找出具體錯誤
2. **確認環境變數**是否正確設定
3. **確認 Root Directory**是否設為 `client`
4. **檢查檔案是否存在**於 GitHub 上

## 💡 最佳實踐

1. **每次更改後**：
   ```bash
   git add .
   git commit -m "描述更改"
   git push
   ```
   讓 Vercel 自動部署

2. **更新環境變數後**：
   - 在 Vercel Dashboard 更新環境變數
   - 然後點擊 **Redeploy**（因為環境變數變了，需要重新部署）

3. **不要直接 Redeploy 舊 commit**：
   - 如果程式碼有更改，先推送到 GitHub
   - 讓 Vercel 自動部署新 commit

