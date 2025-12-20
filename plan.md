# Final Project – Midterm Plan

## Deploy Link

https://ntu-food-map.vercel.app

## 1. 本次 Prototype 已完成

- ✅ 基本頁面架構（Next.js 14 App Router）
- ✅ 雙語介面（中文/英文）使用 next-intl
- ✅ 互動式地圖（Leaflet + Marker Clustering）
- ✅ 美食地點列表與篩選功能
  - 距離篩選（Max distance slider，500-5000 公尺）
  - 評分篩選（Min rating slider，0-5）
  - 價格篩選（Price level dropdown，$ - $$$$）
  - 類別篩選（Categories: 中式、西式、小吃、夜市、速食、日式等）
  - 特色篩選（Open now only、International friendly）
- ✅ 地點詳情頁面（顯示完整店家資訊、推薦分數分解）
- ✅ 食物轉盤功能（Roulette）
- ✅ 推薦分數計算系統
  - 距離分數（距離越近分數越高，使用指數衰減）
  - 評分分數（0-5 正規化）
  - 人氣分數（基於評論數量，使用對數尺度）
  - 營業狀態分數（營業中/已關閉/未知）
  - 情境分數（基於特色標籤，如外籍生友善）
- ✅ 後端 API（Next.js Serverless Functions）
  - GET /api/places（地點列表與篩選，支援地理空間查詢）
  - GET /api/places/:id（地點詳情）
  - POST /api/roulette（轉盤功能，從篩選後的店家池中隨機選擇）
  - GET /api/health（健康檢查）
- ✅ 資料庫串接（MongoDB Atlas + 地理空間查詢）
  - 使用 2dsphere 索引進行地理空間查詢
  - 支援 $near 查詢（根據距離排序）
- ✅ 資料匯入腳本（import_to_db.js）
- ✅ 營業狀態判斷（checkIfOpen 函數，根據營業時間判斷是否營業中）
- ✅ 距離計算（calculateDistance 函數，計算兩點間距離）
- ✅ Vercel 部署完成
- ⚠️ 尚未串接 Google Places API（目前使用靜態 seed 資料，有 fetch_places.js 腳本但尚未實際串接）

## 2. 最終版本預計完成項目

- 🔄 串接 Google Places API（取得即時店家資料、照片、評論等）
- 🔄 使用者認證系統（登入/註冊）
- 🔄 個人化推薦（基於使用者歷史記錄）
- 🔄 收藏功能（我的最愛）
- 🔄 評論與評分系統（使用者可以留下評論和評分）
- 🔄 搜尋功能（關鍵字搜尋店家名稱、地址等）
- 🔄 路線規劃（整合 Google Maps Directions API）
- 🔄 即時營業狀態（更準確的營業時間判斷，整合 Google Places API）
- 🔄 更多篩選條件（素食、無障礙設施等）
- 🔄 響應式設計優化（行動裝置體驗完整優化）
- 🔄 效能優化（圖片懶加載、快取策略）
- 🔄 錯誤處理與使用者體驗改善
- 🔄 單元測試與整合測試

## 3. 預期開發進度

- **第一週**: 
  - 串接 Google Places API（取得即時店家資料、照片、評論）
  - 完成使用者認證系統（登入/註冊）
  - 實作收藏功能（我的最愛）
  - 優化資料庫查詢效能

- **第二週**:
  - 實作評論與評分系統
  - 開發搜尋功能（關鍵字搜尋）
  - 整合 Google Maps Directions API（路線規劃）

- **第三週**:
  - 實作個人化推薦系統
  - 優化即時營業狀態判斷
  - 新增更多篩選條件
  - 響應式設計優化

- **第四週**:
  - 效能優化與錯誤處理
  - 測試與最終整合
  - 準備 Final Presentation

