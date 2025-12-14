# Vercel 部署检查清单

## 🔍 诊断步骤

### 1. 检查 Root Directory 设置

**位置：** Vercel Dashboard → Settings → General → Root Directory

**必须设置为：** `client`

**检查方法：**
- 如果 Root Directory 不是 `client`，构建会失败或找不到文件
- 确认后需要重新部署

### 2. 检查环境变量

**位置：** Vercel Dashboard → Settings → Environment Variables

**必须设置的环境变量：**

#### ✅ `NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY`
- **值：** 您的 Google Maps API Key（应以 "AIza" 开头）
- **环境：** 必须勾选所有三个环境
  - ✅ Production
  - ✅ Preview  
  - ✅ Development

**验证方法：**
1. 访问部署的网站：`https://ntu-food-map.vercel.app/api/debug`
2. 应该看到 JSON 响应，包含：
   ```json
   {
     "hasApiKey": true,
     "keyLength": 39,
     "keyPreview": "AIzaSyXXXX...",
     "keyStartsWith": "AIza"
   }
   ```

#### ✅ `MONGODB_URI`
- **值：** MongoDB 连接字符串
- **环境：** 所有三个环境

#### ✅ `DB_NAME`
- **值：** 数据库名称（例如：`ntu-foodmap-db`）
- **环境：** 所有三个环境

### 3. 检查 Google Cloud Console API Key 设置

**位置：** [Google Cloud Console](https://console.cloud.google.com/) → API 和服务 → 凭据

**必须检查：**

1. **API 已启用：**
   - ✅ Maps JavaScript API
   - ✅ Places API

2. **API Key 限制设置：**
   - **应用程式限制：** HTTP referrer (网站)
   - **网站限制：** 必须包含：
     ```
     https://ntu-food-map.vercel.app/*
     https://*.vercel.app/*
     ```

### 4. 检查构建日志

**位置：** Vercel Dashboard → Deployments → 选择最新部署 → Build Logs

**应该看到：**
- ✅ `✓ Compiled successfully`
- ✅ `✓ Generating static pages`
- ✅ `Build Completed`

**不应该看到：**
- ❌ 环境变量相关的错误
- ❌ 找不到文件的错误
- ❌ TypeScript 编译错误

### 5. 检查浏览器控制台

**访问：** `https://ntu-food-map.vercel.app/zh`

**打开浏览器控制台（F12），应该看到：**
- ✅ `🔍 Google Maps API Key Debug Info:` 日志
- ✅ 没有红色错误信息

**如果看到错误：**
- ❌ "Google Maps API Key 未設定" → 环境变量未设置或未重新部署
- ❌ "RefererNotAllowedMapError" → API Key 限制设置不正确
- ❌ "ApiNotActivatedMapError" → API 未启用

## 🛠️ 常见问题解决方案

### 问题 1: 地图显示 "API Key 未設定"

**原因：** 环境变量未正确加载

**解决步骤：**
1. 确认 Vercel 中已设置 `NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY`
2. 确认所有三个环境都已勾选
3. **重要：** 重新部署应用（设置环境变量后必须重新部署）
4. 访问 `/api/debug` 验证环境变量是否加载

### 问题 2: 地图显示 "RefererNotAllowedMapError"

**原因：** API Key 的 HTTP referrer 限制不允许 Vercel 域名

**解决步骤：**
1. 前往 Google Cloud Console
2. 编辑 API Key
3. 在"网站限制"中添加：
   ```
   https://ntu-food-map.vercel.app/*
   https://*.vercel.app/*
   ```
4. 保存后等待几分钟生效

### 问题 3: 构建成功但地图无法加载

**可能原因：**
1. 环境变量在构建时未加载（需要重新部署）
2. API Key 格式不正确
3. API 未启用

**解决步骤：**
1. 访问 `/api/debug` 检查环境变量状态
2. 检查浏览器控制台的错误信息
3. 确认 Google Cloud Console 中 API 已启用

### 问题 4: Root Directory 设置错误

**症状：** 构建失败，找不到文件

**解决步骤：**
1. 前往 Vercel Dashboard → Settings → General
2. 设置 Root Directory 为 `client`
3. 保存后重新部署

## 📋 快速检查清单

部署前确认：

- [ ] Root Directory 设置为 `client`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_JS_KEY` 已设置（所有环境）
- [ ] `MONGODB_URI` 已设置（所有环境）
- [ ] `DB_NAME` 已设置（所有环境）
- [ ] Google Cloud Console 中 API 已启用
- [ ] API Key 限制包含 Vercel 域名
- [ ] 已重新部署应用
- [ ] 访问 `/api/debug` 验证环境变量
- [ ] 浏览器控制台没有错误

## 🔗 有用的链接

- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [Google Maps Platform 文档](https://developers.google.com/maps/documentation)

