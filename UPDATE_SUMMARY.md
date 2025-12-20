# 更新內容清單

## 📋 本次更新摘要

本次更新主要包含以下功能改進和修復：

### ✨ 新增功能

1. **類別過濾功能**
   - 實作完整的類別過濾系統（餐廳、咖啡廳、小吃、夜市、速食、日式、中式、西式）
   - 日式/中式/西式類別支援評論關鍵字檢查
   - 整合 Google Places API 類型映射
   - 支援多類別同時選擇

2. **評論資料顯示**
   - 新增評論資料獲取功能（從 Google Places API）
   - 在店家詳情頁顯示評論列表
   - 顯示評論者資訊、評分、時間和內容

3. **多語言地圖支援**
   - Google Map 本身支援語言切換（中文/英文）
   - 根據頁面語言自動切換地圖語言

### 🔧 功能改進

1. **地圖互動優化**
   - 點擊店家時自動定位並標記
   - 修復多層圓圈問題（現在只會顯示一個搜索半徑圓圈）
   - 改進地圖標記設計（使用顏色編碼的 $ 符號表示價位）
   - 修復重置後無法重新選擇位置的問題

2. **篩選功能改進**
   - 修復「僅顯示營業中」篩選功能
   - 距離滑桿範圍調整（最小 100 公尺）
   - 移除「外籍生友善」功能（根據需求）

3. **UI/UX 改進**
   - 修復所有文字顏色被背景遮蓋的問題
   - 確保所有文字元素都有明確的顏色設定
   - 改進 InfoWindow 顯示內容

4. **多語言支援**
   - 修復英文版頁面仍顯示中文的問題
   - 新增多個翻譯鍵值
   - 完善所有頁面的多語言支援

### 🐛 Bug 修復

1. 修復「查看詳情」頁面空白問題
2. 修復店家詳情頁資料顯示不完整問題
3. 修復文字顏色被背景遮蓋問題
4. 修復地圖點擊事件處理問題
5. 修復多層圓圈顯示問題

### 📝 專案整理

1. 刪除重複的文檔檔案（VERCEL_DEPLOYMENT_CHECKLIST.md）
2. 更新專案文檔引用
3. 新增 ENV_SETUP.md 環境設定說明

### 📊 修改統計

- **17 個檔案修改**
- **新增 771 行，刪除 361 行**
- **新增 1 個檔案** (ENV_SETUP.md)

### 📁 主要修改檔案

#### 核心功能
- `client/utils/googlePlaces.ts` - 新增類別過濾和評論關鍵字檢查
- `client/utils/types.ts` - 新增 PlaceReview 介面
- `client/app/api/places/route.ts` - 新增 open_now 過濾邏輯

#### UI 組件
- `client/components/Map.tsx` - 地圖互動改進、多語言支援
- `client/components/Filters.tsx` - 移除外籍生友善、改進篩選器
- `client/app/[locale]/place/[id]/page.tsx` - 評論顯示、多語言支援
- `client/components/PlaceCard.tsx` - 文字顏色修復
- `client/components/ScoreBreakdown.tsx` - 文字顏色修復

#### 多語言
- `client/lib/i18n/zh.json` - 新增翻譯鍵值
- `client/lib/i18n/en.json` - 新增翻譯鍵值

#### 其他
- `client/lib/scoring.ts` - 移除外籍生友善評分邏輯
- `server/src/scoring.ts` - 移除外籍生友善評分邏輯
- `PROJECT_ARCHITECTURE.md` - 更新文檔引用
- `PROJECT_STRUCTURE.md` - 更新文檔引用

### ⚠️ 注意事項

1. 本次更新包含大量功能改進，建議完整測試
2. 類別過濾功能依賴 Google Places API 的評論資料
3. 多語言地圖需要重新載入 Google Maps API（已實作自動處理）

### 🧪 建議測試項目

1. 類別過濾功能（特別是日式/中式/西式）
2. 地圖互動（點擊、標記、圓圈）
3. 多語言切換（中文/英文）
4. 店家詳情頁評論顯示
5. 所有篩選功能
6. 文字顏色顯示

---

## ✨ 新增功能（OAuth 認證與留言系統）12.15

### 🔐 OAuth 認證系統

