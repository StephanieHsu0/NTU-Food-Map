# Vercel 部署完整指南

## ⚠️ 重要：環境變數設定

### 必須設定的環境變數

在 Vercel Dashboard → **Settings** → **Environment Variables** 中新增以下環境變數：

#### 1. MongoDB 連線（必需）

```
MONGODB_URI=mongodb+srv://ntu-foodmap-user:您的密碼@ntu-foodmap-db.8qyrjzs.mongodb.net/ntu-foodmap-db?retryWrites=true&w=majority
DB_NAME=ntu-foodmap-db
```

**重要注意事項：**
- ✅ 必須選擇 **Production**, **Preview**, **Development** 三個環境
- ✅ `MONGODB_URI` 必須包含資料庫名稱（`/ntu-foodmap-db`）
- ✅ 密碼如果包含特殊字元（`@`, `#`, `%`, `&`, `=`），需要 URL 編碼
- ✅ 確保 MongoDB Atlas → Network Access 允許所有 IP（`0.0.0.0/0`）

#### 2. 環境變數格式檢查清單

- [ ] `MONGODB_URI` 格式正確：`mongodb+srv://用戶名:密碼@主機/資料庫名稱?參數`
- [ ] `DB_NAME` 與連線字串中的資料庫名稱一致
- [ ] 三個環境（Production, Preview, Development）都已設定
- [ ] 沒有多餘的空格或換行

## 📋 Vercel 專案設定步驟

### 步驟 1: 設定 Root Directory

1. 前往 Vercel Dashboard
2. 選擇您的專案
3. 進入 **Settings** → **General**
4. 找到 **Root Directory** 設定
5. 設定為：`client`
6. 點擊 **Save**

**⚠️ 這是最重要的設定！如果沒有設定，Vercel 會找不到 Next.js 專案。**

### 步驟 2: 設定環境變數

1. 進入 **Settings** → **Environment Variables**
2. 點擊 **Add New**
3. 新增以下環境變數：

   **Name**: `MONGODB_URI`
   **Value**: `mongodb+srv://ntu-foodmap-user:您的密碼@ntu-foodmap-db.8qyrjzs.mongodb.net/ntu-foodmap-db?retryWrites=true&w=majority`
   **Environment**: 選擇 **Production**, **Preview**, **Development**（三個都要選）

   **Name**: `DB_NAME`
   **Value**: `ntu-foodmap-db`
   **Environment**: 選擇 **Production**, **Preview**, **Development**（三個都要選）

4. 點擊 **Save** 儲存每個環境變數

### 步驟 3: 檢查 Build Settings

在 **Settings** → **General** 中確認：

- **Framework Preset**: Next.js（應該自動偵測）
- **Build Command**: `npm run build`（或留空，讓 Vercel 自動偵測）
- **Output Directory**: `.next`（或留空）
- **Install Command**: `npm install`（或留空）

**注意：** 如果已設定 Root Directory 為 `client`，這些命令會自動在 `client/` 目錄下執行。

### 步驟 4: 部署

1. 推送程式碼到 GitHub（如果還沒推送）
2. Vercel 會自動偵測並開始部署
3. 或手動觸發：**Deployments** → 點擊最新部署旁的 **...** → **Redeploy**

## 🔧 常見部署錯誤和解決方案

### 錯誤 1: `MIDDLEWARE_INVOCATION_FAILED` ⚠️ 最常見

**原因：**
- Middleware 執行時發生錯誤
- 通常是 `next-intl` 配置問題
- 翻譯檔案路徑錯誤
- 或環境變數未正確載入

**解決方案：**

1. **確認翻譯檔案存在且路徑正確**：
   - ✅ `client/lib/i18n/zh.json` 必須存在
   - ✅ `client/lib/i18n/en.json` 必須存在
   - ✅ 檔案必須是有效的 JSON 格式

2. **檢查 middleware.ts**（必須完全一致）：
   ```typescript
   // client/middleware.ts
   import createMiddleware from 'next-intl/middleware';
   import { locales } from './i18n';

   export default createMiddleware({
     locales: locales as string[],
     defaultLocale: 'zh',
     localePrefix: 'always'
   });

   export const config = {
     matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
   };
   ```

3. **檢查 i18n.ts**（必須完全一致）：
   ```typescript
   // client/i18n.ts
   import { getRequestConfig } from 'next-intl/server';
   import { notFound } from 'next/navigation';

   export const locales = ['zh', 'en'] as const;
   export type Locale = (typeof locales)[number];

   export default getRequestConfig(async ({ locale }) => {
     if (!locales.includes(locale as Locale)) {
       notFound();
     }

     return {
       messages: (await import(`./lib/i18n/${locale}.json`)).default
     };
   });
   ```

4. **檢查 layout.tsx**：
   ```typescript
   // client/app/[locale]/layout.tsx
   // 確保 generateStaticParams 返回正確的格式
   export function generateStaticParams() {
     return locales.map((locale) => ({ locale }));
   }
   ```

5. **如果仍然失敗，嘗試簡化 middleware**（臨時測試）：
   ```typescript
   // 臨時簡化版本（僅用於測試）
   export default function middleware(request: NextRequest) {
     // 簡單重定向到 /zh
     if (request.nextUrl.pathname === '/') {
       return NextResponse.redirect(new URL('/zh', request.url));
     }
     return NextResponse.next();
   }
   ```

**原因：**
- Middleware 執行時發生錯誤
- 通常是 `next-intl` 配置問題
- 或環境變數未正確載入

**解決方案：**

