# Final Project – Midterm Plan

## Deploy Link

https://ntu-food-map.vercel.app

## 1. 本次 Prototype 已完成

- ✅ 基本頁面架構（Next.js 14 App Router）
- ✅ 雙語介面（中文/英文）使用 next-intl
- ✅ 互動式地圖（Leaflet + Marker Clustering）
- ✅ 美食地點列表與篩選功能
  - 距離篩選（Max distance slider）
  - 評分篩選（Min rating slider）
  - 價格篩選（Price level dropdown）
  - 類別篩選（Categories: 中式、西式、小吃、夜市、速食、日式等）
  - 特色篩選（Open now only、International friendly）
- ✅ 地點詳情頁面
- ✅ 食物轉盤功能（Roulette）
- ✅ 推薦分數計算系統（距離、評分、人氣、營業狀態、情境）
- ✅ 後端 API（Next.js Serverless Functions）
  - GET /api/places（地點列表與篩選）
  - GET /api/places/:id（地點詳情）
  - POST /api/roulette（轉盤功能）
  - GET /api/health（健康檢查）
- ✅ 資料庫串接（MongoDB Atlas + 地理空間查詢）
- ✅ 資料匯入腳本（import_to_db.js）
- ✅ Vercel 部署完成

## 2. 最終版本預計完成項目

- 🔄 使用者認證系統（登入/註冊）
- 🔄 個人化推薦（基於使用者歷史記錄）
- 🔄 收藏功能（我的最愛）
- 🔄 評論與評分系統
- 🔄 搜尋功能（關鍵字搜尋）
- 🔄 路線規劃（整合 Google Maps Directions API）
- 🔄 即時營業狀態（更準確的營業時間判斷）
- 🔄 更多篩選條件（素食、無障礙設施等）
- 🔄 響應式設計優化（行動裝置體驗）
- 🔄 效能優化（圖片懶加載、快取策略）
- 🔄 錯誤處理與使用者體驗改善
- 🔄 單元測試與整合測試

## 3. 預期開發進度

- **Week 1 (12/06 - 12/12)**: 
  - 完成使用者認證系統（登入/註冊）
  - 實作收藏功能（我的最愛）
  - 優化資料庫查詢效能

- **Week 2 (12/13 - 12/19)**:
  - 實作評論與評分系統
  - 開發搜尋功能（關鍵字搜尋）
  - 整合 Google Maps Directions API（路線規劃）

- **Week 3 (12/20 - 12/26)**:
  - 實作個人化推薦系統
  - 優化即時營業狀態判斷
  - 新增更多篩選條件

- **Week 4 (12/27 - 01/02)**:
  - 響應式設計優化
  - 效能優化與錯誤處理
  - 測試與最終整合
  - 準備 Final Presentation