1. **NextAuth v5 整合**
   - 升級至 NextAuth v5（beta.30）
   - 實作 MongoDB Adapter 用於使用者資料儲存
   - 支援 JWT Session 策略
   - 狀態：✅ 已實作

2. **Google OAuth 登入**
   - 實作 Google OAuth 2.0 登入流程
   - 支援自動環境變數偵測（`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`）
   - 向後兼容舊的環境變數命名
   - 自訂登入頁面（`/auth/signin`）
   - 狀態：✅ 已實作 ⚠️ 未測試

3. **Line OAuth 登入**
   - 實作 Line OAuth 2.0 登入流程
   - 建立自訂 Line Provider（`client/lib/providers/line.ts`）
   - 支援自動環境變數偵測（`AUTH_LINE_ID`, `AUTH_LINE_SECRET`）
   - 向後兼容舊的環境變數命名（`LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`）
   - 狀態：✅ 已實作 ⚠️ 未測試

4. **認證相關功能**
   - 使用者登入/登出功能（`AuthButton` 組件）
   - Session 管理（包含使用者 ID、Provider 資訊）
   - 多語言登入頁面支援
   - 狀態：✅ 已實作

### 💬 店家留言系統

1. **留言 CRUD 功能**
   - ✅ 新增留言（POST `/api/comments`）
   - ✅ 編輯留言（PUT `/api/comments/[id]`）
   - ✅ 刪除留言（DELETE `/api/comments/[id]`）
   - ✅ 查詢留言（GET `/api/comments?place_id=xxx&sort_by=time|likes`）
   - 狀態：✅ 已實作 ⚠️ 未測試

2. **留言互動功能**
   - ✅ 按讚功能（POST `/api/comments/[id]/like`）
   - ✅ 按倒讚功能（POST `/api/comments/[id]/dislike`）
   - ✅ 防止重複按讚/倒讚
   - ✅ 顯示按讚/倒讚數量
   - 狀態：✅ 已實作 ⚠️ 未測試

3. **留言排序功能**
   - ✅ 依時間排序（最新優先）
   - ✅ 依按讚數排序（最熱門優先）
   - ✅ 使用者可切換排序方式
   - 狀態：✅ 已實作 ⚠️ 未測試

4. **留言評分功能**
   - ✅ 1-5 星評分系統
   - ✅ 評分顯示在留言中
   - ✅ 評分為選填項目
   - 狀態：✅ 已實作 ⚠️ 未測試

5. **留言權限管理**
   - ✅ 僅登入使用者可留言
   - ✅ 僅留言作者可編輯/刪除自己的留言
   - ✅ 未登入使用者顯示登入提示
   - 狀態：✅ 已實作 ⚠️ 未測試

6. **留言 UI 組件**
   - ✅ `CommentSection` 組件（完整留言功能）
   - ✅ 顯示使用者頭像和名稱
   - ✅ 顯示留言時間和編輯標記
   - ✅ 響應式設計
   - ✅ 多語言支援
   - 狀態：✅ 已實作 ⚠️ 未測試

### 📁 相關檔案

#### OAuth 認證
- `client/lib/auth.ts` - NextAuth 設定和 Provider 配置
- `client/lib/providers/line.ts` - 自訂 Line OAuth Provider
- `client/lib/mongodb-adapter.ts` - MongoDB Adapter 實作
- `client/app/[locale]/auth/signin/page.tsx` - 登入頁面
- `client/components/AuthButton.tsx` - 登入/登出按鈕組件
- `client/app/api/auth/[...nextauth]/route.ts` - NextAuth API 路由

#### 留言系統
- `client/components/CommentSection.tsx` - 留言區組件
- `client/app/api/comments/route.ts` - 留言 CRUD API（GET, POST）
- `client/app/api/comments/[id]/route.ts` - 單一留言操作（GET, PUT, DELETE）
- `client/app/api/comments/[id]/like/route.ts` - 按讚 API
- `client/app/api/comments/[id]/dislike/route.ts` - 按倒讚 API
- `client/app/api/user/current/route.ts` - 取得當前使用者資訊
- `client/app/[locale]/place/[id]/page.tsx` - 整合留言功能到店家詳情頁

### ⚠️ 注意事項

