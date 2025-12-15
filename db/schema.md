# MongoDB Schema 說明

## 資料庫結構

本專案使用 MongoDB Atlas 作為資料庫，主要集合（Collection）包括：
- `places` - 店家資訊
- `users` - 使用者資訊（OAuth）
- `comments` - 使用者留言
- `favorites` - 使用者收藏

## Places Collection Schema

```typescript
{
  _id: ObjectId,              // MongoDB 自動生成的 ID
  id: string,                 // 店家唯一識別碼（如 Google Place ID）
  name_zh: string,            // 中文店名
  name_en: string,            // 英文店名
  address_zh: string,         // 中文地址
  address_en: string,          // 英文地址
  phone?: string,              // 電話號碼（可選）
  price_level: number,         // 價位等級 (1-4)
  rating: number,              // 評分 (0-5)
  rating_count: number,        // 評分數量
  lat: number,                 // 緯度
  lng: number,                 // 經度
  location: {                  // 地理空間資料（用於查詢）
    type: "Point",
    coordinates: [longitude, latitude]  // MongoDB 使用 [lng, lat] 順序
  },
  categories: string[],         // 類別陣列（如：["餐廳", "中式"]）
  features: string[],           // 特色陣列（如：["international_friendly", "wifi"]）
  open_hours?: {               // 營業時間（可選）
    "Monday": ["11:00-21:00"],
    "Tuesday": ["11:00-21:00"],
    ...
  },
  photos?: string[],           // 照片 URL 陣列（可選）
  website?: string,             // 網站 URL（可選）
  created_at?: Date,           // 建立時間
  updated_at?: Date            // 更新時間
}
```

## 索引（Indexes）

以下索引會在連線時自動建立：

1. **2dsphere index on `location`** - 用於地理空間查詢（距離、範圍搜尋）
2. **Index on `rating`** - 用於評分排序
3. **Index on `price_level`** - 用於價位篩選
4. **Index on `categories`** - 用於類別篩選
5. **Index on `features`** - 用於特色篩選

## 地理空間查詢

MongoDB 使用 `$near` 操作符進行地理空間查詢：

```javascript
{
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: radiusInMeters
    }
  }
}
```

## 範例文件

```json
{
  "id": "place_001",
  "name_zh": "台大小福",
  "name_en": "NTU Xiao Fu",
  "address_zh": "台北市大安區羅斯福路四段1號",
  "address_en": "No. 1, Section 4, Roosevelt Road, Da'an District, Taipei",
  "phone": "+886-2-3366-3366",
  "price_level": 2,
  "rating": 4.2,
  "rating_count": 1250,
  "lat": 25.0170,
  "lng": 121.5395,
  "location": {
    "type": "Point",
    "coordinates": [121.5395, 25.0170]
  },
  "categories": ["餐廳", "小吃", "中式"],
  "features": ["international_friendly", "wifi", "vegetarian"],
  "open_hours": {
    "Monday": ["07:00-21:00"],
    "Tuesday": ["07:00-21:00"],
    "Wednesday": ["07:00-21:00"],
    "Thursday": ["07:00-21:00"],
    "Friday": ["07:00-21:00"],
    "Saturday": ["08:00-20:00"],
    "Sunday": ["08:00-20:00"]
  },
  "photos": [],
  "website": null,
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-01-01T00:00:00Z")
}
```

## Users Collection Schema

```typescript
{
  _id: ObjectId,              // MongoDB 自動生成的 ID
  oauth_provider: 'google' | 'line',  // OAuth 提供者
  oauth_id: string,           // Provider 提供的唯一 ID
  email?: string,             // 電子郵件（可選）
  name: string,               // 使用者名稱
  avatar_url?: string,        // 頭像 URL（可選）
  created_at: Date,          // 建立時間
  updated_at: Date           // 更新時間
}
```

## Comments Collection Schema

```typescript
{
  _id: ObjectId,              // MongoDB 自動生成的 ID
  place_id: string,           // 店家 ID（Google Place ID 或資料庫 ID）
  user_id: ObjectId,          // 使用者 ID（引用 Users）
  content: string,            // 留言內容
  rating?: number,           // 評分 (1-5)（可選）
  edited: boolean,           // 是否已編輯
  edited_at?: Date,          // 編輯時間（可選）
  created_at: Date,          // 建立時間
  likes: number,             // 按讚數
  dislikes: number,         // 倒讚數
  user_likes: ObjectId[],    // 按讚的使用者 ID 陣列
  user_dislikes: ObjectId[]  // 倒讚的使用者 ID 陣列
}
```

## Favorites Collection Schema

```typescript
{
  _id: ObjectId,              // MongoDB 自動生成的 ID
  user_id: ObjectId,          // 使用者 ID（引用 Users）
  place_id: string,           // 店家 ID（Google Place ID 或資料庫 ID）
  note?: string,              // 使用者備註（可選）
  created_at: Date           // 建立時間
}
```

## 新增索引（Indexes）

以下索引需要在連線時建立：

### Users Collection
1. **Compound unique index on `oauth_provider` + `oauth_id`** - 確保每個 OAuth 帳號唯一

### Comments Collection
1. **Index on `place_id`** - 用於查詢特定店家的留言
2. **Index on `user_id`** - 用於查詢特定使用者的留言
3. **Index on `created_at`** - 用於時間排序

### Favorites Collection
1. **Compound unique index on `user_id` + `place_id`** - 確保每個使用者對同一店家只能收藏一次
2. **Index on `user_id`** - 用於查詢特定使用者的收藏

