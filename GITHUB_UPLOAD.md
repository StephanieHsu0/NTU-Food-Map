# GitHub 上傳指南

## 步驟 1: 在 GitHub 建立新倉庫

1. 前往 https://github.com/new
2. 輸入倉庫名稱（例如：`ntu-food-map`）
3. 選擇 **Public** 或 **Private**
4. **不要**勾選 "Initialize this repository with a README"（我們已經有檔案了）
5. 點擊 "Create repository"

## 步驟 2: 連接本地倉庫到 GitHub

複製 GitHub 提供的命令，或使用以下命令（將 `YOUR_USERNAME` 和 `YOUR_REPO_NAME` 替換為您的資訊）：

```bash
# 添加遠端倉庫
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 或使用 SSH（如果您已設定 SSH key）
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

## 步驟 3: 上傳到 GitHub

```bash
# 推送所有檔案到 GitHub
git branch -M main
git push -u origin main
```

## 驗證

上傳完成後，前往您的 GitHub 倉庫頁面，您應該會看到所有專案檔案。

## 重要提醒

✅ **已確保不會上傳敏感資訊：**
- `.env` 檔案已被 `.gitignore` 排除
- `server/.env` 已被排除
- `client/.env.local` 已被排除
- `node_modules/` 已被排除

⚠️ **請確認：**
- 您的 MongoDB 連線字串不會出現在任何已提交的檔案中
- 如果之前不小心提交了 `.env` 檔案，請使用以下命令移除：
  ```bash
  git rm --cached .env
  git rm --cached server/.env
  git rm --cached client/.env.local
  git commit -m "Remove sensitive .env files"
  ```

## 後續更新

之後如果要更新 GitHub：

```bash
git add .
git commit -m "描述您的更改"
git push
```