1. **OAuth 功能**
   - 需要設定正確的環境變數（見 `ENV_SETUP.md`）
   - Google OAuth 需要設定授權重新導向 URI
   - Line OAuth 需要設定 Callback URL
   - 生產環境需要更新 OAuth 應用程式的授權 URI

2. **留言功能**
   - 留言功能需要使用者登入
   - 留言資料儲存在 MongoDB `comments` collection
   - 留言與使用者透過 `user_id` 關聯
   - 留言與店家透過 `place_id` 關聯

3. **測試狀態**
   - ⚠️ OAuth 登入功能尚未完整測試
   - ⚠️ 留言系統尚未完整測試
   - 建議進行完整的功能測試和整合測試

---

## 🔧 最新修復（TypeScript 錯誤修復）12.15 16:30

### 🐛 Bug 修復

1. **修復 Line OAuth Provider 類型錯誤**
   - 檔案：`client/lib/providers/line.ts`
   - 問題：無法找到 `next-auth/providers/oauth` 模組
   - 解決：將 import 路徑從 `next-auth/providers/oauth` 改為 `@auth/core/providers`（符合 NextAuth v5）
   - 狀態：✅ 已修復

2. **修復 Server 端口類型錯誤**
   - 檔案：`server/src/index.ts`
   - 問題：`process.env.PORT` 和 `process.env.SERVER_PORT` 為字串類型，但 `app.listen()` 需要數字類型
   - 解決：使用 `parseInt()` 將環境變數轉換為數字
   - 狀態：✅ 已修復

3. **修復 Google Map 選項類型錯誤**
   - 檔案：`client/components/Map.tsx`
   - 問題：`language` 不是 `MapOptions` 的有效屬性
   - 解決：移除 `options` 中的 `language` 屬性（語言已正確設定在 `LoadScript` 組件上）
   - 狀態：✅ 已修復

### 📝 專案整理

1. **環境變數設定**
   - `client/.env`（使用 NextAuth v5 新命名標準）
   - 狀態：✅ 已完成

### 📁 最新修改檔案

- `client/lib/providers/line.ts` - 修復 OAuth 類型導入
- `server/src/index.ts` - 修復端口類型轉換
- `client/components/Map.tsx` - 移除無效的 MapOptions 屬性

---

## 📋 待辦項目（TODO）

### 🔴 高優先級

1. **使用者個人介面設定**
   - [ ] 實作使用者個人資料頁面（Profile）
   - [ ] 顯示使用者留言過的店家列表
   - [ ] 顯示使用者留言內容
   - [ ] 允許使用者編輯個人資料
   - [ ] 實作使用者頭像上傳功能
   - 狀態：⏳ 待開發

2. **OAuth 功能測試**
   - [ ] 測試 Google OAuth 登入流程
   - [ ] 測試 Line OAuth 登入流程
   - [ ] 驗證 OAuth 使用者資料獲取
   - [ ] 測試 OAuth 錯誤處理
   - [ ] 確認登入後的 session 管理
   - [ ] 測試 OAuth 在生產環境的運作
   - [ ] 測試登出功能
   - 狀態：⏳ 待測試

3. **店家留言功能測試**
   - [ ] 測試新增留言功能
   - [ ] 測試編輯留言功能
   - [ ] 測試刪除留言功能
   - [ ] 測試留言排序功能（時間/按讚數）
   - [ ] 測試按讚/按倒讚功能
   - [ ] 測試留言權限控制（僅作者可編輯/刪除）
   - [ ] 測試未登入使用者的留言限制
   - [ ] 測試留言評分功能
   - [ ] 測試留言資料正確性（使用者資訊、時間戳記等）
   - 狀態：⏳ 待測試

### 🟡 中優先級

4. **程式碼品質改進**
   - [ ] 完成所有 TypeScript 類型定義
   - [ ] 添加單元測試
   - [ ] 改進錯誤處理機制

5. **效能優化**
   - [ ] 優化地圖載入效能
   - [ ] 實作資料快取機制
   - [ ] 優化 API 請求頻率

### 🟢 低優先級

6. **功能增強**
   - [ ] 新增更多篩選選項
   - [ ] 改進搜尋功能
   - [ ] 新增店家收藏分類功能