1. **檢查 middleware.ts**：
   ```typescript
   // client/middleware.ts 應該如下：
   import createMiddleware from 'next-intl/middleware';
   import { locales } from './i18n';

   export default createMiddleware({
     locales: locales as string[],
     defaultLocale: 'zh',
     localePrefix: 'always'
   });

   export const config = {
     matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
   };
   ```

2. **檢查 i18n.ts**：
   ```typescript
   // client/i18n.ts 應該如下：
   import { getRequestConfig } from 'next-intl/server';
   import { notFound } from 'next/navigation';

   export const locales = ['zh', 'en'] as const;
   export type Locale = (typeof locales)[number];

   export default getRequestConfig(async ({ locale }) => {
     if (!locales.includes(locale as Locale)) {
       notFound();
     }

     return {
       messages: (await import(`./lib/i18n/${locale}.json`)).default
     };
   });
   ```

3. **確認翻譯檔案存在**：
   - `client/lib/i18n/zh.json` 必須存在
   - `client/lib/i18n/en.json` 必須存在

### 錯誤 2: `No Next.js version detected`

**原因：**
- Root Directory 未設定為 `client`
- 或 `client/package.json` 中沒有 `next` 依賴

**解決方案：**
1. 確認 Root Directory 設為 `client`
2. 確認 `client/package.json` 中有 `"next": "^14.0.0"`

### 錯誤 3: `MongoDB connection failed`

**原因：**
- 環境變數未設定或格式錯誤
- MongoDB Atlas Network Access 未允許 Vercel IP

**解決方案：**
1. 檢查 Vercel 環境變數是否正確設定
2. 確認 MongoDB Atlas → Network Access → 允許 `0.0.0.0/0`（所有 IP）
3. 檢查連線字串格式是否正確

### 錯誤 4: `Module not found: Can't resolve '@/lib/db'`

**原因：**
- TypeScript 路徑別名未正確設定
- 或檔案路徑錯誤

**解決方案：**
1. 確認 `client/tsconfig.json` 中有：
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

## ✅ 部署檢查清單

部署前請確認：

- [ ] Root Directory 已設為 `client`
- [ ] 環境變數 `MONGODB_URI` 已設定（三個環境）
- [ ] 環境變數 `DB_NAME` 已設定（三個環境）
- [ ] MongoDB Atlas Network Access 允許所有 IP
- [ ] `client/lib/i18n/zh.json` 存在
- [ ] `client/lib/i18n/en.json` 存在
- [ ] `client/package.json` 中有 `next` 和 `mongodb` 依賴
- [ ] 程式碼已推送到 GitHub

## 🧪 部署後測試

### 1. 測試健康檢查 API

```
https://ntu-foodmap.vercel.app/api/health
```

應該回傳：
```json
{"status":"ok","message":"NTU Food Map API is running"}
```

### 2. 測試前端首頁

```
https://ntu-foodmap.vercel.app
```

應該會自動重定向到：
```
https://ntu-foodmap.vercel.app/zh
```

### 3. 測試 API

```
https://ntu-foodmap.vercel.app/api/places?lat=25.0170&lng=121.5395&radius=2000
```

應該回傳地點列表（JSON 格式）

### 4. 檢查部署日誌

如果部署失敗：
1. 前往 Vercel Dashboard → **Deployments**
2. 點擊失敗的部署
3. 查看 **Build Logs** 和 **Function Logs**
4. 尋找錯誤訊息

## 📝 環境變數範例

### 正確的格式

```
MONGODB_URI=mongodb+srv://ntu-foodmap-user:password123@ntu-foodmap-db.8qyrjzs.mongodb.net/ntu-foodmap-db?retryWrites=true&w=majority
DB_NAME=ntu-foodmap-db
```

### 錯誤的格式（不要這樣做）

```
# ❌ 缺少資料庫名稱
MONGODB_URI=mongodb+srv://user:pass@host.net/?retryWrites=true&w=majority

# ❌ 包含多餘空格
MONGODB_URI = mongodb+srv://...

# ❌ 使用 localhost（Vercel 無法連接）
MONGODB_URI=mongodb://localhost:27017/ntu_food_map
```

## 🔍 除錯技巧

### 查看 Vercel 函數日誌

1. 前往 Vercel Dashboard → **Functions**
2. 選擇函數（例如 `/api/places`）
3. 查看 **Logs** 標籤
4. 檢查是否有錯誤訊息

### 測試環境變數是否正確載入

在 API 路由中暫時添加：

```typescript
// client/app/api/health/route.ts
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'NTU Food Map API is running',
    // 暫時用於除錯（不要顯示完整連線字串）
    hasMongoUri: !!process.env.MONGODB_URI,
    dbName: process.env.DB_NAME
  });
}
```

部署後訪問 `/api/health` 檢查環境變數是否正確載入。

## 🚀 快速部署步驟總結

1. ✅ 設定 Root Directory = `client`
2. ✅ 設定環境變數 `MONGODB_URI` 和 `DB_NAME`（三個環境）
3. ✅ 確認 MongoDB Atlas Network Access 允許所有 IP
4. ✅ 推送程式碼到 GitHub
5. ✅ Vercel 自動部署
6. ✅ 測試 `/api/health` 和首頁

## 📞 如果仍然失敗

1. **檢查 Vercel 部署日誌**：查看具體錯誤訊息
2. **檢查 MongoDB 連線**：使用 `scripts/test_mongodb_connection.js` 測試
3. **檢查環境變數**：確認格式正確，三個環境都已設定
4. **檢查 Root Directory**：確認設為 `client`

